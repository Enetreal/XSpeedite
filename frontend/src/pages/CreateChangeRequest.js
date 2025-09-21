import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  TextField,
  Grid,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Divider,
  Alert,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Chip,
} from '@mui/material';
import {
  ArrowBack,
  ArrowForward,
  Save,
  Send,
  Add,
  Delete,
  CloudUpload,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { changeRequestService, fileService } from '../services';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';

const steps = [
  'Basic Information',
  'Impact Assessment', 
  'Implementation Plan',
  'Review & Submit'
];

const validationSchemas = [
  // Step 1: Basic Information
  Yup.object({
    title: Yup.string().required('Title is required'),
    description: Yup.string().required('Description is required'),
    reason: Yup.string().required('Reason for change is required'),
    priority: Yup.string().required('Priority is required'),
    targetCompletionDate: Yup.date().required('Target completion date is required'),
    affectedSystems: Yup.array().min(1, 'At least one affected system is required'),
  }),
  // Step 2: Impact Assessment
  Yup.object({
    riskAssessment: Yup.string().required('Risk assessment is required'),
    impactLevel: Yup.string().required('Impact level is required'),
  }),
  // Step 3: Implementation Plan
  Yup.object({
    actionPlan: Yup.array().min(1, 'At least one action plan item is required'),
  }),
  // Step 4: Review & Submit (no additional validation)
  Yup.object(),
];

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

const systemOptions = [
  'Quality Management System',
  'Document Control',
  'Training System',
  'Equipment Management',
  'Supplier Management',
  'Product Control',
  'Corrective Actions',
  'Internal Audit',
  'Management Review',
  'Other',
];

const impactLevels = [
  { value: 'low', label: 'Low - Minor impact, easy to reverse' },
  { value: 'medium', label: 'Medium - Moderate impact, some complexity' },
  { value: 'high', label: 'High - Significant impact, difficult to reverse' },
  { value: 'critical', label: 'Critical - Major impact, system-wide effects' },
];

const CreateChangeRequest = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [activeStep, setActiveStep] = useState(0);
  const [attachments, setAttachments] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  // Create change request mutation
  const createMutation = useMutation({
    mutationFn: (data) => changeRequestService.create(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries(['change-requests']);
      queryClient.invalidateQueries(['my-requests']);
      toast.success('Change request created successfully!');
      navigate(`/change-requests/${response.data.data._id}`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create change request');
    },
  });

  // File upload mutation
  const uploadMutation = useMutation({
    mutationFn: (file) => fileService.upload(file, 'change-request'),
    onSuccess: (response) => {
      setAttachments(prev => [...prev, response.data.data]);
    },
    onError: (error) => {
      toast.error('Failed to upload file');
    },
  });

  const formik = useFormik({
    initialValues: {
      title: '',
      description: '',
      reason: '',
      priority: '',
      targetCompletionDate: '',
      affectedSystems: [],
      riskAssessment: '',
      impactLevel: '',
      requiresValidation: false,
      regulatoryImpact: false,
      customerImpact: false,
      actionPlan: [{ description: '', responsiblePerson: '', targetDate: '' }],
      additionalNotes: '',
    },
    validationSchema: validationSchemas[activeStep],
    onSubmit: async (values, { setSubmitting }) => {
      if (activeStep === steps.length - 1) {
        // Final submission
        const submitData = {
          ...values,
          attachments: attachments.map(file => file._id),
        };
        await createMutation.mutateAsync(submitData);
      } else {
        setActiveStep(prev => prev + 1);
      }
      setSubmitting(false);
    },
  });

  const handleNext = () => {
    formik.validateForm().then(errors => {
      if (Object.keys(errors).length === 0) {
        setActiveStep(prev => prev + 1);
      } else {
        formik.setTouched(
          Object.keys(formik.values).reduce((acc, key) => {
            acc[key] = true;
            return acc;
          }, {})
        );
      }
    });
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSaveDraft = async () => {
    const draftData = {
      ...formik.values,
      attachments: attachments.map(file => file._id),
      status: 'draft',
    };
    await createMutation.mutateAsync(draftData);
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    setUploadingFiles(true);
    
    try {
      for (const file of files) {
        await uploadMutation.mutateAsync(file);
      }
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleRemoveFile = (fileId) => {
    setAttachments(prev => prev.filter(file => file._id !== fileId));
  };

  const addActionPlanItem = () => {
    formik.setFieldValue('actionPlan', [
      ...formik.values.actionPlan,
      { description: '', responsiblePerson: '', targetDate: '' }
    ]);
  };

  const removeActionPlanItem = (index) => {
    const newActionPlan = formik.values.actionPlan.filter((_, i) => i !== index);
    formik.setFieldValue('actionPlan', newActionPlan);
  };

  const handleActionPlanChange = (index, field, value) => {
    const newActionPlan = [...formik.values.actionPlan];
    newActionPlan[index][field] = value;
    formik.setFieldValue('actionPlan', newActionPlan);
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="title"
                label="Change Request Title"
                value={formik.values.title}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.title && Boolean(formik.errors.title)}
                helperText={formik.touched.title && formik.errors.title}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                name="description"
                label="Description of Change"
                value={formik.values.description}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.description && Boolean(formik.errors.description)}
                helperText={formik.touched.description && formik.errors.description}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                name="reason"
                label="Reason for Change"
                value={formik.values.reason}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.reason && Boolean(formik.errors.reason)}
                helperText={formik.touched.reason && formik.errors.reason}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                name="priority"
                label="Priority"
                value={formik.values.priority}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.priority && Boolean(formik.errors.priority)}
                helperText={formik.touched.priority && formik.errors.priority}
                required
              >
                {priorityOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                name="targetCompletionDate"
                label="Target Completion Date"
                value={formik.values.targetCompletionDate}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.targetCompletionDate && Boolean(formik.errors.targetCompletionDate)}
                helperText={formik.touched.targetCompletionDate && formik.errors.targetCompletionDate}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                name="affectedSystems"
                label="Affected Systems"
                value={formik.values.affectedSystems}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.affectedSystems && Boolean(formik.errors.affectedSystems)}
                helperText={formik.touched.affectedSystems && formik.errors.affectedSystems}
                SelectProps={{ multiple: true }}
                required
              >
                {systemOptions.map((system) => (
                  <MenuItem key={system} value={system}>
                    {system}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                name="riskAssessment"
                label="Risk Assessment"
                placeholder="Describe potential risks and mitigation strategies..."
                value={formik.values.riskAssessment}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.riskAssessment && Boolean(formik.errors.riskAssessment)}
                helperText={formik.touched.riskAssessment && formik.errors.riskAssessment}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                name="impactLevel"
                label="Impact Level"
                value={formik.values.impactLevel}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.impactLevel && Boolean(formik.errors.impactLevel)}
                helperText={formik.touched.impactLevel && formik.errors.impactLevel}
                required
              >
                {impactLevels.map((level) => (
                  <MenuItem key={level.value} value={level.value}>
                    {level.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Additional Considerations
              </Typography>
              <FormControlLabel
                control={
                  <Checkbox
                    name="requiresValidation"
                    checked={formik.values.requiresValidation}
                    onChange={formik.handleChange}
                  />
                }
                label="Requires Validation"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    name="regulatoryImpact"
                    checked={formik.values.regulatoryImpact}
                    onChange={formik.handleChange}
                  />
                }
                label="Regulatory Impact"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    name="customerImpact"
                    checked={formik.values.customerImpact}
                    onChange={formik.handleChange}
                  />
                }
                label="Customer Impact"
              />
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Action Plan</Typography>
                <Button startIcon={<Add />} onClick={addActionPlanItem}>
                  Add Item
                </Button>
              </Box>
              {formik.values.actionPlan.map((item, index) => (
                <Card key={index} sx={{ mb: 2 }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="subtitle1">Action Item {index + 1}</Typography>
                      {formik.values.actionPlan.length > 1 && (
                        <IconButton onClick={() => removeActionPlanItem(index)}>
                          <Delete />
                        </IconButton>
                      )}
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          multiline
                          rows={2}
                          label="Description"
                          value={item.description}
                          onChange={(e) => handleActionPlanChange(index, 'description', e.target.value)}
                          required
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Responsible Person"
                          value={item.responsiblePerson}
                          onChange={(e) => handleActionPlanChange(index, 'responsiblePerson', e.target.value)}
                          required
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          type="date"
                          label="Target Date"
                          value={item.targetDate}
                          onChange={(e) => handleActionPlanChange(index, 'targetDate', e.target.value)}
                          InputLabelProps={{ shrink: true }}
                          required
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              ))}
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                name="additionalNotes"
                label="Additional Notes"
                value={formik.values.additionalNotes}
                onChange={formik.handleChange}
                placeholder="Any additional information or special considerations..."
              />
            </Grid>
          </Grid>
        );

      case 3:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mb: 3 }}>
                Please review all information before submitting. Once submitted, this change request will be sent for approval.
              </Alert>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Basic Information</Typography>
                  <Typography><strong>Title:</strong> {formik.values.title}</Typography>
                  <Typography><strong>Priority:</strong> {formik.values.priority}</Typography>
                  <Typography><strong>Target Date:</strong> {formik.values.targetCompletionDate}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Impact Assessment</Typography>
                  <Typography><strong>Impact Level:</strong> {formik.values.impactLevel}</Typography>
                  <Typography><strong>Requires Validation:</strong> {formik.values.requiresValidation ? 'Yes' : 'No'}</Typography>
                  <Typography><strong>Regulatory Impact:</strong> {formik.values.regulatoryImpact ? 'Yes' : 'No'}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Action Plan ({formik.values.actionPlan.length} items)</Typography>
                  <List>
                    {formik.values.actionPlan.map((item, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={item.description}
                          secondary={`${item.responsiblePerson} - ${item.targetDate}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        {/* Header */}
        <Box display="flex" alignItems="center" mb={4}>
          <Button startIcon={<ArrowBack />} onClick={() => navigate('/change-requests')}>
            Back to Change Requests
          </Button>
          <Typography variant="h4" sx={{ ml: 2 }}>
            New Change Request
          </Typography>
        </Box>

        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Form Content */}
        <form onSubmit={formik.handleSubmit}>
          {renderStepContent(activeStep)}

          {/* File Attachments */}
          {activeStep === steps.length - 1 && (
            <Box mt={4}>
              <Typography variant="h6" gutterBottom>
                Attachments ({attachments.length})
              </Typography>
              <Button
                variant="outlined"
                component="label"
                startIcon={<CloudUpload />}
                disabled={uploadingFiles}
              >
                Upload Files
                <input
                  type="file"
                  hidden
                  multiple
                  onChange={handleFileUpload}
                />
              </Button>
              {attachments.length > 0 && (
                <List>
                  {attachments.map((file) => (
                    <ListItem key={file._id}>
                      <ListItemText primary={file.originalName} secondary={`${(file.size / 1024).toFixed(1)} KB`} />
                      <IconButton onClick={() => handleRemoveFile(file._id)}>
                        <Delete />
                      </IconButton>
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          )}

          {/* Navigation Buttons */}
          <Box display="flex" justifyContent="space-between" mt={4}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              startIcon={<ArrowBack />}
            >
              Back
            </Button>
            
            <Box>
              <Button
                variant="outlined"
                onClick={handleSaveDraft}
                startIcon={<Save />}
                sx={{ mr: 2 }}
                disabled={createMutation.isLoading}
              >
                Save Draft
              </Button>
              
              {activeStep === steps.length - 1 ? (
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<Send />}
                  disabled={createMutation.isLoading}
                >
                  {createMutation.isLoading ? 'Submitting...' : 'Submit Request'}
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  variant="contained"
                  endIcon={<ArrowForward />}
                >
                  Next
                </Button>
              )}
            </Box>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default CreateChangeRequest;