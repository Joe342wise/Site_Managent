const express = require('express');
const router = express.Router();
const {
  getAllSites,
  getSiteById,
  createSite,
  updateSite,
  deleteSite,
  getSiteStatistics
} = require('../controllers/siteController');
const { authenticateToken, authorize } = require('../middleware/auth');
const { validateRequest, schemas } = require('../middleware/validation');

router.use(authenticateToken);

router.get('/statistics', getSiteStatistics);
router.get('/', getAllSites);
router.get('/:id', getSiteById);
router.post('/', validateRequest(schemas.createSite), createSite);
router.put('/:id', validateRequest(schemas.updateSite), updateSite);
router.delete('/:id', authorize('admin', 'manager'), deleteSite);

module.exports = router;