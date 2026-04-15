// src/pages/CheckoutPage.tsx - Modern full-width checkout
import React, { useState, useEffect } from 'react';
import { useCartStore } from '../stores/cartStore';
import { useProductStore } from '../stores/productStore';
import { useUserStore } from '../stores/userStore';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress
} from '@mui/material';
import apiClient, { getImageUrl } from '../api';

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

    // Payment Selection state
    const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | 'cod'>('upi');

    // Affiliate state
    const [manualCode, setManualCode] = useState('');
    const [isApplyingCode, setIsApplyingCode] = useState(false);
    const [affiliateName, setAffiliateName] = useState(localStorage.getItem('techverse_affiliate_name') || '');
    const [affiliateCode, setAffiliateCode] = useState(localStorage.getItem('techverse_affiliate_code') || '');
    const [affiliateError, setAffiliateError] = useState<string | null>(null);

    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const initializeCheckout = async () => {
            try {
                if (!isAuthenticated || !user) {
                    await checkAuthStatus();
                }

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

                    fetchAddresses();
                    checkProfileCompletion();
                    setAuthChecking(false);
                }, 1000);

            } catch (error) {
                setAuthChecking(false);
                window.location.href = '/login';
            }
        };

        initializeCheckout();
    }, []);

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
        if (!tempName.trim() || !tempPhone.trim()) {
            alert('Please fill out all fields');
            return;
        }
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

            useUserStore.setState({ user: response.data });

            setProfileDialogOpen(false);
            setProfileIncomplete(false);
            setMissingFields([]);
            await checkProfileCompletion();

        } catch (error) {
            alert('Failed to update profile. Please try again.');
        } finally {
            setProfileLoading(false);
        }
    };

    const handleApplyAffiliate = async () => {
        if (!manualCode.trim()) return;
        setIsApplyingCode(true);
        setAffiliateError(null);
        try {
            const response = await apiClient.get(`/api/affiliates/verify/${manualCode.trim()}/`);
            if (response.data.success) {
                localStorage.setItem('techverse_affiliate_code', response.data.code);
                localStorage.setItem('techverse_affiliate_name', response.data.affiliate_name);
                setAffiliateCode(response.data.code);
                setAffiliateName(response.data.affiliate_name);
                setManualCode('');
                setAffiliateError(null);
            }
        } catch (error: any) {
            setAffiliateError(error.response?.data?.error || 'Invalid affiliate code');
            localStorage.removeItem('techverse_affiliate_code');
            localStorage.removeItem('techverse_affiliate_name');
            setAffiliateCode('');
            setAffiliateName('');
        } finally {
            setIsApplyingCode(false);
        }
    };

    const handleRemoveAffiliate = () => {
        localStorage.removeItem('techverse_affiliate_code');
        localStorage.removeItem('techverse_affiliate_name');
        setAffiliateCode('');
        setAffiliateName('');
    };

    const handlePlaceOrder = async () => {
        if (paymentMethod === 'cod') {
            alert("Cash on Delivery is currently unavailable.");
            return;
        }

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
            const affiliateCode = localStorage.getItem('techverse_affiliate_code');

            const payload = {
                address_id: selectedAddress,
                items: items.map((item) => ({
                    product_slug: item.product.slug,
                    quantity: item.quantity,
                })),
                affiliate_code: affiliateCode
            };

            const response = await apiClient.post('/api/orders/create-bulk/', payload);
            const orderId = response.data.id;

            // Clear the cart locally once order is created in backend
            clearCart();

            const paymentResponse = await apiClient.post('/api/payments/initiate/', {
                order_id: orderId
            });

            if (paymentResponse.data.redirect_url) {
                window.location.href = paymentResponse.data.redirect_url;
            } else {
                throw new Error('Invalid payment response');
            }

        } catch (error) {
            alert('Failed to place order. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const totalPrice = getTotalPrice();

    if (authChecking) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] bg-[#FAF9F5] text-[#1A1814] p-10">
                <style>{`
                    .material-symbols-outlined {
                        font-family: 'Material Symbols Outlined';
                        font-style: normal;
                        font-size: 24px;
                        display: inline-block;
                        line-height: 1;
                        text-transform: none;
                        white-space: nowrap;
                        font-weight: normal;
                    }
                `}</style>
                <CircularProgress sx={{ color: '#1C2B4A' }} />
                <p className="mt-4 text-[#8A8279] font-medium text-sm">Loading checkout...</p>
            </div>
        );
    }

    return (
        <div 
            className="font-['Inter',sans-serif] text-[#1A1814] min-h-screen pb-20 pt-[80px] md:pt-[100px] relative overflow-hidden"
            style={{ backgroundColor: '#FAF9F5' }}
        >
            <style>{`
                .material-symbols-outlined {
                    font-family: 'Material Symbols Outlined';
                    font-style: normal;
                    font-size: 24px;
                    display: inline-block;
                    line-height: 1;
                    text-transform: none;
                    white-space: nowrap;
                    font-weight: normal;
                }
            `}</style>

            {/* Subtle Background Blobs — matching site palette */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(212,146,42,0.07) 0%, transparent 70%)' }} />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(28,43,74,0.06) 0%, transparent 70%)' }} />

            <div className="w-full max-w-[1400px] mx-auto px-4 md:px-8 relative z-10">
                <div className="w-full">

                    {/* Header */}
                    <div className="mb-8 md:mb-10">
                        <p className="text-xs font-semibold text-[#D4922A] tracking-[0.2em] uppercase mb-2">Techverse Store</p>
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[#1A1814]">Checkout</h1>
                        <p className="mt-1.5 text-[#6B6156] text-sm">Review your order and complete your purchase securely.</p>
                    </div>

                    {/* Profile Incomplete Banner */}
                    {profileIncomplete && (
                        <div className="mb-6 border border-[#D4922A]/30 bg-amber-50 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 flex-shrink-0 rounded-full bg-[#D4922A]/15 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[#D4922A] text-lg">warning</span>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-amber-900">Profile Incomplete</p>
                                    <p className="text-xs text-amber-700 mt-0.5">Missing: <span className="font-bold">{missingFields.join(', ')}</span></p>
                                </div>
                            </div>
                            {missingFields.includes('name') || missingFields.includes('phone') ? (
                                <button onClick={() => setProfileDialogOpen(true)} className="flex-shrink-0 px-5 py-2 bg-[#D4922A] hover:bg-[#b87b24] text-white text-xs font-semibold rounded-full transition-colors">
                                    Complete Profile
                                </button>
                            ) : (
                                <button onClick={() => window.location.href = '/profile'} className="flex-shrink-0 px-5 py-2 bg-[#1C2B4A] hover:bg-[#243660] text-white text-xs font-semibold rounded-full transition-colors">
                                    Add Address
                                </button>
                            )}
                        </div>
                    )}

                    {/* Two-column grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">

                        {/* Left Column */}
                        <div className="lg:col-span-8 space-y-5">

                            {/* Order Items */}
                            <section className="bg-white border border-[rgba(28,43,74,0.08)] p-6 md:p-7 rounded-2xl shadow-sm">
                                <div className="flex items-center gap-2.5 mb-5">
                                    <span className="material-symbols-outlined text-[#1C2B4A] text-xl">shopping_bag</span>
                                    <h2 className="text-base font-semibold text-[#1A1814]">Order Items</h2>
                                    <span className="ml-auto text-xs font-medium text-[#6B6156] bg-[rgba(28,43,74,0.05)] px-2.5 py-0.5 rounded-full">{items.length} item{items.length > 1 ? 's' : ''}</span>
                                </div>
                                <div className="space-y-3">
                                    {items.map((item) => (
                                        <div key={item.product.id} className="flex items-center gap-4 p-4 rounded-xl bg-[#FAF9F5] border border-[rgba(28,43,74,0.06)] hover:border-[rgba(28,43,74,0.14)] transition-colors">
                                            <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center border border-[rgba(28,43,74,0.07)]">
                                                {item.product.image ? (
                                                    <img alt={item.product.name} className="w-14 h-14 md:w-16 md:h-16 object-contain" src={getImageUrl(item.product.image)} />
                                                ) : (
                                                    <span className="text-2xl font-bold text-[#D4922A]">{item.product.name.charAt(0)}</span>
                                                )}
                                            </div>
                                            <div className="flex-grow min-w-0">
                                                <h3 className="font-semibold text-sm md:text-base text-[#1A1814] line-clamp-2 leading-snug">{item.product.name}</h3>
                                                <p className="text-xs text-[#6B6156] mt-1">{item.product.category.name} · Qty: {item.quantity}</p>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <p className="text-base md:text-lg font-bold text-[#1A1814]">₹{(parseFloat(item.product.price) * item.quantity).toFixed(2)}</p>
                                                <p className="text-[11px] text-[#6B6156] mt-0.5">₹{parseFloat(item.product.price).toFixed(2)} each</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Delivery Address */}
                            <section className="bg-white border border-[rgba(28,43,74,0.08)] p-6 md:p-7 rounded-2xl shadow-sm">
                                <div className="flex items-center gap-2.5 mb-5">
                                    <span className="material-symbols-outlined text-[#1C2B4A] text-xl">location_on</span>
                                    <h2 className="text-base font-semibold text-[#1A1814]">Delivery Address</h2>
                                </div>

                                {addresses.length === 0 ? (
                                    <div className="p-8 text-center border border-dashed border-[rgba(28,43,74,0.15)] rounded-xl bg-[rgba(28,43,74,0.02)]">
                                        <span className="material-symbols-outlined text-4xl text-[#D4922A] block mb-2">add_location_alt</span>
                                        <p className="text-[#6B6156] text-sm font-medium mb-4">No saved addresses found</p>
                                        <button onClick={() => window.location.href = '/profile'} className="px-6 py-2.5 border border-[#1C2B4A] text-[#1C2B4A] text-xs font-semibold hover:bg-[#1C2B4A] hover:text-white transition-colors rounded-full">
                                            Add Address
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {addresses.map((address) => (
                                            <div
                                                key={address.id}
                                                onClick={() => setSelectedAddress(address.id.toString())}
                                                className={`cursor-pointer border p-4 rounded-xl transition-all duration-200 ${
                                                    selectedAddress === address.id.toString()
                                                        ? 'border-[#1C2B4A] bg-[rgba(28,43,74,0.04)] shadow-sm'
                                                        : 'border-[rgba(28,43,74,0.08)] bg-[#FAF9F5] hover:border-[rgba(28,43,74,0.2)]'
                                                }`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="mt-0.5 flex-shrink-0">
                                                        <span className={`material-symbols-outlined text-lg ${selectedAddress === address.id.toString() ? 'text-[#1C2B4A]' : 'text-[#6B6156]'}`}>
                                                            {selectedAddress === address.id.toString() ? 'radio_button_checked' : 'radio_button_unchecked'}
                                                        </span>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className={`font-semibold text-sm truncate ${selectedAddress === address.id.toString() ? 'text-[#1C2B4A]' : 'text-[#1A1814]'}`}>{address.street_address}</p>
                                                        <p className="text-xs text-[#6B6156] leading-relaxed mt-0.5">{address.city}, {address.state} — {address.pincode}</p>
                                                        {address.is_default && (
                                                            <span className="inline-block mt-2 px-2 py-0.5 bg-[rgba(28,43,74,0.08)] text-[#1C2B4A] text-[10px] font-semibold rounded-full">Default</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {addresses.length > 0 && (
                                    <button onClick={() => window.location.href = '/profile'} className="mt-4 text-xs font-medium text-[#6B6156] hover:text-[#1C2B4A] transition-colors w-full text-center pt-2">
                                        + Manage Addresses
                                    </button>
                                )}
                            </section>

                            {/* Shipping */}
                            <section className="bg-white border border-[rgba(28,43,74,0.08)] p-6 md:p-7 rounded-2xl shadow-sm">
                                <div className="flex items-center gap-2.5 mb-5">
                                    <span className="material-symbols-outlined text-[#1C2B4A] text-xl">local_shipping</span>
                                    <h2 className="text-base font-semibold text-[#1A1814]">Shipping</h2>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="p-4 rounded-xl bg-[#FAF9F5] border border-[rgba(28,43,74,0.06)] flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-[#6B6156] mb-0.5">Method</p>
                                            <p className="text-sm font-semibold text-[#1A1814]">Standard Delivery</p>
                                        </div>
                                        <span className="text-sm font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-full">FREE</span>
                                    </div>
                                    <div className="p-4 rounded-xl bg-[#FAF9F5] border border-[rgba(28,43,74,0.06)]">
                                        <p className="text-xs text-[#6B6156] mb-0.5">Estimated Delivery</p>
                                        <p className="text-sm font-semibold text-[#1A1814]">3–5 Business Days</p>
                                    </div>
                                </div>
                            </section>

                            {/* Payment Method */}
                            <section className="bg-white border border-[rgba(28,43,74,0.08)] p-6 md:p-7 rounded-2xl shadow-sm">
                                <div className="flex items-center gap-2.5 mb-5">
                                    <span className="material-symbols-outlined text-[#1C2B4A] text-xl">account_balance_wallet</span>
                                    <h2 className="text-base font-semibold text-[#1A1814]">Payment Method</h2>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <button
                                        onClick={() => setPaymentMethod('card')}
                                        className={`p-5 rounded-xl border flex flex-col items-center gap-3 transition-all ${
                                            paymentMethod === 'card'
                                                ? 'border-[#1C2B4A] bg-[rgba(28,43,74,0.04)] shadow-sm'
                                                : 'border-[rgba(28,43,74,0.08)] bg-[#FAF9F5] hover:border-[rgba(28,43,74,0.2)]'
                                        }`}
                                    >
                                        <span className={`material-symbols-outlined text-2xl ${paymentMethod === 'card' ? 'text-[#1C2B4A]' : 'text-[#6B6156]'}`}>credit_card</span>
                                        <span className={`text-xs font-semibold ${paymentMethod === 'card' ? 'text-[#1C2B4A]' : 'text-[#6B6156]'}`}>Card</span>
                                    </button>
                                    <button
                                        onClick={() => setPaymentMethod('upi')}
                                        className={`p-5 rounded-xl border flex flex-col items-center gap-3 transition-all ${
                                            paymentMethod === 'upi'
                                                ? 'border-[#1C2B4A] bg-[rgba(28,43,74,0.04)] shadow-sm'
                                                : 'border-[rgba(28,43,74,0.08)] bg-[#FAF9F5] hover:border-[rgba(28,43,74,0.2)]'
                                        }`}
                                    >
                                        <span className={`material-symbols-outlined text-2xl ${paymentMethod === 'upi' ? 'text-[#1C2B4A]' : 'text-[#6B6156]'}`}>qr_code_scanner</span>
                                        <span className={`text-xs font-semibold ${paymentMethod === 'upi' ? 'text-[#1C2B4A]' : 'text-[#6B6156]'}`}>UPI</span>
                                    </button>
                                    <div className="p-5 rounded-xl border border-[rgba(28,43,74,0.05)] bg-[rgba(28,43,74,0.02)] flex flex-col items-center gap-3 cursor-not-allowed relative overflow-hidden group opacity-50">
                                        <span className="material-symbols-outlined text-2xl text-[#6B6156]">payments</span>
                                        <span className="text-xs font-semibold text-[#6B6156] line-through">Cash on Delivery</span>
                                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 rounded-xl">
                                            <span className="text-[10px] font-semibold text-[#6B6156] text-center px-3">Currently Unavailable</span>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* Right Sidebar */}
                        <aside className="lg:col-span-4 lg:sticky lg:top-28">
                            <div className="bg-white border border-[rgba(28,43,74,0.1)] p-6 md:p-7 rounded-2xl shadow-sm">
                                <h2 className="text-base font-semibold text-[#1A1814] mb-5 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[#1C2B4A] text-xl">receipt_long</span>
                                    Order Summary
                                </h2>

                                <div className="space-y-3 mb-5">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-[#6B6156]">Subtotal ({items.length} item{items.length > 1 ? 's' : ''})</span>
                                        <span className="text-[#1A1814] font-semibold">₹{totalPrice.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-[#6B6156]">Shipping</span>
                                        <span className="text-green-700 font-semibold">FREE</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-[#6B6156]">Taxes</span>
                                        <span className="text-[#1A1814] font-medium">Included</span>
                                    </div>
                                </div>

                                {/* Affiliate */}
                                {affiliateCode ? (
                                    <div className="mb-5 flex items-center justify-between bg-[rgba(212,146,42,0.07)] border border-[rgba(212,146,42,0.25)] p-3.5 rounded-xl group">
                                        <div>
                                            <p className="text-[10px] font-semibold text-[#6B6156] uppercase tracking-wider mb-1">Via Referral</p>
                                            <div className="flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-[14px] text-[#D4922A]">verified</span>
                                                <span className="text-sm font-bold text-[#1C2B4A]">{affiliateName || affiliateCode}</span>
                                            </div>
                                        </div>
                                        <button onClick={handleRemoveAffiliate} className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-50 rounded-full" title="Remove">
                                            <span className="material-symbols-outlined text-red-400 text-[16px]">close</span>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="mb-5 pt-4 border-t border-[rgba(28,43,74,0.06)]">
                                        <label className="text-[10px] font-bold text-[#6B6156] uppercase tracking-wider block mb-2">Referral Code</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={manualCode}
                                                onChange={(e) => { setManualCode(e.target.value); if (affiliateError) setAffiliateError(null); }}
                                                placeholder="Enter code"
                                                className={`flex-1 bg-[#FAF9F5] border ${affiliateError ? 'border-red-300 text-red-600' : 'border-[rgba(28,43,74,0.12)] text-[#1C2B4A]'} rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:border-[#1C2B4A] transition-all placeholder:text-[#6B6156]/50 uppercase tracking-widest`}
                                            />
                                            <button
                                                onClick={handleApplyAffiliate}
                                                disabled={isApplyingCode || !manualCode.trim()}
                                                className="bg-[#1C2B4A] hover:bg-[#243660] disabled:bg-[rgba(28,43,74,0.1)] disabled:text-[#6B6156] text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center min-w-[72px]"
                                            >
                                                {isApplyingCode ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Apply'}
                                            </button>
                                        </div>
                                        {affiliateError && (
                                            <p className="text-[11px] text-red-500 mt-1.5 flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[13px]">error</span>
                                                {affiliateError}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Total */}
                                <div className="pt-4 border-t border-[rgba(28,43,74,0.08)] mb-5">
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <p className="text-xs text-[#6B6156] mb-1">Total</p>
                                            <p className="text-3xl font-bold text-[#1A1814] tracking-tight">₹{totalPrice.toFixed(2)}</p>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-green-700 bg-green-50 px-2.5 py-1.5 rounded-full">
                                            <span className="material-symbols-outlined text-[13px]">verified_user</span>
                                            <span className="text-[10px] font-semibold">Secure</span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handlePlaceOrder}
                                    disabled={loading || profileIncomplete || !selectedAddress}
                                    className={`w-full py-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 ${
                                        loading || profileIncomplete || !selectedAddress
                                            ? 'bg-[rgba(28,43,74,0.07)] text-[#6B6156] cursor-not-allowed'
                                            : 'bg-[#1C2B4A] hover:bg-[#243660] text-white shadow-[0_4px_14px_rgba(28,43,74,0.2)] hover:shadow-[0_6px_20px_rgba(28,43,74,0.3)]'
                                    }`}
                                >
                                    {loading
                                        ? <><CircularProgress size={18} sx={{ color: 'currentColor' }} /> Processing...</>
                                        : <><span className="material-symbols-outlined text-lg">lock</span> Place Order</>
                                    }
                                </button>

                                <p className="text-center text-[11px] text-[#6B6156] mt-4">
                                    By proceeding, you agree to our{' '}
                                    <a className="text-[#1C2B4A] hover:underline" href="/terms">Terms & Conditions</a>
                                </p>
                            </div>

                            {/* Trust Badges */}
                            <div className="mt-5 grid grid-cols-3 gap-3">
                                <div className="flex flex-col items-center gap-1.5 text-[11px] font-medium text-[#6B6156] text-center">
                                    <div className="w-9 h-9 rounded-full bg-white border border-[rgba(28,43,74,0.08)] flex items-center justify-center shadow-sm">
                                        <span className="material-symbols-outlined text-[#1C2B4A] text-lg">shield</span>
                                    </div>
                                    Secure Payment
                                </div>
                                <div className="flex flex-col items-center gap-1.5 text-[11px] font-medium text-[#6B6156] text-center">
                                    <div className="w-9 h-9 rounded-full bg-white border border-[rgba(28,43,74,0.08)] flex items-center justify-center shadow-sm">
                                        <span className="material-symbols-outlined text-[#D4922A] text-lg">history</span>
                                    </div>
                                    Easy Returns
                                </div>
                                <div className="flex flex-col items-center gap-1.5 text-[11px] font-medium text-[#6B6156] text-center">
                                    <div className="w-9 h-9 rounded-full bg-white border border-[rgba(28,43,74,0.08)] flex items-center justify-center shadow-sm">
                                        <span className="material-symbols-outlined text-[#1C2B4A] text-lg">support_agent</span>
                                    </div>
                                    24/7 Support
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>
            </div>

            {/* Profile Completion Dialog */}
            <Dialog
                open={profileDialogOpen}
                onClose={() => !profileLoading && setProfileDialogOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        background: '#FFFFFF',
                        border: '1px solid rgba(28,43,74,0.1)',
                        borderRadius: '20px',
                        color: '#1A1814',
                        boxShadow: '0 20px 60px rgba(28,43,74,0.12)'
                    }
                }}
            >
                <DialogTitle sx={{ borderBottom: '1px solid rgba(28,43,74,0.08)', display: 'flex', alignItems: 'center', gap: 2, p: 3 }}>
                    <div className="h-10 w-10 rounded-full bg-[rgba(28,43,74,0.06)] flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-[#1C2B4A] text-xl">badge</span>
                    </div>
                    <div>
                        <span className="block font-semibold text-base text-[#1A1814]">Complete Your Profile</span>
                        <span className="block text-xs text-[#6B6156] mt-0.5">Please fill in your name and phone number to continue.</span>
                    </div>
                </DialogTitle>

                <DialogContent sx={{ p: 3, mt: 1 }}>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-medium text-[#6B6156] block mb-1.5">Full Name</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B6156] text-lg">person</span>
                                <input
                                    className="w-full bg-[#FAF9F5] border border-[rgba(28,43,74,0.12)] focus:border-[#1C2B4A] rounded-xl py-3 pl-10 pr-4 text-[#1A1814] text-sm outline-none transition-all"
                                    placeholder="Your full name" type="text"
                                    value={tempName} onChange={e => setTempName(e.target.value)} disabled={profileLoading}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-[#6B6156] block mb-1.5">Phone Number</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B6156] text-lg">call</span>
                                <input
                                    className="w-full bg-[#FAF9F5] border border-[rgba(28,43,74,0.12)] focus:border-[#1C2B4A] rounded-xl py-3 pl-10 pr-4 text-[#1A1814] text-sm outline-none transition-all"
                                    placeholder="+91 XXXXX XXXXX" type="text"
                                    value={tempPhone} onChange={e => setTempPhone(e.target.value)} disabled={profileLoading}
                                />
                            </div>
                        </div>
                    </div>
                </DialogContent>

                <DialogActions sx={{ p: 3, pt: 0, gap: 2 }}>
                    <button onClick={() => setProfileDialogOpen(false)} disabled={profileLoading} className="px-5 py-2.5 text-xs font-medium text-[#6B6156] hover:text-[#1A1814] transition-colors rounded-full">
                        Cancel
                    </button>
                    <button
                        onClick={handleCompleteProfile} disabled={profileLoading || !tempName.trim() || !tempPhone.trim()}
                        className="px-7 py-2.5 bg-[#1C2B4A] hover:bg-[#243660] disabled:bg-[rgba(28,43,74,0.08)] disabled:text-[#6B6156] text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-2"
                    >
                        {profileLoading
                            ? <><CircularProgress size={14} sx={{ color: 'currentColor' }} /> Saving...</>
                            : <><span className="material-symbols-outlined text-sm">save</span> Save</>
                        }
                    </button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default CheckoutPage;
