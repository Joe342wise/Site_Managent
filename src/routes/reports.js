const express = require('express');
const router = express.Router();
const {
  generateEstimateReport,
  generateVarianceReport,
  generateSiteReport,
  downloadReport,
  getReportsList,
  cleanupReports,
  deleteReport
} = require('../controllers/reportController');
const { authenticateToken, authorize } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/list', getReportsList);
router.delete('/cleanup', authorize('admin', 'manager'), cleanupReports);
router.delete('/:filename', authorize('admin', 'manager'), deleteReport);
router.get('/download/:filename', downloadReport);
router.get('/estimate/:estimate_id', generateEstimateReport);
router.get('/variance/:site_id', generateVarianceReport);
router.get('/site/:site_id', generateSiteReport);

module.exports = router;