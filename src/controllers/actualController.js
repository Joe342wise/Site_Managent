const { pool } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');

const getAllActuals = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, site_id, estimate_id, item_id, date_from, date_to } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let query = `
    SELECT a.*,
           ei.description as item_description,
           ei.quantity as estimated_quantity,
           ei.unit as item_unit,
           ei.unit_price as estimated_unit_price,
           ei.total_estimated,
           c.name as category_name,
           e.title as estimate_title,
           s.name as site_name,
           u.username as recorded_by_username
    FROM actuals a
    JOIN estimate_items ei ON a.item_id = ei.item_id
    JOIN estimates e ON ei.estimate_id = e.estimate_id
    JOIN sites s ON e.site_id = s.site_id
    JOIN categories c ON ei.category_id = c.category_id
    LEFT JOIN users u ON a.recorded_by = u.user_id
  `;

  let countQuery = `
    SELECT COUNT(*) as total
    FROM actuals a
    JOIN estimate_items ei ON a.item_id = ei.item_id
    JOIN estimates e ON ei.estimate_id = e.estimate_id
    JOIN sites s ON e.site_id = s.site_id
  `;

  const params = [];
  let whereConditions = [];

  if (site_id) {
    whereConditions.push('s.site_id = ?');
    params.push(site_id);
  }

  if (estimate_id) {
    whereConditions.push('e.estimate_id = ?');
    params.push(estimate_id);
  }

  if (item_id) {
    whereConditions.push('a.item_id = ?');
    params.push(item_id);
  }

  if (date_from) {
    whereConditions.push('a.date_recorded >= ?');
    params.push(date_from);
  }

  if (date_to) {
    whereConditions.push('a.date_recorded <= ?');
    params.push(date_to);
  }

  if (whereConditions.length > 0) {
    const whereClause = ' WHERE ' + whereConditions.join(' AND ');
    query += whereClause;
    countQuery += whereClause;
  }

  query += ' ORDER BY a.date_recorded DESC LIMIT ? OFFSET ?';

  const [actuals] = await pool.execute(query, [...params, parseInt(limit), offset]);
  const [countResult] = await pool.execute(countQuery, params);

  const total = countResult[0].total;
  const totalPages = Math.ceil(total / parseInt(limit));

  res.json({
    success: true,
    data: {
      actuals,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalActuals: total,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1
      }
    }
  });
});

const getActualById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [actuals] = await pool.execute(`
    SELECT a.*,
           ei.description as item_description,
           ei.quantity as estimated_quantity,
           ei.unit as item_unit,
           ei.unit_price as estimated_unit_price,
           ei.total_estimated,
           c.name as category_name,
           e.title as estimate_title,
           s.name as site_name,
           u.username as recorded_by_username
    FROM actuals a
    JOIN estimate_items ei ON a.item_id = ei.item_id
    JOIN estimates e ON ei.estimate_id = e.estimate_id
    JOIN sites s ON e.site_id = s.site_id
    JOIN categories c ON ei.category_id = c.category_id
    LEFT JOIN users u ON a.recorded_by = u.user_id
    WHERE a.actual_id = ?
  `, [id]);

  if (actuals.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Actual cost record not found'
    });
  }

  res.json({
    success: true,
    data: actuals[0]
  });
});

const createActual = asyncHandler(async (req, res) => {
  const { item_id, actual_unit_price, actual_quantity, date_recorded = new Date(), notes } = req.body;
  const recorded_by = req.user.user_id;

  const [itemCheck] = await pool.execute(
    'SELECT item_id FROM estimate_items WHERE item_id = ?',
    [item_id]
  );

  if (itemCheck.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Estimate item not found'
    });
  }

  const [result] = await pool.execute(
    'INSERT INTO actuals (item_id, actual_unit_price, actual_quantity, date_recorded, notes, recorded_by) VALUES (?, ?, ?, ?, ?, ?)',
    [item_id, actual_unit_price, actual_quantity, date_recorded, notes, recorded_by]
  );

  const [newActual] = await pool.execute(`
    SELECT a.*,
           ei.description as item_description,
           ei.quantity as estimated_quantity,
           ei.unit as item_unit,
           ei.unit_price as estimated_unit_price,
           ei.total_estimated,
           c.name as category_name,
           e.title as estimate_title,
           s.name as site_name,
           u.username as recorded_by_username
    FROM actuals a
    JOIN estimate_items ei ON a.item_id = ei.item_id
    JOIN estimates e ON ei.estimate_id = e.estimate_id
    JOIN sites s ON e.site_id = s.site_id
    JOIN categories c ON ei.category_id = c.category_id
    LEFT JOIN users u ON a.recorded_by = u.user_id
    WHERE a.actual_id = ?
  `, [result.insertId]);

  res.status(201).json({
    success: true,
    message: 'Actual cost recorded successfully',
    data: newActual[0]
  });
});

const updateActual = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { actual_unit_price, actual_quantity, date_recorded, notes } = req.body;

  const updates = [];
  const params = [];

  if (actual_unit_price !== undefined) {
    updates.push('actual_unit_price = ?');
    params.push(actual_unit_price);
  }
  if (actual_quantity !== undefined) {
    updates.push('actual_quantity = ?');
    params.push(actual_quantity);
  }
  if (date_recorded !== undefined) {
    updates.push('date_recorded = ?');
    params.push(date_recorded);
  }
  if (notes !== undefined) {
    updates.push('notes = ?');
    params.push(notes);
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
    `UPDATE actuals SET ${updates.join(', ')} WHERE actual_id = ?`,
    params
  );

  if (result.affectedRows === 0) {
    return res.status(404).json({
      success: false,
      message: 'Actual cost record not found'
    });
  }

  const [updatedActual] = await pool.execute(`
    SELECT a.*,
           ei.description as item_description,
           ei.quantity as estimated_quantity,
           ei.unit as item_unit,
           ei.unit_price as estimated_unit_price,
           ei.total_estimated,
           c.name as category_name,
           e.title as estimate_title,
           s.name as site_name,
           u.username as recorded_by_username
    FROM actuals a
    JOIN estimate_items ei ON a.item_id = ei.item_id
    JOIN estimates e ON ei.estimate_id = e.estimate_id
    JOIN sites s ON e.site_id = s.site_id
    JOIN categories c ON ei.category_id = c.category_id
    LEFT JOIN users u ON a.recorded_by = u.user_id
    WHERE a.actual_id = ?
  `, [id]);

  res.json({
    success: true,
    message: 'Actual cost updated successfully',
    data: updatedActual[0]
  });
});

const deleteActual = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [result] = await pool.execute(
    'DELETE FROM actuals WHERE actual_id = ?',
    [id]
  );

  if (result.affectedRows === 0) {
    return res.status(404).json({
      success: false,
      message: 'Actual cost record not found'
    });
  }

  res.json({
    success: true,
    message: 'Actual cost record deleted successfully'
  });
});

const getActualsByEstimate = asyncHandler(async (req, res) => {
  const { estimate_id } = req.params;

  const [actuals] = await pool.execute(`
    SELECT a.*,
           ei.description as item_description,
           ei.quantity as estimated_quantity,
           ei.unit as item_unit,
           ei.unit_price as estimated_unit_price,
           ei.total_estimated,
           c.name as category_name,
           u.username as recorded_by_username
    FROM actuals a
    JOIN estimate_items ei ON a.item_id = ei.item_id
    JOIN categories c ON ei.category_id = c.category_id
    LEFT JOIN users u ON a.recorded_by = u.user_id
    WHERE ei.estimate_id = ?
    ORDER BY c.sort_order, ei.item_id, a.date_recorded DESC
  `, [estimate_id]);

  const [summary] = await pool.execute(`
    SELECT
      COUNT(DISTINCT a.actual_id) as total_actuals,
      COUNT(DISTINCT a.item_id) as items_with_actuals,
      SUM(a.total_actual) as total_actual_cost,
      SUM(ei.total_estimated) as total_estimated_cost,
      SUM(a.variance_amount) as total_variance,
      AVG(a.variance_percentage) as average_variance_percentage
    FROM actuals a
    JOIN estimate_items ei ON a.item_id = ei.item_id
    WHERE ei.estimate_id = ?
  `, [estimate_id]);

  res.json({
    success: true,
    data: {
      actuals,
      summary: summary[0]
    }
  });
});

const getActualsByItem = asyncHandler(async (req, res) => {
  const { item_id } = req.params;

  const [actuals] = await pool.execute(`
    SELECT a.*,
           u.username as recorded_by_username
    FROM actuals a
    LEFT JOIN users u ON a.recorded_by = u.user_id
    WHERE a.item_id = ?
    ORDER BY a.date_recorded DESC
  `, [item_id]);

  const [itemInfo] = await pool.execute(`
    SELECT ei.*,
           c.name as category_name,
           e.title as estimate_title,
           s.name as site_name
    FROM estimate_items ei
    JOIN estimates e ON ei.estimate_id = e.estimate_id
    JOIN sites s ON e.site_id = s.site_id
    JOIN categories c ON ei.category_id = c.category_id
    WHERE ei.item_id = ?
  `, [item_id]);

  if (itemInfo.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Estimate item not found'
    });
  }

  res.json({
    success: true,
    data: {
      item: itemInfo[0],
      actuals
    }
  });
});

const getActualsStatistics = asyncHandler(async (req, res) => {
  const [stats] = await pool.execute(`
    SELECT
      COUNT(*) as total_actuals,
      COUNT(DISTINCT item_id) as items_with_actuals,
      SUM(total_actual) as total_actual_cost,
      SUM(variance_amount) as total_variance,
      AVG(variance_percentage) as average_variance_percentage,
      SUM(CASE WHEN variance_amount > 0 THEN 1 ELSE 0 END) as over_budget_count,
      SUM(CASE WHEN variance_amount < 0 THEN 1 ELSE 0 END) as under_budget_count,
      SUM(CASE WHEN variance_amount = 0 THEN 1 ELSE 0 END) as on_budget_count
    FROM actuals
  `);

  const [recentActuals] = await pool.execute(`
    SELECT a.actual_id, a.total_actual, a.variance_amount, a.date_recorded,
           ei.description as item_description,
           s.name as site_name
    FROM actuals a
    JOIN estimate_items ei ON a.item_id = ei.item_id
    JOIN estimates e ON ei.estimate_id = e.estimate_id
    JOIN sites s ON e.site_id = s.site_id
    ORDER BY a.date_recorded DESC
    LIMIT 10
  `);

  const [varianceByCategory] = await pool.execute(`
    SELECT
      c.name as category_name,
      COUNT(a.actual_id) as actual_count,
      SUM(a.total_actual) as total_actual,
      SUM(ei.total_estimated) as total_estimated,
      SUM(a.variance_amount) as total_variance,
      AVG(a.variance_percentage) as avg_variance_percentage
    FROM actuals a
    JOIN estimate_items ei ON a.item_id = ei.item_id
    JOIN categories c ON ei.category_id = c.category_id
    GROUP BY c.category_id, c.name
    ORDER BY total_variance DESC
  `);

  res.json({
    success: true,
    data: {
      statistics: stats[0],
      recentActuals,
      varianceByCategory
    }
  });
});

module.exports = {
  getAllActuals,
  getActualById,
  createActual,
  updateActual,
  deleteActual,
  getActualsByEstimate,
  getActualsByItem,
  getActualsStatistics
};