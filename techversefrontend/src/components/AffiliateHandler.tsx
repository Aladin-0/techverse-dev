import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api';
import { Box, CircularProgress, Typography } from '@mui/material';

const meshGradient = `
    radial-gradient(at 0% 0%, rgba(26, 26, 26, 0.15) 0px, transparent 50%),
    radial-gradient(at 100% 100%, rgba(26, 26, 26, 0.1) 0px, transparent 50%)
`;

export const AffiliateHandler: React.FC = () => {
    const { affiliateCode } = useParams<{ affiliateCode: string }>();
    const navigate = useNavigate();

    useEffect(() => {
        const trackAffiliate = async () => {
            if (!affiliateCode) {
                navigate('/', { replace: true });
                return;
            }

            try {
                // Verify and record click on backend
                const response = await apiClient.get(`/api/affiliates/verify/${affiliateCode}/`);
                
                if (response.data.success) {
                    // Store the code for checkout attribution
                    localStorage.setItem('techverse_affiliate_code', affiliateCode);
                    localStorage.setItem('techverse_affiliate_name', response.data.affiliate_name);
                    localStorage.setItem('techverse_affiliate_time', Date.now().toString());
                    
                    // Small delay for better UX feel
                    setTimeout(() => {
                        navigate('/store', { replace: true });
                    }, 1500);
                }
            } catch (error) {
                console.error("Affiliate tracking error:", error);
                localStorage.removeItem('techverse_affiliate_code');
                localStorage.removeItem('techverse_affiliate_name');
                navigate('/', { replace: true });
            }
        };

        trackAffiliate();
    }, [affiliateCode, navigate]);

    return (
        <Box sx={{ 
            height: '100vh', 
            width: '100%', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            background: '#FAF9F5',
            backgroundImage: meshGradient,
            fontFamily: "'Inter', sans-serif"
        }}>
            <CircularProgress size={60} thickness={2} sx={{ color: '#1C2B4A' }} />
            <Typography sx={{ mt: 4, color: '#1C2B4A', fontWeight: 900, letterSpacing: '0.4em', fontSize: 11, fontStyle: 'italic' }}>
                CREATOR LINK RECOGNIZED
            </Typography>
            <Typography variant="h4" sx={{ mt: 1, color: '#fff', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em', textShadow: '0 0 20px rgba(28,43,74,0.2)' }}>
                {localStorage.getItem('techverse_affiliate_name') ? `WELCOME TO ${localStorage.getItem('techverse_affiliate_name').toUpperCase()}'S CIRCLE` : 'ESTABLISHING CLEARANCE'}
            </Typography>
        </Box>
    );
};
