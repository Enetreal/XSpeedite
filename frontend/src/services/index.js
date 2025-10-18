import api from './api';

// Auth Service
export const authService = {
  login: (email, password) => 
    api.post('/auth/login', { email, password }),
  
  register: (userData) => 
    api.post('/auth/register', userData),
  
  logout: () => 
    api.post('/auth/logout'),
  
  getProfile: () => 
    api.get('/auth/profile'),
  
  updateProfile: (data) => 
    api.put('/auth/profile', data),
  
  changePassword: (currentPassword, newPassword) => 
    api.put('/auth/change-password', { currentPassword, newPassword }),
  
  forgotPassword: (email) => 
    api.post('/auth/forgot-password', { email }),
  
  resetPassword: (token, password) => 
    api.post('/auth/reset-password', { token, password }),
};

// Change Request Service
export const changeRequestService = {
  getAll: (params = {}) => 
    api.get('/change-requests', { params }),
  
  getById: (id) => 
    api.get(`/change-requests/${id}`),
  
  create: (data) => 
    api.post('/change-requests', data),
  
  update: (id, data) => 
    api.put(`/change-requests/${id}`, data),
  
  delete: (id) => 
    api.delete(`/change-requests/${id}`),
  
  approve: (id, comment) => 
    api.post(`/change-requests/${id}/approve`, { comment }),
  
  reject: (id, comment) => 
    api.post(`/change-requests/${id}/reject`, { comment }),
  
  // Role-based approval actions
  requestApproval: (id, approverRole, comment) => 
    api.post(`/change-requests/${id}/request-approval`, { approverRole, comment }),
  
  delegateApproval: (id, delegateToUserId, comment) => 
    api.post(`/change-requests/${id}/delegate`, { delegateToUserId, comment }),
  
  escalateApproval: (id, reason) => 
    api.post(`/change-requests/${id}/escalate`, { reason }),
  
  requestChanges: (id, comment) => 
    api.post(`/change-requests/${id}/request-changes`, { comment }),
  
  submit: (id) => 
    api.post(`/change-requests/${id}/submit`),
  
  implement: (id, implementationDetails) => 
    api.post(`/change-requests/${id}/implement`, { implementationDetails }),
  
  completeEffectivenessCheck: (id, data) => 
    api.post(`/change-requests/${id}/effectiveness-check`, data),
  
  requestTimelineExtension: (id, data) => 
    api.post(`/change-requests/${id}/timeline-extension`, data),
  
  approveTimelineExtension: (id, approved) => 
    api.post(`/change-requests/${id}/timeline-extension/approve`, { approved }),
  
  uploadFile: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/change-requests/${id}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  deleteFile: (id, fileId) => 
    api.delete(`/change-requests/${id}/files/${fileId}`),
  
  downloadFile: (id, fileId) => 
    api.get(`/change-requests/${id}/files/${fileId}/download`, {
      responseType: 'blob',
    }),
  
  getPendingApprovals: () => 
    api.get('/change-requests/pending-approvals'),
  
  getMyRequests: () => 
    api.get('/change-requests/my-requests'),
  
  getDashboardStats: () => 
    api.get('/change-requests/dashboard-stats'),
  
  // Approval workflow methods
  getApprovalHistory: (id) => 
    api.get(`/change-requests/${id}/approval-history`),
  
  getRequiredApprovers: (id) => 
    api.get(`/change-requests/${id}/required-approvers`),
  
  checkApprovalPermissions: (id) => 
    api.get(`/change-requests/${id}/approval-permissions`),
};

// Approval Service - Role-based approval workflow management
export const approvalService = {
  // Get approval matrix for a change request type
  getApprovalMatrix: (changeType, priority, department) => 
    api.get('/approvals/matrix', { 
      params: { changeType, priority, department } 
    }),
  
  // Submit change request for approval based on role hierarchy
  submitForApproval: (changeRequestId, submissionData) => 
    api.post(`/approvals/submit/${changeRequestId}`, submissionData),
  
  // Get current approval status and next required approvers
  getApprovalStatus: (changeRequestId) => 
    api.get(`/approvals/status/${changeRequestId}`),
  
  // Approve at current user's level
  approveAtMyLevel: (changeRequestId, approvalData) => 
    api.post(`/approvals/approve/${changeRequestId}`, {
      ...approvalData,
      action: 'approve'
    }),
  
  // Reject at current user's level
  rejectAtMyLevel: (changeRequestId, rejectionData) => 
    api.post(`/approvals/approve/${changeRequestId}`, {
      ...rejectionData,
      action: 'reject'
    }),
  
  // Request changes (send back to requester)
  requestChanges: (changeRequestId, changeRequestData) => 
    api.post(`/approvals/approve/${changeRequestId}`, {
      ...changeRequestData,
      action: 'request_changes'
    }),
  
  // Delegate approval to another user of same or higher level
  delegateApproval: (changeRequestId, delegationData) => 
    api.post(`/approvals/delegate/${changeRequestId}`, delegationData),
  
  // Escalate to higher level (emergency approvals)
  escalateApproval: (changeRequestId, escalationData) => 
    api.post(`/approvals/escalate/${changeRequestId}`, escalationData),
  
  // Get approvals pending for current user
  getMyPendingApprovals: (params = {}) => 
    api.get('/approvals/my-pending', { params }),
  
  // Get approvals delegated to current user
  getDelegatedApprovals: (params = {}) => 
    api.get('/approvals/delegated-to-me', { params }),
  
  // Get approval history for a change request
  getApprovalHistory: (changeRequestId) => 
    api.get(`/approvals/history/${changeRequestId}`),
  
  // Check if user can approve at any level for a change request
  canApprove: (changeRequestId) => 
    api.get(`/approvals/can-approve/${changeRequestId}`),
  
  // Get approval configuration/rules
  getApprovalRules: () => 
    api.get('/approvals/rules'),
  
  // Update approval rules (admin only)
  updateApprovalRules: (rules) => 
    api.put('/approvals/rules', rules),
  
  // Get approval performance metrics
  getApprovalMetrics: (params = {}) => 
    api.get('/approvals/metrics', { params }),
  
  // Bulk approve multiple requests (for authorized users)
  bulkApprove: (approvalData) => 
    api.post('/approvals/bulk-approve', approvalData),
  
  // Set approval reminders
  setApprovalReminder: (changeRequestId, reminderData) => 
    api.post(`/approvals/reminder/${changeRequestId}`, reminderData),
  
  // Get approval workflow templates
  getWorkflowTemplates: () => 
    api.get('/approvals/workflow-templates'),
  
  // Create custom approval workflow
  createCustomWorkflow: (workflowData) => 
    api.post('/approvals/custom-workflow', workflowData),
};

// User Service
export const userService = {
  getAll: (params = {}) => 
    api.get('/users', { params }),
  
  getById: (id) => 
    api.get(`/users/${id}`),
  
  create: (data) => 
    api.post('/users', data),
  
  update: (id, data) => 
    api.put(`/users/${id}`, data),
  
  delete: (id) => 
    api.delete(`/users/${id}`),
  
  updateRole: (id, role) => 
    api.put(`/users/${id}/role`, { role }),
  
  toggleActive: (id) => 
    api.put(`/users/${id}/toggle-active`),
  
  resetPassword: (id) => 
    api.post(`/users/${id}/reset-password`),
};

// File Service
export const fileService = {
  upload: (file, category = 'document') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    return api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  download: (fileId) => 
    api.get(`/files/${fileId}/download`, {
      responseType: 'blob',
    }),
  
  delete: (fileId) => 
    api.delete(`/files/${fileId}`),
  
  getMetadata: (fileId) => 
    api.get(`/files/${fileId}/metadata`),
};

// Notification Service
export const notificationService = {
  getAll: (params = {}) => 
    api.get('/notifications', { params }),
  
  markAsRead: (id) => 
    api.put(`/notifications/${id}/read`),
  
  markAllAsRead: () => 
    api.put('/notifications/mark-all-read'),
  
  getUnreadCount: () => 
    api.get('/notifications/unread-count'),
};

// Report Service
export const reportService = {
  getChangeRequestReport: (params = {}) => 
    api.get('/reports/change-requests', { params }),
  
  getUserActivityReport: (params = {}) => 
    api.get('/reports/user-activity', { params }),
  
  getApprovalTimeReport: (params = {}) => 
    api.get('/reports/approval-times', { params }),
  
  getEffectivenessReport: (params = {}) => 
    api.get('/reports/effectiveness', { params }),
  
  exportToPDF: (reportType, params = {}) => 
    api.get(`/reports/${reportType}/pdf`, {
      params,
      responseType: 'blob',
    }),
  
  exportToExcel: (reportType, params = {}) => 
    api.get(`/reports/${reportType}/excel`, {
      params,
      responseType: 'blob',
    }),
};