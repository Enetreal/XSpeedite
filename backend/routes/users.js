const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  createUser,
  getUsersByRole,
  getUsersByDepartment,
  updateUserPermissions,
  deactivateUser,
  reactivateUser
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

// Apply authentication to all routes
router.use(protect);

// Admin only routes
router.use(authorize('admin', 'cct'));

router.get('/', getUsers);
router.post('/', createUser);
router.get('/role/:role', getUsersByRole);
router.get('/department/:department', getUsersByDepartment);

router.get('/:id', getUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);
router.put('/:id/permissions', updateUserPermissions);
router.put('/:id/deactivate', deactivateUser);
router.put('/:id/reactivate', reactivateUser);

module.exports = router;