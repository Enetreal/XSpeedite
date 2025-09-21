const express = require('express');
const router = express.Router();
const {
  getAllChangeRequests,
  getChangeRequest,
  createChangeRequest,
  updateChangeRequest,
  deleteChangeRequest,
  submitChangeRequest,
  approveChangeRequest,
  rejectChangeRequest,
  addActionPlan,
  updateActionPlan,
  addEvidence,
  performEffectivenessCheck,
  requestTimelineExtension,
  approveTimelineExtension,
  getChangeRequestsByStatus,
  getMyChangeRequests,
  getPendingApprovals,
  discontinueChangeRequest
} = require('../controllers/changeRequestController');

const { protect, authorize, checkPermission } = require('../middleware/auth');

// Apply authentication to all routes
router.use(protect);

// Public routes (authenticated users)
router.get('/', getAllChangeRequests);
router.get('/my-requests', getMyChangeRequests);
router.get('/pending-approvals', getPendingApprovals);
router.get('/status/:status', getChangeRequestsByStatus);
router.post('/', createChangeRequest);

// Specific change request routes
router.get('/:id', getChangeRequest);
router.put('/:id', updateChangeRequest);
router.delete('/:id', deleteChangeRequest);

// Workflow routes
router.post('/:id/submit', submitChangeRequest);
router.post('/:id/approve', approveChangeRequest);
router.post('/:id/reject', rejectChangeRequest);
router.post('/:id/discontinue', discontinueChangeRequest);

// Action plan routes
router.post('/:id/action-plan', addActionPlan);
router.put('/:id/action-plan', updateActionPlan);

// Evidence routes
router.post('/:id/evidence', addEvidence);

// Effectiveness check routes
router.post('/:id/effectiveness-check', performEffectivenessCheck);

// Timeline extension routes
router.post('/:id/timeline-extension', requestTimelineExtension);
router.post('/:id/timeline-extension/:extensionId/approve', approveTimelineExtension);

module.exports = router;