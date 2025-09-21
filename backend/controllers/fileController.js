const path = require('path');
const fs = require('fs').promises;
const ChangeRequest = require('../models/ChangeRequest');

// @desc    Upload files
// @route   POST /api/files/upload
// @access  Private
exports.uploadFiles = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const { changeRequestId, category } = req.body;

    if (!changeRequestId) {
      return res.status(400).json({
        success: false,
        message: 'Change request ID is required'
      });
    }

    // Find the change request
    const changeRequest = await ChangeRequest.findById(changeRequestId);
    if (!changeRequest) {
      return res.status(404).json({
        success: false,
        message: 'Change request not found'
      });
    }

    // Check permissions
    const canUpload = 
      req.user.role === 'admin' ||
      changeRequest.requester.toString() === req.user._id.toString() ||
      changeRequest.currentApprover?.toString() === req.user._id.toString();

    if (!canUpload) {
      // Clean up uploaded files
      await Promise.all(req.files.map(file => 
        fs.unlink(file.path).catch(console.error)
      ));
      
      return res.status(403).json({
        success: false,
        message: 'Not authorized to upload files for this change request'
      });
    }

    // Add files to change request
    const uploadedFiles = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      uploadDate: new Date(),
      uploadedBy: req.user._id,
      category: category || 'initial_documentation'
    }));

    changeRequest.attachments.push(...uploadedFiles);

    // Add audit log entry
    changeRequest.addAuditLog(
      'Files uploaded',
      req.user._id,
      {
        fileCount: uploadedFiles.length,
        category,
        files: uploadedFiles.map(f => f.originalName)
      },
      req.ip
    );

    await changeRequest.save();

    res.status(200).json({
      success: true,
      message: `${uploadedFiles.length} file(s) uploaded successfully`,
      data: {
        files: uploadedFiles.map(file => ({
          id: changeRequest.attachments[changeRequest.attachments.length - uploadedFiles.length + uploadedFiles.indexOf(file)]._id,
          filename: file.filename,
          originalName: file.originalName,
          size: file.size,
          uploadDate: file.uploadDate
        }))
      }
    });
  } catch (error) {
    console.error('Upload files error:', error);
    
    // Clean up uploaded files on error
    if (req.files) {
      await Promise.all(req.files.map(file => 
        fs.unlink(file.path).catch(console.error)
      ));
    }

    res.status(500).json({
      success: false,
      message: 'Server error while uploading files'
    });
  }
};

// @desc    Download file
// @route   GET /api/files/:id
// @access  Private
exports.downloadFile = async (req, res) => {
  try {
    const fileId = req.params.id;

    // Find change request containing this file
    const changeRequest = await ChangeRequest.findOne({
      'attachments._id': fileId
    });

    if (!changeRequest) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Check permissions
    const canDownload = 
      req.user.role === 'admin' ||
      req.user.role === 'cct' ||
      changeRequest.requester.toString() === req.user._id.toString() ||
      changeRequest.currentApprover?.toString() === req.user._id.toString() ||
      changeRequest.department === req.user.department;

    if (!canDownload) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to download this file'
      });
    }

    // Find the specific file
    const file = changeRequest.attachments.id(fileId);
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    const filePath = path.join(process.env.UPLOAD_PATH || './uploads', file.filename);

    try {
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }

    // Set headers for download
    res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
    res.setHeader('Content-Type', file.mimetype);

    // Send file
    res.sendFile(path.resolve(filePath));
  } catch (error) {
    console.error('Download file error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while downloading file'
    });
  }
};

// @desc    Get file info
// @route   GET /api/files/:id/info
// @access  Private
exports.getFileInfo = async (req, res) => {
  try {
    const fileId = req.params.id;

    const changeRequest = await ChangeRequest.findOne({
      'attachments._id': fileId
    }).populate('attachments.uploadedBy', 'name email');

    if (!changeRequest) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    const file = changeRequest.attachments.id(fileId);
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: file._id,
        originalName: file.originalName,
        mimetype: file.mimetype,
        size: file.size,
        uploadDate: file.uploadDate,
        uploadedBy: file.uploadedBy,
        category: file.category
      }
    });
  } catch (error) {
    console.error('Get file info error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while getting file info'
    });
  }
};

// @desc    Delete file
// @route   DELETE /api/files/:id
// @access  Private
exports.deleteFile = async (req, res) => {
  try {
    const fileId = req.params.id;

    const changeRequest = await ChangeRequest.findOne({
      'attachments._id': fileId
    });

    if (!changeRequest) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    const file = changeRequest.attachments.id(fileId);
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Check permissions
    const canDelete = 
      req.user.role === 'admin' ||
      (changeRequest.requester.toString() === req.user._id.toString() && 
       ['draft', 'hod_rejected', 'qa_rejected'].includes(changeRequest.status)) ||
      file.uploadedBy.toString() === req.user._id.toString();

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this file'
      });
    }

    // Delete file from filesystem
    const filePath = path.join(process.env.UPLOAD_PATH || './uploads', file.filename);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.warn('File not found on filesystem:', filePath);
    }

    // Remove from database
    changeRequest.attachments.pull(fileId);

    // Add audit log entry
    changeRequest.addAuditLog(
      'File deleted',
      req.user._id,
      {
        filename: file.originalName,
        category: file.category
      },
      req.ip
    );

    await changeRequest.save();

    res.status(200).json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting file'
    });
  }
};