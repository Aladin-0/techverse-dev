// src/main.tsx - Updated with backend path check BEFORE React Router
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { SnackbarProvider } from 'notistack';

// ✅ CHECK BEFORE REACT LOADS - This runs FIRST
const backendPaths = ['/admin-panel/', '/api/', '/accounts/'];
const currentPath = window.location.pathname;

if (backendPaths.some(path => currentPath.startsWith(path))) {
  // Don't load React at all - let the page load normally (nginx will handle it)
  throw new Error('Backend path - stopping React initialization');
}

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
  typography: {
    // Use Inter everywhere — matches Stitch design exactly
    fontFamily: "'Inter', sans-serif",
    fontWeightBold: 900,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        'html, body, #root': {
          fontFamily: "'Inter', sans-serif",
        },
      },
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <ThemeProvider theme={darkTheme}>
      <SnackbarProvider 
        autoHideDuration={2500} 
        maxSnack={2}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        style={{ 
          fontSize: '14px', 
          borderRadius: '12px', 
          maxWidth: '90vw', 
          wordBreak: 'break-word', 
          whiteSpace: 'normal',
          lineHeight: 1.4
        }}
      >
        <CssBaseline />
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </SnackbarProvider>
    </ThemeProvider>
  </BrowserRouter>
);
