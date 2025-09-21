const mongoose = require('mongoose');

const changeRequestSchema = new mongoose.Schema({
  // Basic Information
  changeControlNumber: {
    type: String,
    unique: true,
    sparse: true // Only unique when value exists
  },
  title: {
    type: String,
    required: [true, 'Please provide a title for the change request'],
    trim: true,
    maxLength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Please provide a description'],
    trim: true,
    maxLength: [2000, 'Description cannot exceed 2000 characters']
  },
  
  // Requester Information
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  requestDate: {
    type: Date,
    default: Date.now
  },
  department: {
    type: String,
    required: true
  },
  
  // Change Classification
  changeType: {
    type: String,
    enum: ['major', 'minor', 'emergency'],
    required: true
  },
  category: {
    type: String,
    enum: [
      'process',
      'product',
      'equipment',
      'documentation',
      'facility',
      'personnel',
      'supplier',
      'system',
      'other'
    ],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  
  // Change Details
  currentState: {
    type: String,
    required: true,
    maxLength: [1000, 'Current state description cannot exceed 1000 characters']
  },
  proposedChange: {
    type: String,
    required: true,
    maxLength: [2000, 'Proposed change description cannot exceed 2000 characters']
  },
  justification: {
    type: String,
    required: true,
    maxLength: [1000, 'Justification cannot exceed 1000 characters']
  },
  
  // Impact Assessment
  impactAssessment: {
    quality: {
      impact: { type: String, enum: ['none', 'low', 'medium', 'high'] },
      description: String
    },
    safety: {
      impact: { type: String, enum: ['none', 'low', 'medium', 'high'] },
      description: String
    },
    regulatory: {
      impact: { type: String, enum: ['none', 'low', 'medium', 'high'] },
      description: String
    },
    financial: {
      impact: { type: String, enum: ['none', 'low', 'medium', 'high'] },
      description: String,
      estimatedCost: Number
    },
    operational: {
      impact: { type: String, enum: ['none', 'low', 'medium', 'high'] },
      description: String
    }
  },
  
  // Timeline
  proposedImplementationDate: {
    type: Date,
    required: true
  },
  actualImplementationDate: {
    type: Date
  },
  completionDate: {
    type: Date
  },
  
  // Status and Workflow
  status: {
    type: String,
    enum: [
      'draft',
      'submitted',
      'under_hod_review',
      'hod_approved',
      'hod_rejected',
      'under_qa_review',
      'qa_approved',
      'qa_rejected',
      'under_cct_review',
      'cct_approved',
      'cct_rejected',
      'action_plan_pending',
      'action_plan_submitted',
      'implementation_pending',
      'implementation_in_progress',
      'implementation_completed',
      'effectiveness_check_pending',
      'effectiveness_check_completed',
      'closed',
      'discontinued'
    ],
    default: 'draft'
  },
  
  // Current approver for workflow
  currentApprover: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Approval History
  approvals: [{
    approver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['hod', 'qa_correspondent', 'cct'],
      required: true
    },
    action: {
      type: String,
      enum: ['approved', 'rejected', 'requested_changes'],
      required: true
    },
    comments: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    signature: String // Base64 encoded signature
  }],
  
  // Action Plan
  actionPlan: {
    tasks: [{
      description: String,
      responsible: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      dueDate: Date,
      status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed'],
        default: 'pending'
      },
      evidence: [String] // File paths
    }],
    resources: String,
    timeline: String,
    successCriteria: String,
    riskMitigation: String
  },
  
  // Evidence and Documentation
  attachments: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    uploadDate: {
      type: Date,
      default: Date.now
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    category: {
      type: String,
      enum: ['initial_documentation', 'evidence', 'implementation_proof', 'effectiveness_check']
    }
  }],
  
  // Effectiveness Check
  effectivenessCheck: {
    checkDate: Date,
    checkedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    criteria: [{
      description: String,
      met: Boolean,
      evidence: String
    }],
    overallResult: {
      type: String,
      enum: ['effective', 'partially_effective', 'ineffective']
    },
    comments: String,
    followUpRequired: Boolean,
    followUpActions: [String]
  },
  
  // Timeline Extensions
  timelineExtensions: [{
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    requestDate: Date,
    originalDate: Date,
    newDate: Date,
    reason: String,
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvalDate: Date,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    }
  }],
  
  // Communication
  notifications: [{
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    type: {
      type: String,
      enum: ['approval_request', 'approval_given', 'rejection', 'reminder', 'deadline_approaching']
    },
    message: String,
    sentDate: {
      type: Date,
      default: Date.now
    },
    read: {
      type: Boolean,
      default: false
    }
  }],
  
  // Audit Trail
  auditLog: [{
    action: String,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    details: mongoose.Schema.Types.Mixed,
    ipAddress: String
  }],
  
  // Metadata
  tags: [String],
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  deletedAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
changeRequestSchema.index({ changeControlNumber: 1 });
changeRequestSchema.index({ requester: 1 });
changeRequestSchema.index({ status: 1 });
changeRequestSchema.index({ currentApprover: 1 });
changeRequestSchema.index({ requestDate: -1 });
changeRequestSchema.index({ proposedImplementationDate: 1 });
changeRequestSchema.index({ department: 1 });
changeRequestSchema.index({ changeType: 1 });
changeRequestSchema.index({ category: 1 });
changeRequestSchema.index({ priority: 1 });

// Virtual for days since request
changeRequestSchema.virtual('daysSinceRequest').get(function() {
  return Math.floor((Date.now() - this.requestDate) / (1000 * 60 * 60 * 24));
});

// Virtual for days until implementation
changeRequestSchema.virtual('daysUntilImplementation').get(function() {
  if (!this.proposedImplementationDate) return null;
  return Math.floor((this.proposedImplementationDate - Date.now()) / (1000 * 60 * 60 * 24));
});

// Virtual for overall impact level
changeRequestSchema.virtual('overallImpact').get(function() {
  if (!this.impactAssessment) return 'none';
  
  const impacts = [
    this.impactAssessment.quality?.impact,
    this.impactAssessment.safety?.impact,
    this.impactAssessment.regulatory?.impact,
    this.impactAssessment.financial?.impact,
    this.impactAssessment.operational?.impact
  ].filter(Boolean);
  
  if (impacts.includes('high')) return 'high';
  if (impacts.includes('medium')) return 'medium';
  if (impacts.includes('low')) return 'low';
  return 'none';
});

// Pre-save middleware to generate change control number
changeRequestSchema.pre('save', async function(next) {
  if (this.isNew && this.status === 'submitted' && !this.changeControlNumber) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments({
      changeControlNumber: { $regex: `^CC-${year}-` }
    });
    
    this.changeControlNumber = `CC-${year}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Method to add audit log entry
changeRequestSchema.methods.addAuditLog = function(action, performedBy, details, ipAddress) {
  this.auditLog.push({
    action,
    performedBy,
    details,
    ipAddress,
    timestamp: new Date()
  });
};

// Method to get current workflow step
changeRequestSchema.methods.getCurrentWorkflowStep = function() {
  const statusSteps = {
    'draft': 'Draft',
    'submitted': 'Submitted',
    'under_hod_review': 'HOD Review',
    'hod_approved': 'HOD Approved',
    'under_qa_review': 'QA Review',
    'qa_approved': 'QA Approved',
    'under_cct_review': 'CCT Review',
    'cct_approved': 'CCT Approved',
    'action_plan_pending': 'Action Plan Pending',
    'implementation_pending': 'Implementation Pending',
    'implementation_in_progress': 'Implementation In Progress',
    'implementation_completed': 'Implementation Completed',
    'effectiveness_check_pending': 'Effectiveness Check Pending',
    'closed': 'Closed'
  };
  
  return statusSteps[this.status] || this.status;
};

// Method to check if user can edit
changeRequestSchema.methods.canEdit = function(user) {
  if (user.role === 'admin') return true;
  if (this.requester.toString() === user._id.toString() && ['draft', 'hod_rejected', 'qa_rejected'].includes(this.status)) return true;
  return false;
};

// Method to check if user can approve
changeRequestSchema.methods.canApprove = function(user) {
  if (user.role === 'admin') return true;
  if (this.currentApprover && this.currentApprover.toString() === user._id.toString()) return true;
  return false;
};

module.exports = mongoose.model('ChangeRequest', changeRequestSchema);