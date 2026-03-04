// src/pages/CheckoutPage.tsx - Part 1 of 2
import React, { useState, useEffect } from 'react';
import { useCartStore } from '../stores/cartStore';
import { useProductStore } from '../stores/productStore';
import { useUserStore } from '../stores/userStore';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Grid,
  Card,
  CardContent,
  Chip,
  CircularProgress
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import HomeIcon from '@mui/icons-material/Home';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { styled } from '@mui/material/styles';
import apiClient, { API_BASE_URL, getImageUrl } from '../api';

// Styled components matching your design system
const PageWrapper = styled(Box)(({ theme }) => ({
  backgroundColor: '#000000',
  color: 'white',
  fontFamily: "'Inter', sans-serif",
  minHeight: '100vh',
  width: '100%',
  paddingTop: '80px',
  [theme.breakpoints.down('sm')]: {
    paddingTop: '60px',
  },
}));

const CheckoutHero = styled(Box)(({ theme }) => ({
  background: `
    radial-gradient(ellipse 1200px 800px at 50% 20%, rgba(64, 64, 64, 0.15) 0%, transparent 50%),
    linear-gradient(135deg, #000000 0%, #111111 50%, #000000 100%)
  `,
  padding: '60px',
  textAlign: 'center',
  position: 'relative',
  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
  [theme.breakpoints.down('sm')]: {
    padding: '40px 20px',
  },
}));

const HeroTitle = styled(Typography)(({ theme }) => ({
  fontSize: '36px',
  fontWeight: 700,
  marginBottom: '16px',
  color: '#ffffff',
  background: 'linear-gradient(135deg, #ffffff, #e0e0e0)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  [theme.breakpoints.down('sm')]: {
    fontSize: '28px',
  },
}));

const CheckoutContent = styled(Box)(({ theme }) => ({
  padding: '60px',
  background: `linear-gradient(135deg, #000000 0%, #0a0a0a 25%, #111111 50%, #0a0a0a 75%, #000000 100%)`,
  position: 'relative',
  [theme.breakpoints.down('sm')]: {
    padding: '30px 20px',
  },
}));

const ContentContainer = styled(Box)({
  maxWidth: '1200px',
  margin: '0 auto',
  position: 'relative',
  zIndex: 2,
});

const SectionCard = styled(Card)({
  background: `linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)`,
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: '20px',
  marginBottom: '32px',
  backdropFilter: 'blur(20px)',
});

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontSize: '24px',
  fontWeight: 600,
  marginBottom: '24px',
  color: 'rgba(255, 255, 255, 0.95)',
  [theme.breakpoints.down('sm')]: {
    fontSize: '20px',
  },
}));

const PremiumButton = styled(Button)(({ theme }) => ({
  backgroundColor: 'rgba(96, 165, 250, 0.15)',
  border: '1px solid rgba(96, 165, 250, 0.3)',
  color: '#60a5fa',
  borderRadius: '16px',
  padding: '16px',
  fontSize: '16px',
  fontWeight: 600,
  textTransform: 'none',
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: 'rgba(96, 165, 250, 0.25)',
    borderColor: 'rgba(96, 165, 250, 0.4)',
    transform: 'translateY(-2px)',
  },
  '&:disabled': {
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
    color: 'rgba(96, 165, 250, 0.5)',
    cursor: 'not-allowed',
  },
  [theme.breakpoints.down('sm')]: {
    width: '100%',
  },
}));

const PremiumTextField = styled(TextField)({
  '& .MuiOutlinedInput-root': {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '12px',
    color: 'white',
    '& fieldset': { border: 'none' },
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.06)',
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    '&.Mui-focused': {
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
  },
  '& .MuiInputLabel-root': {
    color: 'rgba(255, 255, 255, 0.6)',
    '&.Mui-focused': { color: 'rgba(255, 255, 255, 0.9)' },
  },
  '& .MuiInputBase-input': { color: 'white' }
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

const OrderItemCard = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  padding: '16px 0',
  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
  '&:last-child': {
    borderBottom: 'none',
  },
});

const CheckoutPage: React.FC = () => {
  const { items, getTotalPrice, clearCart } = useCartStore();
  const { addresses, fetchAddresses } = useProductStore();
  const { user, isAuthenticated, checkAuthStatus } = useUserStore();

  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [profileIncomplete, setProfileIncomplete] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [orderIds, setOrderIds] = useState<number[]>([]);
  const [authChecking, setAuthChecking] = useState(true);

  // Profile completion dialog state
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [tempName, setTempName] = useState('');
  const [tempPhone, setTempPhone] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  // Enhanced authentication check
  useEffect(() => {
    const initializeCheckout = async () => {
      try {
        // If not authenticated according to store, try to check auth status
        if (!isAuthenticated || !user) {
          await checkAuthStatus();
        }

        // Give a moment for auth to update
        setTimeout(() => {
          const currentAuthState = useUserStore.getState();

          if (!currentAuthState.isAuthenticated || !currentAuthState.user) {
            window.location.href = '/login';
            return;
          }

          if (items.length === 0) {
            window.location.href = '/store';
            return;
          }

          // User is authenticated and has items, proceed with checkout
          fetchAddresses();
          checkProfileCompletion();
          setAuthChecking(false);
        }, 1000);

      } catch (error) {
        console.error('Error during checkout initialization:', error);
        setAuthChecking(false);
        window.location.href = '/login';
      }
    };

    initializeCheckout();
  }, []); // Remove dependencies to avoid infinite loop

  // Set default address
  useEffect(() => {
    const defaultAddress = addresses.find(addr => addr.is_default);
    if (defaultAddress && !selectedAddress) {
      setSelectedAddress(defaultAddress.id.toString());
    }
  }, [addresses, selectedAddress]);

  const checkProfileCompletion = async () => {
    try {
      const response = await apiClient.get('/api/users/profile/validate/');
      const { is_complete, missing_fields } = response.data;

      if (!is_complete) {
        setProfileIncomplete(true);
        setMissingFields(missing_fields);
        setTempName(user?.name || '');
        setTempPhone(user?.phone || '');
      } else {
        setProfileIncomplete(false);
        setMissingFields([]);
      }
    } catch (error) {
      console.error('Error checking profile completion:', error);
    }
  };

  const handleCompleteProfile = async () => {
    if (!tempName.trim()) {
      alert('Please enter your name');
      return;
    }

    if (!tempPhone.trim()) {
      alert('Please enter your phone number');
      return;
    }

    // Validate phone number format
    const phoneRegex = /^[+]?[\d\s\-\(\)]{10,15}$/;
    if (!phoneRegex.test(tempPhone.trim())) {
      alert('Please enter a valid phone number');
      return;
    }

    setProfileLoading(true);
    try {
      const response = await apiClient.patch('/api/users/profile/', {
        name: tempName.trim(),
        phone: tempPhone.trim()
      });

      // Update the user store with new data
      useUserStore.setState({ user: response.data });

      setProfileDialogOpen(false);
      setProfileIncomplete(false);
      setMissingFields([]);
      await checkProfileCompletion(); // Revalidate

    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    // Check profile completion first
    if (profileIncomplete) {
      if (missingFields.includes('name') || missingFields.includes('phone')) {
        setProfileDialogOpen(true);
        return;
      }

      if (missingFields.includes('address')) {
        alert('Please add a delivery address from your profile before placing an order.');
        window.location.href = '/profile';
        return;
      }
    }

    if (!selectedAddress) {
      alert('Please select a delivery address');
      return;
    }

    setLoading(true);
    try {
      // Create a single order for all cart items
      const payload = {
        address_id: selectedAddress,
        items: items.map((item) => ({
          product_slug: item.product.slug,
          quantity: item.quantity,
        })),
      };

      const response = await apiClient.post('/api/orders/create-bulk/', payload);
      const orderId = response.data.id;

      // Initiate PhonePe Payment
      const paymentResponse = await apiClient.post('/api/payments/initiate/', {
        order_id: orderId
      });

      if (paymentResponse.data.redirect_url) {
        // Clear cart before redirecting so user doesn't buy again
        clearCart();
        window.location.href = paymentResponse.data.redirect_url;
      } else {
        throw new Error('Invalid payment response');
      }

    } catch (error) {
      console.error('Order creation failed:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const totalPrice = getTotalPrice();

  // Show loading while checking authentication
  if (authChecking) {
    return (
      <PageWrapper>
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - 80px)',
          flexDirection: 'column',
          gap: 2
        }}>
          <CircularProgress sx={{ color: '#60a5fa' }} />
          <Typography sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
            Verifying authentication...
          </Typography>
        </Box>
      </PageWrapper>
    );
  }
  // Success page
  if (orderSuccess) {
    return (
      <PageWrapper>
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - 80px)',
          textAlign: 'center',
          padding: '40px',
        }}>
          <Box sx={{ maxWidth: '600px' }}>
            <CheckCircleIcon sx={{
              fontSize: '80px',
              color: '#22c55e',
              marginBottom: '24px'
            }} />

            <Typography sx={{
              fontSize: '36px',
              fontWeight: 700,
              marginBottom: '16px',
              color: '#22c55e'
            }}>
              Order Placed Successfully!
            </Typography>

            <Typography sx={{
              fontSize: '18px',
              color: 'rgba(255, 255, 255, 0.6)',
              marginBottom: '32px',
              lineHeight: 1.6
            }}>
              Thank you for your purchase! Your order{orderIds.length > 1 ? 's' : ''}
              {orderIds.length > 0 && ` (#${orderIds.join(', #')})`}
              {orderIds.length > 1 ? ' have' : ' has'} been confirmed.
              You'll receive updates via email and SMS.
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <PremiumButton onClick={() => window.location.href = '/my-orders'}>
                <ShoppingCartIcon sx={{ mr: 1 }} />
                View Orders
              </PremiumButton>

              <Button
                onClick={() => window.location.href = '/store'}
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: 'white',
                  borderRadius: '16px',
                  padding: '16px 24px',
                  fontSize: '16px',
                  fontWeight: 600,
                  textTransform: 'none',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.12)',
                  }
                }}
              >
                Continue Shopping
              </Button>
            </Box>
          </Box>
        </Box>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      {/* Header */}
      <CheckoutHero>
        <HeroTitle>Checkout</HeroTitle>
        <Typography sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '16px' }}>
          Review your order and complete your purchase
        </Typography>
      </CheckoutHero>

      {/* Profile Incomplete Warning */}
      {profileIncomplete && (
        <Box sx={{ padding: { xs: '20px', sm: '20px 60px' } }}>
          <Alert
            severity="warning"
            sx={{
              backgroundColor: 'rgba(251, 191, 36, 0.15)',
              color: '#fbbf24',
              border: '1px solid rgba(251, 191, 36, 0.3)',
              borderRadius: '12px',
              '& .MuiAlert-icon': { color: '#fbbf24' }
            }}
            icon={<WarningIcon />}
          >
            <Typography variant="h6" sx={{ mb: 1 }}>Profile Incomplete</Typography>
            <Typography sx={{ mb: 2 }}>
              Please complete your profile before placing an order. Missing: {missingFields.join(', ')}
            </Typography>

            <Box sx={{ display: 'flex', gap: 1 }}>
              {!missingFields.includes('address') && (
                <Button
                  onClick={() => setProfileDialogOpen(true)}
                  size="small"
                  sx={{
                    color: '#fbbf24',
                    textTransform: 'none',
                    fontWeight: 600,
                    border: '1px solid rgba(251, 191, 36, 0.3)',
                    '&:hover': {
                      backgroundColor: 'rgba(251, 191, 36, 0.1)',
                    }
                  }}
                >
                  Complete Now
                </Button>
              )}

              {missingFields.includes('address') && (
                <Button
                  onClick={() => window.location.href = '/profile'}
                  size="small"
                  sx={{
                    color: '#fbbf24',
                    textTransform: 'none',
                    fontWeight: 600,
                    border: '1px solid rgba(251, 191, 36, 0.3)',
                    '&:hover': {
                      backgroundColor: 'rgba(251, 191, 36, 0.1)',
                    }
                  }}
                >
                  Add Address
                </Button>
              )}
            </Box>
          </Alert>
        </Box>
      )}

      {/* Main Content */}
      <CheckoutContent>
        <ContentContainer>
          <Grid container spacing={4}>

            {/* Left Column - Order Items & Address */}
            <Grid size={{ xs: 12, lg: 8 }}>

              {/* Order Summary */}
              <SectionCard>
                <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
                  <SectionTitle>Order Summary</SectionTitle>

                  {items.map((item) => (
                    <OrderItemCard key={item.product.id}>
                      <Box sx={{
                        width: '60px',
                        height: '60px',
                        background: 'linear-gradient(135deg, #2a2a2a, #1a1a1a)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                      }}>
                        {item.product.image ? (
                          <img
                            src={getImageUrl(item.product.image)}
                            alt={item.product.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <Typography sx={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '18px' }}>
                            {item.product.name.charAt(0)}
                          </Typography>
                        )}
                      </Box>

                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ color: 'white', fontWeight: 500, mb: 0.5, fontSize: { xs: '14px', sm: '16px' } }}>
                          {item.product.name}
                        </Typography>
                        <Typography sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '14px' }}>
                          {item.product.category.name} • Quantity: {item.quantity}
                        </Typography>
                      </Box>

                      <Typography sx={{ color: '#60a5fa', fontWeight: 600, fontSize: { xs: '16px', sm: '18px' } }}>
                        ₹{(parseFloat(item.product.price) * item.quantity).toFixed(2)}
                      </Typography>
                    </OrderItemCard>
                  ))}
                </CardContent>
              </SectionCard>

              {/* Delivery Address */}
              <SectionCard>
                <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                    <SectionTitle sx={{ mb: 0 }}>
                      <HomeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Delivery Address
                    </SectionTitle>

                    {addresses.length > 0 && (
                      <Button
                        onClick={() => window.location.href = '/profile'}
                        size="small"
                        sx={{
                          color: 'rgba(255, 255, 255, 0.7)',
                          textTransform: 'none',
                          '&:hover': { color: '#60a5fa' }
                        }}
                      >
                        Manage Addresses
                      </Button>
                    )}
                  </Box>

                  {addresses.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <HomeIcon sx={{ fontSize: '48px', color: 'rgba(255, 255, 255, 0.3)', mb: 2 }} />
                      <Typography sx={{ color: 'rgba(255, 255, 255, 0.6)', mb: 2 }}>
                        No addresses found
                      </Typography>
                      <Typography sx={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '14px', mb: 3 }}>
                        Please add an address to continue
                      </Typography>
                      <PremiumButton onClick={() => window.location.href = '/profile'}>
                        Add Address
                      </PremiumButton>
                    </Box>
                  ) : (
                    addresses.map((address) => (
                      <AddressCard
                        key={address.id}
                        selected={selectedAddress === address.id.toString()}
                        onClick={() => setSelectedAddress(address.id.toString())}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                          <input
                            type="radio"
                            name="address"
                            value={address.id}
                            checked={selectedAddress === address.id.toString()}
                            onChange={(e) => setSelectedAddress(e.target.value)}
                            style={{ marginTop: '4px' }}
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
                                  border: '1px solid rgba(34, 197, 94, 0.3)'
                                }}
                              />
                            )}

                            <Typography sx={{ color: 'white', fontWeight: 500, mb: 0.5 }}>
                              {address.street_address}
                            </Typography>

                            <Typography sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px' }}>
                              {address.city}, {address.state} - {address.pincode}
                            </Typography>
                          </Box>
                        </Box>
                      </AddressCard>
                    ))
                  )}
                </CardContent>
              </SectionCard>
            </Grid>

            {/* Right Column - Order Total */}
            <Grid size={{ xs: 12, lg: 4 }}>
              <SectionCard sx={{ position: 'sticky', top: '100px' }}>
                <CardContent sx={{ p: 4 }}>
                  <SectionTitle sx={{ mb: 3 }}>Order Total</SectionTitle>

                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                        Subtotal ({items.length} item{items.length !== 1 ? 's' : ''}):
                      </Typography>
                      <Typography sx={{ color: 'white' }}>
                        ₹{totalPrice.toFixed(2)}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                        Delivery:
                      </Typography>
                      <Typography sx={{ color: '#22c55e' }}>
                        Free
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                        Tax:
                      </Typography>
                      <Typography sx={{ color: 'white' }}>
                        Included
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                    pt: 2,
                    mb: 3
                  }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography sx={{ fontSize: '20px', fontWeight: 600, color: 'white' }}>
                        Total:
                      </Typography>
                      <Typography sx={{ fontSize: '24px', fontWeight: 700, color: '#60a5fa' }}>
                        ₹{totalPrice.toFixed(2)}
                      </Typography>
                    </Box>
                  </Box>

                  <PremiumButton
                    fullWidth
                    onClick={handlePlaceOrder}
                    disabled={loading || addresses.length === 0 || !selectedAddress || profileIncomplete}
                    sx={{ mb: 2 }}
                  >
                    {loading ? (
                      <>
                        <CircularProgress size={20} sx={{ mr: 1, color: 'currentColor' }} />
                        Placing Order...
                      </>
                    ) : (
                      <>
                        <LocalShippingIcon sx={{ mr: 1 }} />
                        Place Order
                      </>
                    )}
                  </PremiumButton>

                  {profileIncomplete && (
                    <Typography sx={{
                      fontSize: '12px',
                      color: 'rgba(255, 255, 255, 0.5)',
                      textAlign: 'center'
                    }}>
                      Complete your profile to place order
                    </Typography>
                  )}

                  {addresses.length === 0 && (
                    <Typography sx={{
                      fontSize: '12px',
                      color: 'rgba(255, 255, 255, 0.5)',
                      textAlign: 'center'
                    }}>
                      Add a delivery address to continue
                    </Typography>
                  )}
                </CardContent>
              </SectionCard>
            </Grid>
          </Grid>
        </ContentContainer>
      </CheckoutContent>

      {/* Profile Completion Dialog */}
      <Dialog
        open={profileDialogOpen}
        onClose={() => !profileLoading && setProfileDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: 'linear-gradient(135deg, rgba(20, 20, 20, 0.95) 0%, rgba(10, 10, 10, 0.98) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '20px',
            color: 'white',
          }
        }}
      >
        <DialogTitle sx={{
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
          <WarningIcon sx={{ color: '#fbbf24' }} />
          Complete Your Profile
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          <Typography sx={{ mb: 3, color: 'rgba(255, 255, 255, 0.8)' }}>
            We need your name and phone number to process your order and provide delivery updates.
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <PremiumTextField
              label="Full Name"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              fullWidth
              required
              disabled={profileLoading}
              InputProps={{
                startAdornment: <PersonIcon sx={{ color: 'rgba(255, 255, 255, 0.6)', mr: 1 }} />
              }}
            />

            <PremiumTextField
              label="Phone Number"
              value={tempPhone}
              onChange={(e) => setTempPhone(e.target.value)}
              fullWidth
              required
              disabled={profileLoading}
              placeholder="+91 9876543210"
              InputProps={{
                startAdornment: <PhoneIcon sx={{ color: 'rgba(255, 255, 255, 0.6)', mr: 1 }} />
              }}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button
            onClick={() => setProfileDialogOpen(false)}
            disabled={profileLoading}
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)' }
            }}
          >
            Cancel
          </Button>

          <PremiumButton
            onClick={handleCompleteProfile}
            disabled={profileLoading || !tempName.trim() || !tempPhone.trim()}
          >
            {profileLoading ? (
              <>
                <CircularProgress size={16} sx={{ mr: 1, color: 'currentColor' }} />
                Saving...
              </>
            ) : (
              'Save & Continue'
            )}
          </PremiumButton>
        </DialogActions>
      </Dialog>
    </PageWrapper>
  );
};

export default CheckoutPage;