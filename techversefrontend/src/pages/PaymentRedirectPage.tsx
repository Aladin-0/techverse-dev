import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { styled } from '@mui/material/styles';
import apiClient from '../api';

const PageWrapper = styled(Box)(({ theme }) => ({
    backgroundColor: '#000000',
    color: 'white',
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '40px',
    fontFamily: "'Inter', sans-serif",
}));

const StatusCard = styled(Box)(({ theme }) => ({
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '20px',
    padding: '40px',
    maxWidth: '600px',
    width: '100%',
    backdropFilter: 'blur(20px)',
}));

const PremiumButton = styled(Button)(({ theme }) => ({
    backgroundColor: 'rgba(96, 165, 250, 0.15)',
    border: '1px solid rgba(96, 165, 250, 0.3)',
    color: '#60a5fa',
    borderRadius: '16px',
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: 600,
    textTransform: 'none',
    marginTop: '24px',
    transition: 'all 0.3s ease',
    '&:hover': {
        backgroundColor: 'rgba(96, 165, 250, 0.25)',
        borderColor: 'rgba(96, 165, 250, 0.4)',
        transform: 'translateY(-2px)',
    }
}));

const PaymentRedirectPage: React.FC = () => {
    const { transactionId } = useParams<{ transactionId: string }>();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'success' | 'failed' | 'error'>('loading');

    useEffect(() => {
        // We check the status by mimicking a callback to our own backend.
        // The backend `payment_callback` actually verifies payment status using PhonePe's Status API
        // when both S2S and client redirect happen. So we just hit `/api/payments/callback/` or
        // we could create a dedicated `status` endpoint if needed, but our callback view supports POSTs.

        // Actually, since PhonePe redirect is a GET to frontend, the backend status API can be polled.
        // Wait, we didn't add a dedicated status API, but the `payment_callback` handles `code, merchantId, transactionId`
        // Let's call our backend to verify via S2S Status Check!

        const verifyStatus = async () => {
            try {
                const response = await apiClient.post('/api/payments/callback/', {
                    code: 'VERIFY', // Our backend logic triggers S2S verify if code, merchantId, transactionId are sent
                    merchantId: 'PGTESTPAYUAT', // Or whatever is in env, the backend ignores it and uses its own config for checking. Let's just pass dummy so it triggers the verify_payment_status
                    transactionId: transactionId
                });

                if (response.data.status === 'SUCCESS') {
                    setStatus('success');
                } else if (response.data.status === 'FAILED') {
                    setStatus('failed');
                } else {
                    // Still pending
                    setTimeout(verifyStatus, 3000); // Poll again
                }
            } catch (err) {
                setStatus('error');
            }
        };

        if (transactionId) {
            verifyStatus();
        }
    }, [transactionId]);

    return (
        <PageWrapper>
            <StatusCard>
                {status === 'loading' && (
                    <>
                        <CircularProgress sx={{ color: '#60a5fa', mb: 3 }} size={60} />
                        <Typography variant="h5" fontWeight="600" mb={1}>
                            Verifying Payment...
                        </Typography>
                        <Typography sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                            Please do not refresh or close this page.
                        </Typography>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <CheckCircleIcon sx={{ fontSize: '80px', color: '#22c55e', mb: 3 }} />
                        <Typography variant="h4" fontWeight="700" color="#22c55e" mb={2}>
                            Payment Successful!
                        </Typography>
                        <Typography sx={{ color: 'rgba(255, 255, 255, 0.6)', mb: 4 }}>
                            Your transaction has been processed and your order is confirmed.
                            Transaction ID: {transactionId}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                            <PremiumButton onClick={() => navigate('/my-orders')}>
                                View Orders
                            </PremiumButton>
                            <PremiumButton onClick={() => navigate('/store')}>
                                Continue Shopping
                            </PremiumButton>
                        </Box>
                    </>
                )}

                {(status === 'failed' || status === 'error') && (
                    <>
                        <ErrorIcon sx={{ fontSize: '80px', color: '#ef4444', mb: 3 }} />
                        <Typography variant="h4" fontWeight="700" color="#ef4444" mb={2}>
                            Payment Failed
                        </Typography>
                        <Typography sx={{ color: 'rgba(255, 255, 255, 0.6)', mb: 4 }}>
                            We could not process your payment. If money was deducted, it will be refunded automatically.
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                            <PremiumButton onClick={() => navigate('/checkout')}>
                                Try Again
                            </PremiumButton>
                        </Box>
                    </>
                )}
            </StatusCard>
        </PageWrapper>
    );
};

export default PaymentRedirectPage;
