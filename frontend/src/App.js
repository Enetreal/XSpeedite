import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';

import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ChangeRequests from './pages/ChangeRequests';
import ChangeRequestDetail from './pages/ChangeRequestDetail';
import CreateChangeRequest from './pages/CreateChangeRequest';
import PendingApprovals from './pages/PendingApprovals';
import MyRequests from './pages/MyRequests';
import Users from './pages/Users';
import Reports from './pages/Reports';
import Profile from './pages/Profile';

// Protected Route Component
const ProtectedRoute = ({ children, roles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={
            user ? <Navigate to="/dashboard" replace /> : <Login />
          } 
        />

        {/* Protected Routes */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  
                  {/* Change Request Routes */}
                  <Route path="/change-requests" element={<ChangeRequests />} />
                  <Route path="/change-requests/new" element={<CreateChangeRequest />} />
                  <Route path="/change-requests/:id" element={<ChangeRequestDetail />} />
                  <Route path="/my-requests" element={<MyRequests />} />
                  <Route path="/pending-approvals" element={<PendingApprovals />} />
                  
                  {/* User Management (Admin/CCT only) */}
                  <Route 
                    path="/users" 
                    element={
                      <ProtectedRoute roles={['admin', 'cct']}>
                        <Users />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* Reports */}
                  <Route path="/reports" element={<Reports />} />
                  
                  {/* Profile */}
                  <Route path="/profile" element={<Profile />} />
                  
                  {/* Catch all route */}
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Box>
  );
}

export default App;