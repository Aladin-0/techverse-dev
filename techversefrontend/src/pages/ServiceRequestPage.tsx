// src/pages/ServiceRequestPage.tsx - COMPLETE MOBILE-RESPONSIVE VERSION
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import {
  Box,
  Typography,
  Button,
  TextField,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Radio,
  Alert,
  Switch
} from '@mui/material';
import BuildIcon from '@mui/icons-material/Build';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import HandymanIcon from '@mui/icons-material/Handyman';
import { useServiceStore } from '../stores/serviceStore';
import { useProductStore } from '../stores/productStore';
import { useUserStore } from '../stores/userStore';
import apiClient from '../api';
import { useSnackbar } from 'notistack';

// Main page wrapper
const PageWrapper = styled(Box)({
  backgroundColor: '#000000',
  color: 'white',
  fontFamily: "'Segoe UI', 'Roboto', sans-serif",
  minHeight: '100vh',
  width: '100%',
  // MODIFIED: Adjusted padding to account for the new fixed header
  paddingTop: '70px',
});

// MODIFIED: Header is now fixed and has responsive padding
const Header = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '15px 60px',
  background: 'rgba(10, 10, 10, 0.9)',
  backdropFilter: 'blur(10px)',
  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  zIndex: 1000,
  '@media (max-width: 768px)': {
    padding: '15px 20px',
  },
});

const BackButton = styled(Button)({
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  color: 'rgba(255, 255, 255, 0.7)',
  borderRadius: '12px',
  padding: '12px 20px',
  fontSize: '14px',
  fontWeight: 500,
  textTransform: 'none',
  transition: 'all 0.3s ease',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    transform: 'translateX(-2px)',
  },
});

const BreadcrumbText = styled(Typography)({
  fontSize: '14px',
  color: 'rgba(255, 255, 255, 0.6)',
  fontWeight: 400,
});

// REMOVED: ServiceHero, HeroTitle, HeroSubtitle styled components are no longer needed

// MODIFIED: ServiceContent now has responsive padding
const ServiceContent = styled(Box)({
  padding: '40px 60px',
  background: `linear-gradient(135deg, #000000 0%, #0a0a0a 25%, #111111 50%, #0a0a0a 75%, #000000 100%)`,
  position: 'relative',
  '@media (max-width: 768px)': {
    padding: '30px 20px',
  },
});

const ContentContainer = styled(Box)({
  maxWidth: '1200px',
  margin: '0 auto',
  position: 'relative',
  zIndex: 2,
});

const SectionTitle = styled(Typography)({
  fontSize: '24px',
  fontWeight: 600,
  color: 'rgba(255, 255, 255, 0.95)',
  marginBottom: '32px',
  background: 'linear-gradient(135deg, #ffffff, #e0e0e0)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  letterSpacing: '0.5px',
});

// MODIFIED: Adjusted grid for better fit on small screens
const ServiceGrid = styled(Box)({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: '32px',
  marginBottom: '60px',
  '@media (max-width: 768px)': {
    gridTemplateColumns: '1fr',
    gap: '24px',
  },
});

const ServiceCard = styled(Card)<{ selected?: boolean }>(({ selected }) => ({
  background: selected
    ? `linear-gradient(135deg, rgba(96, 165, 250, 0.15) 0%, rgba(96, 165, 250, 0.08) 50%, rgba(96, 165, 250, 0.15) 100%)`
    : `linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 50%, rgba(255, 255, 255, 0.05) 100%)`,
  border: selected
    ? '1px solid rgba(96, 165, 250, 0.3)'
    : '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: '20px',
  overflow: 'hidden',
  transition: 'all 0.4s cubic-bezier(0.23, 1, 0.320, 1)',
  cursor: 'pointer',
  position: 'relative',
  backdropFilter: 'blur(20px)',
  '&:hover': {
    backgroundColor: selected ? 'rgba(96, 165, 250, 0.2)' : 'rgba(255, 255, 255, 0.08)',
    borderColor: selected ? 'rgba(96, 165, 250, 0.4)' : 'rgba(255, 255, 255, 0.15)',
    transform: 'translateY(-8px) scale(1.02)',
    boxShadow: `0 25px 50px rgba(0, 0, 0, 0.5), 0 0 30px ${selected ? 'rgba(96, 165, 250, 0.2)' : 'rgba(255, 255, 255, 0.1)'}`,
  },
}));

const ServiceHeader = styled(Box)({
  padding: '24px 24px 20px',
  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
});

const ServiceIcon = styled(Box)({
  width: '56px',
  height: '56px',
  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
  borderRadius: '16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  '& .MuiSvgIcon-root': {
    fontSize: '28px',
    color: 'rgba(255, 255, 255, 0.8)',
  },
});

const ServiceInfo = styled(Box)({
  flex: 1,
});

const ServiceName = styled(Typography)({
  fontSize: '18px',
  fontWeight: 600,
  color: 'rgba(255, 255, 255, 0.95)',
  marginBottom: '4px',
  lineHeight: 1.3,
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
});

const ServicePrice = styled(Chip)({
  backgroundColor: 'rgba(96, 165, 250, 0.15)',
  color: '#60a5fa',
  border: '1px solid rgba(96, 165, 250, 0.3)',
  fontSize: '14px',
  fontWeight: 600,
  height: '32px',
});

const CustomServiceCard = styled(ServiceCard)({
  background: `linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.05) 50%, rgba(139, 92, 246, 0.1) 100%)`,
  border: '1px solid rgba(139, 92, 246, 0.2)',
  '&:hover': {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
});

const AddressSection = styled(Card)({
  background: `linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 50%, rgba(255, 255, 255, 0.05) 100%)`,
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: '20px',
  marginBottom: '32px',
  backdropFilter: 'blur(20px)',
});

const SectionHeader = styled(Box)({
  padding: '24px 32px 20px',
  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
});

const SectionHeaderTitle = styled(Typography)({
  fontSize: '20px',
  fontWeight: 600,
  color: 'rgba(255, 255, 255, 0.95)',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  '& .MuiSvgIcon-root': {
    fontSize: '24px',
    color: 'rgba(255, 255, 255, 0.7)',
  },
});

const PremiumButton = styled(Button)({
  backgroundColor: 'rgba(255, 255, 255, 0.08)',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  color: 'rgba(255, 255, 255, 0.9)',
  borderRadius: '12px',
  padding: '12px 20px',
  fontSize: '13px',
  fontWeight: 600,
  textTransform: 'none',
  backdropFilter: 'blur(10px)',
  transition: 'all 0.3s cubic-bezier(0.23, 1, 0.320, 1)',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderColor: 'rgba(255, 255, 255, 0.25)',
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 20px rgba(255, 255, 255, 0.1)',
  },
  '&.primary': {
    backgroundColor: 'rgba(96, 165, 250, 0.15)',
    borderColor: 'rgba(96, 165, 250, 0.3)',
    color: '#60a5fa',
    '&:hover': {
      backgroundColor: 'rgba(96, 165, 250, 0.25)',
      borderColor: 'rgba(96, 165, 250, 0.4)',
      boxShadow: '0 8px 20px rgba(96, 165, 250, 0.2)',
    },
  },
  '&:disabled': {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    color: 'rgba(255, 255, 255, 0.4)',
    cursor: 'not-allowed',
  },
});

const PremiumTextField = styled(TextField)({
  width: '100%',
  '& .MuiOutlinedInput-root': {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '12px',
    color: 'white',
    backdropFilter: 'blur(10px)',
    transition: 'all 0.3s cubic-bezier(0.23, 1, 0.320, 1)',
    '& fieldset': {
      border: 'none',
    },
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.06)',
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    '&.Mui-focused': {
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      borderColor: 'rgba(255, 255, 255, 0.3)',
      boxShadow: '0 0 0 4px rgba(255, 255, 255, 0.1)',
    },
  },
  '& .MuiInputBase-input': {
    color: 'white',
    fontSize: '14px',
    fontWeight: 400,
    '&::placeholder': {
      color: 'rgba(255, 255, 255, 0.4)',
    },
  },
  '& .MuiInputLabel-root': {
    color: 'rgba(255, 255, 255, 0.6)',
    '&.Mui-focused': {
      color: 'rgba(255, 255, 255, 0.9)',
    },
  },
});

const AddressCard = styled(Box)<{ selected?: boolean }>(({ selected }) => ({
  padding: '16px',
  backgroundColor: selected ? 'rgba(96, 165, 250, 0.1)' : 'transparent',
  border: `1px solid ${selected ? 'rgba(96, 165, 250, 0.3)' : 'rgba(255, 255, 255, 0.05)'}`,
  borderRadius: '12px',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  marginBottom: '12px',
  '&:hover': {
    backgroundColor: selected ? 'rgba(96, 165, 250, 0.15)' : 'rgba(255, 255, 255, 0.02)',
    borderColor: selected ? 'rgba(96, 165, 250, 0.4)' : 'rgba(255, 255, 255, 0.1)',
  },
}));

const PremiumDialog = styled(Dialog)({
  '& .MuiDialog-paper': {
    background: `linear-gradient(135deg, rgba(20, 20, 20, 0.95) 0%, rgba(10, 10, 10, 0.98) 100%)`,
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '20px',
    color: 'white',
    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
  },
  '& .MuiDialogTitle-root': {
    color: 'rgba(255, 255, 255, 0.95)',
    fontSize: '20px',
    fontWeight: 600,
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    paddingBottom: '16px',
  },
});

interface ServiceIssue {
  id: number;
  description: string;
  price: string;
}

interface ServiceCategory {
  id: number;
  name: string;
  issues: ServiceIssue[];
  is_free_for_user?: boolean;
}

interface Address {
  id: number;
  street_address: string;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
}

export const ServiceRequestPage: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const { categories, fetchCategories } = useServiceStore();
  const { addresses, fetchAddresses } = useProductStore();
  const { user } = useUserStore();

  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState<ServiceIssue | null>(null);
  const [customDescription, setCustomDescription] = useState('');
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [showAddressDialog, setShowAddressDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isCustomSelected, setIsCustomSelected] = useState(false);

  const [addressForm, setAddressForm] = useState({
    street_address: '',
    city: '',
    state: '',
    pincode: '',
    is_default: false
  });

  // REMOVED: heroAnimation hook is no longer needed

  const category = categories.find(cat => cat.id === parseInt(categoryId || ''));

  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchCategories();
        await fetchAddresses();
      } catch (error) {
        console.error('Error loading data:', error);
      }
      setLoading(false);
    };
    loadData();
  }, [fetchCategories, fetchAddresses]);

  useEffect(() => {
    const defaultAddress = addresses.find(addr => addr.is_default);
    if (defaultAddress && !selectedAddress) {
      setSelectedAddress(defaultAddress.id.toString());
    }
  }, [addresses, selectedAddress]);

  const handleIssueSelect = (issue: ServiceIssue) => {
    setSelectedIssue(issue);
    setCustomDescription('');
    setIsCustomSelected(false);
  };

  const handleCustomIssue = () => {
    setSelectedIssue(null);
    setIsCustomSelected(true);
  };

  const handleAddAddress = async () => {
    if (!addressForm.street_address.trim() || !addressForm.city.trim() ||
      !addressForm.state.trim() || !addressForm.pincode.trim()) {
      enqueueSnackbar('Please fill all address fields', { variant: 'error' });
      return;
    }

    try {
      const response = await apiClient.post('/api/addresses/create/', addressForm);
      await fetchAddresses();
      setSelectedAddress(response.data.id.toString());
      setShowAddressDialog(false);
      setAddressForm({ street_address: '', city: '', state: '', pincode: '', is_default: false });
      enqueueSnackbar('Address added successfully!', { variant: 'success' });
    } catch (error) {
      console.error('Failed to add address:', error);
      enqueueSnackbar('Failed to add address', { variant: 'error' });
    }
  };

  const handleSubmitRequest = async () => {
    if (!selectedIssue && !customDescription.trim()) {
      enqueueSnackbar('Please select an issue or provide a description', { variant: 'error' });
      return;
    }

    if (!selectedAddress) {
      enqueueSnackbar('Please select a service location', { variant: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      const requestData = {
        service_category: categoryId,
        issue: selectedIssue ? selectedIssue.id : null,
        custom_description: selectedIssue ? '' : customDescription,
        service_location: selectedAddress,
      };

      const response = await apiClient.post('/api/requests/create/', requestData);
      const serviceRequestId = response.data.id;

      if (category?.is_free_for_user) {
        enqueueSnackbar('Service request submitted successfully!', { variant: 'success' });
        navigate('/services', {
          state: { message: 'Service request submitted successfully! We will contact you within 24 hours.' }
        });
      } else {
        // Initiate PhonePe Payment
        const paymentResponse = await apiClient.post('/api/payments/initiate/', {
          service_request_id: serviceRequestId
        });

        if (paymentResponse.data.redirect_url) {
          window.location.href = paymentResponse.data.redirect_url;
        } else {
          throw new Error('Invalid payment response');
        }
      }

    } catch (error) {
      console.error('Failed to submit service request:', error);
      enqueueSnackbar('Failed to submit service request', { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const isFormValid = () => {
    return (selectedIssue || customDescription.trim()) && selectedAddress;
  };

  if (!category) {
    return (
      <PageWrapper>
        <Header>
          <BackButton onClick={() => navigate('/services')}>
            <ArrowBackIcon sx={{ fontSize: '16px' }} />
            Back to Services
          </BackButton>
        </Header>
        <ServiceContent>
          <Typography variant="h4" sx={{ textAlign: 'center', color: 'white' }}>Service Category Not Found</Typography>
          <Typography sx={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', mt: 2, mb: 3 }}>The requested service category could not be found.</Typography>
          <Box sx={{ textAlign: 'center' }}>
            <PremiumButton onClick={() => navigate('/services')}>
              Back to Services
            </PremiumButton>
          </Box>
        </ServiceContent>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <Header>
        <BackButton onClick={() => navigate('/services')}>
          <ArrowBackIcon sx={{ fontSize: '16px' }} />
          Back to Services
        </BackButton>
      </Header>

      {/* REMOVED: The ServiceHero JSX block has been deleted */}

      <ServiceContent>
        <ContentContainer>
          <SectionTitle sx={{ textAlign: 'center' }}>
            Request Service: {category.name}
          </SectionTitle>
          <Typography sx={{
            fontSize: '16px',
            color: 'rgba(255, 255, 255, 0.65)',
            fontWeight: 300,
            mb: 5,
            letterSpacing: '0.1px',
            maxWidth: '600px',
            textAlign: 'center',
            margin: '0 auto 40px'
          }}>
            Select an issue you're experiencing or describe it yourself. Our expert technicians are here to help.
          </Typography>

          {category.is_free_for_user && (
            <Alert
              icon={<CheckCircleIcon />}
              severity="success"
              sx={{
                mb: 3,
                backgroundColor: 'rgba(34, 197, 94, 0.15)',
                color: '#22c55e',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: '16px',
                '& .MuiAlert-icon': { color: '#22c55e' },
                '& .MuiAlert-message': {
                  fontSize: '14px',
                  fontWeight: 500
                }
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                🎉 AMC Benefit Active!
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                All services in this category are FREE for you as an AMC customer.
                No service charges will be applied!
              </Typography>
            </Alert>
          )}

          <SectionTitle>Available Repair Services</SectionTitle>

          <ServiceGrid>
            {loading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <Box key={index}>Loading...</Box>
              ))
            ) : (
              <>
                {category.issues.map((issue) => {
                  const isFreeService = category.is_free_for_user === true;

                  return (
                    <ServiceCard
                      key={issue.id}
                      selected={selectedIssue?.id === issue.id}
                      onClick={() => handleIssueSelect(issue)}
                    >
                      <ServiceHeader>
                        <ServiceIcon>
                          <HandymanIcon />
                        </ServiceIcon>
                        <ServiceInfo>
                          <ServiceName>
                            {issue.description}
                            {isFreeService && (
                              <Chip
                                label="FREE"
                                size="small"
                                sx={{
                                  ml: 1,
                                  backgroundColor: 'rgba(34, 197, 94, 0.15)',
                                  color: '#22c55e',
                                  border: '1px solid rgba(34, 197, 94, 0.3)',
                                  fontWeight: 700,
                                  fontSize: '11px',
                                  height: '22px'
                                }}
                              />
                            )}
                          </ServiceName>
                          <ServicePrice
                            label={isFreeService ? 'FREE for AMC' : `₹${issue.price}`}
                            sx={isFreeService ? {
                              backgroundColor: 'rgba(34, 197, 94, 0.15)',
                              color: '#22c55e',
                              border: '1px solid rgba(34, 197, 94, 0.3)'
                            } : {}}
                          />
                        </ServiceInfo>
                        <Radio
                          checked={selectedIssue?.id === issue.id}
                          onChange={() => handleIssueSelect(issue)}
                          sx={{
                            color: 'rgba(255, 255, 255, 0.6)',
                            '&.Mui-checked': {
                              color: '#60a5fa',
                            },
                          }}
                        />
                      </ServiceHeader>
                    </ServiceCard>
                  );
                })}

                <CustomServiceCard
                  selected={isCustomSelected}
                  onClick={handleCustomIssue}
                >
                  <ServiceHeader>
                    <ServiceIcon>
                      <CurrencyRupeeIcon />
                    </ServiceIcon>
                    <ServiceInfo>
                      <ServiceName>Custom Issue</ServiceName>
                      <ServicePrice
                        label="Quote on Request"
                        sx={{
                          backgroundColor: 'rgba(139, 92, 246, 0.15)',
                          color: '#8b5cf6',
                          border: '1px solid rgba(139, 92, 246, 0.3)'
                        }}
                      />
                    </ServiceInfo>
                    <Radio
                      checked={isCustomSelected}
                      onChange={handleCustomIssue}
                      sx={{
                        color: 'rgba(255, 255, 255, 0.6)',
                        '&.Mui-checked': {
                          color: '#8b5cf6',
                        },
                      }}
                    />
                  </ServiceHeader>
                  {isCustomSelected && (
                    <CardContent sx={{ pt: 0, pb: 3, px: 3 }}>
                      <PremiumTextField
                        label="Describe your issue"
                        multiline
                        rows={4}
                        value={customDescription}
                        onChange={(e) => setCustomDescription(e.target.value)}
                        placeholder="Please describe the problem you're experiencing in detail..."
                        required
                      />
                    </CardContent>
                  )}
                </CustomServiceCard>
              </>
            )}
          </ServiceGrid>

          <AddressSection>
            <SectionHeader>
              <SectionHeaderTitle>
                <LocationOnIcon />
                Service Location
              </SectionHeaderTitle>
              <PremiumButton onClick={() => setShowAddressDialog(true)}>
                <AddIcon sx={{ mr: 1, fontSize: '16px' }} />
                Add Address
              </PremiumButton>
            </SectionHeader>

            <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
              {addresses.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <LocationOnIcon sx={{ fontSize: '48px', color: 'rgba(255, 255, 255, 0.3)', mb: 2 }} />
                  <Typography sx={{ color: 'rgba(255, 255, 255, 0.6)', mb: 2, fontSize: '18px', fontWeight: 500 }}>
                    No addresses found
                  </Typography>
                  <Typography sx={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '14px', mb: 3 }}>
                    Please add a service location to continue
                  </Typography>
                  <PremiumButton className="primary" onClick={() => setShowAddressDialog(true)}>
                    <AddIcon sx={{ mr: 1, fontSize: '16px' }} />
                    Add Address
                  </PremiumButton>
                </Box>
              ) : (
                <>
                  <Typography sx={{
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: '14px',
                    mb: 3,
                    fontWeight: 400
                  }}>
                    Select where you'd like our technician to provide the service:
                  </Typography>
                  <Grid container spacing={2}>
                    {addresses.map((address) => (
                      <Grid xs={12} md={6} key={address.id}>
                        <AddressCard
                          selected={selectedAddress === address.id.toString()}
                          onClick={() => setSelectedAddress(address.id.toString())}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                            <Radio
                              checked={selectedAddress === address.id.toString()}
                              onChange={() => setSelectedAddress(address.id.toString())}
                              sx={{
                                color: 'rgba(255, 255, 255, 0.6)',
                                '&.Mui-checked': {
                                  color: '#60a5fa',
                                },
                                mt: 0.5
                              }}
                            />

                            <Box sx={{ flex: 1 }}>
                              {address.is_default && (
                                <Chip
                                  label="Default"
                                  size="small"
                                  sx={{
                                    mb: 1,
                                    backgroundColor: 'rgba(34, 197, 94, 0.15)',
                                    color: '#22c55e',
                                    border: '1px solid rgba(34, 197, 94, 0.3)',
                                    fontSize: '11px',
                                    height: '24px'
                                  }}
                                />
                              )}

                              <Typography sx={{ color: 'white', fontWeight: 500, mb: 0.5, fontSize: '15px' }}>
                                {address.street_address}
                              </Typography>

                              <Typography sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '13px' }}>
                                {address.city}, {address.state} - {address.pincode}
                              </Typography>
                            </Box>
                          </Box>
                        </AddressCard>
                      </Grid>
                    ))}
                  </Grid>
                </>
              )}
            </CardContent>
          </AddressSection>

          <Box sx={{
            background: `linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 50%, rgba(255, 255, 255, 0.05) 100%)`,
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '20px',
            padding: { xs: '24px', md: '32px' },
            textAlign: 'center',
            backdropFilter: 'blur(20px)',
          }}>
            <Typography sx={{
              fontSize: '20px',
              fontWeight: 600,
              color: 'rgba(255, 255, 255, 0.95)',
              mb: 2
            }}>
              Ready to Submit Your Request?
            </Typography>

            <Typography sx={{
              fontSize: '14px',
              color: 'rgba(255, 255, 255, 0.6)',
              mb: 3,
              maxWidth: '500px',
              margin: '0 auto 24px'
            }}>
              Our expert technician will contact you within 24 hours to schedule the service.
            </Typography>

            {/* MODIFIED: Button container is now responsive */}
            <Box sx={{
              display: 'flex',
              justifyContent: 'center',
              gap: 2,
              flexDirection: { xs: 'column-reverse', sm: 'row' },
              '& .MuiButton-root': {
                width: { xs: '100%', sm: 'auto' },
              }
            }}>
              <PremiumButton
                onClick={() => navigate('/services')}
                sx={{ minWidth: { sm: '140px' } }}
              >
                <ArrowBackIcon sx={{ mr: 1, fontSize: '16px' }} />
                Back
              </PremiumButton>

              <PremiumButton
                className="primary"
                onClick={handleSubmitRequest}
                disabled={submitting || !isFormValid()}
                sx={{ minWidth: { sm: '200px' } }}
              >
                {submitting ? 'Submitting...' : (
                  <>
                    <CheckCircleIcon sx={{ mr: 1, fontSize: '16px' }} />
                    Submit Request
                  </>
                )}
              </PremiumButton>
            </Box>
          </Box>

          {isFormValid() && (
            <Alert
              icon={<CheckCircleIcon />}
              severity="info"
              sx={{
                mt: 3,
                backgroundColor: 'rgba(96, 165, 250, 0.15)',
                color: '#60a5fa',
                border: '1px solid rgba(96, 165, 250, 0.3)',
                borderRadius: '16px',
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                Request Ready
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                Service: {selectedIssue ? selectedIssue.description : 'Custom'} |
                Location: {addresses.find(a => a.id.toString() === selectedAddress)?.city || 'Selected'}
                {selectedIssue && !category.is_free_for_user && ` | Price: ₹${selectedIssue.price}`}
                {category.is_free_for_user && ` | FREE Service`}
              </Typography>
            </Alert>
          )}
        </ContentContainer>
      </ServiceContent>

      <PremiumDialog
        open={showAddressDialog}
        onClose={() => !submitting && setShowAddressDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <LocationOnIcon sx={{ color: '#60a5fa' }} />
            Add New Service Address
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', mb: 3 }}>
            Add the address where you'd like our technician to provide the service.
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <PremiumTextField
              label="Street Address"
              value={addressForm.street_address}
              onChange={(e) => setAddressForm({ ...addressForm, street_address: e.target.value })}
              fullWidth
              required
              placeholder="Enter your complete street address"
            />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <PremiumTextField
                  label="City"
                  value={addressForm.city}
                  onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                  fullWidth
                  required
                  placeholder="City name"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <PremiumTextField
                  label="State"
                  value={addressForm.state}
                  onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                  fullWidth
                  required
                  placeholder="State name"
                />
              </Grid>
            </Grid>

            <PremiumTextField
              label="Pincode"
              value={addressForm.pincode}
              onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
              fullWidth
              required
              placeholder="6-digit pincode"
              inputProps={{ maxLength: 6 }}
            />

            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 2,
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <Box>
                <Typography sx={{ color: 'white', fontWeight: 500, fontSize: '14px' }}>
                  Set as default address
                </Typography>
                <Typography sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px' }}>
                  Use this address for future service requests
                </Typography>
              </Box>
              <Switch
                checked={addressForm.is_default}
                onChange={(e) => setAddressForm({ ...addressForm, is_default: e.target.checked })}
                sx={{
                  '& .MuiSwitch-track': {
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  },
                  '& .MuiSwitch-thumb': {
                    backgroundColor: '#60a5fa',
                  },
                }}
              />
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button
            onClick={() => setShowAddressDialog(false)}
            disabled={submitting}
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)' }
            }}
          >
            Cancel
          </Button>

          <PremiumButton
            className="primary"
            onClick={handleAddAddress}
            disabled={!addressForm.street_address.trim() || !addressForm.city.trim() ||
              !addressForm.state.trim() || !addressForm.pincode.trim()}
          >
            <AddIcon sx={{ mr: 1, fontSize: '16px' }} />
            Add Address
          </PremiumButton>
        </DialogActions>
      </PremiumDialog>
    </PageWrapper>
  );
};