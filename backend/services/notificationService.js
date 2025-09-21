const nodemailer = require('nodemailer');
const ChangeRequest = require('../models/ChangeRequest');
const User = require('../models/User');

// Email transporter configuration
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_PORT == 465, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// @desc    Send notification to user
// @param   {ObjectId} userId - User to notify
// @param   {String} type - Notification type
// @param   {Object} changeRequest - Change request object
// @param   {String} customMessage - Custom message (optional)
exports.sendNotification = async (userId, type, changeRequest, customMessage = '') => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      console.error('User not found for notification:', userId);
      return;
    }

    let subject = '';
    let message = '';
    let html = '';

    // Generate notification content based on type
    switch (type) {
      case 'approval_request':
        subject = `QMS: Approval Required - ${changeRequest.title}`;
        message = `You have a new change request requiring your approval.\n\nChange Control Number: ${changeRequest.changeControlNumber || 'Pending'}\nTitle: ${changeRequest.title}\nRequester: ${changeRequest.requester.name}\n\nPlease log in to the QMS system to review and approve this request.`;
        html = generateApprovalRequestHTML(changeRequest, user);
        break;

      case 'approval_given':
        subject = `QMS: Request Approved - ${changeRequest.title}`;
        message = `Your change request has been approved by ${user.name}.\n\nChange Control Number: ${changeRequest.changeControlNumber}\nTitle: ${changeRequest.title}\n\nYou can now proceed to the next step in the workflow.`;
        html = generateApprovalGivenHTML(changeRequest, user);
        break;

      case 'rejection':
        subject = `QMS: Request Rejected - ${changeRequest.title}`;
        message = `Your change request has been rejected.\n\nChange Control Number: ${changeRequest.changeControlNumber}\nTitle: ${changeRequest.title}\nReason: ${customMessage}\n\nPlease review the comments and resubmit if necessary.`;
        html = generateRejectionHTML(changeRequest, user, customMessage);
        break;

      case 'reminder':
        subject = `QMS: Reminder - Action Required for ${changeRequest.title}`;
        message = `This is a reminder that you have a pending action on change request:\n\nChange Control Number: ${changeRequest.changeControlNumber}\nTitle: ${changeRequest.title}\n\nPlease complete the required action as soon as possible.`;
        html = generateReminderHTML(changeRequest, user);
        break;

      case 'deadline_approaching':
        subject = `QMS: Deadline Approaching - ${changeRequest.title}`;
        message = `The implementation deadline for change request is approaching:\n\nChange Control Number: ${changeRequest.changeControlNumber}\nTitle: ${changeRequest.title}\nDeadline: ${changeRequest.proposedImplementationDate}\n\nPlease ensure timely completion.`;
        html = generateDeadlineHTML(changeRequest, user);
        break;

      case 'all_approvals_complete':
        subject = `QMS: All Approvals Complete - ${changeRequest.title}`;
        message = `All required approvals have been obtained for your change request.\n\nChange Control Number: ${changeRequest.changeControlNumber}\nTitle: ${changeRequest.title}\n\nYou can now proceed with implementation planning.`;
        html = generateAllApprovalsHTML(changeRequest, user);
        break;

      default:
        subject = `QMS: Notification - ${changeRequest.title}`;
        message = customMessage || 'You have a new notification regarding your change request.';
        html = generateGenericHTML(changeRequest, user, message);
    }

    // Send email notification
    if (user.email) {
      await sendEmail(user.email, subject, message, html);
    }

    // Add in-app notification to change request
    if (changeRequest._id) {
      await ChangeRequest.findByIdAndUpdate(changeRequest._id, {
        $push: {
          notifications: {
            recipient: userId,
            type,
            message: subject,
            sentDate: new Date(),
            read: false
          }
        }
      });
    }

    console.log(`Notification sent to ${user.email}: ${subject}`);
  } catch (error) {
    console.error('Send notification error:', error);
  }
};

// @desc    Send email
const sendEmail = async (to, subject, text, html) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"${process.env.APP_NAME || 'QMS Change Control'}" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('Send email error:', error);
    throw error;
  }
};

// @desc    Send reminder notifications for overdue items
exports.sendReminderNotifications = async () => {
  try {
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000));

    // Find change requests with approaching deadlines
    const approachingDeadlines = await ChangeRequest.find({
      proposedImplementationDate: {
        $gte: now,
        $lte: threeDaysFromNow
      },
      status: { $in: ['implementation_pending', 'implementation_in_progress'] },
      isDeleted: false
    }).populate('requester');

    for (const changeRequest of approachingDeadlines) {
      await exports.sendNotification(
        changeRequest.requester._id,
        'deadline_approaching',
        changeRequest
      );
    }

    // Find overdue approvals
    const overdueApprovals = await ChangeRequest.find({
      currentApprover: { $exists: true, $ne: null },
      requestDate: { $lt: new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000)) }, // 7 days old
      status: { $in: ['submitted', 'under_hod_review', 'under_qa_review', 'under_cct_review'] },
      isDeleted: false
    }).populate('currentApprover');

    for (const changeRequest of overdueApprovals) {
      await exports.sendNotification(
        changeRequest.currentApprover._id,
        'reminder',
        changeRequest,
        'This approval request has been pending for more than 7 days.'
      );
    }

    console.log(`Sent ${approachingDeadlines.length + overdueApprovals.length} reminder notifications`);
  } catch (error) {
    console.error('Send reminder notifications error:', error);
  }
};

// HTML template generators
const generateApprovalRequestHTML = (changeRequest, user) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2c5aa0;">QMS Change Control - Approval Required</h2>
      <p>Dear ${user.name},</p>
      <p>You have a new change request requiring your approval:</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Change Request Details</h3>
        <p><strong>Change Control Number:</strong> ${changeRequest.changeControlNumber || 'Pending'}</p>
        <p><strong>Title:</strong> ${changeRequest.title}</p>
        <p><strong>Requester:</strong> ${changeRequest.requester.name}</p>
        <p><strong>Department:</strong> ${changeRequest.department}</p>
        <p><strong>Priority:</strong> ${changeRequest.priority}</p>
        <p><strong>Request Date:</strong> ${new Date(changeRequest.requestDate).toLocaleDateString()}</p>
      </div>
      
      <p>Please log in to the QMS system to review and approve this request.</p>
      <p><a href="${process.env.FRONTEND_URL}/change-requests/${changeRequest._id}" style="background-color: #2c5aa0; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Review Request</a></p>
      
      <p>Best regards,<br>QMS Change Control System</p>
    </div>
  `;
};

const generateApprovalGivenHTML = (changeRequest, approver) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #28a745;">QMS Change Control - Request Approved</h2>
      <p>Good news! Your change request has been approved.</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Change Request Details</h3>
        <p><strong>Change Control Number:</strong> ${changeRequest.changeControlNumber}</p>
        <p><strong>Title:</strong> ${changeRequest.title}</p>
        <p><strong>Approved by:</strong> ${approver.name} (${approver.role})</p>
        <p><strong>Current Status:</strong> ${changeRequest.getCurrentWorkflowStep()}</p>
      </div>
      
      <p>You can now proceed to the next step in the workflow.</p>
      <p><a href="${process.env.FRONTEND_URL}/change-requests/${changeRequest._id}" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Request</a></p>
      
      <p>Best regards,<br>QMS Change Control System</p>
    </div>
  `;
};

const generateRejectionHTML = (changeRequest, rejector, reason) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc3545;">QMS Change Control - Request Rejected</h2>
      <p>Your change request has been rejected and requires your attention.</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Change Request Details</h3>
        <p><strong>Change Control Number:</strong> ${changeRequest.changeControlNumber}</p>
        <p><strong>Title:</strong> ${changeRequest.title}</p>
        <p><strong>Rejected by:</strong> ${rejector.name} (${rejector.role})</p>
        <p><strong>Reason:</strong> ${reason}</p>
      </div>
      
      <p>Please review the comments and make necessary changes before resubmitting.</p>
      <p><a href="${process.env.FRONTEND_URL}/change-requests/${changeRequest._id}" style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Review Request</a></p>
      
      <p>Best regards,<br>QMS Change Control System</p>
    </div>
  `;
};

const generateReminderHTML = (changeRequest, user) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #ffc107;">QMS Change Control - Reminder</h2>
      <p>Dear ${user.name},</p>
      <p>This is a reminder that you have a pending action on the following change request:</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Change Request Details</h3>
        <p><strong>Change Control Number:</strong> ${changeRequest.changeControlNumber}</p>
        <p><strong>Title:</strong> ${changeRequest.title}</p>
        <p><strong>Current Status:</strong> ${changeRequest.getCurrentWorkflowStep()}</p>
        <p><strong>Days Pending:</strong> ${changeRequest.daysSinceRequest}</p>
      </div>
      
      <p>Please complete the required action as soon as possible.</p>
      <p><a href="${process.env.FRONTEND_URL}/change-requests/${changeRequest._id}" style="background-color: #ffc107; color: black; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Take Action</a></p>
      
      <p>Best regards,<br>QMS Change Control System</p>
    </div>
  `;
};

const generateDeadlineHTML = (changeRequest, user) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #fd7e14;">QMS Change Control - Deadline Approaching</h2>
      <p>Dear ${user.name},</p>
      <p>The implementation deadline for your change request is approaching:</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Change Request Details</h3>
        <p><strong>Change Control Number:</strong> ${changeRequest.changeControlNumber}</p>
        <p><strong>Title:</strong> ${changeRequest.title}</p>
        <p><strong>Implementation Deadline:</strong> ${new Date(changeRequest.proposedImplementationDate).toLocaleDateString()}</p>
        <p><strong>Days Remaining:</strong> ${changeRequest.daysUntilImplementation}</p>
      </div>
      
      <p>Please ensure timely completion or request a timeline extension if needed.</p>
      <p><a href="${process.env.FRONTEND_URL}/change-requests/${changeRequest._id}" style="background-color: #fd7e14; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Request</a></p>
      
      <p>Best regards,<br>QMS Change Control System</p>
    </div>
  `;
};

const generateAllApprovalsHTML = (changeRequest, user) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #28a745;">QMS Change Control - All Approvals Complete</h2>
      <p>Congratulations! All required approvals have been obtained for your change request.</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Change Request Details</h3>
        <p><strong>Change Control Number:</strong> ${changeRequest.changeControlNumber}</p>
        <p><strong>Title:</strong> ${changeRequest.title}</p>
        <p><strong>Current Status:</strong> ${changeRequest.getCurrentWorkflowStep()}</p>
      </div>
      
      <p>You can now proceed with creating your action plan and implementation.</p>
      <p><a href="${process.env.FRONTEND_URL}/change-requests/${changeRequest._id}" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Create Action Plan</a></p>
      
      <p>Best regards,<br>QMS Change Control System</p>
    </div>
  `;
};

const generateGenericHTML = (changeRequest, user, message) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2c5aa0;">QMS Change Control - Notification</h2>
      <p>Dear ${user.name},</p>
      <p>${message}</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Change Request Details</h3>
        <p><strong>Change Control Number:</strong> ${changeRequest.changeControlNumber}</p>
        <p><strong>Title:</strong> ${changeRequest.title}</p>
      </div>
      
      <p><a href="${process.env.FRONTEND_URL}/change-requests/${changeRequest._id}" style="background-color: #2c5aa0; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Request</a></p>
      
      <p>Best regards,<br>QMS Change Control System</p>
    </div>
  `;
};

module.exports = exports;