import { Navigate, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/stores/authStore';
import Layout from '@/components/Layout';

// Pages
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import AnalyticsPage from '@/pages/AnalyticsPage';
import UsersPage from '@/pages/UsersPage';
import CreateUserPage from '@/pages/CreateUserPage';
import EditUserPage from '@/pages/EditUserPage';
import ProductsPage from '@/pages/ProductsPage';
import CreateProductPage from '@/pages/CreateProductPage';
import EditProductPage from '@/pages/EditProductPage';
import OrdersPage from '@/pages/OrdersPage';
import ServicesPage from '@/pages/ServicesPage';
import EditServicePage from '@/pages/EditServicePage';
import EditServiceCategoryPage from '@/pages/EditServiceCategoryPage';
import CategoriesPage from '@/pages/CategoriesPage';
import BannersPage from '@/pages/BannersPage';
import AffiliatesPage from '@/pages/AffiliatesPage';
import CreateAffiliatePage from '@/pages/CreateAffiliatePage';
import AffiliateDetailPage from '@/pages/AffiliateDetailPage';
import JobSheetsPage from '@/pages/JobSheetsPage';
import JobSheetDetailPage from '@/pages/JobSheetDetailPage';
import SettingsPage from '@/pages/SettingsPage';

/** Spinner shown while checking auth */
function AuthLoading() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: '#0a0a0f' }}
    >
      <div
        className="h-10 w-10 animate-spin rounded-full border-4 border-t-transparent"
        style={{ borderColor: '#7c3aed transparent #7c3aed #7c3aed' }}
      />
    </div>
  );
}

/** Wraps protected routes — redirects to /login if not authenticated */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <AuthLoading />;
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}

/** All routes nested inside the Layout sidebar */
function AdminRoutes() {
  return (
    <ProtectedRoute>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />

          {/* Users */}
          <Route path="users" element={<UsersPage />} />
          <Route path="users/create" element={<CreateUserPage />} />
          <Route path="users/:id/edit" element={<EditUserPage />} />

          {/* Products */}
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/create" element={<CreateProductPage />} />
          <Route path="products/:id/edit" element={<EditProductPage />} />

          {/* Orders */}
          <Route path="orders" element={<OrdersPage />} />

          {/* Services */}
          <Route path="services" element={<ServicesPage />} />
          <Route path="services/:id/edit" element={<EditServicePage />} />
          <Route path="services/categories/:id/edit" element={<EditServiceCategoryPage />} />

          {/* Categories */}
          <Route path="categories" element={<CategoriesPage />} />

          {/* Banners */}
          <Route path="banners" element={<BannersPage />} />

          {/* Affiliates */}
          <Route path="affiliates" element={<AffiliatesPage />} />
          <Route path="affiliates/create" element={<CreateAffiliatePage />} />
          <Route path="affiliates/:id" element={<AffiliateDetailPage />} />

          {/* Job Sheets */}
          <Route path="job-sheets" element={<JobSheetsPage />} />
          <Route path="job-sheets/:id" element={<JobSheetDetailPage />} />

          {/* Settings */}
          <Route path="settings" element={<SettingsPage />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/*" element={<AdminRoutes />} />
      </Routes>
    </AuthProvider>
  );
}
