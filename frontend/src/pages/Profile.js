import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  TextField,
  Button,
  Avatar,
  Divider,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Edit,
  Save,
  Cancel,
  Person,
  Email,
  Badge,
  Security,
  Notifications,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '../services';
import { toast } from 'react-toastify';

const TabPanel = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`tabpanel-${index}`}
    aria-labelledby={`tab-${index}`}
    {...other}
  >
    {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
  </div>
);

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const queryClient = useQueryClient();
  
  const [tabValue, setTabValue] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    department: user?.department || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
  });
  
  const [passwordDialog, setPasswordDialog] = useState({
    open: false,
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: authService.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries(['auth', 'profile']);
      setEditMode(false);
      toast.success('Profile updated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error updating profile');
    },
  });

  // Password change mutation
  const changePasswordMutation = useMutation({
    mutationFn: ({ currentPassword, newPassword }) => 
      authService.changePassword(currentPassword, newPassword),
    onSuccess: () => {
      setPasswordDialog({
        open: false,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      toast.success('Password changed successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error changing password');
    },
  });

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleProfileChange = (field) => (event) => {
    setProfileData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleSaveProfile = async () => {
    await updateProfileMutation.mutateAsync(profileData);
  };

  const handleCancelEdit = () => {
    setProfileData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      department: user?.department || '',
      phone: user?.phone || '',
      bio: user?.bio || '',
    });
    setEditMode(false);
  };

  const handlePasswordDialogChange = (field) => (event) => {
    setPasswordDialog(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleChangePassword = async () => {
    if (passwordDialog.newPassword !== passwordDialog.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (passwordDialog.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    await changePasswordMutation.mutateAsync({
      currentPassword: passwordDialog.currentPassword,
      newPassword: passwordDialog.newPassword,
    });
  };

  const getRoleDisplayName = (role) => {
    const roleMap = {
      'requester': 'Requester',
      'hod': 'Head of Department',
      'qa': 'QA Correspondent',
      'cct': 'Change Control Team',
      'admin': 'Administrator',
    };
    return roleMap[role] || role;
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Typography variant="h4" gutterBottom>
        Profile Settings
      </Typography>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab icon={<Person />} label="Profile" />
          <Tab icon={<Security />} label="Security" />
          <Tab icon={<Notifications />} label="Notifications" />
        </Tabs>

        {/* Profile Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Avatar
                    sx={{
                      width: 120,
                      height: 120,
                      mx: 'auto',
                      mb: 2,
                      bgcolor: 'primary.main',
                      fontSize: '3rem',
                    }}
                  >
                    {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                  </Avatar>
                  <Typography variant="h5" gutterBottom>
                    {user?.firstName} {user?.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {getRoleDisplayName(user?.role)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {user?.department}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h6">
                      Profile Information
                    </Typography>
                    {!editMode && (
                      <Button
                        variant="outlined"
                        startIcon={<Edit />}
                        onClick={() => setEditMode(true)}
                      >
                        Edit Profile
                      </Button>
                    )}
                  </Box>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="First Name"
                        value={profileData.firstName}
                        onChange={handleProfileChange('firstName')}
                        disabled={!editMode}
                        InputProps={{
                          startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} />,
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Last Name"
                        value={profileData.lastName}
                        onChange={handleProfileChange('lastName')}
                        disabled={!editMode}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Email"
                        value={profileData.email}
                        onChange={handleProfileChange('email')}
                        disabled={!editMode}
                        InputProps={{
                          startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} />,
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Department"
                        value={profileData.department}
                        onChange={handleProfileChange('department')}
                        disabled={!editMode}
                        InputProps={{
                          startAdornment: <Badge sx={{ mr: 1, color: 'text.secondary' }} />,
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Phone"
                        value={profileData.phone}
                        onChange={handleProfileChange('phone')}
                        disabled={!editMode}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Bio"
                        value={profileData.bio}
                        onChange={handleProfileChange('bio')}
                        disabled={!editMode}
                        multiline
                        rows={3}
                        placeholder="Tell us about yourself..."
                      />
                    </Grid>
                  </Grid>
                </CardContent>
                
                {editMode && (
                  <CardActions>
                    <Button
                      variant="contained"
                      startIcon={<Save />}
                      onClick={handleSaveProfile}
                      disabled={updateProfileMutation.isLoading}
                    >
                      Save Changes
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Cancel />}
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </Button>
                  </CardActions>
                )}
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Security Tab */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Change Password
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Keep your account secure by using a strong password.
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() => setPasswordDialog({ ...passwordDialog, open: true })}
                  >
                    Change Password
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Account Information
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Account ID: {user?._id?.slice(-8)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Role: {getRoleDisplayName(user?.role)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Last Login: {user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'N/A'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Account Created: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Notifications Tab */}
        <TabPanel value={tabValue} index={2}>
          <Alert severity="info" sx={{ mb: 3 }}>
            Notification preferences will be available in a future update.
          </Alert>
          
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Email Notifications
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Configure when you want to receive email notifications about your change requests and approvals.
              </Typography>
            </CardContent>
          </Card>
        </TabPanel>
      </Paper>

      {/* Password Change Dialog */}
      <Dialog
        open={passwordDialog.open}
        onClose={() => setPasswordDialog({ ...passwordDialog, open: false })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="password"
                label="Current Password"
                value={passwordDialog.currentPassword}
                onChange={handlePasswordDialogChange('currentPassword')}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="password"
                label="New Password"
                value={passwordDialog.newPassword}
                onChange={handlePasswordDialogChange('newPassword')}
                required
                helperText="Password must be at least 8 characters long"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="password"
                label="Confirm New Password"
                value={passwordDialog.confirmPassword}
                onChange={handlePasswordDialogChange('confirmPassword')}
                required
                error={passwordDialog.newPassword !== passwordDialog.confirmPassword && passwordDialog.confirmPassword !== ''}
                helperText={
                  passwordDialog.newPassword !== passwordDialog.confirmPassword && passwordDialog.confirmPassword !== ''
                    ? 'Passwords do not match'
                    : ''
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setPasswordDialog({ ...passwordDialog, open: false })}
          >
            Cancel
          </Button>
          <Button
            onClick={handleChangePassword}
            variant="contained"
            disabled={
              changePasswordMutation.isLoading ||
              !passwordDialog.currentPassword ||
              !passwordDialog.newPassword ||
              passwordDialog.newPassword !== passwordDialog.confirmPassword
            }
          >
            Change Password
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Profile;