// src/pages/TechnicianDashboard.tsx - FINAL POLISHED MOBILE UI (v2)
import React, { useEffect, useState } from 'react';
import { styled } from '@mui/material/styles';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  Grid,
  Divider,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tab,
  Tabs,
  Alert
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import BuildIcon from '@mui/icons-material/Build';
import StarIcon from '@mui/icons-material/Star';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import DescriptionIcon from '@mui/icons-material/Description';
import { useUserStore } from '../stores/userStore';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';
import { TechnicianNavBar } from '../components/TechnicianNavBar';
import { JobSheetForm } from '../components/JobSheetForm';
import apiClient from '../api';

const PageWrapper = styled(Box)({
  backgroundColor: '#000000',
  color: 'white',
  fontFamily: "'Inter', sans-serif",
  minHeight: '100vh',
  width: '100%',
  paddingTop: '80px',
});

const DashboardContent = styled(Box)({
  padding: '24px',
  '@media (min-width: 900px)': {
    padding: '40px',
  },
  background: `linear-gradient(135deg, #0C0B09 0%, #0E0D0B 25%, #131210 50%, #0E0D0B 75%, #0C0B09 100%)`,
  position: 'relative',
});

const ContentContainer = styled(Box)({
  maxWidth: '1200px',
  margin: '0 auto',
  position: 'relative',
  zIndex: 2,
});

const StatsCard = styled(Card)({
  background: `linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)`,
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: '20px',
  transition: 'all 0.3s ease',
  backdropFilter: 'blur(20px)',
  height: '100%',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
    transform: 'translateY(-4px)',
  },
});

const TaskCard = styled(Card)({
  background: `linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)`,
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: '16px',
  marginBottom: '16px',
  transition: 'all 0.3s ease',
  backdropFilter: 'blur(20px)',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
});

const PremiumButton = styled(Button)({
  backgroundColor: 'rgba(96, 165, 250, 0.15)',
  border: '1px solid rgba(96, 165, 250, 0.3)',
  color: '#60a5fa',
  borderRadius: '12px',
  padding: '10px 16px',
  fontSize: '13px',
  fontWeight: 600,
  textTransform: 'none',
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: 'rgba(96, 165, 250, 0.25)',
    borderColor: 'rgba(96, 165, 250, 0.4)',
  },
  '&.success': {
    backgroundColor: 'rgba(46, 204, 113, 0.2)',
    borderColor: 'rgba(46, 204, 113, 0.4)',
    color: '#2ecc71',
    '&:hover': {
      backgroundColor: 'rgba(46, 204, 113, 0.3)',
    },
  },
});

const StatusChip = styled(Chip)<{ status: string }>(({ status }) => {
  const getStatusColor = () => {
    switch (status?.toLowerCase()) {
      case 'pending':
      case 'submitted':
        return { bg: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24', border: 'rgba(251, 191, 36, 0.3)' };
      case 'processing':
        return { bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: 'rgba(59, 130, 246, 0.3)' };
      case 'in_progress':
        return { bg: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6', border: 'rgba(139, 92, 246, 0.3)' };
      case 'delivered':
      case 'completed':
        return { bg: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', border: 'rgba(34, 197, 94, 0.3)' };
      default:
        return { bg: 'rgba(156, 163, 175, 0.15)', color: '#9ca3af', border: 'rgba(156, 163, 175, 0.3)' };
    }
  };

  const colors = getStatusColor();
  return {
    backgroundColor: colors.bg,
    color: colors.color,
    border: `1px solid ${colors.border}`,
    fontWeight: 600,
    fontSize: '11px',
    height: '24px',
  };
});

interface Order {
  id: number;
  customer_name: string;
  customer_phone: string;
  order_date: string;
  status: string;
  total_amount: string;
  shipping_address_details: { street_address: string; city: string; };
  items: Array<{ product_name: string; }>;
}

interface ServiceRequest {
  id: number;
  customer: { name: string; phone: string; };
  service_category: { name: string; };
  issue: { description: string; } | null;
  custom_description: string;
  service_location: { street_address: string; city: string; };
  request_date: string;
  status: string;
  has_job_sheet: boolean;
  job_sheet_status: 'PENDING' | 'APPROVED' | 'DECLINED' | null;
}

interface TechnicianStats {
  total_orders: number;
  completed_orders: number;
  total_services: number;
  completed_services: number;
  average_rating: number;
  this_month_completed: number;
}

export const TechnicianDashboard: React.FC = () => {
  const { isAuthenticated, checkAuthStatus } = useUserStore();
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();

  const [currentTab, setCurrentTab] = useState(0);
  const [orders, setOrders] = useState<Order[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [stats, setStats] = useState<TechnicianStats>({
    total_orders: 0, completed_orders: 0, total_services: 0,
    completed_services: 0, average_rating: 0, this_month_completed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, type: 'order' as 'order' | 'service', id: 0, title: '' });
  const [jobSheetFormOpen, setJobSheetFormOpen] = useState(false);
  const [selectedServiceForJobSheet, setSelectedServiceForJobSheet] = useState<ServiceRequest | null>(null);

  useEffect(() => {
    const checkTechnicianAccess = async () => {
      try {
        if (!isAuthenticated) {
          await checkAuthStatus();
          setTimeout(() => {
            const { isAuthenticated: stillIsAuthenticated, user } = useUserStore.getState();
            if (!stillIsAuthenticated || !user) {
              enqueueSnackbar('Please login to access the dashboard', { variant: 'error' });
              navigate('/login');
              return;
            }
            if (user.role !== 'TECHNICIAN') {
              setAccessDenied(true);
              enqueueSnackbar('Access denied. Technician role required.', { variant: 'error' });
              setTimeout(() => navigate('/login'), 2000);
              return;
            }
            setAuthChecking(false);
            fetchDashboardData();
          }, 500);
        } else {
          const { user } = useUserStore.getState();
          if (user?.role !== 'TECHNICIAN') {
            setAccessDenied(true);
            enqueueSnackbar('Access denied. Technician role required.', { variant: 'error' });
            setTimeout(() => navigate('/login'), 2000);
            return;
          }
          setAuthChecking(false);
          fetchDashboardData();
        }
      } catch (error) {
        setAuthChecking(false);
        enqueueSnackbar('Authentication error', { variant: 'error' });
        navigate('/login');
      }
    };
    checkTechnicianAccess();
  }, [isAuthenticated, checkAuthStatus, enqueueSnackbar, navigate]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [ordersRes, servicesRes, statsRes] = await Promise.all([
        apiClient.get('/api/technician/assigned-orders/'),
        apiClient.get('/api/technician/assigned-services/'),
        apiClient.get('/api/technician/stats/'),
      ]);
      setOrders(ordersRes.data);
      setServiceRequests(servicesRes.data);
      setStats(statsRes.data);
    } catch (error) {
      enqueueSnackbar('Failed to load dashboard data', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (type: 'order' | 'service', id: number) => {
    const url = type === 'order'
      ? `/api/technician/complete-order/${id}/`
      : `/api/service-requests/${id}/complete/`;
    const successMessage = type === 'order' ? 'Order marked as delivered!' : 'Service marked as completed!';
    const errorMessage = type === 'order' ? 'Failed to complete order' : 'Failed to complete service';

    try {
      await apiClient.patch(url);
      enqueueSnackbar(successMessage, { variant: 'success' });
      fetchDashboardData();
    } catch (error: any) {
      enqueueSnackbar(error.response?.data?.error || errorMessage, { variant: 'error' });
    }
  };

  const openConfirmDialog = (type: 'order' | 'service', id: number, title: string) => {
    setConfirmDialog({ open: true, type, id, title });
  };

  const handleConfirm = () => {
    handleUpdateStatus(confirmDialog.type, confirmDialog.id);
    setConfirmDialog({ open: false, type: 'order', id: 0, title: '' });
  };

  const renderLoadingSkeleton = () => (
    <PageWrapper>
      <TechnicianNavBar />
      <DashboardContent>
        <Typography>Verifying access...</Typography>
        <LinearProgress sx={{ mt: 2, backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
      </DashboardContent>
    </PageWrapper>
  );

  const renderAccessDenied = () => (
    <PageWrapper>
      <TechnicianNavBar />
      <DashboardContent>
        <Alert severity="error" sx={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
          <Typography variant="h6">Access Denied</Typography>
          <Typography>Redirecting to login...</Typography>
        </Alert>
      </DashboardContent>
    </PageWrapper>
  );

  if (authChecking || loading) return renderLoadingSkeleton();
  if (accessDenied) return renderAccessDenied();

  const statsItems = [
    { icon: AssignmentIcon, value: stats.total_orders + stats.total_services, label: 'Total Assigned', color: '#60a5fa' },
    { icon: CheckCircleIcon, value: stats.completed_orders + stats.completed_services, label: 'Completed', color: '#2ecc71' },
    { icon: StarIcon, value: stats.average_rating ? stats.average_rating.toFixed(1) : '0.0', label: 'Average Rating', color: '#fbbf24' },
    { icon: TrendingUpIcon, value: stats.this_month_completed, label: 'This Month', color: '#8b5cf6' },
  ];

  return (
    <PageWrapper>
      <TechnicianNavBar onRefresh={fetchDashboardData} />
      <DashboardContent>
        <ContentContainer>
          {/* MODIFIED: Adjusted spacing and font sizes to ensure 2x2 grid fits on mobile */}
          <Grid container spacing={{ xs: 1.5, md: 3 }} sx={{ mb: { xs: 3, md: 4 } }}>
            {statsItems.map((item, index) => (
              <Grid size={{ xs: 6, md: 3 }} key={index}>
                <StatsCard>
                  <CardContent sx={{ p: { xs: 2, md: 3 }, textAlign: 'center' }}>
                    <item.icon sx={{ fontSize: { xs: '28px', md: '48px' }, color: item.color, mb: 1 }} />
                    <Typography sx={{ color: item.color, fontWeight: 700, fontSize: { xs: '1.6rem', md: '2.5rem' }, lineHeight: 1.2 }}>
                      {item.value}
                    </Typography>
                    <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: { xs: '12px', md: '14px' }, mt: 0.5 }}>
                      {item.label}
                    </Typography>
                  </CardContent>
                </StatsCard>
              </Grid>
            ))}
          </Grid>

          <StatsCard>
            <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
              <Box sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <Tabs value={currentTab} onChange={(e, val) => setCurrentTab(val)} variant="fullWidth">
                  <Tab label={`Orders (${orders.filter(o => o.status !== 'DELIVERED').length})`} icon={<LocalShippingIcon />} iconPosition="start" />
                  <Tab label={`Services (${serviceRequests.filter(s => s.status !== 'COMPLETED').length})`} icon={<BuildIcon />} iconPosition="start" />
                </Tabs>
              </Box>

              <Box sx={{ p: { xs: 2, md: 3 } }}>
                {currentTab === 0 && (
                  orders.filter(o => o.status !== 'DELIVERED').length > 0 ? (
                    orders.filter(o => o.status !== 'DELIVERED').map((order) => (
                      <TaskCard key={order.id}>
                        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Box>
                              <Typography sx={{ color: 'white', fontWeight: 600 }}>Order #{order.id}</Typography>
                              <StatusChip label={order.status} status={order.status} size="small" />
                            </Box>
                            <Typography sx={{ color: '#60a5fa', fontWeight: 700, fontSize: '18px' }}>₹{order.total_amount}</Typography>
                          </Box>
                          <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.1)' }} />
                          <Grid container spacing={2} sx={{ mb: 2 }}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                                <PersonIcon color="action" fontSize="small" />
                                <Typography fontSize="14px">{order.customer_name}</Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <PhoneIcon color="action" fontSize="small" />
                                <Typography fontSize="14px">{order.customer_phone}</Typography>
                              </Box>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                                <LocationOnIcon color="action" fontSize="small" sx={{ mt: 0.2 }} />
                                <Typography fontSize="14px">{order.shipping_address_details.street_address}, {order.shipping_address_details.city}</Typography>
                              </Box>
                            </Grid>
                          </Grid>
                          <PremiumButton className="success" fullWidth onClick={() => openConfirmDialog('order', order.id, `Order #${order.id}`)}>
                            <CheckCircleIcon sx={{ mr: 1, fontSize: '16px' }} />
                            Mark Delivered
                          </PremiumButton>
                        </CardContent>
                      </TaskCard>
                    ))
                  ) : <Alert severity="info" sx={{ bgcolor: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>No pending orders.</Alert>
                )}

                {currentTab === 1 && (
                  serviceRequests.filter(s => s.status !== 'COMPLETED').length > 0 ? (
                    serviceRequests.filter(s => s.status !== 'COMPLETED').map((service) => (
                      <TaskCard key={service.id}>
                        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Box>
                              <Typography sx={{ color: 'white', fontWeight: 600 }}>Service #{service.id}</Typography>
                              <StatusChip label={service.status} status={service.status} size="small" />
                            </Box>
                            <Chip label={service.service_category.name} size="small" />
                          </Box>
                          <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.1)' }} />
                          <Typography color="text.secondary" fontSize="12px" sx={{ mb: 1 }}>Issue:</Typography>
                          <Typography fontSize="14px" sx={{ mb: 2 }}>{service.issue?.description || service.custom_description}</Typography>
                          <Grid container spacing={2} sx={{ mb: 2 }}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                                <PersonIcon color="action" fontSize="small" />
                                <Typography fontSize="14px">{service.customer.name}</Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <PhoneIcon color="action" fontSize="small" />
                                <Typography fontSize="14px">{service.customer.phone}</Typography>
                              </Box>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                                <LocationOnIcon color="action" fontSize="small" sx={{ mt: 0.2 }} />
                                <Typography fontSize="14px">{service.service_location.street_address}, {service.service_location.city}</Typography>
                              </Box>
                            </Grid>
                          </Grid>

                          {service.has_job_sheet && (
                            <Box sx={{
                              p: 1.5, mb: 2, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 1.5,
                              background: service.job_sheet_status === 'APPROVED' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(251, 191, 36, 0.1)',
                              border: `1px solid ${service.job_sheet_status === 'APPROVED' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(251, 191, 36, 0.3)'}`
                            }}>
                              <DescriptionIcon fontSize="small" sx={{ color: service.job_sheet_status === 'APPROVED' ? '#22c55e' : '#fbbf24' }} />
                              <Typography fontSize="13px" fontWeight="500" sx={{ color: service.job_sheet_status === 'APPROVED' ? '#22c55e' : '#fbbf24' }}>
                                Job Sheet: {service.job_sheet_status === 'APPROVED' ? '✓ Approved' : '⏳ Pending Approval'}
                              </Typography>
                            </Box>
                          )}

                          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5 }}>
                            {!service.has_job_sheet && (
                              <PremiumButton fullWidth onClick={() => { setSelectedServiceForJobSheet(service); setJobSheetFormOpen(true); }}>
                                <DescriptionIcon sx={{ mr: 1, fontSize: '16px' }} />
                                Create Job Sheet
                              </PremiumButton>
                            )}
                            <PremiumButton fullWidth className="success" onClick={() => openConfirmDialog('service', service.id, `Service #${service.id}`)}
                              disabled={!service.has_job_sheet || service.job_sheet_status !== 'APPROVED'}>
                              <CheckCircleIcon sx={{ mr: 1, fontSize: '16px' }} />
                              Mark Completed
                            </PremiumButton>
                          </Box>
                        </CardContent>
                      </TaskCard>
                    ))
                  ) : <Alert severity="info" sx={{ bgcolor: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>No pending services.</Alert>
                )}
              </Box>
            </CardContent>
          </StatsCard>
        </ContentContainer>
      </DashboardContent>

      <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ ...confirmDialog, open: false })} PaperProps={{ sx: { background: '#121212', borderRadius: '20px', color: 'white' } }}>
        <DialogTitle fontWeight={600}>Confirm Completion</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            Are you sure you want to mark {confirmDialog.title} as {confirmDialog.type === 'order' ? 'delivered' : 'completed'}?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button onClick={() => setConfirmDialog({ ...confirmDialog, open: false })} sx={{ color: 'text.secondary' }}>Cancel</Button>
          <PremiumButton className="success" onClick={handleConfirm}>
            <CheckCircleIcon sx={{ mr: 1, fontSize: '16px' }} />
            Confirm
          </PremiumButton>
        </DialogActions>
      </Dialog>

      {selectedServiceForJobSheet && (
        <JobSheetForm
          open={jobSheetFormOpen}
          onClose={() => { setJobSheetFormOpen(false); setSelectedServiceForJobSheet(null); }}
          serviceRequest={selectedServiceForJobSheet}
          onSuccess={() => { fetchDashboardData(); }}
        />
      )}
    </PageWrapper>
  );
};