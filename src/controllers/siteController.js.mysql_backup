const { pool } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');

const getAllSites = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, search } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let query = `
    SELECT s.*,
           u.username as created_by_username,
           (SELECT COUNT(*) FROM estimates e WHERE e.site_id = s.site_id) as estimate_count,
           (SELECT SUM(total_estimated) FROM estimates e WHERE e.site_id = s.site_id) as total_estimated_amount,
           (SELECT SUM(a.actual_unit_price * COALESCE(a.actual_quantity, ei.quantity))
            FROM actuals a
            JOIN estimate_items ei ON a.item_id = ei.item_id
            JOIN estimates e ON ei.estimate_id = e.estimate_id
            WHERE e.site_id = s.site_id) as total_purchased_amount
    FROM sites s
    LEFT JOIN users u ON s.created_by = u.user_id
  `;

  let countQuery = 'SELECT COUNT(*) as total FROM sites s';
  const whereParams = [];

  let whereConditions = [];

  if (status) {
    whereConditions.push('s.status = ?');
    whereParams.push(status);
  }

  if (search) {
    whereConditions.push('(s.name LIKE ? OR s.location LIKE ?)');
    const searchTerm = `%${search}%`;
    whereParams.push(searchTerm, searchTerm);
  }

  if (whereConditions.length > 0) {
    const whereClause = ' WHERE ' + whereConditions.join(' AND ');
    query += whereClause;
    countQuery += whereClause;
  }

  query += ` ORDER BY s.created_at DESC LIMIT ${parseInt(limit)} OFFSET ${offset}`;

  const [sites] = await pool.execute(query, whereParams);
  const [countResult] = await pool.execute(countQuery, whereParams);

  const total = countResult[0].total;
  const totalPages = Math.ceil(total / parseInt(limit));

  res.json({
    success: true,
    data: {
      sites,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalSites: total,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1
      }
    }
  });
});

const getSiteById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [sites] = await pool.execute(`
    SELECT s.*,
           u.username as created_by_username,
           (SELECT COUNT(*) FROM estimates e WHERE e.site_id = s.site_id) as estimate_count,
           (SELECT SUM(total_estimated) FROM estimates e WHERE e.site_id = s.site_id) as total_estimated_amount,
           (SELECT SUM(a.actual_unit_price * COALESCE(a.actual_quantity, ei.quantity))
            FROM actuals a
            JOIN estimate_items ei ON a.item_id = ei.item_id
            JOIN estimates e ON ei.estimate_id = e.estimate_id
            WHERE e.site_id = s.site_id) as total_purchased_amount
    FROM sites s
    LEFT JOIN users u ON s.created_by = u.user_id
    WHERE s.site_id = ?
  `, [id]);

  if (sites.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Site not found'
    });
  }

  const [estimates] = await pool.execute(
    'SELECT estimate_id, title, date_created, status, total_estimated FROM estimates WHERE site_id = ? ORDER BY date_created DESC',
    [id]
  );

  res.json({
    success: true,
    data: {
      ...sites[0],
      estimates
    }
  });
});

const createSite = asyncHandler(async (req, res) => {
  const { name, location, start_date, end_date, status = 'planning', budget_limit, notes } = req.body;
  const created_by = req.user.user_id;

  const [result] = await pool.execute(
    'INSERT INTO sites (name, location, start_date, end_date, status, budget_limit, notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [
      name.trim(),
      location && location.trim() ? location.trim() : null,
      start_date || null,
      end_date || null,
      status,
      budget_limit || null,
      notes && notes.trim() ? notes.trim() : null,
      created_by
    ]
  );

  const [newSite] = await pool.execute(`
    SELECT s.*,
           u.username as created_by_username,
           0 as estimate_count,
           0 as total_estimated_amount,
           0 as total_purchased_amount
    FROM sites s
    LEFT JOIN users u ON s.created_by = u.user_id
    WHERE s.site_id = ?
  `, [result.insertId]);

  res.status(201).json({
    success: true,
    message: 'Site created successfully',
    data: newSite[0]
  });
});

const updateSite = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, location, start_date, end_date, status, budget_limit, notes } = req.body;

  const updates = [];
  const params = [];

  if (name !== undefined) {
    updates.push('name = ?');
    params.push(name.trim());
  }
  if (location !== undefined) {
    updates.push('location = ?');
    params.push(location && location.trim() ? location.trim() : null);
  }
  if (start_date !== undefined) {
    updates.push('start_date = ?');
    params.push(start_date || null);
  }
  if (end_date !== undefined) {
    updates.push('end_date = ?');
    params.push(end_date || null);
  }
  if (status !== undefined) {
    updates.push('status = ?');
    params.push(status);
  }
  if (budget_limit !== undefined) {
    updates.push('budget_limit = ?');
    params.push(budget_limit || null);
  }
  if (notes !== undefined) {
    updates.push('notes = ?');
    params.push(notes && notes.trim() ? notes.trim() : null);
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
    `UPDATE sites SET ${updates.join(', ')} WHERE site_id = ?`,
    params
  );

  if (result.affectedRows === 0) {
    return res.status(404).json({
      success: false,
      message: 'Site not found'
    });
  }

  const [updatedSite] = await pool.execute(`
    SELECT s.*,
           u.username as created_by_username,
           (SELECT COUNT(*) FROM estimates e WHERE e.site_id = s.site_id) as estimate_count,
           (SELECT SUM(total_estimated) FROM estimates e WHERE e.site_id = s.site_id) as total_estimated_amount,
           (SELECT SUM(a.actual_unit_price * COALESCE(a.actual_quantity, ei.quantity))
            FROM actuals a
            JOIN estimate_items ei ON a.item_id = ei.item_id
            JOIN estimates e ON ei.estimate_id = e.estimate_id
            WHERE e.site_id = s.site_id) as total_purchased_amount
    FROM sites s
    LEFT JOIN users u ON s.created_by = u.user_id
    WHERE s.site_id = ?
  `, [id]);

  res.json({
    success: true,
    message: 'Site updated successfully',
    data: updatedSite[0]
  });
});

const deleteSite = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [estimateCount] = await pool.execute(
    'SELECT COUNT(*) as count FROM estimates WHERE site_id = ?',
    [id]
  );

  if (estimateCount[0].count > 0) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete site with existing estimates. Delete estimates first.'
    });
  }

  const [result] = await pool.execute(
    'DELETE FROM sites WHERE site_id = ?',
    [id]
  );

  if (result.affectedRows === 0) {
    return res.status(404).json({
      success: false,
      message: 'Site not found'
    });
  }

  res.json({
    success: true,
    message: 'Site deleted successfully'
  });
});

const getSiteStatistics = asyncHandler(async (req, res) => {
  const [stats] = await pool.execute(`
    SELECT
      COUNT(*) as total_sites,
      SUM(CASE WHEN status = 'planning' THEN 1 ELSE 0 END) as planning_sites,
      SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_sites,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_sites,
      SUM(CASE WHEN status = 'on_hold' THEN 1 ELSE 0 END) as on_hold_sites,
      SUM(budget_limit) as total_budget,
      AVG(budget_limit) as average_budget
    FROM sites
  `);

  const [recentSites] = await pool.execute(`
    SELECT site_id, name, status, created_at
    FROM sites
    ORDER BY created_at DESC
    LIMIT 5
  `);

  res.json({
    success: true,
    data: {
      statistics: stats[0],
      recentSites
    }
  });
});

module.exports = {
  getAllSites,
  getSiteById,
  createSite,
  updateSite,
  deleteSite,
  getSiteStatistics
};