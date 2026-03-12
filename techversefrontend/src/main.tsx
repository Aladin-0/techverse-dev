// src/main.tsx - Updated with backend path check BEFORE React Router
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './ErrorBoundary';
import './index.css';
import './App.css';
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
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={darkTheme}>
        <SnackbarProvider>
          <CssBaseline />
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </SnackbarProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
