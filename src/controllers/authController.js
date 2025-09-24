const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const { generateTokens } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const emailService = require('../services/emailService');

const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  const usersResult = await pool.query(
    'SELECT user_id, username, password, email, full_name, role, is_active, profile_image FROM users WHERE username = $1 AND is_active = TRUE',
    [username]
  );
  const users = usersResult.rows;

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
  const { username, email, full_name, profile_image } = req.body;
  const userId = req.user.user_id;

  // Check if username is already taken by another user
  if (username) {
    const existingUsersResult = await pool.query(
      'SELECT user_id FROM users WHERE username = $1 AND user_id != $2',
      [username, userId]
    );
    const existingUsers = existingUsersResult.rows;

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Username is already taken'
      });
    }
  }

  const result = await pool.query(
    'UPDATE users SET username = COALESCE($1, username), email = $2, full_name = $3, profile_image = $4, updated_at = CURRENT_TIMESTAMP WHERE user_id = $5',
    [username, email, full_name, profile_image, userId]
  );

  if (result.affectedRows === 0) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  const usersResult = await pool.query(
    'SELECT user_id, username, email, full_name, role, is_active, profile_image FROM users WHERE user_id = $1',
    [userId]
  );
  const users = usersResult.rows;

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: users[0]
  });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.user_id;

  const usersResult = await pool.query(
    'SELECT password FROM users WHERE user_id = $1',
    [userId]
  );
  const users = usersResult.rows;

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

  await pool.query(
    'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
    [hashedNewPassword, userId]
  );

  // Send confirmation email (don't block the response)
  setImmediate(async () => {
    try {
      await emailService.sendPasswordChangeConfirmation(req.user.email, req.user.username);
    } catch (error) {
      console.error('Failed to send password change confirmation email:', error);
    }
  });

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  // Check if user exists
  const usersResult = await pool.query(
    'SELECT user_id, username, email FROM users WHERE email = $1 AND is_active = TRUE',
    [email]
  );
  const users = usersResult.rows;

  if (users.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'No account found with this email address'
    });
  }

  const user = users[0];

  // Generate 6-digit verification code
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Store verification code
  await pool.query(
    'INSERT INTO verification_codes (email, code, type, expires_at) VALUES ($1, $2, $3, $4)',
    [email, verificationCode, 'password_reset', expiresAt]
  );

  // Send verification email
  try {
    await emailService.sendPasswordChangeVerification(email, verificationCode);

    res.json({
      success: true,
      message: 'Password reset code sent to your email'
    });
  } catch (error) {
    console.error('Failed to send verification email:', error);

    // In case of email failure, still allow password reset but inform user
    res.json({
      success: true,
      message: `Password reset code generated for your account.
      Due to a temporary email service issue, please check your server console for the verification code: ${verificationCode}`,
      warningMessage: 'Email service temporarily unavailable. Code logged to server console.'
    });
  }
});

const resetPassword = asyncHandler(async (req, res) => {
  const { email, verificationCode, newPassword } = req.body;

  // Verify the code
  const codesResult = await pool.query(
    'SELECT id FROM verification_codes WHERE email = $1 AND code = $2 AND type = $3 AND expires_at > NOW() AND used = FALSE',
    [email, verificationCode, 'password_reset']
  );
  const codes = codesResult.rows;

  if (codes.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired verification code'
    });
  }

  const codeId = codes[0].id;

  // Check if user still exists
  const usersResult = await pool.query(
    'SELECT user_id, username FROM users WHERE email = $1 AND is_active = TRUE',
    [email]
  );
  const users = usersResult.rows;

  if (users.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'User account not found'
    });
  }

  const user = users[0];

  // Hash new password
  const hashedNewPassword = await bcrypt.hash(newPassword, 10);

  // Start transaction
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Update password
    await client.query(
      'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
      [hashedNewPassword, user.user_id]
    );

    // Mark verification code as used
    await client.query(
      'UPDATE verification_codes SET used = TRUE WHERE id = $1',
      [codeId]
    );

    await client.query('COMMIT');

    // Send confirmation email (don't block the response)
    setImmediate(async () => {
      try {
        await emailService.sendPasswordChangeConfirmation(email, user.username);
      } catch (error) {
        console.error('Failed to send password reset confirmation email:', error);
      }
    });

    res.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});

module.exports = {
  login,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword
};