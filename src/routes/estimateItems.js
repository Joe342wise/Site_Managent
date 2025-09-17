const express = require('express');
const router = express.Router();
const {
  getAllCategories,
  getEstimateItems,
  getEstimateItemById,
  createEstimateItem,
  updateEstimateItem,
  deleteEstimateItem,
  bulkCreateEstimateItems,
  getItemsByCategory
} = require('../controllers/estimateItemController');
const { authenticateToken, authorize } = require('../middleware/auth');
const { validateRequest, schemas } = require('../middleware/validation');

router.use(authenticateToken);

router.get('/categories', getAllCategories);
router.get('/estimate/:estimate_id', getEstimateItems);
router.get('/estimate/:estimate_id/by-category', getItemsByCategory);
router.get('/:id', getEstimateItemById);
router.post('/', validateRequest(schemas.createEstimateItem), createEstimateItem);
router.post('/estimate/:estimate_id/bulk', bulkCreateEstimateItems);
router.put('/:id', validateRequest(schemas.updateEstimateItem), updateEstimateItem);
router.delete('/:id', authorize('admin', 'manager'), deleteEstimateItem);

module.exports = router;