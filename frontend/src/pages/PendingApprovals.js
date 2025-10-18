import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  TextField,
  MenuItem,
  InputAdornment,
  Grid,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Card,
  CardContent,
  Divider,
  Stack,
} from '@mui/material';
import {
  Visibility,
  Check,
  Close,
  Search,
  FilterList,
  Comment,
  Assignment,
  AccessTime,
  Person,
  Timeline,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { changeRequestService } from '../services';
import { format } from 'date-fns';
import { toast } from 'react-toastify';

const statusOptions = [
  { value: '', label: 'All Pending' },
  { value: 'submitted', label: 'Newly Submitted' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'pending_hod_approval', label: 'Pending HOD Approval' },
  { value: 'pending_qa_review', label: 'Pending QA Review' },
  { value: 'pending_cct_approval', label: 'Pending CCT Approval' },
];

const priorityOptions = [
  { value: '', label: 'All Priorities' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

const getStatusColor = (status) => {
  switch (status) {
    case 'submitted':
      return 'info';
    case 'under_review':
      return 'warning';
    case 'pending_hod_approval':
      return 'secondary';
    case 'pending_qa_review':
      return 'primary';
    case 'pending_cct_approval':
      return 'error';
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

const ActionDialog = ({ open, onClose, request, onSubmit }) => {
  const [action, setAction] = useState('');
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!action) {
      toast.error('Please select an action');
      return;
    }

    if ((action === 'reject' || action === 'request_changes') && !comments.trim()) {
      toast.error('Comments are required for rejection or change requests');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(request._id, action, comments);
      onClose();
      setAction('');
      setComments('');
    } catch (error) {
      console.error('Error submitting action:', error);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Review Change Request: {request?.changeControlNumber}
      </DialogTitle>
      <DialogContent>
        {request && (
          <Box sx={{ mb: 3 }}>
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {request.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {request.description}
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Person fontSize="small" />
                      <Typography variant="body2">
                        <strong>Requester:</strong> {request.requester ? 
                          `${request.requester.firstName} ${request.requester.lastName}` : 
                          'N/A'
                        }
                      </Typography>
                    </Stack>
                  </Grid>
                  <Grid item xs={6}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Timeline fontSize="small" />
                      <Typography variant="body2">
                        <strong>Priority:</strong> 
                        <Chip
                          label={request.priority?.toUpperCase() || 'N/A'}
                          color={getPriorityColor(request.priority)}
                          size="small"
                          variant="outlined"
                          sx={{ ml: 1 }}
                        />
                      </Typography>
                    </Stack>
                  </Grid>
                  <Grid item xs={6}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <AccessTime fontSize="small" />
                      <Typography variant="body2">
                        <strong>Created:</strong> {format(new Date(request.createdAt), 'MMM dd, yyyy HH:mm')}
                      </Typography>
                    </Stack>
                  </Grid>
                  <Grid item xs={6}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Assignment fontSize="small" />
                      <Typography variant="body2">
                        <strong>Target Date:</strong> {request.targetCompletionDate ? 
                          format(new Date(request.targetCompletionDate), 'MMM dd, yyyy') : 
                          'N/A'
                        }
                      </Typography>
                    </Stack>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <TextField
              fullWidth
              select
              label="Action"
              value={action}
              onChange={(e) => setAction(e.target.value)}
              sx={{ mb: 2 }}
              required
            >
              <MenuItem value="approve">Approve</MenuItem>
              <MenuItem value="reject">Reject</MenuItem>
              <MenuItem value="request_changes">Request Changes</MenuItem>
              <MenuItem value="delegate">Delegate</MenuItem>
            </TextField>

            <TextField
              fullWidth
              multiline
              rows={4}
              label="Comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Enter your comments here..."
              required={action === 'reject' || action === 'request_changes'}
              helperText={
                (action === 'reject' || action === 'request_changes') ? 
                'Comments are required for this action' : 
                'Optional comments for this action'
              }
            />

            {action === 'approve' && (
              <Alert severity="success" sx={{ mt: 2 }}>
                This change request will be approved and moved to the next stage in the workflow.
              </Alert>
            )}
            {action === 'reject' && (
              <Alert severity="error" sx={{ mt: 2 }}>
                This change request will be rejected and returned to the requester.
              </Alert>
            )}
            {action === 'request_changes' && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                The requester will be notified to make the requested changes.
              </Alert>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={loading || !action}
        >
          {loading ? 'Processing...' : 'Submit'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const PendingApprovals = () => {
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    priority: '',
    sortBy: 'createdAt',
    sortOrder: 'asc',
  });
  const [actionDialog, setActionDialog] = useState({
    open: false,
    request: null,
  });

  // Fetch pending approvals
  const { data, isLoading, error } = useQuery({
    queryKey: ['pending-approvals', page, rowsPerPage, filters],
    queryFn: () => changeRequestService.getPendingApprovals({
      page: page + 1,
      limit: rowsPerPage,
      ...filters,
    }).then(res => res.data.data),
    keepPreviousData: true,
  });

  // Approval action mutation
  const approvalMutation = useMutation({
    mutationFn: ({ requestId, action, comments }) => 
      changeRequestService.submitApproval(requestId, action, comments),
    onSuccess: () => {
      queryClient.invalidateQueries(['pending-approvals']);
      queryClient.invalidateQueries(['change-requests']);
      toast.success('Action submitted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error submitting action');
    },
  });

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (field) => (event) => {
    setFilters(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
    setPage(0);
  };

  const handleViewDetails = (id) => {
    navigate(`/change-requests/${id}`);
  };

  const handleOpenActionDialog = (request) => {
    setActionDialog({
      open: true,
      request,
    });
  };

  const handleCloseActionDialog = () => {
    setActionDialog({
      open: false,
      request: null,
    });
  };

  const handleSubmitAction = async (requestId, action, comments) => {
    await approvalMutation.mutateAsync({ requestId, action, comments });
  };

  const canApprove = (request) => {
    if (!user) return false;
    
    // Admin can approve anything
    if (hasRole('admin')) return true;
    
    // HOD can approve requests in their department
    if (hasRole('hod') && request.status === 'pending_hod_approval') {
      return request.affectedDepartment === user.department;
    }
    
    // QA can review after HOD approval
    if (hasRole('qa') && request.status === 'pending_qa_review') {
      return true;
    }
    
    // CCT can approve after QA review
    if (hasRole('cct') && request.status === 'pending_cct_approval') {
      return true;
    }
    
    return false;
  };

  const requests = data?.changeRequests || [];
  const totalCount = data?.totalCount || 0;

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          Pending Approvals
        </Typography>
        <Chip 
          label={`${totalCount} items requiring approval`} 
          color="warning" 
          variant="outlined"
        />
      </Box>

      {/* Summary Cards */}
      {data?.summary && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Newly Submitted
                </Typography>
                <Typography variant="h4" color="info.main">
                  {data.summary.submitted || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Under Review
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {data.summary.under_review || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Awaiting HOD
                </Typography>
                <Typography variant="h4" color="secondary.main">
                  {data.summary.pending_hod_approval || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Critical Priority
                </Typography>
                <Typography variant="h4" color="error.main">
                  {data.summary.critical || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          <FilterList sx={{ mr: 1, verticalAlign: 'middle' }} />
          Filters
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search"
              variant="outlined"
              value={filters.search}
              onChange={handleFilterChange('search')}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              placeholder="Search by title, number, or requester..."
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              select
              label="Status"
              value={filters.status}
              onChange={handleFilterChange('status')}
            >
              {statusOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              select
              label="Priority"
              value={filters.priority}
              onChange={handleFilterChange('priority')}
            >
              {priorityOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              select
              label="Sort By"
              value={filters.sortBy}
              onChange={handleFilterChange('sortBy')}
            >
              <MenuItem value="createdAt">Created Date</MenuItem>
              <MenuItem value="title">Title</MenuItem>
              <MenuItem value="priority">Priority</MenuItem>
              <MenuItem value="targetCompletionDate">Target Date</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              select
              label="Order"
              value={filters.sortOrder}
              onChange={handleFilterChange('sortOrder')}
            >
              <MenuItem value="asc">Oldest First</MenuItem>
              <MenuItem value="desc">Newest First</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {/* Results */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Control Number</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Requester</TableCell>
                <TableCell>Created Date</TableCell>
                <TableCell>Target Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    Loading pending approvals...
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    Error loading pending approvals
                  </TableCell>
                </TableRow>
              ) : requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Box sx={{ p: 4 }}>
                      <Assignment sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary">
                        No pending approvals
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        All caught up! No change requests require your approval at this time.
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((request) => (
                  <TableRow 
                    key={request._id} 
                    hover
                    sx={{
                      backgroundColor: request.priority === 'critical' ? 'error.light' : 'inherit',
                      '&:hover': {
                        backgroundColor: request.priority === 'critical' ? 'error.main' : 'action.hover',
                      },
                    }}
                  >
                    <TableCell>{request.changeControlNumber}</TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                        {request.title}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={formatStatus(request.status)}
                        color={getStatusColor(request.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={request.priority?.toUpperCase() || 'N/A'}
                        color={getPriorityColor(request.priority)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {request.requester ? 
                        `${request.requester.firstName} ${request.requester.lastName}` : 
                        'N/A'
                      }
                    </TableCell>
                    <TableCell>
                      {format(new Date(request.createdAt), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      {request.targetCompletionDate ? 
                        format(new Date(request.targetCompletionDate), 'MMM dd, yyyy') : 
                        'N/A'
                      }
                    </TableCell>
                    <TableCell>
                      <Box display="flex">
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => handleViewDetails(request._id)}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        {canApprove(request) && (
                          <>
                            <Tooltip title="Take Action">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenActionDialog(request)}
                                color="primary"
                              >
                                <Comment />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Quick Approve">
                              <IconButton
                                size="small"
                                onClick={() => handleSubmitAction(request._id, 'approve', '')}
                                color="success"
                                disabled={approvalMutation.isLoading}
                              >
                                <Check />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Quick Reject">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenActionDialog(request)}
                                color="error"
                              >
                                <Close />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Action Dialog */}
      <ActionDialog
        open={actionDialog.open}
        onClose={handleCloseActionDialog}
        request={actionDialog.request}
        onSubmit={handleSubmitAction}
      />
    </Container>
  );
};

export default PendingApprovals;