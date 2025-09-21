const express = require('express');
const router = express.Router();
const {
  generateChangeRequestReport,
  generateDashboardReport,
  generateAuditReport,
  getReportTypes,
  scheduleReport
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

// Apply authentication to all routes
router.use(protect);

router.get('/types', getReportTypes);
router.post('/change-requests', generateChangeRequestReport);
router.post('/dashboard', generateDashboardReport);
router.post('/audit', authorize('admin', 'cct', 'qa_correspondent'), generateAuditReport);
router.post('/schedule', authorize('admin', 'cct'), scheduleReport);

module.exports = router;