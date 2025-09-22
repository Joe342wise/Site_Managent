import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Pages
import LoginPage from './pages/Login';
import ForgotPasswordPage from './pages/ForgotPassword';
import DashboardPage from './pages/Dashboard';
import SitesPage from './pages/Sites';
import EstimatesPage from './pages/Estimates';
import EstimateDetails from './pages/EstimateDetails';
import ActualsPage from './pages/Actuals';
import ActualDetailPage from './pages/ActualDetail';
import VariancePage from './pages/Variance';
import VarianceDetailPage from './pages/VarianceDetail';
import ReportsPage from './pages/Reports';
import ProfilePage from './pages/Profile';

// Components
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
};

// Public Route component (for login page)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <ForgotPasswordPage />
            </PublicRoute>
          }
        />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sites"
          element={
            <ProtectedRoute>
              <SitesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/estimates"
          element={
            <ProtectedRoute>
              <EstimatesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/estimates/:estimateId"
          element={
            <ProtectedRoute>
              <EstimateDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/actuals"
          element={
            <ProtectedRoute>
              <ActualsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/actuals/:estimateId"
          element={
            <ProtectedRoute>
              <ActualDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/variance"
          element={
            <ProtectedRoute>
              <VariancePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/variance/:estimateId"
          element={
            <ProtectedRoute>
              <VarianceDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <ReportsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="App">
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                style: {
                  background: '#10B981',
                },
              },
              error: {
                style: {
                  background: '#EF4444',
                },
              },
            }}
          />
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;