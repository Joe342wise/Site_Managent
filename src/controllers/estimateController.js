const { pool } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');

const getAllEstimates = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, site_id, status, search } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let query = `
    SELECT e.*,
           s.name as site_name,
           s.location as site_location,
           u.username as created_by_username,
           (SELECT COUNT(*) FROM estimate_items ei WHERE ei.estimate_id = e.estimate_id) as item_count,
           (SELECT SUM(total_estimated) FROM estimate_items ei WHERE ei.estimate_id = e.estimate_id) as calculated_total,
           (SELECT SUM(a.actual_unit_price * COALESCE(a.actual_quantity, ei.quantity))
            FROM actuals a
            JOIN estimate_items ei ON a.item_id = ei.item_id
            WHERE ei.estimate_id = e.estimate_id) as total_purchased_amount
    FROM estimates e
    LEFT JOIN sites s ON e.site_id = s.site_id
    LEFT JOIN users u ON e.created_by = u.user_id
  `;

  let countQuery = 'SELECT COUNT(*) as total FROM estimates e';
  const params = [];

  let whereConditions = [];

  if (site_id) {
    whereConditions.push('e.site_id = ?');
    params.push(site_id);
  }

  if (status) {
    whereConditions.push('e.status = ?');
    params.push(status);
  }

  if (search) {
    whereConditions.push('(e.title LIKE ? OR e.description LIKE ?)');
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm);
  }

  if (whereConditions.length > 0) {
    const whereClause = ' WHERE ' + whereConditions.join(' AND ');
    query += whereClause;
    countQuery += whereClause;
  }

  query += ` ORDER BY e.date_created DESC LIMIT ${parseInt(limit)} OFFSET ${offset}`;

  const [estimates] = await pool.execute(query, params);
  const [countResult] = await pool.execute(countQuery, params);

  const total = countResult[0].total;
  const totalPages = Math.ceil(total / parseInt(limit));

  res.json({
    success: true,
    data: {
      estimates,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalEstimates: total,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1
      }
    }
  });
});

const getEstimateById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [estimates] = await pool.execute(`
    SELECT e.*,
           s.name as site_name,
           s.location as site_location,
           u.username as created_by_username,
           (SELECT SUM(a.actual_unit_price * COALESCE(a.actual_quantity, ei.quantity))
            FROM actuals a
            JOIN estimate_items ei ON a.item_id = ei.item_id
            WHERE ei.estimate_id = e.estimate_id) as total_purchased_amount
    FROM estimates e
    LEFT JOIN sites s ON e.site_id = s.site_id
    LEFT JOIN users u ON e.created_by = u.user_id
    WHERE e.estimate_id = ?
  `, [id]);

  if (estimates.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Estimate not found'
    });
  }

  const [items] = await pool.execute(`
    SELECT ei.*,
           c.name as category_name,
           (SELECT COUNT(*) FROM actuals a WHERE a.item_id = ei.item_id) as has_actuals
    FROM estimate_items ei
    LEFT JOIN categories c ON ei.category_id = c.category_id
    WHERE ei.estimate_id = ?
    ORDER BY c.sort_order, ei.item_id
  `, [id]);

  const [summary] = await pool.execute(`
    SELECT
      COUNT(*) as total_items,
      SUM(total_estimated) as total_amount,
      COUNT(DISTINCT category_id) as categories_used
    FROM estimate_items
    WHERE estimate_id = ?
  `, [id]);

  res.json({
    success: true,
    data: {
      ...estimates[0],
      items,
      summary: summary[0]
    }
  });
});

const createEstimate = asyncHandler(async (req, res) => {
  const { site_id, title, description, date_created = new Date() } = req.body;
  const created_by = req.user.user_id;

  const [siteCheck] = await pool.execute(
    'SELECT site_id FROM sites WHERE site_id = ?',
    [site_id]
  );

  if (siteCheck.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Site not found'
    });
  }

  const [result] = await pool.execute(
    'INSERT INTO estimates (site_id, title, description, date_created, created_by) VALUES (?, ?, ?, ?, ?)',
    [
      parseInt(site_id),
      title.trim(),
      description && description.trim() ? description.trim() : null,
      date_created,
      created_by
    ]
  );

  const [newEstimate] = await pool.execute(`
    SELECT e.*,
           s.name as site_name,
           s.location as site_location,
           u.username as created_by_username,
           0 as item_count,
           0 as calculated_total,
           0 as total_purchased_amount
    FROM estimates e
    LEFT JOIN sites s ON e.site_id = s.site_id
    LEFT JOIN users u ON e.created_by = u.user_id
    WHERE e.estimate_id = ?
  `, [result.insertId]);

  res.status(201).json({
    success: true,
    message: 'Estimate created successfully',
    data: newEstimate[0]
  });
});

const updateEstimate = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description, status } = req.body;

  const updates = [];
  const params = [];

  if (title !== undefined) {
    updates.push('title = ?');
    params.push(title.trim());
  }
  if (description !== undefined) {
    updates.push('description = ?');
    params.push(description && description.trim() ? description.trim() : null);
  }
  if (status !== undefined) {
    updates.push('status = ?');
    params.push(status);
  }

  if (updates.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No valid fields to update'
    });
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');
  params.push(id);

  const [result] = await pool.execute(
    `UPDATE estimates SET ${updates.join(', ')} WHERE estimate_id = ?`,
    params
  );

  if (result.affectedRows === 0) {
    return res.status(404).json({
      success: false,
      message: 'Estimate not found'
    });
  }

  const [updatedEstimate] = await pool.execute(`
    SELECT e.*,
           s.name as site_name,
           s.location as site_location,
           u.username as created_by_username,
           (SELECT COUNT(*) FROM estimate_items ei WHERE ei.estimate_id = e.estimate_id) as item_count,
           (SELECT SUM(total_estimated) FROM estimate_items ei WHERE ei.estimate_id = e.estimate_id) as calculated_total,
           (SELECT SUM(a.actual_unit_price * COALESCE(a.actual_quantity, ei.quantity))
            FROM actuals a
            JOIN estimate_items ei ON a.item_id = ei.item_id
            WHERE ei.estimate_id = e.estimate_id) as total_purchased_amount
    FROM estimates e
    LEFT JOIN sites s ON e.site_id = s.site_id
    LEFT JOIN users u ON e.created_by = u.user_id
    WHERE e.estimate_id = ?
  `, [id]);

  res.json({
    success: true,
    message: 'Estimate updated successfully',
    data: updatedEstimate[0]
  });
});

const deleteEstimate = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [itemCount] = await pool.execute(
    'SELECT COUNT(*) as count FROM estimate_items WHERE estimate_id = ?',
    [id]
  );

  if (itemCount[0].count > 0) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete estimate with existing items. Delete items first.'
    });
  }

  const [result] = await pool.execute(
    'DELETE FROM estimates WHERE estimate_id = ?',
    [id]
  );

  if (result.affectedRows === 0) {
    return res.status(404).json({
      success: false,
      message: 'Estimate not found'
    });
  }

  res.json({
    success: true,
    message: 'Estimate deleted successfully'
  });
});

const getEstimateStatistics = asyncHandler(async (req, res) => {
  const [stats] = await pool.execute(`
    SELECT
      COUNT(*) as total_estimates,
      SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft_estimates,
      SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) as submitted_estimates,
      SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_estimates,
      SUM(total_estimated) as total_estimated_value,
      AVG(total_estimated) as average_estimate_value
    FROM estimates
  `);

  const [recentEstimates] = await pool.execute(`
    SELECT e.estimate_id, e.title, e.status, e.date_created, s.name as site_name
    FROM estimates e
    LEFT JOIN sites s ON e.site_id = s.site_id
    ORDER BY e.date_created DESC
    LIMIT 5
  `);

  res.json({
    success: true,
    data: {
      statistics: stats[0],
      recentEstimates
    }
  });
});

const duplicateEstimate = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title } = req.body;
  const created_by = req.user.user_id;

  const [originalEstimate] = await pool.execute(
    'SELECT * FROM estimates WHERE estimate_id = ?',
    [id]
  );

  if (originalEstimate.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Original estimate not found'
    });
  }

  const original = originalEstimate[0];

  const [newEstimateResult] = await pool.execute(
    'INSERT INTO estimates (site_id, title, description, date_created, created_by) VALUES (?, ?, ?, ?, ?)',
    [original.site_id, title || `${original.title} (Copy)`, original.description, new Date(), created_by]
  );

  const newEstimateId = newEstimateResult.insertId;

  const [originalItems] = await pool.execute(
    'SELECT * FROM estimate_items WHERE estimate_id = ?',
    [id]
  );

  for (const item of originalItems) {
    await pool.execute(
      'INSERT INTO estimate_items (estimate_id, description, category_id, quantity, unit, unit_price, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [newEstimateId, item.description, item.category_id, item.quantity, item.unit, item.unit_price, item.notes]
    );
  }

  const [newEstimate] = await pool.execute(`
    SELECT e.*,
           s.name as site_name,
           s.location as site_location,
           u.username as created_by_username,
           (SELECT COUNT(*) FROM estimate_items ei WHERE ei.estimate_id = e.estimate_id) as item_count,
           (SELECT SUM(total_estimated) FROM estimate_items ei WHERE ei.estimate_id = e.estimate_id) as calculated_total,
           0 as total_purchased_amount
    FROM estimates e
    LEFT JOIN sites s ON e.site_id = s.site_id
    LEFT JOIN users u ON e.created_by = u.user_id
    WHERE e.estimate_id = ?
  `, [newEstimateId]);

  res.status(201).json({
    success: true,
    message: 'Estimate duplicated successfully',
    data: newEstimate[0]
  });
});

module.exports = {
  getAllEstimates,
  getEstimateById,
  createEstimate,
  updateEstimate,
  deleteEstimate,
  getEstimateStatistics,
  duplicateEstimate
};