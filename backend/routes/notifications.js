const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  sendNotification
} = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

// Apply authentication to all routes
router.use(protect);

router.get('/', getNotifications);
router.post('/send', sendNotification);
router.put('/:id/read', markAsRead);
router.put('/mark-all-read', markAllAsRead);
router.delete('/:id', deleteNotification);

module.exports = router;