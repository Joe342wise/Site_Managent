const express = require('express');
const router = express.Router();
const {
  getVarianceAnalysis,
  getVarianceBySite,
  getVarianceByCategory,
  getVarianceTrends,
  getTopVariances,
  getVarianceAlerts
} = require('../controllers/varianceController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/analysis', getVarianceAnalysis);
router.get('/by-site', getVarianceBySite);
router.get('/by-category', getVarianceByCategory);
router.get('/trends', getVarianceTrends);
router.get('/top', getTopVariances);
router.get('/alerts', getVarianceAlerts);

module.exports = router;