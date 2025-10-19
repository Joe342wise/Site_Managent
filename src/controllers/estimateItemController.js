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
      (SELECT COUNT(DISTINCT ei.item_id) FROM actuals a
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

  const existingItemResult = await pool.query(
    'SELECT estimate_id FROM estimate_items WHERE item_id = $1',
    [id]
  );
  const existingItem = existingItemResult.rows;

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
    updates.push(`description = $${params.length + 1}`);
    params.push(description);
  }
  if (category_id !== undefined) {
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

    updates.push(`category_id = $${params.length + 1}`);
    params.push(category_id);
  }
  if (quantity !== undefined) {
    updates.push(`quantity = $${params.length + 1}`);
    params.push(quantity);
  }
  if (unit !== undefined) {
    updates.push(`unit = $${params.length + 1}`);
    params.push(unit);
  }
  if (unit_price !== undefined) {
    updates.push(`unit_price = $${params.length + 1}`);
    params.push(unit_price);
  }
  if (notes !== undefined) {
    updates.push(`notes = $${params.length + 1}`);
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

  const result = await pool.query(
    `UPDATE estimate_items SET ${updates.join(', ')} WHERE item_id = $${params.length}`,
    params
  );

  if (result.rowCount === 0) {
    return res.status(404).json({
      success: false,
      message: 'Estimate item not found'
    });
  }

  await pool.query(
    'UPDATE estimates SET total_estimated = (SELECT SUM(total_estimated) FROM estimate_items WHERE estimate_id = $1) WHERE estimate_id = $1',
    [estimate_id]
  );

  const updatedItemResult = await pool.query(`
    SELECT ei.*,
           c.name as category_name,
           (SELECT COUNT(*) FROM actuals a WHERE a.item_id = ei.item_id) as has_actuals,
           (SELECT SUM(total_actual) FROM actuals a WHERE a.item_id = ei.item_id) as total_actual_cost
    FROM estimate_items ei
    LEFT JOIN categories c ON ei.category_id = c.category_id
    WHERE ei.item_id = $1
  `, [id]);
  const updatedItem = updatedItemResult.rows;

  res.json({
    success: true,
    message: 'Estimate item updated successfully',
    data: updatedItem[0]
  });
});

const deleteEstimateItem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { force } = req.query; // Allow cascade delete with ?force=true

  const existingItemResult = await pool.query(
    'SELECT estimate_id FROM estimate_items WHERE item_id = $1',
    [id]
  );
  const existingItem = existingItemResult.rows;

  if (existingItem.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Estimate item not found'
    });
  }

  const estimate_id = existingItem[0].estimate_id;

  // Check for existing actuals
  const actualCountResult = await pool.query(
    'SELECT COUNT(*) as count FROM actuals WHERE item_id = $1',
    [id]
  );
  const actualCount = actualCountResult.rows;
  const hasActuals = parseInt(actualCount[0].count) > 0;

  // If actuals exist and force delete not requested, return detailed error
  if (hasActuals && force !== 'true') {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete item with recorded actuals. Delete actuals first.',
      details: {
        actualCount: parseInt(actualCount[0].count),
        canForceDelete: true,
        hint: 'Add ?force=true to delete this item and all associated actuals'
      }
    });
  }

  // Use transaction for cascade delete
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // If force delete, remove actuals first
    if (hasActuals && force === 'true') {
      const deleteActualsResult = await client.query(
        'DELETE FROM actuals WHERE item_id = $1',
        [id]
      );
      console.log(`Cascade deleted ${deleteActualsResult.rowCount} actual cost records for item ${id}`);
    }

    // Delete the estimate item
    const result = await client.query(
      'DELETE FROM estimate_items WHERE item_id = $1',
      [id]
    );

    if (result.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Estimate item not found'
      });
    }

    // Update estimate total
    await client.query(
      'UPDATE estimates SET total_estimated = (SELECT COALESCE(SUM(total_estimated), 0) FROM estimate_items WHERE estimate_id = $1) WHERE estimate_id = $1',
      [estimate_id]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: hasActuals
        ? `Estimate item and ${actualCount[0].count} associated actual(s) deleted successfully`
        : 'Estimate item deleted successfully',
      deletedActuals: hasActuals ? parseInt(actualCount[0].count) : 0
    });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
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

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const createdItems = [];

    for (const item of items) {
      const { description, category_id, quantity = 1, unit, unit_price, notes } = item;

      const result = await client.query(
        'INSERT INTO estimate_items (estimate_id, description, category_id, quantity, unit, unit_price, notes) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING item_id',
        [estimate_id, description, category_id, quantity, unit, unit_price, notes]
      );

      const newItemResult = await client.query(`
        SELECT ei.*,
               c.name as category_name
        FROM estimate_items ei
        LEFT JOIN categories c ON ei.category_id = c.category_id
        WHERE ei.item_id = $1
      `, [result.rows[0].item_id]);

      createdItems.push(newItemResult.rows[0]);
    }

    await client.query(
      'UPDATE estimates SET total_estimated = (SELECT SUM(total_estimated) FROM estimate_items WHERE estimate_id = $1) WHERE estimate_id = $1',
      [estimate_id]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: `${createdItems.length} estimate items created successfully`,
      data: createdItems
    });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});

const getItemsByCategory = asyncHandler(async (req, res) => {
  const { estimate_id } = req.params;

  const itemsByCategoryResult = await pool.query(`
    SELECT
      c.category_id,
      c.name as category_name,
      c.description as category_description,
      COUNT(ei.item_id) as item_count,
      SUM(ei.total_estimated) as category_total,
      JSON_AGG(
        JSON_BUILD_OBJECT(
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
  const itemsByCategory = itemsByCategoryResult.rows;

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
