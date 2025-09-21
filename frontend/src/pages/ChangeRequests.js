import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
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
} from '@mui/material';
import {
  Add,
  Visibility,
  Edit,
  Search,
  FilterList,
  Download,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { changeRequestService } from '../services';
import { format } from 'date-fns';

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'pending_hod_approval', label: 'Pending HOD Approval' },
  { value: 'pending_qa_review', label: 'Pending QA Review' },
  { value: 'pending_cct_approval', label: 'Pending CCT Approval' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'implemented', label: 'Implemented' },
  { value: 'closed', label: 'Closed' },
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

const ChangeRequests = () => {
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    priority: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  // Fetch change requests with pagination and filters
  const { data, isLoading, error } = useQuery({
    queryKey: ['change-requests', page, rowsPerPage, filters],
    queryFn: () => changeRequestService.getAll({
      page: page + 1,
      limit: rowsPerPage,
      ...filters,
    }).then(res => res.data.data),
    keepPreviousData: true,
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

  const handleEdit = (id) => {
    navigate(`/change-requests/${id}/edit`);
  };

  const handleCreateNew = () => {
    navigate('/change-requests/new');
  };

  const canEdit = (request) => {
    if (hasRole('admin')) return true;
    if (request.requester?._id === user?._id && ['draft', 'changes_requested'].includes(request.status)) {
      return true;
    }
    return false;
  };

  const requests = data?.changeRequests || [];
  const totalCount = data?.totalCount || 0;

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          Change Requests
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreateNew}
        >
          New Request
        </Button>
      </Box>

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
              placeholder="Search by title, number, or description..."
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
              <MenuItem value="status">Status</MenuItem>
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
              <MenuItem value="desc">Descending</MenuItem>
              <MenuItem value="asc">Ascending</MenuItem>
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
                    Loading...
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    Error loading change requests
                  </TableCell>
                </TableRow>
              ) : requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No change requests found
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((request) => (
                  <TableRow key={request._id} hover>
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
                        {canEdit(request) && (
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => handleEdit(request._id)}
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Export">
                          <IconButton size="small">
                            <Download />
                          </IconButton>
                        </Tooltip>
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
    </Container>
  );
};

export default ChangeRequests;