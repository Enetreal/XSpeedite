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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  Avatar,
  Tooltip,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Block,
  CheckCircle,
  Person,
  Email,
  Badge,
  AdminPanelSettings,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../services';
import { format } from 'date-fns';
import { toast } from 'react-toastify';

const roleOptions = [
  { value: 'requester', label: 'Requester' },
  { value: 'hod', label: 'Head of Department' },
  { value: 'qa', label: 'QA Correspondent' },
  { value: 'cct', label: 'Change Control Team' },
  { value: 'admin', label: 'Administrator' },
];

const getRoleColor = (role) => {
  switch (role) {
    case 'admin':
      return 'error';
    case 'cct':
      return 'primary';
    case 'hod':
      return 'secondary';
    case 'qa':
      return 'info';
    case 'requester':
      return 'default';
    default:
      return 'default';
  }
};

const UserDialog = ({ open, onClose, user, onSubmit }) => {
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    role: user?.role || 'requester',
    department: user?.department || '',
    isActive: user?.isActive !== false,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {user ? 'Edit User' : 'Add New User'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="First Name"
                value={formData.firstName}
                onChange={handleChange('firstName')}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={formData.lastName}
                onChange={handleChange('lastName')}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleChange('email')}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                select
                label="Role"
                value={formData.role}
                onChange={handleChange('role')}
                required
              >
                {roleOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Department"
                value={formData.department}
                onChange={handleChange('department')}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained">
            {user ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

const Users = () => {
  const { hasRole } = useAuth();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [userDialog, setUserDialog] = useState({
    open: false,
    user: null,
  });

  // Check permissions
  if (!hasRole(['admin', 'cct'])) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" color="error" gutterBottom>
            Access Denied
          </Typography>
          <Typography variant="body1">
            You don't have permission to access user management.
          </Typography>
        </Paper>
      </Container>
    );
  }

  // Fetch users
  const { data, isLoading, error } = useQuery({
    queryKey: ['users', page, rowsPerPage],
    queryFn: () => userService.getAll({
      page: page + 1,
      limit: rowsPerPage,
    }).then(res => res.data.data),
    keepPreviousData: true,
  });

  // User mutations
  const createUserMutation = useMutation({
    mutationFn: userService.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      toast.success('User created successfully');
      setUserDialog({ open: false, user: null });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error creating user');
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }) => userService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      toast.success('User updated successfully');
      setUserDialog({ open: false, user: null });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error updating user');
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: userService.toggleActive,
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      toast.success('User status updated');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error updating user status');
    },
  });

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleCreateUser = () => {
    setUserDialog({ open: true, user: null });
  };

  const handleEditUser = (user) => {
    setUserDialog({ open: true, user });
  };

  const handleCloseDialog = () => {
    setUserDialog({ open: false, user: null });
  };

  const handleSubmitUser = async (formData) => {
    if (userDialog.user) {
      await updateUserMutation.mutateAsync({
        id: userDialog.user._id,
        data: formData,
      });
    } else {
      await createUserMutation.mutateAsync(formData);
    }
  };

  const handleToggleActive = (userId) => {
    toggleActiveMutation.mutate(userId);
  };

  const users = data?.users || [];
  const totalCount = data?.totalCount || 0;

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          User Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreateUser}
        >
          Add User
        </Button>
      </Box>

      {/* Stats Cards */}
      {data?.stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Users
                </Typography>
                <Typography variant="h4">
                  {data.stats.total || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Active Users
                </Typography>
                <Typography variant="h4" color="success.main">
                  {data.stats.active || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Administrators
                </Typography>
                <Typography variant="h4" color="error.main">
                  {data.stats.admins || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Inactive Users
                </Typography>
                <Typography variant="h4" color="text.secondary">
                  {data.stats.inactive || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Users Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Last Login</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    Loading users...
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    Error loading users
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user._id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                          {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2">
                            {user.firstName} {user.lastName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {user._id.slice(-6)}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Email fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        {user.email}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={roleOptions.find(r => r.value === user.role)?.label || user.role}
                        color={getRoleColor(user.role)}
                        size="small"
                        icon={user.role === 'admin' ? <AdminPanelSettings /> : <Badge />}
                      />
                    </TableCell>
                    <TableCell>{user.department || 'N/A'}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.isActive ? 'Active' : 'Inactive'}
                        color={user.isActive ? 'success' : 'default'}
                        size="small"
                        icon={user.isActive ? <CheckCircle /> : <Block />}
                      />
                    </TableCell>
                    <TableCell>
                      {user.lastLogin ? 
                        format(new Date(user.lastLogin), 'MMM dd, yyyy') : 
                        'Never'
                      }
                    </TableCell>
                    <TableCell>
                      <Box display="flex">
                        <Tooltip title="Edit User">
                          <IconButton
                            size="small"
                            onClick={() => handleEditUser(user)}
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={user.isActive ? 'Deactivate' : 'Activate'}>
                          <IconButton
                            size="small"
                            onClick={() => handleToggleActive(user._id)}
                            color={user.isActive ? 'error' : 'success'}
                          >
                            {user.isActive ? <Block /> : <CheckCircle />}
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

      {/* User Dialog */}
      <UserDialog
        open={userDialog.open}
        onClose={handleCloseDialog}
        user={userDialog.user}
        onSubmit={handleSubmitUser}
      />
    </Container>
  );
};

export default Users;