const express = require('express');
const router = express.Router();
const {
  getAllActuals,
  getActualById,
  createActual,
  updateActual,
  deleteActual,
  getActualsByEstimate,
  getActualsByItem,
  getActualsStatistics
} = require('../controllers/actualController');
const { authenticateToken, authorize } = require('../middleware/auth');
const { validateRequest, schemas } = require('../middleware/validation');

router.use(authenticateToken);

router.get('/statistics', getActualsStatistics);
router.get('/', getAllActuals);
router.get('/estimate/:estimate_id', getActualsByEstimate);
router.get('/item/:item_id', getActualsByItem);
router.get('/:id', getActualById);
router.post('/', validateRequest(schemas.createActual), createActual);
router.put('/:id', validateRequest(schemas.updateActual), updateActual);
router.delete('/:id', authorize('admin', 'manager'), deleteActual);

module.exports = router;