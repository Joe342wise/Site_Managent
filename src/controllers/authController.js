const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const { generateTokens } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  const [users] = await pool.execute(
    'SELECT user_id, username, password, email, full_name, role, is_active FROM users WHERE username = ? AND is_active = TRUE',
    [username]
  );

  if (users.length === 0) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  const user = users[0];
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  const { accessToken } = generateTokens(user);

  delete user.password;

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user,
      token: accessToken
    }
  });
});

const getProfile = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: req.user
  });
});

const updateProfile = asyncHandler(async (req, res) => {
  const { email, full_name } = req.body;
  const userId = req.user.user_id;

  const [result] = await pool.execute(
    'UPDATE users SET email = ?, full_name = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
    [email, full_name, userId]
  );

  if (result.affectedRows === 0) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  const [users] = await pool.execute(
    'SELECT user_id, username, email, full_name, role, is_active FROM users WHERE user_id = ?',
    [userId]
  );

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: users[0]
  });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.user_id;

  const [users] = await pool.execute(
    'SELECT password FROM users WHERE user_id = ?',
    [userId]
  );

  if (users.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, users[0].password);

  if (!isCurrentPasswordValid) {
    return res.status(400).json({
      success: false,
      message: 'Current password is incorrect'
    });
  }

  const hashedNewPassword = await bcrypt.hash(newPassword, 10);

  await pool.execute(
    'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
    [hashedNewPassword, userId]
  );

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
});

module.exports = {
  login,
  getProfile,
  updateProfile,
  changePassword
};