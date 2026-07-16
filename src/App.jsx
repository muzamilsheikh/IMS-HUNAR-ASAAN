import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { AppProvider, useApp } from './context/AppContext';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Courses from './pages/Courses';
import Expenses from './pages/Expenses';
import Batches from './pages/Batches';
import Roles from './pages/Roles';
import Settings from './pages/Settings';
import LiveClass from './pages/LiveClass';
import Chat from './pages/Chat';
import Login from './pages/Login';
import Reports from './pages/Reports';
import Users from './pages/Users';
import StudentDashboard from './pages/StudentDashboard';
import VideoVault from './pages/VideoVault';
import VideoVaultAdmin from './pages/VideoVaultAdmin';
import Calendar from './pages/Calendar';
import ErrorBoundary from './components/layout/ErrorBoundary';
import StaffDashboard from './pages/StaffDashboard';
import Payroll from './pages/Payroll';
import FeeChallanPage from './pages/FeeChallanPage';

// Component to decide which dashboard to show based on user role
const DashboardOrStudent = () => {
  const { user } = useApp();
  if (user?.role === 'Student') return <StudentDashboard />;
  if (user?.role === 'Staff') return <StaffDashboard />;
  return <Dashboard />;
};

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { token, user, loading } = useApp();

  // Show loading spinner while auth state is being determined (max 5s via timeout)
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-sm text-slate-500">Loading...</p>
      </div>
    );
  }

  if (!token || !user) return <Navigate to="/login" replace />;

  const role = user?.role;
  const currentPath = window.location.pathname;

  // Student guards: block access to /batches, /expenses, /reports, /users, and student management (/students)
  if (role === 'Student') {
    const blockedForStudent = ['/batches', '/expenses', '/reports', '/users', '/students', '/courses', '/roles', '/settings', '/payroll', '/video-vault-admin'];
    const isBlocked = blockedForStudent.some(path => currentPath === path || currentPath.startsWith(path + '/'));
    if (isBlocked) {
      toast.error('Access Denied: You do not have permission to access student-restricted areas.');
      return <Navigate to="/" replace />;
    }
  }

  // Staff guards: permit entry ONLY to calendar slots and dashboards
  if (role === 'Staff') {
    const permittedForStaff = ['/', '/calendar', '/live-class', '/chat', '/video-vault'];
    const isPermitted = permittedForStaff.some(path => currentPath === path || currentPath.startsWith(path + '/'));
    if (!isPermitted) {
      toast.error('Access Denied: Staff accounts are restricted to teaching slots and dashboards.');
      return <Navigate to="/" replace />;
    }
  }

  // Accounts Manager guards: permit entry ONLY to dashboard, calendar, students, batches, courses, reports, expenses, payroll, fee-challan
  if (role === 'accounts_manager') {
    const permittedForAccounts = ['/', '/calendar', '/students', '/batches', '/courses', '/reports', '/expenses', '/payroll', '/fee-challan'];
    const isPermitted = permittedForAccounts.some(path => currentPath === path || currentPath.startsWith(path + '/'));
    if (!isPermitted) {
      toast.error('Access Denied: Accounts Manager account is restricted to financial and reporting modules.');
      return <Navigate to="/" replace />;
    }
  }

  // Coarse-grained allowedRoles check for other roles
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    toast.error('Access Denied: Unauthorized role.');
    return <Navigate to="/" replace />;
  }

  return <Layout>{children}</Layout>;
};

// Separate component for login page to avoid hooks in AppContent
const LoginWithRedirect = () => {
  const { token, loading } = useApp();

  // Show loading while auth state is being determined
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-sm text-slate-500">Loading...</p>
      </div>
    );
  }

  return token ? <Navigate to="/" replace /> : <Login />;
};

function AppContent() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginWithRedirect />} />

        <Route path="/" element={
          <ProtectedRoute>
            <DashboardOrStudent />
          </ProtectedRoute>
        } />

        <Route path="/students" element={
          <ProtectedRoute>
            <Students />
          </ProtectedRoute>
        } />

        <Route path="/users" element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <Users />
          </ProtectedRoute>
        } />

        <Route path="/batches" element={
          <ProtectedRoute>
            <Batches />
          </ProtectedRoute>
        } />

        <Route path="/courses" element={
          <ProtectedRoute allowedRoles={['Admin', 'accounts_manager']}>
            <Courses />
          </ProtectedRoute>
        } />

        <Route path="/expenses" element={
          <ProtectedRoute allowedRoles={['Admin', 'accounts_manager']}>
            <Expenses />
          </ProtectedRoute>
        } />

        <Route path="/roles" element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <Roles />
          </ProtectedRoute>
        } />

        <Route path="/settings" element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <Settings />
          </ProtectedRoute>
        } />

        <Route path="/live-class" element={
          <ProtectedRoute allowedRoles={['Admin', 'Staff', 'Student']}>
            <LiveClass />
          </ProtectedRoute>
        } />

        <Route path="/chat" element={
          <ProtectedRoute allowedRoles={['Admin', 'Staff', 'Student']}>
            <Chat />
          </ProtectedRoute>
        } />

        <Route path="/reports" element={
          <ProtectedRoute allowedRoles={['Admin', 'Staff', 'accounts_manager']}>
            <Reports />
          </ProtectedRoute>
        } />

        <Route path="/video-vault" element={
          <ProtectedRoute allowedRoles={['Student', 'Admin', 'Staff']}>
            <VideoVault />
          </ProtectedRoute>
        } />

        <Route path="/video-vault-admin" element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <VideoVaultAdmin />
          </ProtectedRoute>
        } />

        <Route path="/calendar" element={
          <ProtectedRoute allowedRoles={['Admin', 'Staff', 'Student', 'accounts_manager']}>
            <Calendar />
          </ProtectedRoute>
        } />

        <Route path="/payroll" element={
          <ProtectedRoute allowedRoles={['Admin', 'accounts_manager']}>
            <Payroll />
          </ProtectedRoute>
        } />

        <Route path="/fee-challan" element={
          <ProtectedRoute allowedRoles={['Admin', 'Manager', 'Student', 'accounts_manager']}>
            <FeeChallanPage />
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
              fontSize: '14px',
              fontWeight: '600',
              padding: '16px 20px',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            },
            success: {
              style: {
                background: '#10B981',
                color: '#fff'
              },
              iconTheme: {
                primary: '#fff',
                secondary: '#10B981'
              }
            },
            error: {
              style: {
                background: '#EF4444',
                color: '#fff'
              },
              iconTheme: {
                primary: '#fff',
                secondary: '#EF4444'
              }
            }
          }}
        />
        <AppContent />
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;
