const { pool } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');

const getAllActuals = asyncHandler(async (req, res) => {
  const { page = 1, site_id, estimate_id, item_id, date_from, date_to } = req.query;
  const limit = Math.min(parseInt(req.query.limit) || 10, 100);
  const offset = (parseInt(page) - 1) * limit;

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
    whereConditions.push(`s.site_id = $${params.length + 1}`);
    params.push(site_id);
  }

  if (estimate_id) {
    whereConditions.push(`e.estimate_id = $${params.length + 1}`);
    params.push(estimate_id);
  }

  if (item_id) {
    whereConditions.push(`a.item_id = $${params.length + 1}`);
    params.push(item_id);
  }

  if (date_from) {
    whereConditions.push(`a.date_recorded >= $${params.length + 1}`);
    params.push(date_from);
  }

  if (date_to) {
    whereConditions.push(`a.date_recorded <= $${params.length + 1}`);
    params.push(date_to);
  }

  if (whereConditions.length > 0) {
    const whereClause = ' WHERE ' + whereConditions.join(' AND ');
    query += whereClause;
    countQuery += whereClause;
  }

  query += ` ORDER BY a.date_recorded DESC LIMIT ${limit} OFFSET ${offset}`;

  const actualsResult = await pool.query(query, params);
  const countResult = await pool.query(countQuery, params);
  const actuals = actualsResult.rows;

  // Get summary statistics for the filtered results
  let summaryQuery = `
    SELECT
      COUNT(*) as total_records,
      SUM(a.total_actual) as total_actual,
      SUM(ei.total_estimated) as total_estimated,
      AVG(a.variance_percentage) as avg_variance_percentage
    FROM actuals a
    JOIN estimate_items ei ON a.item_id = ei.item_id
    JOIN estimates e ON ei.estimate_id = e.estimate_id
    JOIN sites s ON e.site_id = s.site_id
  `;

  if (whereConditions.length > 0) {
    summaryQuery += ' WHERE ' + whereConditions.join(' AND ');
  }

  const summaryResult = await pool.query(summaryQuery, params);

  const total = countResult.rows[0].total;
  const totalPages = Math.ceil(total / limit);

  res.json({
    success: true,
    data: actuals,
    pagination: {
      page: parseInt(page),
      limit,
      total,
      totalPages,
      hasNext: parseInt(page) < totalPages,
      hasPrev: parseInt(page) > 1
    },
    summary: summaryResult.rows[0]
  });
});

const getActualById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const actualsResult = await pool.query(`
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
    WHERE a.actual_id = $1
  `, [id]);
  const actuals = actualsResult.rows;

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

  // Validate required fields
  if (!item_id || item_id <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Item ID is required and must be greater than 0'
    });
  }

  if (!actual_unit_price || actual_unit_price <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Actual unit price is required and must be greater than 0'
    });
  }

  const itemCheckResult = await pool.query(
    'SELECT item_id FROM estimate_items WHERE item_id = $1',
    [item_id]
  );
  const itemCheck = itemCheckResult.rows;

  if (itemCheck.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Estimate item not found'
    });
  }

  // Get the estimated values for variance calculation
  const estimateItemResult = await pool.query(
    'SELECT quantity, unit_price, total_estimated FROM estimate_items WHERE item_id = $1',
    [item_id]
  );
  const estimateItem = estimateItemResult.rows[0];

  // Calculate actual values and variance
  const actualQuantity = actual_quantity || estimateItem.quantity;
  const totalActual = actualQuantity * actual_unit_price;

  // CORRECT variance calculation - based on unit price difference
  const unitPriceVariance = actual_unit_price - estimateItem.unit_price;
  const varianceAmount = unitPriceVariance * actualQuantity;
  const variancePercentage = estimateItem.unit_price > 0
    ? (unitPriceVariance / estimateItem.unit_price) * 100
    : 0;

  const result = await pool.query(
    'INSERT INTO actuals (item_id, actual_unit_price, actual_quantity, total_actual, variance_amount, variance_percentage, date_recorded, notes, recorded_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING actual_id',
    [
      parseInt(item_id),
      parseFloat(actual_unit_price),
      actual_quantity ? parseFloat(actual_quantity) : null,
      totalActual,
      varianceAmount,
      variancePercentage,
      date_recorded,
      notes && notes.trim() ? notes.trim() : null,
      recorded_by
    ]
  );

  const newActualResult = await pool.query(`
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
    WHERE a.actual_id = $1
  `, [result.rows[0].actual_id]);
  const newActual = newActualResult.rows;

  res.status(201).json({
    success: true,
    message: 'Actual cost recorded successfully',
    data: newActual[0]
  });
});

const updateActual = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { actual_unit_price, actual_quantity, date_recorded, notes } = req.body;

  // Get current actual record and estimate item info for calculations
  const currentRecordResult = await pool.query(`
    SELECT a.*, ei.quantity as estimated_quantity, ei.unit_price as estimated_unit_price
    FROM actuals a
    JOIN estimate_items ei ON a.item_id = ei.item_id
    WHERE a.actual_id = $1
  `, [id]);

  if (currentRecordResult.rows.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Actual cost record not found'
    });
  }

  const currentRecord = currentRecordResult.rows[0];

  // Determine new values (use provided values or keep current ones)
  const newUnitPrice = actual_unit_price !== undefined ? parseFloat(actual_unit_price) : currentRecord.actual_unit_price;
  const newQuantity = actual_quantity !== undefined ? (actual_quantity ? parseFloat(actual_quantity) : null) : currentRecord.actual_quantity;
  const actualQuantityForCalc = newQuantity || currentRecord.estimated_quantity;

  // Recalculate variance if price or quantity changed
  const needsVarianceRecalc = actual_unit_price !== undefined || actual_quantity !== undefined;
  let totalActual, varianceAmount, variancePercentage;

  if (needsVarianceRecalc) {
    totalActual = actualQuantityForCalc * newUnitPrice;
    const unitPriceVariance = newUnitPrice - currentRecord.estimated_unit_price;
    varianceAmount = unitPriceVariance * actualQuantityForCalc;
    variancePercentage = currentRecord.estimated_unit_price > 0
      ? (unitPriceVariance / currentRecord.estimated_unit_price) * 100
      : 0;
  }

  const updates = [];
  const params = [];

  if (actual_unit_price !== undefined) {
    updates.push(`actual_unit_price = $${params.length + 1}`);
    params.push(newUnitPrice);
  }
  if (actual_quantity !== undefined) {
    updates.push(`actual_quantity = $${params.length + 1}`);
    params.push(newQuantity);
  }
  if (needsVarianceRecalc) {
    updates.push(`total_actual = $${params.length + 1}`);
    params.push(totalActual);
    updates.push(`variance_amount = $${params.length + 1}`);
    params.push(varianceAmount);
    updates.push(`variance_percentage = $${params.length + 1}`);
    params.push(variancePercentage);
  }
  if (date_recorded !== undefined) {
    updates.push(`date_recorded = $${params.length + 1}`);
    params.push(date_recorded);
  }
  if (notes !== undefined) {
    updates.push(`notes = $${params.length + 1}`);
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

  const result = await pool.query(
    `UPDATE actuals SET ${updates.join(', ')} WHERE actual_id = $${params.length}`,
    params
  );

  if (result.rowCount === 0) {
    return res.status(404).json({
      success: false,
      message: 'Actual cost record not found'
    });
  }

  const updatedActualResult = await pool.query(`
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
    WHERE a.actual_id = $1
  `, [id]);
  const updatedActual = updatedActualResult.rows;

  res.json({
    success: true,
    message: 'Actual cost updated successfully',
    data: updatedActual[0]
  });
});

const deleteActual = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await pool.query(
    'DELETE FROM actuals WHERE actual_id = $1',
    [id]
  );

  if (result.rowCount === 0) {
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

  const actualsResult = await pool.query(`
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
    WHERE ei.estimate_id = $1
    ORDER BY ei.item_id ASC, a.date_recorded ASC
  `, [estimate_id]);
  const actuals = actualsResult.rows;

  const summaryResult = await pool.query(`
    SELECT
      COUNT(DISTINCT a.actual_id) as total_actuals,
      COUNT(DISTINCT a.item_id) as items_with_actuals,
      SUM(a.total_actual) as total_actual_cost,
      SUM(ei.total_estimated) as total_estimated_cost,
      SUM(a.variance_amount) as total_variance,
      AVG(a.variance_percentage) as average_variance_percentage
    FROM actuals a
    JOIN estimate_items ei ON a.item_id = ei.item_id
    WHERE ei.estimate_id = $1
  `, [estimate_id]);
  const summary = summaryResult.rows;

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

  const actualsResult = await pool.query(`
    SELECT a.*,
           u.username as recorded_by_username,
           ROW_NUMBER() OVER (ORDER BY a.date_recorded ASC, a.actual_id ASC) as batch_number
    FROM actuals a
    LEFT JOIN users u ON a.recorded_by = u.user_id
    WHERE a.item_id = $1
    ORDER BY a.date_recorded ASC, a.actual_id ASC
  `, [item_id]);
  const actuals = actualsResult.rows;

  const itemInfoResult = await pool.query(`
    SELECT ei.*,
           c.name as category_name,
           e.title as estimate_title,
           s.name as site_name
    FROM estimate_items ei
    JOIN estimates e ON ei.estimate_id = e.estimate_id
    JOIN sites s ON e.site_id = s.site_id
    JOIN categories c ON ei.category_id = c.category_id
    WHERE ei.item_id = $1
  `, [item_id]);
  const itemInfo = itemInfoResult.rows;

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
  const statsResult = await pool.query(`
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
  const stats = statsResult.rows;

  const recentActualsResult = await pool.query(`
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
  const recentActuals = recentActualsResult.rows;

  const varianceByCategoryResult = await pool.query(`
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
  const varianceByCategory = varianceByCategoryResult.rows;

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