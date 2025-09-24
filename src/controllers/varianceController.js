const { pool } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');

const getVarianceAnalysis = asyncHandler(async (req, res) => {
  const { site_id, estimate_id, category_id, variance_threshold = 10 } = req.query;

  let baseQuery = `
    SELECT
      s.site_id,
      s.name as site_name,
      e.estimate_id,
      e.title as estimate_title,
      ei.item_id,
      ei.description as item_description,
      c.name as category_name,
      ei.quantity as estimated_quantity,
      ei.unit,
      ei.unit_price as estimated_unit_price,
      ei.total_estimated,
      COALESCE(a.actual_unit_price, 0) as actual_unit_price,
      COALESCE(a.actual_quantity, ei.quantity) as actual_quantity,
      COALESCE(a.actual_unit_price * COALESCE(a.actual_quantity, ei.quantity), 0) as total_actual,
      COALESCE(a.actual_unit_price * COALESCE(a.actual_quantity, ei.quantity), 0) - ei.total_estimated as variance_amount,
      CASE
        WHEN ei.total_estimated > 0 AND a.actual_unit_price IS NOT NULL
        THEN (((a.actual_unit_price * COALESCE(a.actual_quantity, ei.quantity)) - ei.total_estimated) / ei.total_estimated) * 100
        ELSE 0
      END as variance_percentage,
      CASE
        WHEN a.actual_unit_price IS NULL THEN 'no_actual'
        WHEN (a.actual_unit_price * COALESCE(a.actual_quantity, ei.quantity)) > ei.total_estimated THEN 'over_budget'
        WHEN (a.actual_unit_price * COALESCE(a.actual_quantity, ei.quantity)) < ei.total_estimated THEN 'under_budget'
        ELSE 'on_budget'
      END as variance_status,
      a.date_recorded
    FROM sites s
    JOIN estimates e ON s.site_id = e.site_id
    JOIN estimate_items ei ON e.estimate_id = ei.estimate_id
    JOIN categories c ON ei.category_id = c.category_id
    LEFT JOIN actuals a ON ei.item_id = a.item_id
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

  if (category_id) {
    whereConditions.push(`c.category_id = $${params.length + 1}`);
    params.push(category_id);
  }

  if (whereConditions.length > 0) {
    baseQuery += ' WHERE ' + whereConditions.join(' AND ');
  }

  baseQuery += ' ORDER BY ABS(CASE WHEN ei.total_estimated > 0 AND a.actual_unit_price IS NOT NULL THEN (((a.actual_unit_price * COALESCE(a.actual_quantity, ei.quantity)) - ei.total_estimated) / ei.total_estimated) * 100 ELSE 0 END) DESC, s.site_id, e.estimate_id, c.sort_order';

  const varianceDataResult = await pool.query(baseQuery, params);
  const varianceData = varianceDataResult.rows;

  const significantVariances = varianceData.filter(item =>
    Math.abs(item.variance_percentage) >= parseFloat(variance_threshold)
  );

  const summaryStats = {
    total_items: varianceData.length,
    items_with_actuals: varianceData.filter(item => item.variance_status !== 'no_actual').length,
    over_budget_items: varianceData.filter(item => item.variance_status === 'over_budget').length,
    under_budget_items: varianceData.filter(item => item.variance_status === 'under_budget').length,
    on_budget_items: varianceData.filter(item => item.variance_status === 'on_budget').length,
    significant_variances: significantVariances.length,
    total_estimated: varianceData.reduce((sum, item) => sum + parseFloat(item.total_estimated || 0), 0),
    total_actual: varianceData.reduce((sum, item) => sum + parseFloat(item.total_actual || 0), 0),
    total_variance: varianceData.reduce((sum, item) => sum + parseFloat(item.variance_amount || 0), 0)
  };

  summaryStats.overall_variance_percentage = summaryStats.total_estimated > 0
    ? ((summaryStats.total_variance / summaryStats.total_estimated) * 100)
    : 0;

  res.json({
    success: true,
    data: {
      variance_analysis: varianceData,
      significant_variances: significantVariances,
      summary: summaryStats
    }
  });
});

const getVarianceBySite = asyncHandler(async (req, res) => {
  const siteVariancesResult = await pool.query(`
    SELECT
      s.site_id,
      s.name as site_name,
      s.status as site_status,
      COUNT(DISTINCT e.estimate_id) as estimate_count,
      COUNT(DISTINCT ei.item_id) as total_items,
      COUNT(DISTINCT a.actual_id) as items_with_actuals,
      SUM(ei.total_estimated) as total_estimated,
      SUM(COALESCE(a.actual_unit_price * COALESCE(a.actual_quantity, ei.quantity), 0)) as total_actual,
      SUM(COALESCE(a.actual_unit_price * COALESCE(a.actual_quantity, ei.quantity), 0)) - SUM(ei.total_estimated) as total_variance,
      CASE
        WHEN SUM(ei.total_estimated) > 0
        THEN ((SUM(COALESCE(a.actual_unit_price * COALESCE(a.actual_quantity, ei.quantity), 0)) - SUM(ei.total_estimated)) / SUM(ei.total_estimated)) * 100
        ELSE 0
      END as variance_percentage,
      SUM(CASE WHEN (a.actual_unit_price * COALESCE(a.actual_quantity, ei.quantity)) > ei.total_estimated THEN 1 ELSE 0 END) as over_budget_count,
      SUM(CASE WHEN (a.actual_unit_price * COALESCE(a.actual_quantity, ei.quantity)) < ei.total_estimated THEN 1 ELSE 0 END) as under_budget_count
    FROM sites s
    LEFT JOIN estimates e ON s.site_id = e.site_id
    LEFT JOIN estimate_items ei ON e.estimate_id = ei.estimate_id
    LEFT JOIN actuals a ON ei.item_id = a.item_id
    GROUP BY s.site_id, s.name, s.status
    HAVING COUNT(DISTINCT ei.item_id) > 0
    ORDER BY ABS(variance_percentage) DESC
  `);
  const siteVariances = siteVariancesResult.rows;

  res.json({
    success: true,
    data: siteVariances
  });
});

const getVarianceByCategory = asyncHandler(async (req, res) => {
  const { site_id, estimate_id } = req.query;

  let query = `
    SELECT
      c.category_id,
      c.name as category_name,
      COUNT(ei.item_id) as total_items,
      COUNT(a.actual_id) as items_with_actuals,
      SUM(ei.total_estimated) as total_estimated,
      SUM(COALESCE(a.actual_unit_price * COALESCE(a.actual_quantity, ei.quantity), 0)) as total_actual,
      SUM(COALESCE(a.actual_unit_price * COALESCE(a.actual_quantity, ei.quantity), 0)) - SUM(ei.total_estimated) as total_variance,
      CASE
        WHEN SUM(ei.total_estimated) > 0
        THEN ((SUM(COALESCE(a.actual_unit_price * COALESCE(a.actual_quantity, ei.quantity), 0)) - SUM(ei.total_estimated)) / SUM(ei.total_estimated)) * 100
        ELSE 0
      END as variance_percentage,
      SUM(CASE WHEN (a.actual_unit_price * COALESCE(a.actual_quantity, ei.quantity)) > ei.total_estimated THEN 1 ELSE 0 END) as over_budget_count,
      SUM(CASE WHEN (a.actual_unit_price * COALESCE(a.actual_quantity, ei.quantity)) < ei.total_estimated THEN 1 ELSE 0 END) as under_budget_count,
      AVG(CASE
        WHEN ei.total_estimated > 0 AND a.actual_unit_price IS NOT NULL
        THEN (((a.actual_unit_price * COALESCE(a.actual_quantity, ei.quantity)) - ei.total_estimated) / ei.total_estimated) * 100
        ELSE 0
      END) as avg_item_variance_percentage
    FROM categories c
    LEFT JOIN estimate_items ei ON c.category_id = ei.category_id
    LEFT JOIN estimates e ON ei.estimate_id = e.estimate_id
    LEFT JOIN actuals a ON ei.item_id = a.item_id
  `;

  const params = [];
  let whereConditions = [];

  if (site_id) {
    whereConditions.push(`e.site_id = $${params.length + 1}`);
    params.push(site_id);
  }

  if (estimate_id) {
    whereConditions.push(`e.estimate_id = $${params.length + 1}`);
    params.push(estimate_id);
  }

  if (whereConditions.length > 0) {
    query += ' WHERE ' + whereConditions.join(' AND ');
  }

  query += `
    GROUP BY c.category_id, c.name
    HAVING COUNT(ei.item_id) > 0
    ORDER BY ABS(variance_percentage) DESC
  `;

  const categoryVariancesResult = await pool.query(query, params);
  const categoryVariances = categoryVariancesResult.rows;

  res.json({
    success: true,
    data: categoryVariances
  });
});

const getVarianceTrends = asyncHandler(async (req, res) => {
  const { site_id, days = 30 } = req.query;

  let query = `
    SELECT
      DATE(a.date_recorded) as recorded_date,
      COUNT(a.actual_id) as actuals_recorded,
      SUM(a.actual_unit_price * COALESCE(a.actual_quantity, ei.quantity)) as daily_actual_cost,
      SUM(ei.total_estimated) as daily_estimated_cost,
      SUM((a.actual_unit_price * COALESCE(a.actual_quantity, ei.quantity)) - ei.total_estimated) as daily_variance,
      AVG(CASE
        WHEN ei.total_estimated > 0 AND a.actual_unit_price IS NOT NULL
        THEN (((a.actual_unit_price * COALESCE(a.actual_quantity, ei.quantity)) - ei.total_estimated) / ei.total_estimated) * 100
        ELSE 0
      END) as avg_variance_percentage,
      SUM(CASE WHEN (a.actual_unit_price * COALESCE(a.actual_quantity, ei.quantity)) > ei.total_estimated THEN 1 ELSE 0 END) as over_budget_count,
      SUM(CASE WHEN (a.actual_unit_price * COALESCE(a.actual_quantity, ei.quantity)) < ei.total_estimated THEN 1 ELSE 0 END) as under_budget_count
    FROM actuals a
    JOIN estimate_items ei ON a.item_id = ei.item_id
    JOIN estimates e ON ei.estimate_id = e.estimate_id
  `;

  const params = [];
  let whereConditions = [`a.date_recorded >= CURRENT_DATE - INTERVAL '${parseInt(days)} days'`];

  if (site_id) {
    whereConditions.push(`e.site_id = $${params.length + 1}`);
    params.push(site_id);
  }

  query += ' WHERE ' + whereConditions.join(' AND ');
  query += ' GROUP BY DATE(a.date_recorded) ORDER BY recorded_date ASC';

  const trendsResult = await pool.query(query, params);
  const trends = trendsResult.rows;

  const cumulativeData = [];
  let cumulativeVariance = 0;
  let cumulativeEstimated = 0;
  let cumulativeActual = 0;

  trends.forEach((trend, index) => {
    cumulativeVariance += parseFloat(trend.daily_variance || 0);
    cumulativeEstimated += parseFloat(trend.daily_estimated_cost || 0);
    cumulativeActual += parseFloat(trend.daily_actual_cost || 0);

    cumulativeData.push({
      ...trend,
      cumulative_variance: cumulativeVariance,
      cumulative_estimated: cumulativeEstimated,
      cumulative_actual: cumulativeActual,
      cumulative_variance_percentage: cumulativeEstimated > 0
        ? (cumulativeVariance / cumulativeEstimated) * 100
        : 0
    });
  });

  res.json({
    success: true,
    data: {
      daily_trends: trends,
      cumulative_trends: cumulativeData
    }
  });
});

const getTopVariances = asyncHandler(async (req, res) => {
  const { limit = 10, type = 'both' } = req.query;

  let conditions = '';
  if (type === 'over') {
    conditions = 'AND (a.actual_unit_price * COALESCE(a.actual_quantity, ei.quantity)) > ei.total_estimated';
  } else if (type === 'under') {
    conditions = 'AND (a.actual_unit_price * COALESCE(a.actual_quantity, ei.quantity)) < ei.total_estimated';
  }

  const topVariancesResult = await pool.query(`
    SELECT
      a.actual_id,
      ei.description as item_description,
      c.name as category_name,
      e.title as estimate_title,
      s.name as site_name,
      ei.total_estimated,
      a.actual_unit_price * COALESCE(a.actual_quantity, ei.quantity) as total_actual,
      (a.actual_unit_price * COALESCE(a.actual_quantity, ei.quantity)) - ei.total_estimated as variance_amount,
      CASE
        WHEN ei.total_estimated > 0 AND a.actual_unit_price IS NOT NULL
        THEN (((a.actual_unit_price * COALESCE(a.actual_quantity, ei.quantity)) - ei.total_estimated) / ei.total_estimated) * 100
        ELSE 0
      END as variance_percentage,
      a.date_recorded
    FROM actuals a
    JOIN estimate_items ei ON a.item_id = ei.item_id
    JOIN estimates e ON ei.estimate_id = e.estimate_id
    JOIN sites s ON e.site_id = s.site_id
    JOIN categories c ON ei.category_id = c.category_id
    WHERE a.actual_unit_price IS NOT NULL ${conditions}
    ORDER BY ABS((a.actual_unit_price * COALESCE(a.actual_quantity, ei.quantity)) - ei.total_estimated) DESC
    LIMIT ${parseInt(limit)}
  `);
  const topVariances = topVariancesResult.rows;

  res.json({
    success: true,
    data: topVariances
  });
});

const getVarianceAlerts = asyncHandler(async (req, res) => {
  const { threshold = 20 } = req.query;

  const alertsResult = await pool.query(`
    SELECT
      'high_variance' as alert_type,
      a.actual_id,
      ei.item_id,
      ei.description as item_description,
      c.name as category_name,
      e.title as estimate_title,
      s.name as site_name,
      ei.total_estimated,
      a.actual_unit_price * COALESCE(a.actual_quantity, ei.quantity) as total_actual,
      (a.actual_unit_price * COALESCE(a.actual_quantity, ei.quantity)) - ei.total_estimated as variance_amount,
      CASE
        WHEN ei.total_estimated > 0 AND a.actual_unit_price IS NOT NULL
        THEN (((a.actual_unit_price * COALESCE(a.actual_quantity, ei.quantity)) - ei.total_estimated) / ei.total_estimated) * 100
        ELSE 0
      END as variance_percentage,
      a.date_recorded,
      CASE
        WHEN (a.actual_unit_price * COALESCE(a.actual_quantity, ei.quantity)) > ei.total_estimated THEN 'over_budget'
        ELSE 'under_budget'
      END as variance_direction
    FROM actuals a
    JOIN estimate_items ei ON a.item_id = ei.item_id
    JOIN estimates e ON ei.estimate_id = e.estimate_id
    JOIN sites s ON e.site_id = s.site_id
    JOIN categories c ON ei.category_id = c.category_id
    WHERE a.actual_unit_price IS NOT NULL
      AND ei.total_estimated > 0
      AND ABS((((a.actual_unit_price * COALESCE(a.actual_quantity, ei.quantity)) - ei.total_estimated) / ei.total_estimated) * 100) >= $1
    ORDER BY ABS((((a.actual_unit_price * COALESCE(a.actual_quantity, ei.quantity)) - ei.total_estimated) / ei.total_estimated) * 100) DESC
    LIMIT 50
  `, [parseFloat(threshold)]);
  const alerts = alertsResult.rows;

  const budgetAlertsResult = await pool.query(`
    SELECT
      'budget_exceeded' as alert_type,
      s.site_id,
      s.name as site_name,
      s.budget_limit,
      SUM(a.actual_unit_price * COALESCE(a.actual_quantity, ei.quantity)) as total_spent,
      (SUM(a.actual_unit_price * COALESCE(a.actual_quantity, ei.quantity)) - s.budget_limit) as over_budget_amount,
      ((SUM(a.actual_unit_price * COALESCE(a.actual_quantity, ei.quantity)) - s.budget_limit) / s.budget_limit) * 100 as over_budget_percentage
    FROM sites s
    JOIN estimates e ON s.site_id = e.site_id
    JOIN estimate_items ei ON e.estimate_id = ei.estimate_id
    JOIN actuals a ON ei.item_id = a.item_id
    WHERE s.budget_limit IS NOT NULL
    GROUP BY s.site_id, s.name, s.budget_limit
    HAVING SUM(a.actual_unit_price * COALESCE(a.actual_quantity, ei.quantity)) > s.budget_limit
    ORDER BY ((SUM(a.actual_unit_price * COALESCE(a.actual_quantity, ei.quantity)) - s.budget_limit) / s.budget_limit) * 100 DESC
  `);
  const budgetAlerts = budgetAlertsResult.rows;

  res.json({
    success: true,
    data: {
      variance_alerts: alerts,
      budget_alerts: budgetAlerts
    }
  });
});

module.exports = {
  getVarianceAnalysis,
  getVarianceBySite,
  getVarianceByCategory,
  getVarianceTrends,
  getTopVariances,
  getVarianceAlerts
};