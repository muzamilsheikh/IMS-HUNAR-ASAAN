import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

/**
 * RBAC permission map
 *
 * - admin   → '*' (access all routes)
 * - Staff   → allowed path list
 * - Student → allowed path list
 *
 * Comparison is case-insensitive against user.role so it works whether the
 * backend stores 'Admin', 'admin', 'Staff', 'Student', etc.
 */
const ROLE_PERMISSIONS = {
    Admin:   ['*'],
    admin:   ['*'],
    Manager: ['*'],
    Staff: [
        '/dashboard',
        '/',
        '/students',
        '/enrollments',
        '/payments',
        '/recordings',
        '/video-vault',
        '/live-class',
        '/chat',
        '/calendar',
        '/reports',
        '/profile'
    ],
    Student: [
        '/student/dashboard',
        '/student/courses',
        '/student/recordings',
        '/student/fees',
        '/video-vault',
        '/live-class',
        '/chat',
        '/profile'
    ]
};

/**
 * Where to send a user whose role does NOT have access to the requested path.
 */
const BLOCKED_REDIRECTS = {
    Student: '/student/dashboard',
    Staff:   '/dashboard',
    Manager: '/dashboard'
};

/**
 * ProtectedRoute
 *
 * Usage (standalone, replaces the inline ProtectedRoute in App.jsx):
 *
 *   <Route path="/admin-only" element={
 *     <ProtectedRoute>
 *       <AdminPage />
 *     </ProtectedRoute>
 *   } />
 *
 * Also accepts an optional `allowedRoles` prop for coarse-grained checks
 * (backwards-compatible with the existing App.jsx usage):
 *
 *   <ProtectedRoute allowedRoles={['Admin']}>…</ProtectedRoute>
 */
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    const { user, token, loading } = useApp();
    const location = useLocation();

    // ── 1. Auth state still loading — show spinner, never crash ──────────────
    if (loading) {
        return (
            <div style={{
                minHeight:      '100vh',
                display:        'flex',
                flexDirection:  'column',
                alignItems:     'center',
                justifyContent: 'center',
                background:     '#f8fafc'
            }}>
                <div style={{
                    width:        '48px',
                    height:       '48px',
                    border:       '4px solid #6366f1',
                    borderTop:    '4px solid transparent',
                    borderRadius: '50%',
                    animation:    'spin 0.8s linear infinite'
                }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <p style={{ marginTop: '16px', color: '#6b7280', fontSize: '14px' }}>Loading…</p>
            </div>
        );
    }

    // ── 2. No token → redirect to login ──────────────────────────────────────
    if (!token || !user) {
        return <Navigate to="/login" replace />;
    }

    // ── 3. Legacy allowedRoles prop check (backwards-compat with App.jsx) ────
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        const fallback = BLOCKED_REDIRECTS[user.role] || '/';
        return <Navigate to={fallback} replace />;
    }

    // ── 4. RBAC path check ────────────────────────────────────────────────────
    const currentPath       = location.pathname;
    const userPermissions   = ROLE_PERMISSIONS[user.role] || [];

    // Admin (wildcard) — all routes allowed
    if (userPermissions.includes('*')) {
        return children;
    }

    // Check if current path starts with any allowed prefix
    const hasAccess = userPermissions.some(
        (allowed) => currentPath === allowed || currentPath.startsWith(allowed + '/')
    );

    if (!hasAccess) {
        const fallback = BLOCKED_REDIRECTS[user.role] || '/';
        return <Navigate to={fallback} replace />;
    }

    // ── 5. Authorised — render children ──────────────────────────────────────
    return children;
};

export default ProtectedRoute;
