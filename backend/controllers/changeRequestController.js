const ChangeRequest = require('../models/ChangeRequest');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// @desc    Get all change requests
// @route   GET /api/change-requests
// @access  Private
exports.getAllChangeRequests = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query
    let query = { isDeleted: false };
    
    // Filters
    if (req.query.status) {
      query.status = req.query.status;
    }
    if (req.query.department) {
      query.department = req.query.department;
    }
    if (req.query.changeType) {
      query.changeType = req.query.changeType;
    }
    if (req.query.category) {
      query.category = req.query.category;
    }
    if (req.query.priority) {
      query.priority = req.query.priority;
    }
    if (req.query.requester) {
      query.requester = req.query.requester;
    }

    // Date range filter
    if (req.query.fromDate || req.query.toDate) {
      query.requestDate = {};
      if (req.query.fromDate) {
        query.requestDate.$gte = new Date(req.query.fromDate);
      }
      if (req.query.toDate) {
        query.requestDate.$lte = new Date(req.query.toDate);
      }
    }

    // Search filter
    if (req.query.search) {
      query.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
        { changeControlNumber: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Role-based filtering
    if (req.user.role !== 'admin' && req.user.role !== 'cct') {
      if (req.user.role === 'requester') {
        query.requester = req.user._id;
      } else if (req.user.role === 'hod' || req.user.role === 'qa_correspondent') {
        query.$or = [
          { requester: req.user._id },
          { currentApprover: req.user._id },
          { department: req.user.department }
        ];
      }
    }

    // Sort
    const sortBy = req.query.sortBy || 'requestDate';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const sort = { [sortBy]: sortOrder };

    const changeRequests = await ChangeRequest.find(query)
      .populate('requester', 'name email department position')
      .populate('currentApprover', 'name email role')
      .populate('approvals.approver', 'name email role')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await ChangeRequest.countDocuments(query);

    res.status(200).json({
      success: true,
      count: changeRequests.length,
      total,
      pagination: {
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      data: changeRequests
    });
  } catch (error) {
    console.error('Get all change requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching change requests'
    });
  }
};

// @desc    Get single change request
// @route   GET /api/change-requests/:id
// @access  Private
exports.getChangeRequest = async (req, res) => {
  try {
    const changeRequest = await ChangeRequest.findById(req.params.id)
      .populate('requester', 'name email department position phone signature')
      .populate('currentApprover', 'name email role department')
      .populate('approvals.approver', 'name email role department signature')
      .populate('actionPlan.tasks.responsible', 'name email')
      .populate('attachments.uploadedBy', 'name email')
      .populate('effectivenessCheck.checkedBy', 'name email role')
      .populate('timelineExtensions.requestedBy', 'name email')
      .populate('timelineExtensions.approvedBy', 'name email')
      .populate('auditLog.performedBy', 'name email role');

    if (!changeRequest) {
      return res.status(404).json({
        success: false,
        message: 'Change request not found'
      });
    }

    // Check permissions
    const canView = 
      req.user.role === 'admin' ||
      req.user.role === 'cct' ||
      changeRequest.requester._id.toString() === req.user._id.toString() ||
      changeRequest.currentApprover?._id.toString() === req.user._id.toString() ||
      changeRequest.department === req.user.department;

    if (!canView) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this change request'
      });
    }

    res.status(200).json({
      success: true,
      data: changeRequest
    });
  } catch (error) {
    console.error('Get change request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching change request'
    });
  }
};

// @desc    Create new change request
// @route   POST /api/change-requests
// @access  Private
exports.createChangeRequest = async (req, res) => {
  try {
    const {
      title,
      description,
      changeType,
      category,
      priority,
      currentState,
      proposedChange,
      justification,
      impactAssessment,
      proposedImplementationDate
    } = req.body;

    const changeRequest = await ChangeRequest.create({
      title,
      description,
      changeType,
      category,
      priority,
      currentState,
      proposedChange,
      justification,
      impactAssessment,
      proposedImplementationDate,
      requester: req.user._id,
      department: req.user.department,
      requestDate: new Date()
    });

    // Add audit log entry
    changeRequest.addAuditLog(
      'Change request created',
      req.user._id,
      { status: 'draft' },
      req.ip
    );
    await changeRequest.save();

    // Populate for response
    await changeRequest.populate('requester', 'name email department');

    res.status(201).json({
      success: true,
      message: 'Change request created successfully',
      data: changeRequest
    });
  } catch (error) {
    console.error('Create change request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating change request'
    });
  }
};

// @desc    Update change request
// @route   PUT /api/change-requests/:id
// @access  Private
exports.updateChangeRequest = async (req, res) => {
  try {
    const changeRequest = await ChangeRequest.findById(req.params.id);

    if (!changeRequest) {
      return res.status(404).json({
        success: false,
        message: 'Change request not found'
      });
    }

    // Check permissions
    const canEdit = changeRequest.canEdit(req.user);
    if (!canEdit) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to edit this change request'
      });
    }

    const {
      title,
      description,
      changeType,
      category,
      priority,
      currentState,
      proposedChange,
      justification,
      impactAssessment,
      proposedImplementationDate
    } = req.body;

    const updatedFields = {};
    if (title) updatedFields.title = title;
    if (description) updatedFields.description = description;
    if (changeType) updatedFields.changeType = changeType;
    if (category) updatedFields.category = category;
    if (priority) updatedFields.priority = priority;
    if (currentState) updatedFields.currentState = currentState;
    if (proposedChange) updatedFields.proposedChange = proposedChange;
    if (justification) updatedFields.justification = justification;
    if (impactAssessment) updatedFields.impactAssessment = impactAssessment;
    if (proposedImplementationDate) updatedFields.proposedImplementationDate = proposedImplementationDate;

    const updated = await ChangeRequest.findByIdAndUpdate(
      req.params.id,
      updatedFields,
      { new: true, runValidators: true }
    ).populate('requester', 'name email department');

    // Add audit log entry
    updated.addAuditLog(
      'Change request updated',
      req.user._id,
      { updatedFields: Object.keys(updatedFields) },
      req.ip
    );
    await updated.save();

    res.status(200).json({
      success: true,
      message: 'Change request updated successfully',
      data: updated
    });
  } catch (error) {
    console.error('Update change request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating change request'
    });
  }
};

// @desc    Submit change request for approval
// @route   POST /api/change-requests/:id/submit
// @access  Private
exports.submitChangeRequest = async (req, res) => {
  try {
    const changeRequest = await ChangeRequest.findById(req.params.id);

    if (!changeRequest) {
      return res.status(404).json({
        success: false,
        message: 'Change request not found'
      });
    }

    // Check permissions
    if (changeRequest.requester.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only the requester can submit the change request'
      });
    }

    if (changeRequest.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Change request has already been submitted'
      });
    }

    // Find HOD for the department
    const hod = await User.findOne({
      department: changeRequest.department,
      role: 'hod',
      isActive: true
    });

    if (!hod) {
      return res.status(400).json({
        success: false,
        message: 'No HOD found for this department'
      });
    }

    changeRequest.status = 'submitted';
    changeRequest.currentApprover = hod._id;

    // Add audit log entry
    changeRequest.addAuditLog(
      'Change request submitted for approval',
      req.user._id,
      { 
        previousStatus: 'draft',
        newStatus: 'submitted',
        assignedTo: hod._id
      },
      req.ip
    );

    await changeRequest.save();

    // Send notification to HOD (implement notification service)
    // await sendNotification(hod._id, 'approval_request', changeRequest);

    res.status(200).json({
      success: true,
      message: 'Change request submitted successfully',
      data: changeRequest
    });
  } catch (error) {
    console.error('Submit change request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while submitting change request'
    });
  }
};

// @desc    Approve change request
// @route   POST /api/change-requests/:id/approve
// @access  Private
exports.approveChangeRequest = async (req, res) => {
  try {
    const { comments, signature } = req.body;
    const changeRequest = await ChangeRequest.findById(req.params.id);

    if (!changeRequest) {
      return res.status(404).json({
        success: false,
        message: 'Change request not found'
      });
    }

    // Check permissions
    const canApprove = changeRequest.canApprove(req.user);
    if (!canApprove) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to approve this change request'
      });
    }

    let nextStatus;
    let nextApprover = null;

    // Determine next status and approver based on current status and user role
    if (req.user.role === 'hod' && changeRequest.status === 'submitted') {
      nextStatus = 'hod_approved';
      // Find QA Correspondent
      const qaCorrespondent = await User.findOne({
        role: 'qa_correspondent',
        isActive: true
      });
      if (qaCorrespondent) {
        nextApprover = qaCorrespondent._id;
        changeRequest.status = 'under_qa_review';
      }
    } else if (req.user.role === 'qa_correspondent' && changeRequest.status === 'under_qa_review') {
      nextStatus = 'qa_approved';
      // Find CCT member
      const cctMember = await User.findOne({
        role: 'cct',
        isActive: true
      });
      if (cctMember) {
        nextApprover = cctMember._id;
        changeRequest.status = 'under_cct_review';
      }
    } else if (req.user.role === 'cct' && changeRequest.status === 'under_cct_review') {
      nextStatus = 'cct_approved';
      changeRequest.status = 'action_plan_pending';
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid approval workflow state'
      });
    }

    // Add approval record
    changeRequest.approvals.push({
      approver: req.user._id,
      role: req.user.role,
      action: 'approved',
      comments,
      signature,
      timestamp: new Date()
    });

    changeRequest.currentApprover = nextApprover;

    // Add audit log entry
    changeRequest.addAuditLog(
      `Approved by ${req.user.role}`,
      req.user._id,
      {
        previousStatus: changeRequest.status,
        newStatus: nextStatus,
        comments
      },
      req.ip
    );

    await changeRequest.save();

    // Send notifications
    if (nextApprover) {
      // await sendNotification(nextApprover, 'approval_request', changeRequest);
    } else {
      // Notify requester that all approvals are complete
      // await sendNotification(changeRequest.requester, 'all_approvals_complete', changeRequest);
    }

    res.status(200).json({
      success: true,
      message: 'Change request approved successfully',
      data: changeRequest
    });
  } catch (error) {
    console.error('Approve change request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while approving change request'
    });
  }
};

// @desc    Reject change request
// @route   POST /api/change-requests/:id/reject
// @access  Private
exports.rejectChangeRequest = async (req, res) => {
  try {
    const { comments, signature } = req.body;
    const changeRequest = await ChangeRequest.findById(req.params.id);

    if (!changeRequest || !comments) {
      return res.status(400).json({
        success: false,
        message: 'Change request not found or comments are required for rejection'
      });
    }

    // Check permissions
    const canApprove = changeRequest.canApprove(req.user);
    if (!canApprove) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to reject this change request'
      });
    }

    const previousStatus = changeRequest.status;
    let rejectedStatus;

    if (req.user.role === 'hod') {
      rejectedStatus = 'hod_rejected';
    } else if (req.user.role === 'qa_correspondent') {
      rejectedStatus = 'qa_rejected';
    } else if (req.user.role === 'cct') {
      rejectedStatus = 'cct_rejected';
    }

    changeRequest.status = rejectedStatus;
    changeRequest.currentApprover = null;

    // Add approval record
    changeRequest.approvals.push({
      approver: req.user._id,
      role: req.user.role,
      action: 'rejected',
      comments,
      signature,
      timestamp: new Date()
    });

    // Add audit log entry
    changeRequest.addAuditLog(
      `Rejected by ${req.user.role}`,
      req.user._id,
      {
        previousStatus,
        newStatus: rejectedStatus,
        comments
      },
      req.ip
    );

    await changeRequest.save();

    // Notify requester of rejection
    // await sendNotification(changeRequest.requester, 'rejection', changeRequest);

    res.status(200).json({
      success: true,
      message: 'Change request rejected successfully',
      data: changeRequest
    });
  } catch (error) {
    console.error('Reject change request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while rejecting change request'
    });
  }
};

// @desc    Get my change requests
// @route   GET /api/change-requests/my-requests
// @access  Private
exports.getMyChangeRequests = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = { 
      requester: req.user._id,
      isDeleted: false 
    };

    if (req.query.status) {
      query.status = req.query.status;
    }

    const changeRequests = await ChangeRequest.find(query)
      .populate('currentApprover', 'name email role')
      .sort({ requestDate: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await ChangeRequest.countDocuments(query);

    res.status(200).json({
      success: true,
      count: changeRequests.length,
      total,
      pagination: {
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      data: changeRequests
    });
  } catch (error) {
    console.error('Get my change requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching your change requests'
    });
  }
};

// @desc    Get pending approvals
// @route   GET /api/change-requests/pending-approvals
// @access  Private
exports.getPendingApprovals = async (req, res) => {
  try {
    const query = {
      currentApprover: req.user._id,
      isDeleted: false,
      status: { $in: ['submitted', 'under_hod_review', 'under_qa_review', 'under_cct_review'] }
    };

    const pendingApprovals = await ChangeRequest.find(query)
      .populate('requester', 'name email department position')
      .sort({ requestDate: 1 }) // Oldest first
      .lean();

    res.status(200).json({
      success: true,
      count: pendingApprovals.length,
      data: pendingApprovals
    });
  } catch (error) {
    console.error('Get pending approvals error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching pending approvals'
    });
  }
};

// Additional controller methods can be added here...
// deleteChangeRequest, addActionPlan, updateActionPlan, addEvidence, 
// performEffectivenessCheck, requestTimelineExtension, etc.

module.exports = {
  getAllChangeRequests: exports.getAllChangeRequests,
  getChangeRequest: exports.getChangeRequest,
  createChangeRequest: exports.createChangeRequest,
  updateChangeRequest: exports.updateChangeRequest,
  submitChangeRequest: exports.submitChangeRequest,
  approveChangeRequest: exports.approveChangeRequest,
  rejectChangeRequest: exports.rejectChangeRequest,
  getMyChangeRequests: exports.getMyChangeRequests,
  getPendingApprovals: exports.getPendingApprovals
};