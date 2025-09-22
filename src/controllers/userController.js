const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');

const getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, role, search } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let query = 'SELECT user_id, username, email, full_name, role, is_active, created_at FROM users';
  let countQuery = 'SELECT COUNT(*) as total FROM users';
  const params = [];

  let whereConditions = [];

  if (role) {
    whereConditions.push(`role = $${params.length + 1}`);
    params.push(role);
  }

  if (search) {
    whereConditions.push(`(username LIKE $${params.length + 1} OR email LIKE $${params.length + 2} OR full_name LIKE $${params.length + 3})`);
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  if (whereConditions.length > 0) {
    const whereClause = ' WHERE ' + whereConditions.join(' AND ');
    query += whereClause;
    countQuery += whereClause;
  }

  query += ` ORDER BY created_at DESC LIMIT ${parseInt(limit)} OFFSET ${offset}`;

  const usersResult = await pool.query(query, params);
  const countResult = await pool.query(countQuery, params);
  const users = usersResult.rows;

  const total = countResult.rows[0].total;
  const totalPages = Math.ceil(total / parseInt(limit));

  res.json({
    success: true,
    data: {
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalUsers: total,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1
      }
    }
  });
});

const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const usersResult = await pool.query(
    'SELECT user_id, username, email, full_name, role, is_active, created_at, updated_at FROM users WHERE user_id = $1',
    [id]
  );
  const users = usersResult.rows;

  if (users.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  res.json({
    success: true,
    data: users[0]
  });
});

const createUser = asyncHandler(async (req, res) => {
  const { username, password, email, full_name, role = 'admin' } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  const result = await pool.query(
    'INSERT INTO users (username, password, email, full_name, role) VALUES ($1, $2, $3, $4, $5) RETURNING user_id',
    [username, hashedPassword, email, full_name, role]
  );

  const newUserResult = await pool.query(
    'SELECT user_id, username, email, full_name, role, is_active, created_at FROM users WHERE user_id = $1',
    [result.rows[0].user_id]
  );
  const newUser = newUserResult.rows;

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: newUser[0]
  });
});

const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { username, email, full_name, role, is_active } = req.body;

  const updates = [];
  const params = [];

  if (username !== undefined) {
    updates.push(`username = $${params.length + 1}`);
    params.push(username);
  }
  if (email !== undefined) {
    updates.push(`email = $${params.length + 1}`);
    params.push(email);
  }
  if (full_name !== undefined) {
    updates.push(`full_name = $${params.length + 1}`);
    params.push(full_name);
  }
  if (role !== undefined) {
    updates.push(`role = $${params.length + 1}`);
    params.push(role);
  }
  if (is_active !== undefined) {
    updates.push(`is_active = $${params.length + 1}`);
    params.push(is_active);
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
    `UPDATE users SET ${updates.join(', ')} WHERE user_id = $${params.length}`,
    params
  );

  if (result.affectedRows === 0) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  const updatedUserResult = await pool.query(
    'SELECT user_id, username, email, full_name, role, is_active, created_at, updated_at FROM users WHERE user_id = $1',
    [id]
  );
  const updatedUser = updatedUserResult.rows;

  res.json({
    success: true,
    message: 'User updated successfully',
    data: updatedUser[0]
  });
});

const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (parseInt(id) === req.user.user_id) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete your own account'
    });
  }

  const result = await pool.query(
    'UPDATE users SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1',
    [id]
  );

  if (result.affectedRows === 0) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  res.json({
    success: true,
    message: 'User deactivated successfully'
  });
});

const resetUserPassword = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  const result = await pool.query(
    'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
    [hashedPassword, id]
  );

  if (result.affectedRows === 0) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  res.json({
    success: true,
    message: 'Password reset successfully'
  });
});

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword
};