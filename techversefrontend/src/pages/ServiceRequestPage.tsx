// src/pages/ServiceRequestPage.tsx - Creative Premium Service Request
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, TextField, Dialog, Alert, IconButton, CircularProgress
} from '@mui/material';

// Material Icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AddIcon from '@mui/icons-material/Add';
import HandymanIcon from '@mui/icons-material/Handyman';
import CloseIcon from '@mui/icons-material/Close';
import BuildIcon from '@mui/icons-material/Build';
import TuneIcon from '@mui/icons-material/Tune';
import HomeIcon from '@mui/icons-material/Home';
import PaymentIcon from '@mui/icons-material/Payment';
import VerifiedIcon from '@mui/icons-material/Verified';
import ShieldIcon from '@mui/icons-material/Shield';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

import { useServiceStore } from '../stores/serviceStore';
import { useProductStore } from '../stores/productStore';
import apiClient from '../api';
import { useSnackbar } from 'notistack';

const ACCENT = '#1C2B4A';
const GOLD = '#D4922A';
const BG = '#FAF9F5';
const TEXT = '#1A1814';
const MUTED = '#8A8279';
const SURFACE = '#FFFFFF';
const BORDER = 'rgba(28,43,74,0.10)';
const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';

interface ServiceIssue { id: number; description: string; price: string; }
interface ServiceCategory { id: number; name: string; issues: ServiceIssue[]; is_free_for_user?: boolean; }
interface Address { id: number; street_address: string; city: string; state: string; pincode: string; is_default: boolean; }

export const ServiceRequestPage: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const { categories, fetchCategories } = useServiceStore();
  const { addresses, fetchAddresses } = useProductStore();

  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState<ServiceIssue | null>(null);
  const [isCustomSelected, setIsCustomSelected] = useState(false);
  const [customDescription, setCustomDescription] = useState('');

  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [showAddressDialog, setShowAddressDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [addressForm, setAddressForm] = useState({
    street_address: '', city: '', state: '', pincode: '', is_default: false
  });

  const category = categories.find(cat => cat.id === parseInt(categoryId || ''));

  useEffect(() => {
    window.scrollTo(0, 0);
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
    setIsCustomSelected(false);
    setCustomDescription('');
    setTimeout(() => {
      document.getElementById('address-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleCustomIssue = () => {
    setSelectedIssue(null);
    setIsCustomSelected(true);
    setTimeout(() => {
      document.getElementById('address-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleAddAddress = async () => {
    if (!addressForm.street_address.trim() || !addressForm.city.trim() || !addressForm.state.trim() || !addressForm.pincode.trim()) {
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
      enqueueSnackbar('Failed to add address', { variant: 'error' });
    }
  };

  const handleSubmitRequest = async () => {
    if (!selectedIssue && !customDescription.trim()) {
      enqueueSnackbar('Please select an issue or provide a description', { variant: 'error' });
      return;
    }
    if (!selectedAddress) {
      enqueueSnackbar('Please select a service address', { variant: 'error' });
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

      if (category?.is_free_for_user) {
        navigate('/services', { state: { message: 'Service request submitted successfully! We will contact you within 24 hours.' } });
      } else {
        const paymentResponse = await apiClient.post('/api/payments/initiate/', { service_request_id: response.data.id });
        if (paymentResponse.data.redirect_url) {
          window.location.href = paymentResponse.data.redirect_url;
        } else {
          throw new Error('Invalid payment response');
        }
      }
    } catch (error) {
      enqueueSnackbar('Failed to submit service request', { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: BG }}>
        <CircularProgress sx={{ color: ACCENT }} />
      </Box>
    );
  }

  if (!category) {
    return (
      <Box sx={{ minHeight: '100vh', background: BG, color: TEXT, pt: 16, px: 4, textAlign: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 2 }}>Service Category Not Found</Typography>
        <Button onClick={() => navigate('/services')} sx={{ color: ACCENT, fontWeight: 600 }}>Return to Services</Button>
      </Box>
    );
  }

  const isFreeService = category.is_free_for_user === true;
  const isDisabled = submitting || (!selectedIssue && !customDescription.trim()) || !selectedAddress;

  // Compute current step for the progress indicator
  const currentStep = !selectedIssue && !isCustomSelected ? 1
    : (isCustomSelected && !customDescription.trim()) ? 1
      : !selectedAddress ? 2 : 3;

  const fieldLabels: Record<string, string> = {
    street_address: 'Street Address',
    city: 'City',
    state: 'State',
    pincode: 'Pincode',
  };

  // ════════════ MOBILE VIEW ════════════
  if (isMobile) {
    return (
      <div style={{
        minHeight: '100vh', background: `#F1F3F6`, color: TEXT, fontFamily: "'Inter', sans-serif",
        paddingTop: 70, paddingBottom: 40, position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ width: '100%', padding: '0 12px', position: 'relative', zIndex: 1 }}>

          {/* MOBILE HERO */}
          <section style={{ marginBottom: 24, borderRadius: 16, overflow: 'hidden', background: `linear-gradient(135deg, ${ACCENT} 0%, #2a3f6a 100%)`, padding: '24px 20px', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <button
                  onClick={() => navigate('/services')}
                  style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginBottom: 16 }}
                >
                  <ArrowBackIcon sx={{ color: '#fff', fontSize: 16 }} />
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <div style={{ width: 20, height: 20, borderRadius: 6, background: 'rgba(212,146,42,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BuildIcon sx={{ fontSize: 12, color: GOLD }} />
                  </div>
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Service Request</span>
                </div>
                <h1 style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.1, margin: '0 0 4px', color: '#fff', textTransform: 'uppercase' }}>
                  {category.name}
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 500, margin: 0 }}>
                  Select service & address.
                </p>
              </div>

              {/* Progress Vertical Mini */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center', marginTop: 36 }}>
                {[{ num: 1 }, { num: 2 }, { num: 3 }].map((step) => {
                  const isDone = currentStep > step.num;
                  const isCurrent = currentStep === step.num;
                  return (
                    <div key={step.num} style={{ width: 8, height: 8, borderRadius: 4, background: isDone || isCurrent ? GOLD : 'rgba(255,255,255,0.2)' }} />
                  );
                })}
              </div>
            </div>
          </section>

          {/* AMC FREE BADGE */}
          {isFreeService && (
            <div style={{ background: '#E6F4EA', border: '1px solid #CEEAD6', padding: '12px 16px', borderRadius: 12, marginBottom: 20, display: 'flex', gap: 10, alignItems: 'center' }}>
              <VerifiedIcon sx={{ color: '#137333', fontSize: 20 }} />
              <div>
                <p style={{ fontWeight: 700, color: '#137333', margin: 0, fontSize: 12 }}>AMC Benefit Active</p>
                <p style={{ color: '#137333', margin: 0, fontSize: 10, fontWeight: 500 }}>All services are free.</p>
              </div>
            </div>
          )}

          {/* CATEGORY TABS (scrollable) */}
          <style>{`
            .svc-cat-wrap { position: relative; margin-bottom: 24px; margin-right: -12px; }
            .svc-cat-strip { display: flex; overflow-x: auto; gap: 8px; padding: 0 0 8px; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; }
            .svc-cat-strip::-webkit-scrollbar { display: none; }
            .svc-cat-wrap::after { content: ''; position: absolute; right: 0; top: 0; bottom: 8px; width: 32px; background: linear-gradient(to right, transparent, #FAF9F5); pointer-events: none; }
            .svc-cat-btn { display: flex; flex-shrink: 0; align-items: center; gap: 6px; cursor: pointer; white-space: nowrap; padding: 8px 16px; border-radius: 20px; font-weight: 700; font-size: 12px; scroll-snap-align: start; transition: all 0.18s; font-family: 'Inter', sans-serif; }
          `}</style>
          <div className="svc-cat-wrap">
            <div className="svc-cat-strip">
              {categories.map(cat => {
                const isActive = cat.id === category.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => navigate(`/services/request/${cat.id}`)}
                    className="svc-cat-btn"
                    style={{
                      border: `1px solid ${isActive ? ACCENT : '#E0E0E0'}`,
                      background: isActive ? ACCENT : '#fff',
                      color: isActive ? '#fff' : MUTED,
                    }}
                  >
                    <HandymanIcon sx={{ fontSize: 14, color: isActive ? '#fff' : MUTED }} />
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>

          <h2 style={{ fontSize: 16, fontWeight: 800, color: TEXT, margin: '0 0 12px' }}>1. Select Your Service</h2>

          {/* PRICING GRID (1 column) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
            {category.issues.map((issue, idx) => {
              const isSelected = selectedIssue?.id === issue.id;
              return (
                <div key={issue.id} onClick={() => handleIssueSelect(issue)} style={{
                  background: isSelected ? `linear-gradient(135deg, ${ACCENT}, #2a3f6a)` : '#fff',
                  border: `1px solid ${isSelected ? ACCENT : '#E0E0E0'}`, borderRadius: 16, padding: '16px', display: 'flex', flexDirection: 'column', position: 'relative',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: isSelected ? '#fff' : TEXT, paddingRight: 30 }}>{issue.description}</h3>
                    {isSelected ? <CheckCircleIcon sx={{ fontSize: 18, color: '#22C55E', position: 'absolute', right: 16, top: 16 }} /> : null}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ fontSize: 20, fontWeight: 900, color: isFreeService ? '#10b981' : isSelected ? '#fff' : TEXT }}>
                      {isFreeService ? 'FREE' : `₹${issue.price}`}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* CUSTOM REQUEST */}
            <div onClick={handleCustomIssue} style={{
              background: isCustomSelected ? `linear-gradient(135deg, ${GOLD}, #c08520)` : '#fff', border: `1px solid ${isCustomSelected ? GOLD : '#E0E0E0'}`, borderRadius: 16, padding: '16px', position: 'relative',
            }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: isCustomSelected ? '#fff' : TEXT }}>Custom Request</h3>
              <p style={{ color: isCustomSelected ? 'rgba(255,255,255,0.7)' : MUTED, fontSize: 12, margin: '4px 0 8px' }}>Describe issue for custom quote</p>
              {isCustomSelected && <CheckCircleIcon sx={{ fontSize: 18, color: '#fff', position: 'absolute', right: 16, top: 16 }} />}
            </div>
          </div>

          {isCustomSelected && (
            <div style={{ marginBottom: 32 }}>
              <TextField
                fullWidth multiline rows={3} variant="outlined"
                placeholder="Describe issue..."
                value={customDescription}
                onChange={e => setCustomDescription(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': { background: '#fff', borderRadius: '12px', fontSize: 14, color: '#1A1814' },
                  '& .MuiInputBase-input': { color: '#1A1814', WebkitTextFillColor: '#1A1814' }
                }}
              />
            </div>
          )}

          <div id="address-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: TEXT, margin: 0 }}>2. Service Address</h2>
            <button onClick={() => setShowAddressDialog(true)} style={{ padding: '6px 12px', background: '#fff', border: '1px solid #D1D5DB', borderRadius: 20, fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              <AddIcon sx={{ fontSize: 14 }} /> Add New
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
            {addresses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', borderRadius: 16, background: '#fff', border: '1px dashed #D1D5DB' }}>
                <p style={{ margin: 0, fontSize: 13, color: MUTED }}>No addresses saved</p>
              </div>
            ) : (
              addresses.map(addr => {
                const isAddrSelected = selectedAddress === addr.id.toString();
                return (
                  <div key={addr.id} onClick={() => setSelectedAddress(addr.id.toString())} style={{ padding: 16, borderRadius: 16, background: isAddrSelected ? 'rgba(28,43,74,0.05)' : '#fff', border: `2px solid ${isAddrSelected ? ACCENT : '#E0E0E0'}`, position: 'relative' }}>
                    {addr.is_default && <span style={{ background: 'rgba(212,146,42,0.1)', color: GOLD, fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 4, display: 'inline-block', marginBottom: 4, textTransform: 'uppercase' }}>Default</span>}
                    <h5 style={{ margin: '0 0 4px 0', fontSize: 14, fontWeight: 600 }}>{addr.street_address}</h5>
                    <p style={{ margin: 0, fontSize: 12, color: MUTED }}>{addr.city}, {addr.state} - {addr.pincode}</p>
                    {isAddrSelected && <CheckCircleIcon sx={{ position: 'absolute', top: 16, right: 16, color: ACCENT, fontSize: 18 }} />}
                  </div>
                );
              })
            )}
          </div>

          {/* SUBMIT BUTTON FIXED BOTTOM */}
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '12px 16px', background: '#fff', borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 100, boxShadow: '0 -4px 12px rgba(0,0,0,0.05)' }}>
            <button disabled={isDisabled} onClick={handleSubmitRequest} style={{ padding: '14px 20px', borderRadius: 12, background: isDisabled ? '#E5E7EB' : ACCENT, color: isDisabled ? '#9CA3AF' : '#fff', border: 'none', fontWeight: 700, fontSize: 14, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {submitting ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : <>{isFreeService ? 'Submit Request' : 'Continue to Payment'} <ArrowForwardIcon sx={{ fontSize: 16 }} /></>}
            </button>
          </div>

        </div>

        {/* DIALOG FOR MOBILE is automatically handled by MUI Dialog, but we can style it via PaperProps */}
        <Dialog open={showAddressDialog} onClose={() => setShowAddressDialog(false)} PaperProps={{ style: { background: '#fff', borderRadius: '16px 16px 0 0', margin: 0, position: 'absolute', bottom: 0, width: '100%', maxWidth: '100%' } }}>
          <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E5E7EB' }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Add Address</h3>
            <CloseIcon onClick={() => setShowAddressDialog(false)} />
          </div>
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {['street_address', 'city', 'state', 'pincode'].map(field => (
              <TextField key={field} label={fieldLabels[field] || field} value={(addressForm as any)[field]} onChange={e => setAddressForm({ ...addressForm, [field]: e.target.value })} fullWidth size="small" />
            ))}
            <Button onClick={handleAddAddress} sx={{ background: ACCENT, color: '#fff', padding: '12px', borderRadius: '8px', fontWeight: 700, '&:hover': { background: '#111827' } }}>Save Address</Button>
          </div>
        </Dialog>
      </div>
    );
  }

  // ════════════ DESKTOP VIEW ════════════
  return (
    <div style={{
      minHeight: '100vh',
      background: `
        radial-gradient(circle at 15% 50%, rgba(20, 30, 50, 0.04), transparent 35%),
        radial-gradient(circle at 85% 30%, rgba(212, 146, 42, 0.06), transparent 35%),
        ${BG}
      `,
      color: TEXT,
      fontFamily: "'Inter', sans-serif",
      paddingTop: '100px',
      paddingBottom: '80px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background Decorative Blobs */}
      <div style={{
        position: 'absolute', top: '5%', right: '-8%', width: '500px', height: '500px',
        borderRadius: '50%', background: 'linear-gradient(135deg, rgba(212, 146, 42, 0.12) 0%, rgba(255, 255, 255, 0) 100%)',
        filter: 'blur(80px)', zIndex: 0, pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', bottom: '15%', left: '-12%', width: '600px', height: '600px',
        borderRadius: '50%', background: 'linear-gradient(135deg, rgba(28, 43, 74, 0.08) 0%, rgba(255, 255, 255, 0) 100%)',
        filter: 'blur(100px)', zIndex: 0, pointerEvents: 'none'
      }} />

      <div style={{ width: '100%', padding: '0 48px', position: 'relative', zIndex: 1 }}>

        {/* ═══════════════════════════════════════════════════════════════════
            HERO BANNER WITH BACK BUTTON
        ═══════════════════════════════════════════════════════════════════ */}
        <section style={{ marginBottom: 40 }}>
          <div style={{
            background: `linear-gradient(135deg, ${ACCENT} 0%, #2a3f6a 50%, #1a2540 100%)`,
            borderRadius: 28, padding: '48px 56px 44px', position: 'relative', overflow: 'hidden',
          }}>
            {/* Decorative elements */}
            <div style={{ position: 'absolute', top: -50, right: -30, width: 200, height: 200, borderRadius: '50%', background: 'rgba(212,146,42,0.15)', filter: 'blur(50px)' }} />
            <div style={{ position: 'absolute', bottom: -60, left: '30%', width: 280, height: 280, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', filter: 'blur(50px)' }} />
            <div style={{ position: 'absolute', top: 25, right: 60, width: 100, height: 100, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.06)' }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              {/* Back button */}
              <button
                onClick={() => navigate('/services')}
                style={{
                  width: 40, height: 40, borderRadius: 12, border: '1px solid rgba(255,255,255,0.15)',
                  background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: `all 0.3s ${EASE}`, marginBottom: 24,
                  backdropFilter: 'blur(8px)',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
              >
                <ArrowBackIcon sx={{ color: '#fff', fontSize: 18 }} />
              </button>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 32, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(212,146,42,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <BuildIcon sx={{ fontSize: 20, color: '#D4922A' }} />
                    </div>
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Service Request</span>
                  </div>

                  <h1 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.05, margin: '0 0 10px', color: '#fff', textTransform: 'uppercase' }}>
                    {category.name}
                  </h1>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, fontWeight: 500, margin: 0 }}>
                    Select a service, choose your address, and you're all set.
                  </p>
                </div>

                {/* Progress Steps Indicator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 4 }}>
                  {[
                    { num: 1, label: 'Service', icon: <TuneIcon sx={{ fontSize: 16 }} /> },
                    { num: 2, label: 'Address', icon: <HomeIcon sx={{ fontSize: 16 }} /> },
                    { num: 3, label: 'Confirm', icon: <PaymentIcon sx={{ fontSize: 16 }} /> },
                  ].map((step, i) => {
                    const isDone = currentStep > step.num;
                    const isCurrent = currentStep === step.num;
                    return (
                      <React.Fragment key={step.num}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: 12,
                            background: isDone ? 'rgba(34,197,94,0.2)' : isCurrent ? 'rgba(212,146,42,0.2)' : 'rgba(255,255,255,0.08)',
                            border: `1px solid ${isDone ? 'rgba(34,197,94,0.3)' : isCurrent ? 'rgba(212,146,42,0.3)' : 'rgba(255,255,255,0.1)'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: isDone ? '#22C55E' : isCurrent ? GOLD : 'rgba(255,255,255,0.3)',
                          }}>
                            {isDone ? <CheckCircleIcon sx={{ fontSize: 18 }} /> : step.icon}
                          </div>
                          <span style={{ fontSize: 9, fontWeight: 700, color: isDone ? '#22C55E' : isCurrent ? GOLD : 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                            {step.label}
                          </span>
                        </div>
                        {i < 2 && (
                          <div style={{
                            width: 40, height: 2, marginBottom: 18,
                            background: isDone ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.08)',
                            marginLeft: 4, marginRight: 4,
                          }} />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* AMC FREE BADGE */}
        {isFreeService && (
          <div style={{
            background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
            padding: '18px 28px', borderRadius: 20, marginBottom: 36,
            display: 'flex', gap: 14, alignItems: 'center',
            backdropFilter: 'blur(8px)',
          }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <VerifiedIcon sx={{ color: '#10b981', fontSize: 22 }} />
            </div>
            <div>
              <p style={{ fontWeight: 700, color: '#065f46', margin: 0, fontSize: 15 }}>AMC Benefit Active</p>
              <p style={{ color: '#047857', margin: 0, fontSize: 13, fontWeight: 500, opacity: 0.85 }}>
                All services in this category are free for you as an AMC customer.
              </p>
            </div>
          </div>
        )}

        {/* CATEGORY QUICK TABS */}
        <div style={{
          display: 'flex', overflowX: 'auto', gap: 10, marginBottom: 36,
          padding: '16px 24px', background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(12px)',
          borderRadius: 20, border: '1px solid rgba(255,255,255,0.7)',
        }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: TEXT, display: 'flex', alignItems: 'center', marginRight: 8, whiteSpace: 'nowrap' }}>Categories</span>
          <div style={{ width: 1, height: 24, background: 'rgba(28,43,74,0.1)', marginRight: 8, flexShrink: 0 }} />
          {categories.map(cat => {
            const isActive = cat.id === category.id;
            return (
              <button
                key={cat.id}
                onClick={() => navigate(`/services/request/${cat.id}`)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', whiteSpace: 'nowrap',
                  padding: '8px 18px', borderRadius: 12, border: `1px solid ${isActive ? ACCENT : 'transparent'}`,
                  background: isActive ? ACCENT : 'transparent',
                  color: isActive ? '#fff' : MUTED,
                  fontWeight: 600, fontSize: 13, fontFamily: "'Inter', sans-serif",
                  transition: `all 0.3s ${EASE}`,
                }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(28,43,74,0.05)'; e.currentTarget.style.color = TEXT; } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = MUTED; } }}
              >
                <HandymanIcon sx={{ fontSize: 15, color: isActive ? '#fff' : MUTED }} />
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 1: SELECT SERVICE — Section Title
        ═══════════════════════════════════════════════════════════════════ */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(28,43,74,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TuneIcon sx={{ fontSize: 20, color: ACCENT }} />
          </div>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: TEXT, margin: 0, letterSpacing: '-0.02em' }}>Select Your Service</h2>
            <p style={{ fontSize: 12, color: MUTED, margin: 0, fontWeight: 500 }}>{category.issues.length} services available in {category.name}</p>
          </div>
        </div>

        {/* PRICING GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20, marginBottom: 48 }}>
          {category.issues.map((issue, idx) => {
            const isSelected = selectedIssue?.id === issue.id;
            return (
              <div
                key={issue.id}
                onClick={() => handleIssueSelect(issue)}
                style={{
                  background: isSelected ? `linear-gradient(135deg, ${ACCENT}, #2a3f6a)` : 'rgba(255, 255, 255, 0.65)',
                  backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                  border: `1px solid ${isSelected ? ACCENT : 'rgba(255,255,255,0.85)'}`,
                  borderRadius: 24, padding: 0, display: 'flex', flexDirection: 'column',
                  cursor: 'pointer', transition: `all 0.35s ${EASE}`, overflow: 'hidden',
                  boxShadow: isSelected ? `0 12px 40px ${ACCENT}22` : 'none',
                  position: 'relative',
                }}
                onMouseEnter={e => {
                  if (!isSelected) {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 40px rgba(28,43,74,0.08)';
                    (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isSelected) {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                    (e.currentTarget as HTMLDivElement).style.transform = 'none';
                  }
                }}
              >
                {/* Top accent */}
                {!isSelected && <div style={{ height: 3, background: idx === 0 ? `linear-gradient(90deg, ${GOLD}, ${GOLD}44)` : `linear-gradient(90deg, ${ACCENT}33, transparent)` }} />}

                <div style={{ padding: '28px 28px 24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
                    <div style={{
                      background: isSelected ? 'rgba(255,255,255,0.12)' : 'rgba(28,43,74,0.05)',
                      padding: 10, borderRadius: 14, display: 'flex',
                    }}>
                      <SettingsSuggestIcon sx={{ color: isSelected ? '#fff' : ACCENT, fontSize: 24 }} />
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {idx === 0 && (
                        <span style={{
                          background: isSelected ? 'rgba(255,255,255,0.15)' : GOLD,
                          color: '#fff', fontSize: 10, fontWeight: 700, padding: '4px 12px',
                          borderRadius: 8, letterSpacing: '0.04em', textTransform: 'uppercase',
                        }}>Popular</span>
                      )}
                      {isSelected && (
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <CheckCircleIcon sx={{ fontSize: 16, color: '#22C55E' }} />
                        </div>
                      )}
                    </div>
                  </div>

                  <h3 style={{
                    fontSize: 18, fontWeight: 700, margin: '0 0 6px 0',
                    letterSpacing: '-0.02em', color: isSelected ? '#fff' : TEXT,
                  }}>
                    {issue.description}
                  </h3>
                  <p style={{
                    color: isSelected ? 'rgba(255,255,255,0.55)' : MUTED,
                    fontSize: 13, lineHeight: 1.6, marginBottom: 20, fontWeight: 500,
                  }}>
                    Professional repair and maintenance by certified experts.
                  </p>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{
                      fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em',
                      color: isFreeService ? '#10b981' : isSelected ? '#fff' : TEXT,
                    }}>
                      {isFreeService ? 'FREE' : `₹${issue.price}`}
                    </span>
                    <span style={{ color: isSelected ? 'rgba(255,255,255,0.4)' : MUTED, fontSize: 12, fontWeight: 500 }}>/ service</span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* CUSTOM REQUEST CARD */}
          <div
            onClick={handleCustomIssue}
            style={{
              background: isCustomSelected ? `linear-gradient(135deg, ${GOLD}, #c08520)` : 'rgba(255,255,255,0.65)',
              backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
              border: `1px solid ${isCustomSelected ? GOLD : 'rgba(255,255,255,0.85)'}`,
              borderRadius: 24, padding: 0, display: 'flex', flexDirection: 'column',
              cursor: 'pointer', transition: `all 0.35s ${EASE}`, overflow: 'hidden',
              boxShadow: isCustomSelected ? `0 12px 40px ${GOLD}22` : 'none',
              position: 'relative',
            }}
            onMouseEnter={e => {
              if (!isCustomSelected) {
                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 40px rgba(28,43,74,0.08)';
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
              }
            }}
            onMouseLeave={e => {
              if (!isCustomSelected) {
                (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                (e.currentTarget as HTMLDivElement).style.transform = 'none';
              }
            }}
          >
            {!isCustomSelected && <div style={{ height: 3, background: `linear-gradient(90deg, ${GOLD}44, transparent)` }} />}

            <div style={{ padding: '28px 28px 24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
                <div style={{
                  background: isCustomSelected ? 'rgba(255,255,255,0.15)' : 'rgba(212,146,42,0.08)',
                  padding: 10, borderRadius: 14, display: 'flex',
                }}>
                  <SettingsSuggestIcon sx={{ color: isCustomSelected ? '#fff' : GOLD, fontSize: 24 }} />
                </div>
                {isCustomSelected && (
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircleIcon sx={{ fontSize: 16, color: '#fff' }} />
                  </div>
                )}
              </div>
              <h3 style={{
                fontSize: 18, fontWeight: 700, margin: '0 0 6px 0',
                letterSpacing: '-0.02em', color: isCustomSelected ? '#fff' : TEXT,
              }}>Custom Request</h3>
              <p style={{
                color: isCustomSelected ? 'rgba(255,255,255,0.6)' : MUTED,
                fontSize: 13, lineHeight: 1.6, marginBottom: 20, fontWeight: 500, flex: 1,
              }}>
                Have a specific issue not listed? Describe it and we'll give a custom quote.
              </p>
              <span style={{
                fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em',
                color: isCustomSelected ? '#fff' : TEXT,
              }}>Custom Quote</span>
            </div>
          </div>
        </div>

        {/* CUSTOM DESCRIPTION */}
        {isCustomSelected && (
          <div style={{
            background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.85)', padding: '32px 32px',
            borderRadius: 24, marginBottom: 48,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(212,146,42,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <SettingsSuggestIcon sx={{ fontSize: 18, color: GOLD }} />
              </div>
              <div>
                <h4 style={{ fontSize: 16, fontWeight: 700, color: TEXT, margin: 0 }}>Describe Your Issue</h4>
                <p style={{ color: MUTED, fontSize: 12, margin: 0, fontWeight: 500 }}>Provide details for an accurate quote</p>
              </div>
            </div>
            <TextField
              fullWidth multiline rows={4}
              variant="outlined"
              placeholder="Tell us what's going on with your device..."
              value={customDescription}
              onChange={e => setCustomDescription(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  background: BG, color: TEXT, borderRadius: '14px',
                  fontFamily: "'Inter', sans-serif", fontSize: 14,
                },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: BORDER },
                '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(28,43,74,0.25)' },
                '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: ACCENT },
              }}
            />
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 2: SERVICE ADDRESS
        ═══════════════════════════════════════════════════════════════════ */}
        <div id="address-section" style={{
          background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.85)',
          padding: '36px 36px', borderRadius: 24, marginBottom: 40,
        }}>
          {/* Section header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(28,43,74,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LocationOnIcon sx={{ fontSize: 22, color: ACCENT }} />
              </div>
              <div>
                <h4 style={{ fontSize: 20, fontWeight: 800, color: TEXT, margin: 0, letterSpacing: '-0.02em' }}>Service Address</h4>
                <p style={{ color: MUTED, margin: 0, fontSize: 13, fontWeight: 500 }}>Where should the technician visit?</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddressDialog(true)}
              style={{
                padding: '10px 22px', background: 'rgba(28,43,74,0.04)', color: ACCENT,
                border: `1px solid rgba(28,43,74,0.1)`, borderRadius: 12, fontWeight: 600,
                fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center',
                gap: 6, transition: `all 0.3s ${EASE}`, fontFamily: "'Inter', sans-serif",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = ACCENT; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = ACCENT; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(28,43,74,0.04)'; e.currentTarget.style.color = ACCENT; e.currentTarget.style.borderColor = 'rgba(28,43,74,0.1)'; }}
            >
              <AddIcon sx={{ fontSize: 18 }} /> Add New
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {addresses.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '40px', borderRadius: 20,
                border: '1px dashed rgba(28,43,74,0.12)', background: 'rgba(28,43,74,0.02)',
              }}>
                <LocationOnIcon sx={{ fontSize: 28, color: MUTED, marginBottom: '8px' }} />
                <p style={{ color: MUTED, fontWeight: 600, fontSize: 14, margin: 0 }}>No saved addresses</p>
                <p style={{ color: MUTED, fontWeight: 500, fontSize: 12, margin: '4px 0 0' }}>Add an address to continue</p>
              </div>
            ) : (
              addresses.map(addr => {
                const isAddrSelected = selectedAddress === addr.id.toString();
                return (
                  <div
                    key={addr.id}
                    onClick={() => setSelectedAddress(addr.id.toString())}
                    style={{
                      padding: 20, borderRadius: 18, cursor: 'pointer', transition: `all 0.3s ${EASE}`,
                      background: isAddrSelected ? 'rgba(28,43,74,0.04)' : BG,
                      border: `2px solid ${isAddrSelected ? ACCENT : 'transparent'}`,
                      position: 'relative', overflow: 'hidden',
                    }}
                    onMouseEnter={e => {
                      if (!isAddrSelected) (e.currentTarget as HTMLDivElement).style.border = '2px solid rgba(28,43,74,0.15)';
                    }}
                    onMouseLeave={e => {
                      if (!isAddrSelected) (e.currentTarget as HTMLDivElement).style.border = '2px solid transparent';
                    }}
                  >
                    {/* Left accent */}
                    {isAddrSelected && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: ACCENT, borderRadius: '18px 0 0 18px' }} />}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: isAddrSelected ? 'rgba(28,43,74,0.08)' : 'rgba(28,43,74,0.04)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <LocationOnIcon sx={{ color: isAddrSelected ? ACCENT : MUTED, fontSize: 18 }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        {addr.is_default && (
                          <span style={{
                            background: 'rgba(212,146,42,0.1)', color: GOLD,
                            fontSize: 10, fontWeight: 700, padding: '3px 10px',
                            borderRadius: 6, display: 'inline-block', marginBottom: 6,
                            textTransform: 'uppercase', letterSpacing: '0.05em',
                          }}>Default</span>
                        )}
                        <h5 style={{ margin: '0 0 4px 0', fontSize: 14, fontWeight: 600, color: TEXT }}>{addr.street_address}</h5>
                        <p style={{ margin: 0, fontSize: 12, color: MUTED, fontWeight: 500 }}>
                          {addr.city}, {addr.state} - {addr.pincode}
                        </p>
                      </div>
                      {isAddrSelected && (
                        <div style={{ width: 24, height: 24, borderRadius: 8, background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <CheckCircleIcon sx={{ color: '#22C55E', fontSize: 16 }} />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* SUBMIT BUTTON */}
          <div style={{ borderTop: '1px solid rgba(28,43,74,0.06)', paddingTop: 28, marginTop: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {[
                { icon: <ShieldIcon sx={{ fontSize: 14, color: ACCENT }} />, text: 'Quality Parts' },
                { icon: <SupportAgentIcon sx={{ fontSize: 14, color: GOLD }} />, text: '24/7 Support' },
                { icon: <AccessTimeIcon sx={{ fontSize: 14, color: '#22C55E' }} />, text: 'Same-Day Service' },
              ].map((badge, i) => (
                <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: MUTED }}>
                  {badge.icon} {badge.text}
                </span>
              ))}
            </div>
            <button
              onClick={handleSubmitRequest}
              disabled={isDisabled}
              style={{
                padding: '16px 44px', borderRadius: 14,
                background: isDisabled ? 'rgba(28,43,74,0.06)' : `linear-gradient(135deg, ${ACCENT}, #2a3f6a)`,
                color: isDisabled ? MUTED : '#fff',
                border: 'none', fontWeight: 700, fontSize: 15,
                letterSpacing: '-0.01em', cursor: isDisabled ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 10,
                fontFamily: "'Inter', sans-serif",
                boxShadow: isDisabled ? 'none' : `0 8px 28px ${ACCENT}22`,
                transition: `all 0.3s ${EASE}`,
              }}
              onMouseEnter={e => { if (!isDisabled) e.currentTarget.style.boxShadow = `0 12px 36px ${ACCENT}33`; }}
              onMouseLeave={e => { if (!isDisabled) e.currentTarget.style.boxShadow = `0 8px 28px ${ACCENT}22`; }}
            >
              {submitting ? (
                <CircularProgress size={20} sx={{ color: '#fff' }} />
              ) : (
                <>
                  {isFreeService ? 'Submit Request' : 'Continue to Payment'}
                  <ArrowForwardIcon sx={{ fontSize: 18 }} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* NEW ADDRESS DIALOG */}
      <Dialog
        open={showAddressDialog}
        onClose={() => setShowAddressDialog(false)}
        PaperProps={{
          style: {
            background: 'rgba(255,255,255,0.98)', color: TEXT,
            border: `1px solid ${BORDER}`, borderRadius: 24,
            width: '100%', maxWidth: 480, boxShadow: '0 24px 64px rgba(0,0,0,0.12)',
          }
        }}
      >
        <div style={{ padding: '24px 28px', borderBottom: `1px solid rgba(28,43,74,0.06)`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(28,43,74,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LocationOnIcon sx={{ fontSize: 18, color: ACCENT }} />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>Add New Address</h2>
          </div>
          <IconButton
            onClick={() => setShowAddressDialog(false)}
            sx={{ color: MUTED, width: 36, height: 36, '&:hover': { background: 'rgba(28,43,74,0.06)' } }}
          >
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </div>
        <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {['street_address', 'city', 'state', 'pincode'].map(field => (
            <TextField
              key={field}
              label={fieldLabels[field] || field}
              value={(addressForm as any)[field]}
              onChange={(e) => setAddressForm({ ...addressForm, [field]: e.target.value })}
              fullWidth
              sx={{
                '& .MuiInputLabel-root': { color: MUTED, fontSize: 14, fontWeight: 500 },
                '& .MuiInputLabel-root.Mui-focused': { color: ACCENT },
                '& .MuiOutlinedInput-root': {
                  background: BG, color: TEXT, borderRadius: '14px',
                  fontFamily: "'Inter', sans-serif",
                },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: BORDER },
                '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(28,43,74,0.25)' },
                '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: ACCENT },
              }}
            />
          ))}
          <Button
            onClick={handleAddAddress}
            sx={{
              background: `linear-gradient(135deg, ${ACCENT}, #2a3f6a)`, color: '#fff', padding: '14px',
              fontWeight: 700, borderRadius: '14px', fontSize: 14,
              textTransform: 'none', fontFamily: "'Inter', sans-serif",
              boxShadow: `0 4px 16px ${ACCENT}22`,
              '&:hover': { background: '#243660', boxShadow: `0 6px 20px ${ACCENT}33` },
            }}
          >
            Save Address
          </Button>
        </div>
      </Dialog>
    </div>
  );
};
