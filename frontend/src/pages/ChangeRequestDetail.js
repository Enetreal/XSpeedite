import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Chip,
  Button,
  Divider,
  Card,
  CardContent,
  CardActions,
  Stack,
  Alert,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
} from '@mui/lab';
import {
  Edit,
  Download,
  Print,
  Share,
  Check,
  Close,
  Comment,
  Person,
  AccessTime,
  Assignment,
  Timeline as TimelineIcon,
  Attachment,
  ArrowBack,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { changeRequestService } from '../services';
import { format } from 'date-fns';
import LoadingSpinner from '../components/LoadingSpinner';

const getStatusColor = (status) => {
  switch (status) {
    case 'draft':
      return 'default';
    case 'submitted':
      return 'info';
    case 'under_review':
    case 'pending_hod_approval':
    case 'pending_qa_review':
    case 'pending_cct_approval':
      return 'warning';
    case 'approved':
      return 'success';
    case 'rejected':
      return 'error';
    case 'implemented':
      return 'success';
    case 'closed':
      return 'default';
    default:
      return 'default';
  }
};

const getPriorityColor = (priority) => {
  switch (priority) {
    case 'low':
      return 'success';
    case 'medium':
      return 'warning';
    case 'high':
      return 'error';
    case 'critical':
      return 'error';
    default:
      return 'default';
  }
};

const formatStatus = (status) => {
  return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const TabPanel = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`tabpanel-${index}`}
    aria-labelledby={`tab-${index}`}
    {...other}
  >
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
);

const ChangeRequestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const [tabValue, setTabValue] = useState(0);

  // Fetch change request details
  const { data: request, isLoading, error } = useQuery({
    queryKey: ['change-request', id],
    queryFn: () => changeRequestService.getById(id).then(res => res.data.data),
    enabled: !!id,
  });

  // Fetch approval history
  const { data: approvalHistory = [] } = useQuery({
    queryKey: ['approval-history', id],
    queryFn: () => changeRequestService.getApprovalHistory(id).then(res => res.data.data),
    enabled: !!id,
  });

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleEdit = () => {
    navigate(`/change-requests/${id}/edit`);
  };

  const handleBack = () => {
    navigate(-1);
  };

  const canEdit = () => {
    if (!request || !user) return false;
    if (hasRole('admin')) return true;
    if (request.requester?._id === user._id && ['draft', 'changes_requested'].includes(request.status)) {
      return true;
    }
    return false;
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading change request details..." />;
  }

  if (error || !request) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">
          Error loading change request details. Please try again.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={handleBack} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Box flexGrow={1}>
          <Typography variant="h4" gutterBottom>
            {request.title}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Control Number: {request.changeControlNumber}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          {canEdit() && (
            <Button
              variant="outlined"
              startIcon={<Edit />}
              onClick={handleEdit}
            >
              Edit
            </Button>
          )}
          <Button variant="outlined" startIcon={<Download />}>
            Export
          </Button>
          <Button variant="outlined" startIcon={<Print />}>
            Print
          </Button>
          <Button variant="outlined" startIcon={<Share />}>
            Share
          </Button>
        </Stack>
      </Box>

        <Chip
          label={formatStatus(request.status || '')}
          color={getStatusColor(request.status)}
          size="large"
        />
          size="large"
        />
        <Chip
          label={`Priority: ${request.priority?.toUpperCase() || 'N/A'}`}
          color={getPriorityColor(request.priority)}
          size="large"
          variant="outlined"
        />
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Details" />
          <Tab label="Approval History" />
          <Tab label="Documents" />
          <Tab label="Comments" />
        </Tabs>

        {/* Details Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Description
                  </Typography>
                  <Typography variant="body1" paragraph>
                    {request.description}
                  </Typography>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="h6" gutterBottom>
                    Justification
                  </Typography>
                  <Typography variant="body1" paragraph>
                    {request.justification || 'No justification provided'}
                  </Typography>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="h6" gutterBottom>
                    Impact Assessment
                  </Typography>
                  <Typography variant="body1">
                    {request.impactAssessment || 'No impact assessment provided'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Request Information
                  </Typography>
                  
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Requester
                      </Typography>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Person fontSize="small" />
                        <Typography variant="body2">
                          {request.requester ? 
                            `${request.requester.firstName} ${request.requester.lastName}` : 
                            'N/A'
                          }
                        </Typography>
                      </Stack>
                    </Box>
                    
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Department
                      </Typography>
                      <Typography variant="body2">
                        {request.affectedDepartment || 'N/A'}
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Change Type
                      </Typography>
                      <Typography variant="body2">
                        {request.changeType || 'N/A'}
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Created Date
                      </Typography>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <AccessTime fontSize="small" />
                        <Typography variant="body2">
                          {format(new Date(request.createdAt), 'MMM dd, yyyy HH:mm')}
                        </Typography>
                      </Stack>
                    </Box>
                    
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Target Completion
                      </Typography>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Assignment fontSize="small" />
                        <Typography variant="body2">
                          {request.targetCompletionDate ? 
                            format(new Date(request.targetCompletionDate), 'MMM dd, yyyy') : 
                            'N/A'
                          }
                        </Typography>
                      </Stack>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Approval History Tab */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            <TimelineIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Approval Timeline
          </Typography>
          
          {approvalHistory.length > 0 ? (
            <Timeline>
              {approvalHistory.map((approval, index) => (
                <TimelineItem key={index}>
                  <TimelineSeparator>
                    <TimelineDot 
                      color={
                        approval.action === 'approve' ? 'success' :
                        approval.action === 'reject' ? 'error' : 'warning'
                      }
                    >
                      {approval.action === 'approve' ? <Check /> : <Comment />}
                    </TimelineDot>
                    {index < approvalHistory.length - 1 && <TimelineConnector />}
                  </TimelineSeparator>
                  <TimelineContent>
                    <Typography variant="subtitle1">
                      {approval.action === 'approve' ? 'Approved' : 
                       approval.action === 'reject' ? 'Rejected' : 
                       'Action Taken'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      by {approval.approver?.firstName} {approval.approver?.lastName} 
                      ({approval.approver?.role})
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {format(new Date(approval.createdAt), 'MMM dd, yyyy HH:mm')}
                    </Typography>
                    {approval.comments && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {approval.comments}
                      </Typography>
                    )}
                  </TimelineContent>
                </TimelineItem>
              ))}
            </Timeline>
          ) : (
            <Alert severity="info">
              No approval actions have been taken yet.
            </Alert>
          )}
        </TabPanel>

        {/* Documents Tab */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            <Attachment sx={{ mr: 1, verticalAlign: 'middle' }} />
            Attached Documents
          </Typography>
          
          {request.attachments && request.attachments.length > 0 ? (
            <Grid container spacing={2}>
              {request.attachments.map((file, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" noWrap>
                        {file.originalName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {file.size ? `${(file.size / 1024).toFixed(1)} KB` : 'Unknown size'}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button size="small" startIcon={<Download />}>
                        Download
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Alert severity="info">
              No documents have been attached to this change request.
            </Alert>
          )}
        </TabPanel>

        {/* Comments Tab */}
        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>
            <Comment sx={{ mr: 1, verticalAlign: 'middle' }} />
            Comments & Notes
          </Typography>
          
          <Alert severity="info">
            Comments functionality will be implemented in a future version.
          </Alert>
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default ChangeRequestDetail;