const { pool } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');

const getAllCategories = asyncHandler(async (req, res) => {
  const categoriesResult = await pool.query(
    'SELECT * FROM categories ORDER BY sort_order, name'
  );
  const categories = categoriesResult.rows;

  res.json({
    success: true,
    data: categories
  });
});

const getEstimateItems = asyncHandler(async (req, res) => {
  const { estimate_id } = req.params;
  const { category_id } = req.query;

  let query = `
    SELECT ei.*,
           c.name as category_name,
           (SELECT COUNT(*) FROM actuals a WHERE a.item_id = ei.item_id) as has_actuals,
           (SELECT SUM(total_actual) FROM actuals a WHERE a.item_id = ei.item_id) as total_actual_cost,
           (SELECT SUM(actual_quantity) FROM actuals a WHERE a.item_id = ei.item_id) as total_actual_quantity,
           (SELECT COUNT(actual_id) FROM actuals a WHERE a.item_id = ei.item_id) as purchase_count,
           -- Cumulative variance calculation
           CASE
             WHEN (SELECT SUM(total_actual) FROM actuals a WHERE a.item_id = ei.item_id) IS NULL THEN 0
             ELSE (SELECT SUM(total_actual) FROM actuals a WHERE a.item_id = ei.item_id) -
                  (ei.unit_price * COALESCE((SELECT SUM(actual_quantity) FROM actuals a WHERE a.item_id = ei.item_id), 0))
           END as cumulative_variance_amount,
           -- Cumulative variance percentage
           CASE
             WHEN (SELECT SUM(total_actual) FROM actuals a WHERE a.item_id = ei.item_id) IS NULL THEN 0
             WHEN (SELECT SUM(actual_quantity) FROM actuals a WHERE a.item_id = ei.item_id) IS NULL OR ei.unit_price = 0 THEN 0
             ELSE (
               ((SELECT SUM(total_actual) FROM actuals a WHERE a.item_id = ei.item_id) /
                COALESCE((SELECT SUM(actual_quantity) FROM actuals a WHERE a.item_id = ei.item_id), 0)) - ei.unit_price
             ) / ei.unit_price * 100
           END as cumulative_variance_percentage,
           -- Remaining budget info
           (ei.quantity - COALESCE((SELECT SUM(actual_quantity) FROM actuals a WHERE a.item_id = ei.item_id), 0)) as remaining_quantity,
           (ei.total_estimated - COALESCE((SELECT SUM(total_actual) FROM actuals a WHERE a.item_id = ei.item_id), 0)) as remaining_budget
    FROM estimate_items ei
    LEFT JOIN categories c ON ei.category_id = c.category_id
    WHERE ei.estimate_id = $1
  `;

  const params = [estimate_id];

  if (category_id) {
    query += ` AND ei.category_id = $${params.length + 1}`;
    params.push(category_id);
  }

  query += ' ORDER BY ei.item_id ASC';

  const itemsResult = await pool.query(query, params);
  const items = itemsResult.rows;

  const summaryResult = await pool.query(`
    SELECT
      COUNT(*) as total_items,
      SUM(total_estimated) as total_estimated,
      COUNT(DISTINCT category_id) as categories_used,
      (SELECT COUNT(*) FROM actuals a
       JOIN estimate_items ei ON a.item_id = ei.item_id
       WHERE ei.estimate_id = $1) as items_with_actuals
    FROM estimate_items
    WHERE estimate_id = $1
  `, [estimate_id]);
  const summary = summaryResult.rows;

  res.json({
    success: true,
    data: {
      items,
      summary: summary[0]
    }
  });
});

const getEstimateItemById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const itemsResult = await pool.query(`
    SELECT ei.*,
           c.name as category_name,
           e.title as estimate_title,
           s.name as site_name,
           -- Add cumulative variance data for individual item view
           (SELECT COUNT(*) FROM actuals a WHERE a.item_id = ei.item_id) as has_actuals,
           (SELECT SUM(total_actual) FROM actuals a WHERE a.item_id = ei.item_id) as total_actual_cost,
           (SELECT SUM(actual_quantity) FROM actuals a WHERE a.item_id = ei.item_id) as total_actual_quantity,
           (SELECT COUNT(actual_id) FROM actuals a WHERE a.item_id = ei.item_id) as purchase_count,
           -- Cumulative variance calculation
           CASE
             WHEN (SELECT SUM(total_actual) FROM actuals a WHERE a.item_id = ei.item_id) IS NULL THEN 0
             ELSE (SELECT SUM(total_actual) FROM actuals a WHERE a.item_id = ei.item_id) -
                  (ei.unit_price * COALESCE((SELECT SUM(actual_quantity) FROM actuals a WHERE a.item_id = ei.item_id), 0))
           END as cumulative_variance_amount,
           -- Cumulative variance percentage
           CASE
             WHEN (SELECT SUM(total_actual) FROM actuals a WHERE a.item_id = ei.item_id) IS NULL THEN 0
             WHEN (SELECT SUM(actual_quantity) FROM actuals a WHERE a.item_id = ei.item_id) IS NULL OR ei.unit_price = 0 THEN 0
             ELSE (
               ((SELECT SUM(total_actual) FROM actuals a WHERE a.item_id = ei.item_id) /
                COALESCE((SELECT SUM(actual_quantity) FROM actuals a WHERE a.item_id = ei.item_id), 0)) - ei.unit_price
             ) / ei.unit_price * 100
           END as cumulative_variance_percentage,
           -- Remaining budget info
           (ei.quantity - COALESCE((SELECT SUM(actual_quantity) FROM actuals a WHERE a.item_id = ei.item_id), 0)) as remaining_quantity,
           (ei.total_estimated - COALESCE((SELECT SUM(total_actual) FROM actuals a WHERE a.item_id = ei.item_id), 0)) as remaining_budget
    FROM estimate_items ei
    LEFT JOIN categories c ON ei.category_id = c.category_id
    LEFT JOIN estimates e ON ei.estimate_id = e.estimate_id
    LEFT JOIN sites s ON e.site_id = s.site_id
    WHERE ei.item_id = $1
  `, [id]);
  const items = itemsResult.rows;

  if (items.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Estimate item not found'
    });
  }

  const actualsResult = await pool.query(`
    SELECT a.*,
           u.username as recorded_by_username,
           ROW_NUMBER() OVER (ORDER BY a.date_recorded ASC, a.actual_id ASC) as batch_number
    FROM actuals a
    LEFT JOIN users u ON a.recorded_by = u.user_id
    WHERE a.item_id = $1
    ORDER BY a.date_recorded ASC, a.actual_id ASC
  `, [id]);
  const actuals = actualsResult.rows;

  res.json({
    success: true,
    data: {
      ...items[0],
      actuals
    }
  });
});

const createEstimateItem = asyncHandler(async (req, res) => {
  const { estimate_id, description, category_id, quantity = 1, unit, unit_price, notes } = req.body;

  // Validate required fields
  if (!estimate_id) {
    return res.status(400).json({
      success: false,
      message: 'Estimate ID is required'
    });
  }

  if (!description || !description.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Description is required'
    });
  }

  if (!category_id || category_id <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Category ID is required and must be greater than 0'
    });
  }

  if (!unit || !unit.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Unit is required'
    });
  }

  if (!unit_price || unit_price <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Unit price is required and must be greater than 0'
    });
  }

  if (quantity <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Quantity must be greater than 0'
    });
  }

  const estimateCheckResult = await pool.query(
    'SELECT estimate_id FROM estimates WHERE estimate_id = $1',
    [estimate_id]
  );
  const estimateCheck = estimateCheckResult.rows;

  if (estimateCheck.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Estimate not found'
    });
  }

  const categoryCheckResult = await pool.query(
    'SELECT category_id FROM categories WHERE category_id = $1',
    [category_id]
  );
  const categoryCheck = categoryCheckResult.rows;

  if (categoryCheck.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Category not found'
    });
  }

  const result = await pool.query(
    'INSERT INTO estimate_items (estimate_id, description, category_id, quantity, unit, unit_price, notes) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING item_id',
    [
      parseInt(estimate_id),
      description.trim(),
      parseInt(category_id),
      parseFloat(quantity),
      unit.trim(),
      parseFloat(unit_price),
      notes && notes.trim() ? notes.trim() : null
    ]
  );

  await pool.query(
    'UPDATE estimates SET total_estimated = (SELECT SUM(total_estimated) FROM estimate_items WHERE estimate_id = $1) WHERE estimate_id = $1',
    [estimate_id]
  );

  const newItemResult = await pool.query(`
    SELECT ei.*,
           c.name as category_name,
           0 as has_actuals,
           0 as total_actual_cost
    FROM estimate_items ei
    LEFT JOIN categories c ON ei.category_id = c.category_id
    WHERE ei.item_id = $1
  `, [result.rows[0].item_id]);
  const newItem = newItemResult.rows;

  res.status(201).json({
    success: true,
    message: 'Estimate item created successfully',
    data: newItem[0]
  });
});

const updateEstimateItem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { description, category_id, quantity, unit, unit_price, notes } = req.body;

  const [existingItem] = await pool.query(
    'SELECT estimate_id FROM estimate_items WHERE item_id = $1',
    [id]
  );

  if (existingItem.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Estimate item not found'
    });
  }

  const estimate_id = existingItem[0].estimate_id;

  const updates = [];
  const params = [];

  if (description !== undefined) {
    updates.push('description = ?');
    params.push(description);
  }
  if (category_id !== undefined) {
    const [categoryCheck] = await pool.query(
      'SELECT category_id FROM categories WHERE category_id = $1',
      [category_id]
    );

    if (categoryCheck.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Category not found'
      });
    }

    updates.push('category_id = ?');
    params.push(category_id);
  }
  if (quantity !== undefined) {
    updates.push('quantity = ?');
    params.push(quantity);
  }
  if (unit !== undefined) {
    updates.push('unit = ?');
    params.push(unit);
  }
  if (unit_price !== undefined) {
    updates.push('unit_price = ?');
    params.push(unit_price);
  }
  if (notes !== undefined) {
    updates.push('notes = ?');
    params.push(notes && notes.trim() ? notes : null);
  }

  if (updates.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No valid fields to update'
    });
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');
  params.push(id);

  const [result] = await pool.query(
    `UPDATE estimate_items SET ${updates.join(', ')} WHERE item_id = $1`,
    params
  );

  if (result.affectedRows === 0) {
    return res.status(404).json({
      success: false,
      message: 'Estimate item not found'
    });
  }

  await pool.query(
    'UPDATE estimates SET total_estimated = (SELECT SUM(total_estimated) FROM estimate_items WHERE estimate_id = $1) WHERE estimate_id = $1',
    [estimate_id, estimate_id]
  );

  const [updatedItem] = await pool.query(`
    SELECT ei.*,
           c.name as category_name,
           (SELECT COUNT(*) FROM actuals a WHERE a.item_id = ei.item_id) as has_actuals,
           (SELECT SUM(total_actual) FROM actuals a WHERE a.item_id = ei.item_id) as total_actual_cost
    FROM estimate_items ei
    LEFT JOIN categories c ON ei.category_id = c.category_id
    WHERE ei.item_id = ?
  `, [id]);

  res.json({
    success: true,
    message: 'Estimate item updated successfully',
    data: updatedItem[0]
  });
});

const deleteEstimateItem = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [existingItem] = await pool.query(
    'SELECT estimate_id FROM estimate_items WHERE item_id = $1',
    [id]
  );

  if (existingItem.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Estimate item not found'
    });
  }

  const estimate_id = existingItem[0].estimate_id;

  const [actualCount] = await pool.query(
    'SELECT COUNT(*) as count FROM actuals WHERE item_id = $1',
    [id]
  );

  if (actualCount[0].count > 0) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete item with recorded actuals. Delete actuals first.'
    });
  }

  const [result] = await pool.query(
    'DELETE FROM estimate_items WHERE item_id = $1',
    [id]
  );

  if (result.affectedRows === 0) {
    return res.status(404).json({
      success: false,
      message: 'Estimate item not found'
    });
  }

  await pool.query(
    'UPDATE estimates SET total_estimated = (SELECT COALESCE(SUM(total_estimated), 0) FROM estimate_items WHERE estimate_id = $1) WHERE estimate_id = $1',
    [estimate_id, estimate_id]
  );

  res.json({
    success: true,
    message: 'Estimate item deleted successfully'
  });
});

const bulkCreateEstimateItems = asyncHandler(async (req, res) => {
  const { estimate_id } = req.params;
  const { items } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Items array is required and must not be empty'
    });
  }

  const [estimateCheck] = await pool.query(
    'SELECT estimate_id FROM estimates WHERE estimate_id = $1',
    [estimate_id]
  );

  if (estimateCheck.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Estimate not found'
    });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const createdItems = [];

    for (const item of items) {
      const { description, category_id, quantity = 1, unit, unit_price, notes } = item;

      const [result] = await connection.execute(
        'INSERT INTO estimate_items (estimate_id, description, category_id, quantity, unit, unit_price, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [estimate_id, description, category_id, quantity, unit, unit_price, notes]
      );

      const [newItem] = await connection.execute(`
        SELECT ei.*,
               c.name as category_name
        FROM estimate_items ei
        LEFT JOIN categories c ON ei.category_id = c.category_id
        WHERE ei.item_id = ?
      `, [result.insertId]);

      createdItems.push(newItem[0]);
    }

    await connection.execute(
      'UPDATE estimates SET total_estimated = (SELECT SUM(total_estimated) FROM estimate_items WHERE estimate_id = $1) WHERE estimate_id = $1',
      [estimate_id, estimate_id]
    );

    await connection.commit();

    res.status(201).json({
      success: true,
      message: `${createdItems.length} estimate items created successfully`,
      data: createdItems
    });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
});

const getItemsByCategory = asyncHandler(async (req, res) => {
  const { estimate_id } = req.params;

  const [itemsByCategory] = await pool.query(`
    SELECT
      c.category_id,
      c.name as category_name,
      c.description as category_description,
      COUNT(ei.item_id) as item_count,
      SUM(ei.total_estimated) as category_total,
      JSON_ARRAYAGG(
        JSON_OBJECT(
          'item_id', ei.item_id,
          'description', ei.description,
          'quantity', ei.quantity,
          'unit', ei.unit,
          'unit_price', ei.unit_price,
          'total_estimated', ei.total_estimated
        )
      ) as items
    FROM categories c
    LEFT JOIN estimate_items ei ON c.category_id = ei.category_id AND ei.estimate_id = $1
    GROUP BY c.category_id, c.name, c.description
    ORDER BY c.sort_order
  `, [estimate_id]);

  res.json({
    success: true,
    data: itemsByCategory
  });
});

module.exports = {
  getAllCategories,
  getEstimateItems,
  getEstimateItemById,
  createEstimateItem,
  updateEstimateItem,
  deleteEstimateItem,
  bulkCreateEstimateItems,
  getItemsByCategory
};