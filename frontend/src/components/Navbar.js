import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Badge,
  Avatar,
  Box,
  Tooltip,
} from '@mui/material';
import {
  AccountCircle,
  Notifications,
  Logout,
  Settings,
  ExitToApp,
  Dashboard,
  Assignment,
  Group,
  Assessment,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { notificationService } from '../services';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, hasRole } = useAuth();

  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchor, setNotificationAnchor] = useState(null);

  // Get unread notification count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationService.getUnreadCount().then(res => res.data.count),
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationOpen = (event) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  const handleNavigation = (path) => {
    navigate(path);
    handleMenuClose();
  };

  const handleLogout = async () => {
    await logout();
    handleMenuClose();
    navigate('/login');
  };

  const getPageTitle = () => {
    const path = location.pathname;
    switch (path) {
      case '/dashboard':
        return 'Dashboard';
      case '/change-requests':
        return 'Change Requests';
      case '/change-requests/new':
        return 'New Change Request';
      case '/pending-approvals':
        return 'Pending Approvals';
      case '/my-requests':
        return 'My Requests';
      case '/users':
        return 'User Management';
      case '/reports':
        return 'Reports';
      case '/profile':
        return 'Profile';
      default:
        if (path.startsWith('/change-requests/')) {
          return 'Change Request Details';
        }
        return 'QMS Change Control';
    }
  };

  const navigationButtons = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: <Dashboard />,
      show: true,
    },
    {
      label: 'Change Requests',
      path: '/change-requests',
      icon: <Assignment />,
      show: true,
    },
    {
      label: 'Users',
      path: '/users',
      icon: <Group />,
      show: hasRole(['admin', 'cct']),
    },
    {
      label: 'Reports',
      path: '/reports',
      icon: <Assessment />,
      show: hasRole(['admin', 'cct', 'qa_correspondent']),
    },
  ];

  return (
    <AppBar position="sticky" elevation={1}>
      <Toolbar>
        {/* Logo/Title */}
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ flexGrow: 1, cursor: 'pointer' }}
          onClick={() => navigate('/dashboard')}
        >
          QMS Change Control
        </Typography>

        {/* Page Title */}
        <Typography variant="h6" sx={{ mr: 3 }}>
          {getPageTitle()}
        </Typography>

        {/* Navigation Buttons */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, mr: 2 }}>
          {navigationButtons
            .filter(button => button.show)
            .map((button) => (
              <Button
                key={button.path}
                color="inherit"
                startIcon={button.icon}
                onClick={() => navigate(button.path)}
                sx={{
                  mr: 1,
                  backgroundColor: location.pathname === button.path ? 'rgba(255,255,255,0.1)' : 'transparent',
                }}
              >
                {button.label}
              </Button>
            ))}
        </Box>

        {/* Notifications */}
        <Tooltip title="Notifications">
          <IconButton
            color="inherit"
            onClick={handleNotificationOpen}
            sx={{ mr: 1 }}
          >
            <Badge badgeContent={unreadCount} color="error">
              <Notifications />
            </Badge>
          </IconButton>
        </Tooltip>

        {/* User Menu */}
        <Tooltip title="Account">
          <IconButton
            size="large"
            edge="end"
            color="inherit"
            onClick={handleMenuOpen}
          >
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
              {user?.firstName?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </Avatar>
          </IconButton>
        </Tooltip>

        {/* User Menu Dropdown */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          onClick={handleMenuClose}
          PaperProps={{
            elevation: 3,
            sx: {
              mt: 1.5,
              minWidth: 200,
            },
          }}
        >
          <MenuItem onClick={() => handleNavigation('/profile')}>
            <AccountCircle sx={{ mr: 2 }} />
            Profile
          </MenuItem>
          <MenuItem onClick={() => handleNavigation('/profile')}>
            <Settings sx={{ mr: 2 }} />
            Settings
          </MenuItem>
          <MenuItem onClick={handleLogout}>
            <ExitToApp sx={{ mr: 2 }} />
            Logout
          </MenuItem>
        </Menu>

        {/* Notifications Menu */}
        <Menu
          anchorEl={notificationAnchor}
          open={Boolean(notificationAnchor)}
          onClose={handleNotificationClose}
          PaperProps={{
            elevation: 3,
            sx: {
              mt: 1.5,
              maxWidth: 400,
              maxHeight: 400,
            },
          }}
        >
          <MenuItem>
            <Typography variant="body2" color="text.secondary">
              You have {unreadCount} unread notifications
            </Typography>
          </MenuItem>
          <MenuItem onClick={() => { 
            handleNotificationClose(); 
            navigate('/notifications'); 
          }}>
            <Typography variant="body2">
              View All Notifications
            </Typography>
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;