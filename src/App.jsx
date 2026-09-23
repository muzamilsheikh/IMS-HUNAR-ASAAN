import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { AppProvider, useApp } from './context/AppContext';
import Layout from './components/layout/Layout';
import ErrorBoundary from './components/layout/ErrorBoundary';

// Eagerly loaded — must be available instantly
import Login from './pages/Login';
import FeeChallanPage from './pages/FeeChallanPage';

// Lazily loaded — split into separate chunks for faster initial boot
const Dashboard        = lazy(() => import('./pages/Dashboard'));
const Students         = lazy(() => import('./pages/Students'));
const Courses          = lazy(() => import('./pages/Courses'));
const Expenses         = lazy(() => import('./pages/Expenses'));
const Batches          = lazy(() => import('./pages/Batches'));
const Roles            = lazy(() => import('./pages/Roles'));
const Settings         = lazy(() => import('./pages/Settings'));
const LiveClass        = lazy(() => import('./pages/LiveClass'));
const Chat             = lazy(() => import('./pages/Chat'));
const Reports          = lazy(() => import('./pages/Reports'));
const Users            = lazy(() => import('./pages/Users'));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const VideoVault       = lazy(() => import('./pages/VideoVault'));
const VideoVaultAdmin  = lazy(() => import('./pages/VideoVaultAdmin'));
const Calendar         = lazy(() => import('./pages/Calendar'));
const StaffDashboard   = lazy(() => import('./pages/StaffDashboard'));
const Payroll          = lazy(() => import('./pages/Payroll'));

// Shared route-level loading fallback
const PageLoader = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Loading Module...</p>
  </div>
);

// Component to decide which dashboard to show based on user role
const DashboardOrStudent = () => {
  const { user } = useApp();
  const role = user?.role ? user.role.toLowerCase().trim() : '';
  if (role === 'student') return <StudentDashboard />;
  if (role === 'staff') return <StaffDashboard />;
  return <Dashboard />;
};

const ROUTE_PERMISSIONS = {
  '/calendar': 'viewCalendar',
  '/students': 'viewStudentList',
  '/users': 'manageUsers',
  '/batches': 'viewCreateBatches',
  '/courses': 'viewManageCourses',
  '/expenses': 'manageExpenses',
  '/payroll': 'viewPayroll',
  '/reports': 'accessReports',
  '/roles': 'accessSettings',
  '/live-class': 'liveClassAccess',
  '/chat': 'viewChat',
  '/fee-challan': 'viewChallans',
  '/settings': 'accessSettings',
  '/video-vault-admin': 'videoVaultAdmin'
};

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { token, user, loading, hasPermission } = useApp();

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

  const role = user?.role ? user.role.toLowerCase().trim() : '';
  const currentPath = window.location.pathname;

  // Match current route to required permission key
  const matchedRoute = Object.keys(ROUTE_PERMISSIONS).find(
    path => currentPath === path || currentPath.startsWith(path + '/')
  );

  if (matchedRoute) {
    const requiredPerm = ROUTE_PERMISSIONS[matchedRoute];
    if (!hasPermission(requiredPerm)) {
      toast.error('Access Denied: You do not have permission for this section.');
      return <Navigate to="/" replace />;
    }
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
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<LoginWithRedirect />} />

          <Route path="/" element={
            <ProtectedRoute>
              <DashboardOrStudent />
            </ProtectedRoute>
          } />

          <Route path="/students" element={
            <ProtectedRoute allowedRoles={['Admin', 'admin', 'Manager', 'manager', 'accounts_manager']}>
              <Students />
            </ProtectedRoute>
          } />

          <Route path="/users" element={
            <ProtectedRoute allowedRoles={['Admin', 'admin']}>
              <Users />
            </ProtectedRoute>
          } />

          <Route path="/batches" element={
            <ProtectedRoute allowedRoles={['Admin', 'admin', 'Manager', 'manager', 'accounts_manager', 'Staff', 'staff']}>
              <Batches />
            </ProtectedRoute>
          } />

          <Route path="/courses" element={
            <ProtectedRoute allowedRoles={['Admin', 'admin', 'Manager', 'manager', 'accounts_manager']}>
              <Courses />
            </ProtectedRoute>
          } />

          <Route path="/expenses" element={
            <ProtectedRoute allowedRoles={['Admin', 'admin', 'Manager', 'manager', 'accounts_manager']}>
              <Expenses />
            </ProtectedRoute>
          } />

          <Route path="/roles" element={
            <ProtectedRoute allowedRoles={['Admin', 'admin']}>
              <Roles />
            </ProtectedRoute>
          } />

          <Route path="/settings" element={
            <ProtectedRoute allowedRoles={['Admin', 'admin']}>
              <Settings />
            </ProtectedRoute>
          } />

          <Route path="/live-class" element={
            <ProtectedRoute allowedRoles={['Admin', 'admin', 'Manager', 'manager', 'Staff', 'staff', 'Student', 'student']}>
              <LiveClass />
            </ProtectedRoute>
          } />

          <Route path="/chat" element={
            <ProtectedRoute allowedRoles={['Admin', 'admin', 'Manager', 'manager', 'Staff', 'staff', 'Student', 'student']}>
              <Chat />
            </ProtectedRoute>
          } />

          <Route path="/reports" element={
            <ProtectedRoute allowedRoles={['Admin', 'admin', 'Manager', 'manager', 'accounts_manager']}>
              <Reports />
            </ProtectedRoute>
          } />

          <Route path="/video-vault" element={
            <ProtectedRoute allowedRoles={['Student', 'student', 'Admin', 'admin', 'Staff', 'staff', 'Manager', 'manager']}>
              <VideoVault />
            </ProtectedRoute>
          } />

          <Route path="/video-vault-admin" element={
            <ProtectedRoute allowedRoles={['Admin', 'admin']}>
              <VideoVaultAdmin />
            </ProtectedRoute>
          } />

          <Route path="/calendar" element={
            <ProtectedRoute allowedRoles={['Admin', 'admin', 'Manager', 'manager', 'Staff', 'staff', 'Student', 'student', 'accounts_manager']}>
              <Calendar />
            </ProtectedRoute>
          } />

          <Route path="/payroll" element={
            <ProtectedRoute allowedRoles={['Admin', 'admin', 'Manager', 'manager', 'accounts_manager']}>
              <Payroll />
            </ProtectedRoute>
          } />

          <Route path="/fee-challan" element={
            <ProtectedRoute allowedRoles={['Admin', 'admin', 'Manager', 'manager', 'Student', 'student', 'accounts_manager']}>
              <FeeChallanPage />
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
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
