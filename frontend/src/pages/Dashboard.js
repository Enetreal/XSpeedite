import React from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Box,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Divider,
  Alert,
} from '@mui/material';
import {
  Assignment,
  PendingActions,
  CheckCircle,
  Warning,
  TrendingUp,
  Schedule,
  Person,
  Visibility,
  Edit,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { changeRequestService } from '../services';
import { format } from 'date-fns';

const StatCard = ({ title, value, icon, color = 'primary', onClick }) => (
  <Card 
    sx={{ 
      height: '100%', 
      cursor: onClick ? 'pointer' : 'default',
      '&:hover': onClick ? { elevation: 4 } : {},
    }}
    onClick={onClick}
  >
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography color="textSecondary" gutterBottom variant="h6">
            {title}
          </Typography>
          <Typography variant="h4" component="h2" color={color}>
            {value}
          </Typography>
        </Box>
        <Box sx={{ color: `${color}.main` }}>
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

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

const formatStatus = (status) => {
  return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();

  // Fetch dashboard statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => changeRequestService.getDashboardStats().then(res => res.data.data),
  });

  // Fetch pending approvals for current user
  const { data: pendingApprovals, isLoading: pendingLoading } = useQuery({
    queryKey: ['pending-approvals'],
    queryFn: () => changeRequestService.getPendingApprovals().then(res => res.data.data),
    enabled: hasRole(['hod', 'qa_correspondent', 'cct']),
  });

  // Fetch user's requests
  const { data: myRequests, isLoading: requestsLoading } = useQuery({
    queryKey: ['my-requests'],
    queryFn: () => changeRequestService.getMyRequests().then(res => res.data.data),
  });

  const handleViewChangeRequest = (id) => {
    navigate(`/change-requests/${id}`);
  };

  const handleCreateNew = () => {
    navigate('/change-requests/new');
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Welcome Section */}
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>
          Welcome back, {user?.firstName}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here's an overview of your QMS change control activities.
        </Typography>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Requests"
            value={stats?.totalRequests || 0}
            icon={<Assignment fontSize="large" />}
            color="primary"
            onClick={() => navigate('/change-requests')}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Approvals"
            value={stats?.pendingApprovals || 0}
            icon={<PendingActions fontSize="large" />}
            color="warning"
            onClick={() => navigate('/pending-approvals')}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Approved This Month"
            value={stats?.approvedThisMonth || 0}
            icon={<CheckCircle fontSize="large" />}
            color="success"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Overdue Items"
            value={stats?.overdueItems || 0}
            icon={<Warning fontSize="large" />}
            color="error"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Pending Approvals Section */}
        {hasRole(['hod', 'qa_correspondent', 'cct']) && (
          <Grid item xs={12} lg={6}>
            <Paper sx={{ p: 3, height: '400px', overflow: 'auto' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Pending Approvals ({pendingApprovals?.length || 0})
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => navigate('/pending-approvals')}
                >
                  View All
                </Button>
              </Box>
              
              {pendingLoading ? (
                <Typography>Loading...</Typography>
              ) : pendingApprovals?.length > 0 ? (
                <List>
                  {pendingApprovals.slice(0, 5).map((request, index) => (
                    <React.Fragment key={request._id}>
                      <ListItem
                        secondaryAction={
                          <Box>
                            <IconButton
                              edge="end"
                              onClick={() => handleViewChangeRequest(request._id)}
                            >
                              <Visibility />
                            </IconButton>
                          </Box>
                        }
                      >
                        <ListItemIcon>
                          <Assignment color="warning" />
                        </ListItemIcon>
                        <ListItemText
                          primary={request.title}
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {request.changeControlNumber}
                              </Typography>
                              <Chip
                                label={formatStatus(request.status)}
                                size="small"
                                color={getStatusColor(request.status)}
                                sx={{ mt: 0.5 }}
                              />
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < pendingApprovals.slice(0, 5).length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Alert severity="info">
                  No pending approvals at this time.
                </Alert>
              )}
            </Paper>
          </Grid>
        )}

        {/* My Recent Requests */}
        <Grid item xs={12} lg={hasRole(['hod', 'qa_correspondent', 'cct']) ? 6 : 12}>
          <Paper sx={{ p: 3, height: '400px', overflow: 'auto' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                My Recent Requests ({myRequests?.length || 0})
              </Typography>
              <Box>
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleCreateNew}
                  sx={{ mr: 1 }}
                >
                  Create New
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => navigate('/my-requests')}
                >
                  View All
                </Button>
              </Box>
            </Box>
            
            {requestsLoading ? (
              <Typography>Loading...</Typography>
            ) : myRequests?.length > 0 ? (
              <List>
                {myRequests.slice(0, 5).map((request, index) => (
                  <React.Fragment key={request._id}>
                    <ListItem
                      secondaryAction={
                        <Box>
                          <IconButton
                            edge="end"
                            onClick={() => handleViewChangeRequest(request._id)}
                          >
                            <Visibility />
                          </IconButton>
                          {request.status === 'draft' && (
                            <IconButton
                              edge="end"
                              onClick={() => navigate(`/change-requests/${request._id}/edit`)}
                            >
                              <Edit />
                            </IconButton>
                          )}
                        </Box>
                      }
                    >
                      <ListItemIcon>
                        <Assignment color={getStatusColor(request.status)} />
                      </ListItemIcon>
                      <ListItemText
                        primary={request.title}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {request.changeControlNumber} • Created {format(new Date(request.createdAt), 'MMM dd, yyyy')}
                            </Typography>
                            <Chip
                              label={formatStatus(request.status)}
                              size="small"
                              color={getStatusColor(request.status)}
                              sx={{ mt: 0.5 }}
                            />
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < myRequests.slice(0, 5).length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Alert severity="info">
                You haven't created any change requests yet.
                <Button 
                  variant="contained" 
                  sx={{ ml: 2 }}
                  onClick={handleCreateNew}
                >
                  Create Your First Request
                </Button>
              </Alert>
            )}
          </Paper>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<Assignment />}
                  onClick={handleCreateNew}
                >
                  New Change Request
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<Schedule />}
                  onClick={() => navigate('/my-requests')}
                >
                  My Requests
                </Button>
              </Grid>
              {hasRole(['hod', 'qa_correspondent', 'cct']) && (
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<PendingActions />}
                    onClick={() => navigate('/pending-approvals')}
                  >
                    Pending Approvals
                  </Button>
                </Grid>
              )}
              {hasRole(['admin', 'cct', 'qa_correspondent']) && (
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<TrendingUp />}
                    onClick={() => navigate('/reports')}
                  >
                    View Reports
                  </Button>
                </Grid>
              )}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;