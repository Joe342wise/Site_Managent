const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword
} = require('../controllers/userController');
const { authenticateToken, authorize } = require('../middleware/auth');
const { validateRequest, schemas } = require('../middleware/validation');

router.use(authenticateToken);

router.get('/', authorize('admin', 'manager'), getAllUsers);
router.get('/:id', authorize('admin', 'manager'), getUserById);
router.post('/', authorize('admin'), validateRequest(schemas.createUser), createUser);
router.put('/:id', authorize('admin'), validateRequest(schemas.updateUser), updateUser);
router.delete('/:id', authorize('admin'), deleteUser);
router.post('/:id/reset-password', authorize('admin'), resetUserPassword);

module.exports = router;