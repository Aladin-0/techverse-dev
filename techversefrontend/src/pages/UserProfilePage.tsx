// src/pages/UserProfilePage.tsx — Creative Premium Profile (Split-Panel)
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, TextField, Dialog, IconButton, Switch, FormControlLabel, CircularProgress, Alert
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import PersonIcon from '@mui/icons-material/Person';
import SecurityIcon from '@mui/icons-material/Security';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import VerifiedIcon from '@mui/icons-material/Verified';
import CloseIcon from '@mui/icons-material/Close';
import LogoutIcon from '@mui/icons-material/Logout';
import EngineeringIcon from '@mui/icons-material/Engineering';
import HistoryIcon from '@mui/icons-material/History';
import CampaignIcon from '@mui/icons-material/Campaign';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import StarIcon from '@mui/icons-material/Star';
import ShieldIcon from '@mui/icons-material/Shield';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import NotificationsIcon from '@mui/icons-material/Notifications';
import HomeIcon from '@mui/icons-material/Home';
import { useNavigate } from 'react-router-dom';

import { useUserStore } from '../stores/userStore';
import { useProductStore } from '../stores/productStore';
import apiClient from '../api';
import { useSnackbar } from 'notistack';

const ACCENT = '#1C2B4A';
const GOLD   = '#D4922A';
const BG     = '#FAF9F5';
const TEXT    = '#1A1814';
const MUTED   = '#8A8279';
const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';

interface Address {
  id: number;
  street_address: string;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
}

interface UserProfile {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: string;
  email_notifications: boolean;
  sms_notifications: boolean;
  has_password: boolean;
}

const fieldSx = {
  '& .MuiInputLabel-root': { color: MUTED, fontSize: 13, fontWeight: 600 },
  '& .MuiInputLabel-root.Mui-focused': { color: ACCENT },
  '& .MuiOutlinedInput-root': { background: BG, color: TEXT, borderRadius: '14px', fontFamily: "'Inter', sans-serif" },
  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(28,43,74,0.10)' },
  '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(28,43,74,0.22)' },
  '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: ACCENT },
  '& .Mui-disabled': { color: `${TEXT} !important`, WebkitTextFillColor: `${TEXT} !important`, opacity: 0.8 },
};

const fieldLabel = (field: string) => {
  const map: Record<string, string> = {
    street_address: 'Street Address',
    city: 'City',
    state: 'State',
    pincode: 'Pincode',
  };
  return map[field] || field;
};

export const UserProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const user = useUserStore((state) => state.user);
  const setUserFromServer = useUserStore((state) => state.setUserFromServer);
  const { addresses, fetchAddresses } = useProductStore();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Account');

  const [profileData, setProfileData] = useState<UserProfile>({
    id: 0, name: '', email: '', phone: '', role: 'CUSTOMER',
    email_notifications: true, sms_notifications: true, has_password: false
  });

  // Security tab state
  const setPassword = useUserStore((state) => state.setPassword);
  const [secNewPass, setSecNewPass] = useState('');
  const [secConfirmPass, setSecConfirmPass] = useState('');
  const [secLoading, setSecLoading] = useState(false);
  const [secError, setSecError] = useState('');
  const [secSuccess, setSecSuccess] = useState('');

  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  const [addressForm, setAddressForm] = useState({
    street_address: '', city: '', state: '', pincode: '', is_default: false
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    const loadUserData = async () => {
      try {
        const response = await apiClient.get('/api/users/profile/');
        setProfileData(response.data);
        setUserFromServer(response.data);
      } catch (error) {
        if (user) {
          setProfileData({
            id: user.id, name: user.name || '', email: user.email || '',
            phone: user.phone || '', role: user.role || 'CUSTOMER',
            email_notifications: user.email_notifications ?? true,
            sms_notifications: user.sms_notifications ?? true
          });
        }
      }
      await fetchAddresses();
      setLoading(false);
    };
    loadUserData();
  }, [user?.id, fetchAddresses, setUserFromServer]);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleUpdateProfile = async () => {
    try {
      const response = await apiClient.patch('/api/users/profile/', {
        name: profileData.name, phone: profileData.phone,
        email_notifications: profileData.email_notifications,
        sms_notifications: profileData.sms_notifications
      });
      setProfileData(response.data);
      setUserFromServer(response.data);
      enqueueSnackbar('Profile updated successfully!', { variant: 'success' });
      setEditProfileOpen(false);
    } catch (error) {
      enqueueSnackbar('Failed to update profile', { variant: 'error' });
    }
  };

  const handleSaveAddress = async () => {
    try {
      if (editingAddress) {
        await apiClient.patch(`/api/addresses/${editingAddress.id}/update/`, addressForm);
        enqueueSnackbar('Address updated successfully!', { variant: 'success' });
      } else {
        await apiClient.post('/api/addresses/create/', addressForm);
        enqueueSnackbar('Address added successfully!', { variant: 'success' });
      }
      await fetchAddresses();
      setAddressDialogOpen(false);
      setEditingAddress(null);
      setAddressForm({ street_address: '', city: '', state: '', pincode: '', is_default: false });
    } catch (error) {
      enqueueSnackbar('Failed to save address', { variant: 'error' });
    }
  };

  const handleDeleteAddress = async (addressId: number) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    try {
      await apiClient.delete(`/api/addresses/${addressId}/delete/`);
      enqueueSnackbar('Address deleted successfully!', { variant: 'success' });
      await fetchAddresses();
    } catch (error) {
      enqueueSnackbar('Failed to delete address', { variant: 'error' });
    }
  };

  const openAddressDialog = (address?: Address) => {
    if (address) {
      setEditingAddress(address);
      setAddressForm({ street_address: address.street_address, city: address.city, state: address.state, pincode: address.pincode, is_default: address.is_default });
    } else {
      setEditingAddress(null);
      setAddressForm({ street_address: '', city: '', state: '', pincode: '', is_default: false });
    }
    setAddressDialogOpen(true);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: BG, gap: 2 }}>
        <CircularProgress sx={{ color: ACCENT }} size={32} />
        <Typography sx={{ color: MUTED, fontWeight: 500, fontSize: 13 }}>Loading profile...</Typography>
      </Box>
    );
  }

  const tabs = [
    { name: 'Account', icon: <PersonIcon /> },
    { name: 'Security', icon: <SecurityIcon /> },
    { name: 'Notifications', icon: <NotificationsIcon /> },
    { name: 'Addresses', icon: <LocationOnIcon /> },
    { name: 'Order History', icon: <HistoryIcon />, action: () => navigate('/my-orders') },
    { name: 'Service History', icon: <EngineeringIcon />, action: () => navigate('/service-history') },
    { name: 'Billing', icon: <CreditCardIcon /> },
    ...(profileData.role === 'AFFILIATE' || profileData.role === 'ADMIN' ? [
      { name: 'Affiliate Dashboard', icon: <CampaignIcon />, action: () => navigate('/affiliate/dashboard') }
    ] : []),
    ...(profileData.role === 'ADMIN' ? [
      { name: 'Affiliate Admin', icon: <AdminPanelSettingsIcon />, action: () => window.open('/django-admin/affiliates/', '_blank') }
    ] : []),
  ];

  /* ── Tab content renderer ── */
  const renderContent = () => {
    switch (activeTab) {

      case 'Security':
        return (
          <div style={{
            background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.85)', borderRadius: 24, padding: 36, maxWidth: 560,
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32 }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(139,92,246,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <SecurityIcon sx={{ color: '#8B5CF6', fontSize: 22 }} />
              </div>
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: TEXT, letterSpacing: '-0.02em' }}>Reset Password</h3>
                <p style={{ fontSize: 13, color: MUTED, margin: '4px 0 0', fontWeight: 500 }}>Set a new password for your account</p>
              </div>
            </div>

            {/* Messages */}
            {secError && (
              <div style={{ marginBottom: 20, padding: '14px 16px', borderRadius: 12, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', color: '#dc2626', fontSize: 13, fontWeight: 600 }}>
                {secError}
              </div>
            )}
            {secSuccess && (
              <div style={{ marginBottom: 20, padding: '14px 16px', borderRadius: 12, background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', color: '#16a34a', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>✓</span> {secSuccess}
              </div>
            )}

            {/* Single form — same for everyone */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <TextField
                label="New Password" type="password" value={secNewPass}
                onChange={e => { setSecNewPass(e.target.value); setSecError(''); setSecSuccess(''); }}
                fullWidth sx={fieldSx} size="small"
                inputProps={{ id: 'sec-new-password' }}
              />
              <TextField
                label="Confirm New Password" type="password" value={secConfirmPass}
                onChange={e => { setSecConfirmPass(e.target.value); setSecError(''); setSecSuccess(''); }}
                fullWidth sx={fieldSx} size="small"
                inputProps={{ id: 'sec-confirm-password' }}
              />
              <button
                id="sec-reset-btn"
                disabled={secLoading}
                onClick={async () => {
                  setSecError(''); setSecSuccess('');
                  if (secNewPass.length < 8) { setSecError('Password must be at least 8 characters.'); return; }
                  if (secNewPass !== secConfirmPass) { setSecError('Passwords do not match.'); return; }
                  setSecLoading(true);
                  try {
                    await setPassword(secNewPass, secConfirmPass);
                    setProfileData(prev => ({ ...prev, has_password: true }));
                    setSecSuccess('Password reset successfully!');
                    setSecNewPass(''); setSecConfirmPass('');
                  } catch (e: any) {
                    setSecError(e.response?.data?.error || 'Something went wrong. Please try again.');
                  } finally { setSecLoading(false); }
                }}
                style={{
                  background: `linear-gradient(135deg, ${ACCENT}, #2a3f6a)`, color: '#fff',
                  border: 'none', padding: '14px 32px', borderRadius: 12,
                  fontWeight: 700, fontSize: 14, cursor: secLoading ? 'not-allowed' : 'pointer',
                  fontFamily: "'Inter', sans-serif", opacity: secLoading ? 0.6 : 1,
                  alignSelf: 'flex-start', boxShadow: `0 4px 14px ${ACCENT}22`,
                  transition: 'all 0.2s',
                }}
              >
                {secLoading ? 'Saving...' : 'Reset Password'}
              </button>
            </div>
          </div>
        );

      case 'Notifications':

        return (
          <div style={{
            background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.85)', borderRadius: 24, padding: 36,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32 }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(28,43,74,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <NotificationsIcon sx={{ color: ACCENT, fontSize: 22 }} />
              </div>
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: TEXT, letterSpacing: '-0.02em' }}>Notifications</h3>
                <p style={{ fontSize: 12, color: MUTED, margin: 0, fontWeight: 500 }}>Control how you receive updates</p>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {[
                { checked: profileData.email_notifications, key: 'email_notifications', title: 'Email Notifications', desc: 'Receive service updates and order confirmations via email', icon: <EmailIcon sx={{ fontSize: 18, color: ACCENT }} /> },
                { checked: profileData.sms_notifications, key: 'sms_notifications', title: 'SMS Notifications', desc: 'Receive text messages for important updates', icon: <PhoneIphoneIcon sx={{ fontSize: 18, color: GOLD }} /> },
              ].map(item => (
                <div key={item.key} style={{
                  padding: '20px 24px', borderRadius: 18, background: BG, border: '1px solid rgba(28,43,74,0.06)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
                  transition: `all 0.3s ${EASE}`,
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(28,43,74,0.15)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(28,43,74,0.06)'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(28,43,74,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {item.icon}
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: 14, color: TEXT, margin: 0 }}>{item.title}</p>
                      <p style={{ fontSize: 12, color: MUTED, margin: '2px 0 0', fontWeight: 500 }}>{item.desc}</p>
                    </div>
                  </div>
                  <Switch
                    checked={item.checked}
                    onChange={(e) => setProfileData({ ...profileData, [item.key]: e.target.checked })}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': { color: ACCENT },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: ACCENT },
                    }}
                  />
                </div>
              ))}
            </div>
            <div style={{ borderTop: '1px solid rgba(28,43,74,0.06)', paddingTop: 24, marginTop: 28 }}>
              <button
                onClick={handleUpdateProfile}
                style={{
                  background: `linear-gradient(135deg, ${ACCENT}, #2a3f6a)`, color: '#fff',
                  border: 'none', padding: '14px 32px', borderRadius: 14,
                  fontWeight: 700, fontSize: 14, cursor: 'pointer',
                  fontFamily: "'Inter', sans-serif",
                  boxShadow: `0 4px 16px ${ACCENT}22`,
                  transition: `all 0.3s ${EASE}`,
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 8px 24px ${ACCENT}33`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = `0 4px 16px ${ACCENT}22`; e.currentTarget.style.transform = 'none'; }}
              >
                Save Preferences
              </button>
            </div>
          </div>
        );

      case 'Addresses':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(28,43,74,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <LocationOnIcon sx={{ color: ACCENT, fontSize: 22 }} />
                </div>
                <div>
                  <h3 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: TEXT, letterSpacing: '-0.02em' }}>Saved Addresses</h3>
                  <p style={{ fontSize: 12, color: MUTED, margin: 0, fontWeight: 500 }}>{addresses.length} address{addresses.length !== 1 ? 'es' : ''} on file</p>
                </div>
              </div>
              <button
                onClick={() => openAddressDialog()}
                style={{
                  background: `linear-gradient(135deg, ${ACCENT}, #2a3f6a)`, color: '#fff',
                  padding: '10px 22px', borderRadius: 12, border: 'none',
                  fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
                  cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                  boxShadow: `0 4px 14px ${ACCENT}22`,
                  transition: `all 0.3s ${EASE}`,
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 6px 20px ${ACCENT}33`; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = `0 4px 14px ${ACCENT}22`; e.currentTarget.style.transform = 'none'; }}
              >
                <AddCircleIcon sx={{ fontSize: 18 }} /> Add Address
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
              {addresses.length === 0 ? (
                <div style={{
                  textAlign: 'center', padding: '48px 32px', borderRadius: 24,
                  border: '1px dashed rgba(28,43,74,0.12)', background: 'rgba(255,255,255,0.5)',
                  backdropFilter: 'blur(12px)', gridColumn: '1 / -1',
                }}>
                  <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(28,43,74,0.04)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                    <HomeIcon sx={{ fontSize: 24, color: MUTED }} />
                  </div>
                  <p style={{ color: TEXT, fontWeight: 700, fontSize: 16, margin: '0 0 6px' }}>No Saved Addresses</p>
                  <p style={{ color: MUTED, fontSize: 13, margin: 0, fontWeight: 500 }}>Add an address to get started</p>
                </div>
              ) : (
                addresses.map((addr) => {
                  const label = addr.is_default ? 'Default Address' : 'Other Address';
                  return (
                    <div
                      key={addr.id}
                      style={{
                        background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                        border: '1px solid rgba(255,255,255,0.85)', borderRadius: 20,
                        padding: 0, overflow: 'hidden', transition: `all 0.3s ${EASE}`, position: 'relative',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(28,43,74,0.15)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 28px rgba(28,43,74,0.06)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.85)'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; (e.currentTarget as HTMLDivElement).style.transform = 'none'; }}
                    >
                      {/* Top accent */}
                      <div style={{ height: 3, background: addr.is_default ? `linear-gradient(90deg, ${ACCENT}, ${ACCENT}44)` : `linear-gradient(90deg, ${GOLD}44, transparent)` }} />
                      <div style={{ padding: '24px 24px 20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                          <span style={{
                            background: addr.is_default ? 'rgba(28,43,74,0.06)' : 'rgba(212,146,42,0.08)',
                            color: addr.is_default ? ACCENT : GOLD,
                            fontSize: 10, fontWeight: 700, padding: '4px 12px', borderRadius: 8,
                            textTransform: 'uppercase', letterSpacing: '0.05em',
                          }}>{label}</span>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <IconButton size="small" onClick={() => openAddressDialog(addr)} sx={{ color: MUTED, width: 32, height: 32, '&:hover': { color: ACCENT, background: 'rgba(28,43,74,0.06)' } }}>
                              <EditIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                            <IconButton size="small" onClick={() => handleDeleteAddress(addr.id)} sx={{ color: MUTED, width: 32, height: 32, '&:hover': { color: '#DC2626', background: 'rgba(220,38,38,0.06)' } }}>
                              <DeleteIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(28,43,74,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                            <LocationOnIcon sx={{ fontSize: 18, color: ACCENT }} />
                          </div>
                          <div>
                            <h4 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 4px 0', color: TEXT }}>{addr.street_address}</h4>
                            <p style={{ color: MUTED, fontSize: 13, margin: 0, lineHeight: 1.6, fontWeight: 500 }}>{addr.city}, {addr.state} {addr.pincode}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );

      case 'Billing':
        return (
          <div style={{
            background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.85)', borderRadius: 24,
            padding: '56px 40px', textAlign: 'center',
          }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(28,43,74,0.04)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <CreditCardIcon sx={{ fontSize: 28, color: MUTED }} />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.02em', color: TEXT }}>No Saved Payment Methods</h3>
            <p style={{ color: MUTED, fontSize: 14, fontWeight: 500, maxWidth: 420, margin: '0 auto', lineHeight: 1.7 }}>
              Payment information is transmitted securely during checkout via PhonePe. We do not store credit card data in your profile.
            </p>
          </div>
        );

      case 'Account':
      default:
        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
            {/* Email Card */}
            <div style={{
              background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.85)', borderRadius: 20, padding: 0, overflow: 'hidden',
              transition: `all 0.3s ${EASE}`,
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(28,43,74,0.15)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 28px rgba(28,43,74,0.06)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.85)'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; (e.currentTarget as HTMLDivElement).style.transform = 'none'; }}
            >
              <div style={{ height: 3, background: `linear-gradient(90deg, ${ACCENT}, ${ACCENT}44)` }} />
              <div style={{ padding: '24px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(28,43,74,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <EmailIcon sx={{ fontSize: 20, color: ACCENT }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 600, color: MUTED, margin: '0 0 3px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</p>
                    <p style={{ fontWeight: 700, margin: 0, color: TEXT, fontSize: 14 }}>{profileData.email}</p>
                  </div>
                </div>
                <IconButton onClick={() => setEditProfileOpen(true)} sx={{ color: MUTED, width: 36, height: 36, '&:hover': { color: ACCENT, background: 'rgba(28,43,74,0.06)' } }}>
                  <EditIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </div>
            </div>

            {/* Phone Card */}
            <div style={{
              background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.85)', borderRadius: 20, padding: 0, overflow: 'hidden',
              transition: `all 0.3s ${EASE}`,
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(28,43,74,0.15)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 28px rgba(28,43,74,0.06)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.85)'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; (e.currentTarget as HTMLDivElement).style.transform = 'none'; }}
            >
              <div style={{ height: 3, background: `linear-gradient(90deg, ${GOLD}, ${GOLD}44)` }} />
              <div style={{ padding: '24px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(212,146,42,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <PhoneIphoneIcon sx={{ fontSize: 20, color: GOLD }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 600, color: MUTED, margin: '0 0 3px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Phone</p>
                    <p style={{ fontWeight: 700, margin: 0, color: TEXT, fontSize: 14 }}>{profileData.phone || 'Not registered'}</p>
                  </div>
                </div>
                <IconButton onClick={() => setEditProfileOpen(true)} sx={{ color: MUTED, width: 36, height: 36, '&:hover': { color: ACCENT, background: 'rgba(28,43,74,0.06)' } }}>
                  <EditIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </div>
            </div>

            {/* Membership Card */}
            <div style={{
              background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.85)', borderRadius: 20, padding: 0, overflow: 'hidden',
              transition: `all 0.3s ${EASE}`,
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(28,43,74,0.15)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 28px rgba(28,43,74,0.06)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.85)'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; (e.currentTarget as HTMLDivElement).style.transform = 'none'; }}
            >
              <div style={{ height: 3, background: `linear-gradient(90deg, #22C55E, #22C55E44)` }} />
              <div style={{ padding: '24px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(34,197,94,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <VerifiedIcon sx={{ fontSize: 20, color: '#22C55E' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 600, color: MUTED, margin: '0 0 3px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Membership</p>
                    <p style={{ fontWeight: 700, margin: 0, color: TEXT, fontSize: 14 }}>{profileData.role === 'AMC' ? 'AMC Premium' : 'Standard Member'}</p>
                  </div>
                </div>
                <span style={{
                  padding: '5px 14px', borderRadius: 10,
                  background: 'rgba(34,197,94,0.08)', color: '#16a34a',
                  fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em'
                }}>Active</span>
              </div>
            </div>

            {/* Security Card */}
            <div style={{
              background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.85)', borderRadius: 20, padding: 0, overflow: 'hidden',
              transition: `all 0.3s ${EASE}`,
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(28,43,74,0.15)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 28px rgba(28,43,74,0.06)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.85)'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; (e.currentTarget as HTMLDivElement).style.transform = 'none'; }}
            >
              <div style={{ height: 3, background: `linear-gradient(90deg, #8B5CF6, #8B5CF644)` }} />
              <div style={{ padding: '24px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(139,92,246,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShieldIcon sx={{ fontSize: 20, color: '#8B5CF6' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 600, color: MUTED, margin: '0 0 3px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Security</p>
                    <p style={{ fontWeight: 700, margin: 0, color: TEXT, fontSize: 14 }}>Account Verified</p>
                  </div>
                </div>
                <span style={{
                  padding: '5px 14px', borderRadius: 10,
                  background: 'rgba(139,92,246,0.08)', color: '#7C3AED',
                  fontSize: 11, fontWeight: 700,
                }}>Protected</span>
              </div>
            </div>
          </div>
        );
    }
  };

  /* ══════════════════════════════════════════════
     MOBILE LAYOUT — Full native-app style
  ══════════════════════════════════════════════ */
  if (isMobile) {
    const mobileTabs = [
      { name: 'Account',       icon: <PersonIcon sx={{ fontSize: 18 }} /> },
      { name: 'Security',      icon: <SecurityIcon sx={{ fontSize: 18 }} /> },
      { name: 'Notifications', icon: <NotificationsIcon sx={{ fontSize: 18 }} /> },
      { name: 'Addresses',     icon: <LocationOnIcon sx={{ fontSize: 18 }} /> },
      { name: 'Billing',       icon: <CreditCardIcon sx={{ fontSize: 18 }} /> },
    ];
    const mobileLinks = [
      { name: 'Order History',   icon: <HistoryIcon sx={{ fontSize: 20 }} />,     action: () => navigate('/my-orders') },
      { name: 'Service History', icon: <EngineeringIcon sx={{ fontSize: 20 }} />, action: () => navigate('/service-history') },
      ...(profileData.role === 'AFFILIATE' || profileData.role === 'ADMIN' ? [
        { name: 'Affiliate Dashboard', icon: <CampaignIcon sx={{ fontSize: 20 }} />, action: () => navigate('/affiliate/dashboard') }
      ] : []),
    ];

    const renderMobileContent = () => {
      switch (activeTab) {
        case 'Security':
          return (
            <div style={{ background: '#fff', border: '1px solid rgba(28,43,74,0.08)', borderRadius: 20, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(139,92,246,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <SecurityIcon sx={{ color: '#8B5CF6', fontSize: 20 }} />
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 800, fontSize: 16, color: TEXT }}>Reset Password</p>
                  <p style={{ margin: 0, fontSize: 11, color: MUTED, fontWeight: 500 }}>Secure your account</p>
                </div>
              </div>
              {secError && <div style={{ marginBottom: 16, padding: '12px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', color: '#dc2626', fontSize: 13, fontWeight: 600 }}>{secError}</div>}
              {secSuccess && <div style={{ marginBottom: 16, padding: '12px 14px', borderRadius: 10, background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', color: '#16a34a', fontSize: 13, fontWeight: 700 }}>✓ {secSuccess}</div>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <TextField label="New Password" type="password" value={secNewPass} onChange={e => { setSecNewPass(e.target.value); setSecError(''); }} fullWidth sx={fieldSx} size="small" />
                <TextField label="Confirm Password" type="password" value={secConfirmPass} onChange={e => { setSecConfirmPass(e.target.value); setSecError(''); }} fullWidth sx={fieldSx} size="small" />
                <button disabled={secLoading} onClick={async () => {
                  setSecError(''); setSecSuccess('');
                  if (secNewPass.length < 8) { setSecError('Min 8 characters.'); return; }
                  if (secNewPass !== secConfirmPass) { setSecError('Passwords do not match.'); return; }
                  setSecLoading(true);
                  try { await setPassword(secNewPass, secConfirmPass); setSecSuccess('Password reset!'); setSecNewPass(''); setSecConfirmPass(''); } 
                  catch (e: any) { setSecError(e.response?.data?.error || 'Something went wrong.'); } 
                  finally { setSecLoading(false); }
                }} style={{ padding: '14px', background: `linear-gradient(135deg, ${ACCENT}, #2a3f6a)`, color: '#fff', border: 'none', borderRadius: 12, fontWeight: 800, fontSize: 14, fontFamily: "'Inter', sans-serif", cursor: secLoading ? 'not-allowed' : 'pointer', opacity: secLoading ? 0.6 : 1 }}>
                  {secLoading ? 'Saving...' : 'Reset Password'}
                </button>
              </div>
            </div>
          );

        case 'Notifications':
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { checked: profileData.email_notifications, key: 'email_notifications', title: 'Email Notifications', desc: 'Updates via email', icon: <EmailIcon sx={{ fontSize: 18, color: ACCENT }} /> },
                { checked: profileData.sms_notifications, key: 'sms_notifications', title: 'SMS Notifications', desc: 'Text for important updates', icon: <PhoneIphoneIcon sx={{ fontSize: 18, color: GOLD }} /> },
              ].map(item => (
                <div key={item.key} style={{ background: '#fff', border: '1px solid rgba(28,43,74,0.08)', borderRadius: 16, padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(28,43,74,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.icon}</div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: TEXT }}>{item.title}</p>
                      <p style={{ margin: 0, fontSize: 11, color: MUTED, fontWeight: 500 }}>{item.desc}</p>
                    </div>
                  </div>
                  <Switch checked={item.checked} onChange={e => setProfileData({ ...profileData, [item.key]: e.target.checked })} sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: ACCENT }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: ACCENT } }} />
                </div>
              ))}
              <button onClick={handleUpdateProfile} style={{ padding: '14px', background: `linear-gradient(135deg, ${ACCENT}, #2a3f6a)`, color: '#fff', border: 'none', borderRadius: 12, fontWeight: 800, fontSize: 14, fontFamily: "'Inter', sans-serif", cursor: 'pointer', marginTop: 4 }}>Save Preferences</button>
            </div>
          );

        case 'Addresses':
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <button onClick={() => openAddressDialog()} style={{ padding: '14px', background: `linear-gradient(135deg, ${ACCENT}, #2a3f6a)`, color: '#fff', border: 'none', borderRadius: 12, fontWeight: 800, fontSize: 14, fontFamily: "'Inter', sans-serif", cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <AddCircleIcon sx={{ fontSize: 18 }} /> Add New Address
              </button>
              {addresses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 20px', background: '#fff', borderRadius: 20, border: '1px dashed rgba(28,43,74,0.12)' }}>
                  <HomeIcon sx={{ fontSize: 28, color: MUTED, mb: 1 }} />
                  <p style={{ fontWeight: 700, color: TEXT, margin: '8px 0 4px' }}>No Saved Addresses</p>
                  <p style={{ color: MUTED, fontSize: 13, margin: 0 }}>Add your first delivery address</p>
                </div>
              ) : addresses.map(addr => (
                <div key={addr.id} style={{ background: '#fff', border: `1px solid ${addr.is_default ? ACCENT : 'rgba(28,43,74,0.08)'}`, borderRadius: 16, overflow: 'hidden' }}>
                  <div style={{ height: 3, background: addr.is_default ? `linear-gradient(90deg, ${ACCENT}, ${ACCENT}44)` : `linear-gradient(90deg, ${GOLD}44, transparent)` }} />
                  <div style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flex: 1 }}>
                        <LocationOnIcon sx={{ fontSize: 18, color: ACCENT, mt: '2px', flexShrink: 0 }} />
                        <div>
                          <p style={{ margin: '0 0 2px', fontWeight: 700, fontSize: 14, color: TEXT }}>{addr.street_address}</p>
                          <p style={{ margin: 0, fontSize: 12, color: MUTED, fontWeight: 500 }}>{addr.city}, {addr.state} {addr.pincode}</p>
                          {addr.is_default && <span style={{ display: 'inline-block', marginTop: 6, fontSize: 10, fontWeight: 800, color: ACCENT, background: 'rgba(28,43,74,0.06)', padding: '2px 8px', borderRadius: 6, textTransform: 'uppercase' }}>Default</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                        <IconButton size="small" onClick={() => openAddressDialog(addr)} sx={{ color: MUTED, '&:hover': { color: ACCENT } }}><EditIcon sx={{ fontSize: 16 }} /></IconButton>
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDeleteAddress(addr.id); }} sx={{ color: MUTED, '&:hover': { color: '#DC2626' } }}><DeleteIcon sx={{ fontSize: 16 }} /></IconButton>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );

        case 'Billing':
          return (
            <div style={{ background: '#fff', border: '1px solid rgba(28,43,74,0.08)', borderRadius: 20, padding: '40px 20px', textAlign: 'center' }}>
              <CreditCardIcon sx={{ fontSize: 36, color: MUTED, mb: 2 }} />
              <p style={{ fontWeight: 800, fontSize: 16, color: TEXT, margin: '12px 0 8px' }}>No Saved Payment Methods</p>
              <p style={{ color: MUTED, fontSize: 13, fontWeight: 500, margin: 0, lineHeight: 1.7 }}>Payment is handled securely via PhonePe during checkout.</p>
            </div>
          );

        case 'Account':
        default:
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Email', value: profileData.email, icon: <EmailIcon sx={{ fontSize: 19, color: ACCENT }} />, accent: ACCENT },
                { label: 'Phone', value: profileData.phone || 'Not set', icon: <PhoneIphoneIcon sx={{ fontSize: 19, color: GOLD }} />, accent: GOLD },
                { label: 'Membership', value: profileData.role === 'AMC' ? 'AMC Premium' : 'Standard Member', icon: <VerifiedIcon sx={{ fontSize: 19, color: '#22C55E' }} />, accent: '#22C55E' },
              ].map((item, i) => (
                <div key={i} style={{ background: '#fff', border: '1px solid rgba(28,43,74,0.08)', borderRadius: 16, overflow: 'hidden' }}>
                  <div style={{ height: 3, background: `linear-gradient(90deg, ${item.accent}, ${item.accent}44)` }} />
                  <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: `${item.accent}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.icon}</div>
                      <div>
                        <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</p>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1A1814' }}>{item.value}</p>
                      </div>
                    </div>
                    {i < 2 && <IconButton onClick={() => setEditProfileOpen(true)} sx={{ color: MUTED, width: 32, height: 32, '&:hover': { color: ACCENT, background: 'rgba(28,43,74,0.06)' } }}><EditIcon sx={{ fontSize: 16 }} /></IconButton>}
                  </div>
                </div>
              ))}
            </div>
          );
      }
    };

    return (
      <div style={{ minHeight: '100vh', background: '#F5F6FA', fontFamily: "'Inter', sans-serif" }}>
        <style>{`
          .m-tab { transition: all 0.18s; cursor: pointer; flex-shrink: 0; scroll-snap-align: start; }
          .m-tab-wrap { position: relative; margin-right: -16px; }
          .m-tab-strip { display: flex; overflow-x: auto; gap: 8px; padding: 0 0 12px; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; }
          .m-tab-strip::-webkit-scrollbar { display: none; }
          .m-tab-wrap::after { content: ''; position: absolute; right: 0; top: 0; bottom: 12px; width: 40px; background: linear-gradient(to right, transparent, #fff); pointer-events: none; }
          .m-link { display: flex; align-items: center; gap: 14px; padding: 16px; background: #fff; border: 1px solid rgba(28,43,74,0.08); border-radius: 16px; width: 100%; cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.18s; }
          .m-link:active { transform: scale(0.98); }
        `}</style>

        {/* HERO HEADER */}
        <div style={{ background: `linear-gradient(180deg, ${ACCENT} 0%, #162040 100%)`, padding: '80px 20px 28px', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
            <div style={{ width: 72, height: 72, borderRadius: 20, background: `linear-gradient(135deg, ${GOLD}, #e8a944)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(212,146,42,0.4)', flexShrink: 0, position: 'relative' }}>
              <span style={{ fontSize: 30, fontWeight: 900, color: '#fff' }}>{profileData.name ? profileData.name.charAt(0).toUpperCase() : '?'}</span>
              <div style={{ position: 'absolute', bottom: -4, right: -4, width: 20, height: 20, borderRadius: 6, background: '#22C55E', border: `3px solid ${ACCENT}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircleOutlineIcon sx={{ fontSize: 10, color: '#fff' }} />
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profileData.name || 'Unknown User'}</h1>
              <p style={{ margin: '2px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>{profileData.email}</p>
              <p style={{ margin: '4px 0 0', fontSize: 10, fontWeight: 700, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {profileData.role === 'AMC' ? 'AMC Premium' : profileData.role === 'ADMIN' ? 'Administrator' : 'TechVerse Member'}
              </p>
            </div>
            <button onClick={() => setEditProfileOpen(true)} style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, color: '#fff', fontWeight: 700, fontSize: 12, fontFamily: "'Inter', sans-serif", cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <EditIcon sx={{ fontSize: 14 }} /> Edit
            </button>
          </div>

          {/* Quick stats */}
          <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
            {[
              { label: 'Addresses', value: addresses.length },
              { label: 'Status', value: '✓ Verified' },
              { label: 'Plan', value: profileData.role === 'AMC' ? 'AMC' : 'Standard' },
            ].map((s, i) => (
              <div key={i} style={{ flex: 1, background: 'rgba(255,255,255,0.07)', borderRadius: 12, padding: '10px 6px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p style={{ margin: 0, fontWeight: 900, fontSize: 14, color: i === 2 ? GOLD : '#fff' }}>{s.value}</p>
                <p style={{ margin: '2px 0 0', fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* TAB STRIP */}
        <div style={{ background: '#fff', borderBottom: '1px solid rgba(28,43,74,0.06)', padding: '12px 16px 0', position: 'sticky', top: 64, zIndex: 20 }}>
          <div className="m-tab-wrap">
            <div className="m-tab-strip">
              {mobileTabs.map(tab => {
                const active = activeTab === tab.name;
                return (
                  <button key={tab.name} className="m-tab" onClick={() => setActiveTab(tab.name)} style={{
                    padding: '8px 16px', borderRadius: 20, border: `1px solid ${active ? ACCENT : 'rgba(28,43,74,0.1)'}`,
                    background: active ? ACCENT : 'transparent', color: active ? '#fff' : MUTED,
                    fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap',
                    display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10,
                  }}>
                    {tab.icon}{tab.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {renderMobileContent()}

          {/* QUICK LINKS */}
          <div>
            <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Quick Links</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {mobileLinks.map((link, i) => (
                <button key={i} className="m-link" onClick={link.action}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(28,43,74,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {link.icon}
                  </div>
                  <span style={{ flex: 1, textAlign: 'left', fontWeight: 700, fontSize: 14, color: TEXT }}>{link.name}</span>
                  <ArrowForwardIcon sx={{ fontSize: 16, color: MUTED }} />
                </button>
              ))}

              {/* Logout */}
              <button className="m-link" onClick={() => useUserStore.getState().logout()} style={{ background: 'rgba(239,68,68,0.04)', borderColor: 'rgba(239,68,68,0.12)' }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(239,68,68,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <LogoutIcon sx={{ fontSize: 20, color: '#EF4444' }} />
                </div>
                <span style={{ flex: 1, textAlign: 'left', fontWeight: 700, fontSize: 14, color: '#EF4444' }}>Logout</span>
                <ArrowForwardIcon sx={{ fontSize: 16, color: '#EF4444' }} />
              </button>
            </div>
          </div>
        </div>

        {/* DIALOGS (shared with desktop) */}
        <Dialog open={editProfileOpen} onClose={() => setEditProfileOpen(false)} fullWidth maxWidth="sm"
          PaperProps={{ style: { background: '#fff', color: TEXT, border: '1px solid rgba(28,43,74,0.08)', borderRadius: 20, fontFamily: "'Inter', sans-serif", margin: 16, width: 'calc(100% - 32px)' } }}>
          <div style={{ padding: '20px', borderBottom: '1px solid rgba(28,43,74,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: TEXT }}>Edit Profile</h2>
            <IconButton onClick={() => setEditProfileOpen(false)} sx={{ color: MUTED }}><CloseIcon /></IconButton>
          </div>
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <TextField label="Full Name" value={profileData.name} onChange={e => setProfileData({ ...profileData, name: e.target.value })} fullWidth sx={fieldSx} />
            <TextField label="Email Address" value={profileData.email} disabled fullWidth sx={fieldSx} />
            <TextField label="Phone Number" value={profileData.phone || ''} onChange={e => setProfileData({ ...profileData, phone: e.target.value })} fullWidth sx={fieldSx} />
            <button onClick={handleUpdateProfile} style={{ padding: '14px', background: `linear-gradient(135deg, ${ACCENT}, #2a3f6a)`, color: '#fff', border: 'none', borderRadius: 12, fontWeight: 800, fontSize: 14, fontFamily: "'Inter', sans-serif", cursor: 'pointer' }}>Save Changes</button>
          </div>
        </Dialog>

        <Dialog open={addressDialogOpen} onClose={() => setAddressDialogOpen(false)} fullWidth maxWidth="sm"
          PaperProps={{ style: { background: '#fff', color: TEXT, border: '1px solid rgba(28,43,74,0.08)', borderRadius: 20, fontFamily: "'Inter', sans-serif", margin: 16, width: 'calc(100% - 32px)' } }}>
          <div style={{ padding: '20px', borderBottom: '1px solid rgba(28,43,74,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: TEXT }}>{editingAddress ? 'Edit Address' : 'Add Address'}</h2>
            <IconButton onClick={() => setAddressDialogOpen(false)} sx={{ color: MUTED }}><CloseIcon /></IconButton>
          </div>
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {['street_address', 'city', 'state', 'pincode'].map(field => (
              <TextField key={field} label={fieldLabel(field)} value={(addressForm as any)[field]} onChange={e => setAddressForm({ ...addressForm, [field]: e.target.value })} fullWidth sx={fieldSx} />
            ))}
            <FormControlLabel
              control={<Switch checked={addressForm.is_default} onChange={e => setAddressForm({ ...addressForm, is_default: e.target.checked })} sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: ACCENT }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: ACCENT } }} />}
              label={<span style={{ fontWeight: 600, fontSize: 14, color: TEXT }}>Set as default address</span>}
            />
            <button onClick={handleSaveAddress} style={{ padding: '14px', background: `linear-gradient(135deg, ${ACCENT}, #2a3f6a)`, color: '#fff', border: 'none', borderRadius: 12, fontWeight: 800, fontSize: 14, fontFamily: "'Inter', sans-serif", cursor: 'pointer' }}>{editingAddress ? 'Save Changes' : 'Add Address'}</button>
          </div>
        </Dialog>
      </div>
    );
  }

  /* ══════════════════════════════════════════════
     RENDER — Split-Panel Layout
  ══════════════════════════════════════════════ */
  return (
    <div style={{
      minHeight: '100vh', background: BG, color: TEXT,
      fontFamily: "'Inter', sans-serif", display: 'flex',
    }}>

      {/* ── LEFT SIDEBAR ── */}
      <aside style={{
        width: 300, minHeight: '100vh', flexShrink: 0,
        background: `linear-gradient(180deg, ${ACCENT} 0%, #162040 100%)`,
        display: 'flex', flexDirection: 'column',
        padding: '100px 0 32px',
        position: 'sticky', top: 0, height: '100vh',
        borderRight: '1px solid rgba(255,255,255,0.06)', zIndex: 10,
      }}>
        {/* Profile Card */}
        <div style={{ padding: '0 28px', marginBottom: 40 }}>
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '32px 20px 28px', borderRadius: 22,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(12px)',
          }}>
            <div style={{
              width: 88, height: 88, borderRadius: 22,
              background: `linear-gradient(135deg, ${GOLD}, #e8a944)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 16, boxShadow: '0 8px 28px rgba(212,146,42,0.35)',
              position: 'relative',
            }}>
              <span style={{ fontSize: 36, fontWeight: 900, color: '#fff' }}>
                {profileData.name ? profileData.name.charAt(0).toUpperCase() : '?'}
              </span>
              <div style={{
                position: 'absolute', bottom: -4, right: -4,
                width: 22, height: 22, borderRadius: 8,
                background: '#22C55E', border: `3px solid ${ACCENT}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <CheckCircleOutlineIcon sx={{ fontSize: 12, color: '#fff' }} />
              </div>
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: '0 0 4px', letterSpacing: '-0.02em', textAlign: 'center' }}>
              {profileData.name || 'Unknown User'}
            </h2>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: '0 0 16px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {profileData.role === 'AMC' ? 'AMC Premium Member' : profileData.role === 'ADMIN' ? 'Administrator' : 'TechVerse Member'}
            </p>
            <button onClick={() => setEditProfileOpen(true)} style={{
              width: '100%', padding: '10px', borderRadius: 12,
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
              color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 700,
              cursor: 'pointer', fontFamily: "'Inter', sans-serif",
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: `all 0.3s ${EASE}`,
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
            >
              <EditIcon sx={{ fontSize: 14 }} /> Edit Profile
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.12em', padding: '0 12px', margin: '0 0 8px' }}>Navigation</p>
          {tabs.map(item => {
            const isActive = activeTab === item.name;
            return (
              <button key={item.name} onClick={() => item.action ? item.action() : setActiveTab(item.name)} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px', borderRadius: 14,
                border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left',
                background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
                color: isActive ? '#fff' : 'rgba(255,255,255,0.55)',
                fontWeight: isActive ? 700 : 500, fontSize: 13,
                fontFamily: "'Inter', sans-serif",
                transition: `all 0.25s ${EASE}`,
                borderLeft: isActive ? `3px solid ${GOLD}` : '3px solid transparent',
              }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; } }}
              >
                {React.cloneElement(item.icon, { sx: { fontSize: 18, opacity: isActive ? 1 : 0.7 } })}
                <span style={{ flex: 1 }}>{item.name}</span>
                {item.action && <ArrowForwardIcon sx={{ fontSize: 14, opacity: 0.4 }} />}
              </button>
            );
          })}
          
          <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <button
              onClick={() => useUserStore.getState().logout()}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px', borderRadius: 14,
                border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left',
                background: 'transparent',
                color: 'rgba(255,255,255,0.45)',
                fontWeight: 600, fontSize: 13,
                fontFamily: "'Inter', sans-serif",
                transition: `all 0.25s ${EASE}`,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.08)'; e.currentTarget.style.color = '#fca5a5'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; }}
            >
              <LogoutIcon sx={{ fontSize: 18, opacity: 0.7 }} />
              <span style={{ flex: 1 }}>Logout</span>
            </button>
          </div>
        </nav>

        {/* Bottom Stats */}
        <div style={{ padding: '0 28px', marginTop: 'auto' }}>
          <div style={{ padding: '16px 20px', borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <ShieldIcon sx={{ fontSize: 16, color: '#22C55E' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Account Status</span>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <p style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: '0 0 2px' }}>{addresses.length}</p>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', margin: 0, fontWeight: 600 }}>Addresses</p>
              </div>
              <div style={{ width: 1, background: 'rgba(255,255,255,0.08)' }} />
              <div style={{ flex: 1, textAlign: 'center' }}>
                <p style={{ fontSize: 18, fontWeight: 800, color: '#22C55E', margin: '0 0 2px' }}>✓</p>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', margin: 0, fontWeight: 600 }}>Verified</p>
              </div>
              <div style={{ width: 1, background: 'rgba(255,255,255,0.08)' }} />
              <div style={{ flex: 1, textAlign: 'center' }}>
                <p style={{ fontSize: 18, fontWeight: 800, color: GOLD, margin: '0 0 2px' }}>
                  {profileData.role === 'AMC' ? 'AMC' : profileData.role === 'ADMIN' ? 'ADM' : 'STD'}
                </p>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', margin: 0, fontWeight: 600 }}>Plan</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── RIGHT CONTENT PANEL ── */}
      <main style={{
        flex: 1, minHeight: '100vh', padding: '100px 48px 80px',
        background: `
          radial-gradient(circle at 80% 20%, rgba(212, 146, 42, 0.05), transparent 40%),
          radial-gradient(circle at 20% 80%, rgba(28, 43, 74, 0.03), transparent 40%),
          ${BG}
        `,
        overflow: 'auto',
      }}>
        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: GOLD }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.1em' }}>My Profile</span>
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: TEXT, letterSpacing: '-0.04em', margin: '0 0 6px' }}>{activeTab}</h1>
          <p style={{ fontSize: 14, color: MUTED, margin: 0, fontWeight: 500 }}>
            {activeTab === 'Account' ? 'Manage your personal information and account settings' :
             activeTab === 'Notifications' ? 'Control how you receive updates and alerts' :
             activeTab === 'Addresses' ? 'Manage your saved delivery addresses' :
             activeTab === 'Billing' ? 'View payment methods and billing information' :
             'View and manage your account settings'}
          </p>
        </div>

        {/* Quick Info Bar (Account only) */}
        {activeTab === 'Account' && (
          <div style={{
            display: 'flex', gap: 20, marginBottom: 32,
            padding: '20px 28px', borderRadius: 18,
            background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.85)',
          }}>
            {[
              { label: 'Email', value: profileData.email, icon: <EmailIcon sx={{ fontSize: 16, color: ACCENT }} /> },
              { label: 'Phone', value: profileData.phone || 'Not set', icon: <PhoneIphoneIcon sx={{ fontSize: 16, color: GOLD }} /> },
              { label: 'Role', value: profileData.role === 'AMC' ? 'AMC Premium' : profileData.role === 'ADMIN' ? 'Administrator' : 'Customer', icon: <VerifiedIcon sx={{ fontSize: 16, color: '#22C55E' }} /> },
            ].map((item, i) => (
              <React.Fragment key={i}>
                {i > 0 && <div style={{ width: 1, background: 'rgba(28,43,74,0.06)' }} />}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(28,43,74,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {item.icon}
                  </div>
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, color: MUTED, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</p>
                    <p style={{ fontSize: 13, fontWeight: 700, color: TEXT, margin: 0 }}>{item.value}</p>
                  </div>
                </div>
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Dynamic Content */}
        <section>{renderContent()}</section>

        {/* Trust Bar */}
        <section style={{ padding: '40px 0 0', borderTop: '1px solid rgba(28,43,74,0.06)', marginTop: 48 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {[
              { icon: <ShieldIcon sx={{ fontSize: 20, color: ACCENT }} />, title: 'Data Protected', desc: 'End-to-end encryption on all personal info' },
              { icon: <VerifiedIcon sx={{ fontSize: 20, color: '#22C55E' }} />, title: 'Verified Account', desc: 'Your identity is confirmed and secured' },
              { icon: <CheckCircleOutlineIcon sx={{ fontSize: 20, color: GOLD }} />, title: 'Privacy First', desc: 'We never share your data with third parties' },
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 14, padding: '18px 20px',
                borderRadius: 16, background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.7)', transition: `all 0.3s ${EASE}`,
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.7)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'none'; (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.5)'; }}
              >
                <div style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(28,43,74,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {item.icon}
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: TEXT, margin: '0 0 3px' }}>{item.title}</p>
                  <p style={{ fontSize: 11, color: MUTED, margin: 0, lineHeight: 1.5, fontWeight: 500 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ── EDIT PROFILE DIALOG ── */}
      <Dialog
        open={editProfileOpen}
        onClose={() => setEditProfileOpen(false)}
        PaperProps={{ style: {
          background: 'rgba(255,255,255,0.98)', color: TEXT,
          border: '1px solid rgba(28,43,74,0.08)', borderRadius: 24,
          width: '100%', maxWidth: 480, fontFamily: "'Inter', sans-serif",
          boxShadow: '0 24px 64px rgba(0,0,0,0.12)',
        } }}
      >
        <div style={{ padding: '24px 28px', borderBottom: '1px solid rgba(28,43,74,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(28,43,74,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PersonIcon sx={{ fontSize: 18, color: ACCENT }} />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>Edit Profile</h2>
          </div>
          <IconButton onClick={() => setEditProfileOpen(false)} sx={{ color: MUTED, width: 36, height: 36, '&:hover': { background: 'rgba(28,43,74,0.06)' } }}>
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </div>
        <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <TextField label="Full Name" value={profileData.name} onChange={(e) => setProfileData({ ...profileData, name: e.target.value })} fullWidth sx={fieldSx} />
          <TextField label="Email Address" value={profileData.email} disabled fullWidth sx={{ ...fieldSx, '& .MuiOutlinedInput-root': { ...fieldSx['& .MuiOutlinedInput-root'], opacity: 0.6 } }} />
          <TextField label="Phone Number" value={profileData.phone || ''} onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })} fullWidth sx={fieldSx} />
          <Button
            onClick={handleUpdateProfile}
            sx={{
              background: `linear-gradient(135deg, ${ACCENT}, #2a3f6a)`, color: '#fff',
              padding: '14px', fontWeight: 700, borderRadius: '14px', mt: 1, fontSize: 14,
              textTransform: 'none', fontFamily: "'Inter', sans-serif",
              boxShadow: `0 4px 16px ${ACCENT}22`,
              '&:hover': { background: '#243660', boxShadow: `0 6px 20px ${ACCENT}33` },
            }}
          >
            Save Changes
          </Button>
        </div>
      </Dialog>

      {/* ── EDIT ADDRESS DIALOG ── */}
      <Dialog
        open={addressDialogOpen}
        onClose={() => setAddressDialogOpen(false)}
        PaperProps={{ style: {
          background: 'rgba(255,255,255,0.98)', color: TEXT,
          border: '1px solid rgba(28,43,74,0.08)', borderRadius: 24,
          width: '100%', maxWidth: 480, fontFamily: "'Inter', sans-serif",
          boxShadow: '0 24px 64px rgba(0,0,0,0.12)',
        } }}
      >
        <div style={{ padding: '24px 28px', borderBottom: '1px solid rgba(28,43,74,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(28,43,74,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LocationOnIcon sx={{ fontSize: 18, color: ACCENT }} />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>{editingAddress ? 'Edit Address' : 'Add New Address'}</h2>
          </div>
          <IconButton onClick={() => setAddressDialogOpen(false)} sx={{ color: MUTED, width: 36, height: 36, '&:hover': { background: 'rgba(28,43,74,0.06)' } }}>
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </div>
        <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {['street_address', 'city', 'state', 'pincode'].map(field => (
            <TextField
              key={field}
              label={fieldLabel(field)}
              value={(addressForm as any)[field]}
              onChange={(e) => setAddressForm({ ...addressForm, [field]: e.target.value })}
              fullWidth
              sx={fieldSx}
            />
          ))}
          <FormControlLabel
            control={<Switch checked={addressForm.is_default} onChange={(e) => setAddressForm({ ...addressForm, is_default: e.target.checked })} sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: ACCENT }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: ACCENT } }} />}
            label={<span style={{ fontWeight: 600, fontSize: 14 }}>Set as default address</span>}
          />
          <Button
            onClick={handleSaveAddress}
            sx={{
              background: `linear-gradient(135deg, ${ACCENT}, #2a3f6a)`, color: '#fff',
              padding: '14px', fontWeight: 700, borderRadius: '14px', mt: 1, fontSize: 14,
              textTransform: 'none', fontFamily: "'Inter', sans-serif",
              boxShadow: `0 4px 16px ${ACCENT}22`,
              '&:hover': { background: '#243660', boxShadow: `0 6px 20px ${ACCENT}33` },
            }}
          >
            {editingAddress ? 'Save Changes' : 'Add Address'}
          </Button>
        </div>
      </Dialog>
    </div>
  );
};
