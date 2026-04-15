// src/components/LoginSuccessHandler.tsx - Complete Google OAuth handler
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useUserStore } from '../stores/userStore';
import { Box, CircularProgress, Typography } from '@mui/material';

export const LoginSuccessHandler = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { checkAuthStatus, setUserFromServer } = useUserStore();
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const handleGoogleLogin = async () => {
      // Check if this is a Google OAuth callback
      const loginStatus = searchParams.get('login');
      const accessToken = searchParams.get('access');
      const refreshToken = searchParams.get('refresh');
      const error = searchParams.get('error');

      // Handle OAuth errors
      if (error) {

        const errorMessage = searchParams.get('message') || 'Authentication failed';

        // Clean URL and redirect to login
        window.history.replaceState({}, document.title, '/login');
        navigate('/login', {
          replace: true,
          state: { error: errorMessage }
        });
        return;
      }

      // Handle successful OAuth callback
      if (loginStatus === 'success' && !processing) {
        setProcessing(true);


        // Case 1: Tokens provided in URL (preferred method)
        if (accessToken && refreshToken) {


          try {
            // Store tokens
            localStorage.setItem('access_token', accessToken);
            localStorage.setItem('refresh_token', refreshToken);


            // Fetch user data using the new token
            await checkAuthStatus();


            // Clean up URL
            window.history.replaceState({}, document.title, '/');

            // Show success message


            // Redirect to home
            navigate('/', { replace: true });

          } catch (error) {


            // Clear tokens if auth fails
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');

            // Redirect to login
            navigate('/login', {
              replace: true,
              state: { error: 'Failed to complete authentication. Please try again.' }
            });
          }
        }
        // Case 2: No tokens in URL, try session authentication
        else {


          try {
            // Try to check auth status (maybe session-based)
            await checkAuthStatus();


            // Clean up URL
            window.history.replaceState({}, document.title, '/');

            // Redirect to home
            navigate('/', { replace: true });

          } catch (error) {


            // Redirect to login
            navigate('/login', {
              replace: true,
              state: { error: 'Authentication session expired. Please login again.' }
            });
          }
        }

        setProcessing(false);
      }
    };

    handleGoogleLogin();
  }, [searchParams, checkAuthStatus, navigate, processing]);

  // Show loading indicator while processing OAuth callback
  if (processing || (searchParams.get('login') === 'success' && searchParams.get('access'))) {
    return (
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#FAF9F5',
          zIndex: 9999,
        }}
      >
        <CircularProgress
          size={60}
          sx={{
            color: '#1C2B4A',
            mb: 3
          }}
        />
        <Typography
          variant="h6"
          sx={{
            color: 'white',
            mb: 1,
            fontWeight: 500
          }}
        >
          Completing your login...
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: 'rgba(255, 255, 255, 0.6)'
          }}
        >
          Please wait while we set up your account
        </Typography>
      </Box>
    );
  }

  // Return null when not processing
  return null;
};