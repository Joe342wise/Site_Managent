const express = require('express');
const router = express.Router();
const {
  getAllEstimates,
  getEstimateById,
  createEstimate,
  updateEstimate,
  deleteEstimate,
  getEstimateStatistics,
  duplicateEstimate
} = require('../controllers/estimateController');
const { authenticateToken, authorize } = require('../middleware/auth');
const { validateRequest, schemas } = require('../middleware/validation');

router.use(authenticateToken);

router.get('/statistics', getEstimateStatistics);
router.get('/', getAllEstimates);
router.get('/:id', getEstimateById);
router.post('/', validateRequest(schemas.createEstimate), createEstimate);
router.put('/:id', validateRequest(schemas.updateEstimate), updateEstimate);
router.delete('/:id', authorize('admin', 'manager'), deleteEstimate);
router.post('/:id/duplicate', duplicateEstimate);

module.exports = router;