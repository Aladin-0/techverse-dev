// src/App.tsx - Optimized with React.lazy and Suspense
import React, { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useUserStore } from './stores/userStore';
import { useCartStore } from './stores/cartStore';
import { LoginSuccessHandler } from './components/LoginSuccessHandler';
import { ShoppingCart } from './components/ShoppingCart';
import { NavBar } from './components/NavBar';
import { Footer } from './components/Footer';
import { ChatbotWidget } from './components/ChatbotWidget';
import ScrollToTop from './components/ScrollToTop';
import { Box, CircularProgress, Typography } from '@mui/material';
import { ComparisonBar } from './components/ComparisonBar';
import { AffiliateHandler } from './components/AffiliateHandler';

// Lazy loading components
// Default exports
const LandingPage = lazy(() => import('./pages/LandingPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const PaymentRedirectPage = lazy(() => import('./pages/PaymentRedirectPage'));

// Named exports (need adapter)
const StorePage = lazy(() => import('./pages/StorePage').then(module => ({ default: module.StorePage })));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage').then(module => ({ default: module.ProductDetailPage })));
const ServiceCategoryPage = lazy(() => import('./pages/ServiceCategoryPage').then(module => ({ default: module.ServiceCategoryPage })));
const ServiceRequestPage = lazy(() => import('./pages/ServiceRequestPage').then(module => ({ default: module.ServiceRequestPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then(module => ({ default: module.LoginPage })));
const UserProfilePage = lazy(() => import('./pages/UserProfilePage').then(module => ({ default: module.UserProfilePage })));
const OrdersPage = lazy(() => import('./pages/OrdersPage').then(module => ({ default: module.OrdersPage })));
const ServiceHistoryPage = lazy(() => import('./pages/ServiceHistoryPage').then(module => ({ default: module.ServiceHistoryPage })));
const TechnicianDashboard = lazy(() => import('./pages/TechnicianDashboard').then(module => ({ default: module.TechnicianDashboard })));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage').then(module => ({ default: module.PrivacyPolicyPage })));
const ReturnPolicyPage = lazy(() => import('./pages/ReturnPolicyPage').then(module => ({ default: module.ReturnPolicyPage })));
const RefundPolicyPage = lazy(() => import('./pages/RefundPolicyPage').then(module => ({ default: module.RefundPolicyPage })));
const ShippingPolicyPage = lazy(() => import('./pages/ShippingPolicyPage').then(module => ({ default: module.ShippingPolicyPage })));
const ComparisonPage = lazy(() => import('./pages/ComparisonPage').then(module => ({ default: module.ComparisonPage })));
const AffiliateDashboard = lazy(() => import('./pages/AffiliateDashboard').then(module => ({ default: module.AffiliateDashboard })));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage').then(module => ({ default: module.ResetPasswordPage })));
import { TermsConditionsPage } from './pages/TermsConditionsPage';

// Loading Fallback
const PageLoader = () => (
  <Box sx={{
    height: '100vh',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAF9F5',
    color: '#1A1814'
  }}>
    <CircularProgress size={36} sx={{ color: '#1C2B4A', mb: 2 }} />
    <Typography variant="body2" sx={{ color: '#6B6156', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Loading...</Typography>
  </Box>
);

// Protected Route Component for Technicians
const TechnicianRoute = ({ children }: { children: React.ReactNode }) => {
  const user = useUserStore((state) => state.user);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'TECHNICIAN') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Protected Route Component for Non-Technicians
const CustomerRoute = ({ children }: { children: React.ReactNode }) => {
  const user = useUserStore((state) => state.user);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);

  // If user is a technician, redirect to their dashboard
  if (isAuthenticated && user && user.role === 'TECHNICIAN') {
    return <Navigate to="/technician/dashboard" replace />;
  }

  return <>{children}</>;
};

// Component that handles initial redirect for technicians
const TechnicianRedirect = () => {
  const user = useUserStore((state) => state.user);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const useNavigateRef = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // If user is authenticated and is a technician, redirect to dashboard
    if (isAuthenticated && user && user.role === 'TECHNICIAN') {
      // Only redirect if not already on technician dashboard
      if (!location.pathname.startsWith('/technician')) {
        useNavigateRef('/technician/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, user, useNavigateRef, location.pathname]);

  return null;
};

function App() {
  const checkAuthStatus = useUserStore((state) => state.checkAuthStatus);
  const user = useUserStore((state) => state.user);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const setCurrentUser = useCartStore((state) => state.setCurrentUser);
  // ✅ React Router useLocation — reactive to route changes (not window.location)
  const { pathname } = useLocation();

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  useEffect(() => {
    if (isAuthenticated && user) {
      setCurrentUser(user.id.toString());
    } else {
      setCurrentUser(null);
    }
  }, [isAuthenticated, user, setCurrentUser]);

  return (
    <>
      <ScrollToTop />
      <LoginSuccessHandler />
      <TechnicianRedirect />

      {/* Global Stitch-style navbar */}
      {(!isAuthenticated || !user || user.role !== 'TECHNICIAN') && <NavBar />}

      <main>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Login Route - Accessible to all */}
            <Route path="/login" element={<LoginPage />} />

            {/* Password Reset Confirmation - Linked from email */}
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Technician Routes - Only for technicians */}
            <Route
              path="/technician/dashboard"
              element={
                <TechnicianRoute>
                  <TechnicianDashboard />
                </TechnicianRoute>
              }
            />

            {/* Customer Routes - Redirect technicians away */}
            {/* LandingPage permanently rendered off-route to retain 50MB GPU cache \& WebGL Context. */}
            <Route path="/" element={<Box sx={{ display: 'none' }} />} />
            <Route
              path="/store"
              element={
                <CustomerRoute>
                  <StorePage />
                </CustomerRoute>
              }
            />
            <Route
              path="/product/:slug"
              element={
                <CustomerRoute>
                  <ProductDetailPage />
                </CustomerRoute>
              }
            />
            <Route
              path="/services"
              element={
                <CustomerRoute>
                  <ServiceCategoryPage />
                </CustomerRoute>
              }
            />
            <Route
              path="/services/request/:categoryId"
              element={
                <CustomerRoute>
                  <ServiceRequestPage />
                </CustomerRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <CustomerRoute>
                  <UserProfilePage />
                </CustomerRoute>
              }
            />
            <Route
              path="/my-orders"
              element={
                <CustomerRoute>
                  <OrdersPage />
                </CustomerRoute>
              }
            />
            <Route
              path="/service-history"
              element={
                <CustomerRoute>
                  <ServiceHistoryPage />
                </CustomerRoute>
              }
            />
            <Route
              path="/checkout"
              element={
                <CustomerRoute>
                  <CheckoutPage />
                </CustomerRoute>
              }
            />
            <Route
              path="/payment-redirect/:transactionId"
              element={
                <CustomerRoute>
                  <PaymentRedirectPage />
                </CustomerRoute>
              }
            />
            <Route
              path="/privacy-policy"
              element={
                <CustomerRoute>
                  <PrivacyPolicyPage />
                </CustomerRoute>
              }
            />

            <Route
              path="/return-policy"
              element={
                <CustomerRoute>
                  <ReturnPolicyPage />
                </CustomerRoute>
              }
            />
            <Route
              path="/refund-policy"
              element={
                <CustomerRoute>
                  <RefundPolicyPage />
                </CustomerRoute>
              }
            />
            <Route
              path="/shipping-policy"
              element={
                <CustomerRoute>
                  <ShippingPolicyPage />
                </CustomerRoute>
              }
            />
            <Route
              path="/terms-conditions"
              element={
                <CustomerRoute>
                  <TermsConditionsPage />
                </CustomerRoute>
              }
            />
            <Route
              path="/compare"
              element={
                <CustomerRoute>
                  <ComparisonPage />
                </CustomerRoute>
              }
            />

            {/* Affiliate Routes */}
            <Route path="/affiliate/dashboard" element={<AffiliateDashboard />} />
            <Route path="/:affiliateCode" element={<AffiliateHandler />} />

            {/* Catch all route - redirect based on user role */}
            <Route
              path="*"
              element={
                isAuthenticated && user && user.role === 'TECHNICIAN'
                  ? <Navigate to="/technician/dashboard" replace />
                  : <Navigate to="/" replace />
              }
            />
          </Routes>
        </Suspense>
        
        {/*
          THE 1000X OPTIMIZATION: 
          We permanently mount the LandingPage for customers regardless of route.
          When they visit /store, it merely hides this component. 
          The WebGL Context, 240 Scrolly Frames, and 3D Models are NEVER destroyed by the Garbage Collector!
        */}
        {(!isAuthenticated || !user || user.role !== 'TECHNICIAN') && (
          <Box sx={{ display: pathname === '/' ? 'block' : 'none', width: '100%' }}>
            <Suspense fallback={<PageLoader />}>
              <LandingPage />
            </Suspense>
          </Box>
        )}
      </main>
      
      {/* Global Shopping Cart Component */}
      <ShoppingCart />

      {/* Global Footer (Stitch exact) */}
      {(!isAuthenticated || !user || user.role !== 'TECHNICIAN') && (
        <>
          <Footer />
          {/* TechVerse AI: Home page only */}
          {pathname === '/' && <ChatbotWidget />}
          <ComparisonBar />
        </>
      )}
    </>
  );
}

export default App;