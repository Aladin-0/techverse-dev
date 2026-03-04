import { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Badge,
  Fade,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { styled } from '@mui/material/styles';

// Icons
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import HistoryIcon from '@mui/icons-material/History';
import HomeIcon from '@mui/icons-material/Home';
import StorefrontIcon from '@mui/icons-material/Storefront';
import MiscellaneousServicesIcon from '@mui/icons-material/MiscellaneousServices';
import CloseIcon from '@mui/icons-material/Close';
import GridViewIcon from '@mui/icons-material/GridView';
import InfoIcon from '@mui/icons-material/Info';
import ContactSupportIcon from '@mui/icons-material/ContactSupport';

import { useUserStore } from '../stores/userStore';
import { useCartStore } from '../stores/cartStore';
import { ShoppingCart } from './ShoppingCart';
import logoImage from '../components/Tlogo.png';

// --- STYLED COMPONENTS ---

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: 'transparent',
  backdropFilter: 'none',
  boxShadow: 'none',
  position: 'fixed',
  top: 0,
  zIndex: 1000,
  transition: 'all 0.4s ease',
  '&.scrolled': {
    backdropFilter: 'blur(20px)',
    backgroundColor: 'rgba(8, 8, 8, 0.7)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  },
}));

const MobileDockWrapper = styled(Box)(({ theme }) => ({
  display: 'none',
  [theme.breakpoints.down('md')]: {
    display: 'flex',
    position: 'fixed',
    bottom: '24px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '92%',
    maxWidth: '420px',
    height: '70px',
    backgroundColor: 'rgba(12, 12, 12, 0.8)',
    backdropFilter: 'blur(30px)',
    borderRadius: '35px',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    zIndex: 2500, // Above everything including drawers
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: '0 10px',
    boxShadow: '0 25px 50px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.1)',
  }
}));

const DockItem = styled(IconButton)(({ theme }) => ({
  color: 'rgba(255, 255, 255, 0.5)',
  padding: '14px',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&.active': {
    color: '#60a5fa',
    transform: 'translateY(-6px)',
    '& svg': { filter: 'drop-shadow(0 0 10px rgba(96, 165, 250, 0.8))' }
  },
  '&:active': { transform: 'scale(0.8)' }
}));

const CentralActionButton = styled(Box)(({ theme }) => ({
  width: '64px',
  height: '64px',
  borderRadius: '32px',
  background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  marginTop: '-40px',
  border: '6px solid #080808',
  boxShadow: '0 10px 25px rgba(59, 130, 246, 0.5)',
  cursor: 'pointer',
  zIndex: 2501,
  transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  '&:active': { transform: 'scale(0.85) translateY(5px)' }
}));

const MobileOverlay = styled(Box)({
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  backgroundColor: 'rgba(5, 5, 5, 0.94)',
  backdropFilter: 'blur(25px)',
  zIndex: 2400,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '30px'
});

const GridMenuButton = styled(Button)({
  flexDirection: 'column',
  height: '115px',
  width: '100%',
  borderRadius: '26px',
  backgroundColor: 'rgba(255,255,255,0.03)',
  color: 'white',
  border: '1px solid rgba(255,255,255,0.08)',
  textTransform: 'none',
  '&:active': { transform: 'scale(0.95)', backgroundColor: 'rgba(255,255,255,0.07)' },
  '& svg': { fontSize: '30px', marginBottom: '10px', color: '#60a5fa' }
});

// --- MAIN COMPONENT ---

export const NavBar = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();

  const [scrolled, setScrolled] = useState(false);
  const [menuExpanded, setMenuExpanded] = useState(false);
  const [profileAnchor, setProfileAnchor] = useState<null | HTMLElement>(null);

  const { isAuthenticated, user, logout } = useUserStore();
  const { openCart, closeCart, getTotalItems } = useCartStore(); // Added closeCart
  const totalItems = getTotalItems();

  // 1. UNIVERSAL CLEANUP: Close everything whenever the URL changes
  useEffect(() => {
    setMenuExpanded(false);
    closeCart();
    setProfileAnchor(null);
  }, [location.pathname, closeCart]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 2. NAV INTERCEPTOR: The "Bug-Killer" function
  const cleanNavigate = (path: string) => {
    setMenuExpanded(false);
    closeCart();
    setProfileAnchor(null);
    navigate(path);
  };

  const handleToggleCart = () => {
    setMenuExpanded(false);
    openCart();
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <StyledAppBar position="fixed" className={scrolled ? 'scrolled' : ''}>
        <Toolbar sx={{
          py: { xs: 0, md: 1.5 },
          minHeight: { xs: '56px', md: '64px' }
        }}>
          <Container maxWidth="lg" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <RouterLink to="/" style={{ textDecoration: 'none' }} onClick={() => cleanNavigate('/')}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <img src={logoImage} alt="Logo" style={{ width: '42px', height: '42px' }} />
                <Typography variant="h6" sx={{ fontWeight: 900, letterSpacing: -0.5, color: 'white', display: { xs: 'none', md: 'block' } }}>
                  TECHVERSE
                </Typography>
              </Box>
            </RouterLink>

            {!isMobile && (
              <Box sx={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                {['Store', 'Services', 'About'].map((item) => (
                  <Button
                    key={item}
                    component={RouterLink}
                    to={`/${item.toLowerCase()}`}
                    sx={{ color: '#A3A3A3', textTransform: 'none', fontWeight: 500, '&:hover': { color: 'white' } }}
                  >
                    {item}
                  </Button>
                ))}

                <IconButton onClick={openCart} sx={{ color: 'white' }}>
                  <Badge badgeContent={totalItems} color="primary" sx={{ '& .MuiBadge-badge': { fontWeight: 700 } }}>
                    <ShoppingCartIcon />
                  </Badge>
                </IconButton>

                {isAuthenticated ? (
                  <Button
                    onClick={(e) => setProfileAnchor(e.currentTarget)}
                    sx={{ color: 'white', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '14px', px: 2, py: 1, backdropFilter: 'blur(10px)' }}
                  >
                    <Avatar sx={{ width: 26, height: 26, mr: 1.5, bgcolor: '#3b82f6', fontSize: '12px', fontWeight: 700 }}>
                      {user?.name?.charAt(0).toUpperCase()}
                    </Avatar>
                    {user?.name.split(' ')[0]}
                  </Button>
                ) : (
                  <Button component={RouterLink} to="/login" variant="contained" sx={{ borderRadius: '12px', px: 3, fontWeight: 700, textTransform: 'none' }}>
                    Login
                  </Button>
                )}
              </Box>
            )}
          </Container>
        </Toolbar>
      </StyledAppBar>

      {/* --- INNOVATIVE MOBILE DOCK (Fixed & Optimized) --- */}
      <MobileDockWrapper>
        <DockItem onClick={() => cleanNavigate('/')} className={isActive('/') ? 'active' : ''}>
          <HomeIcon />
        </DockItem>
        <DockItem onClick={() => cleanNavigate('/store')} className={isActive('/store') ? 'active' : ''}>
          <StorefrontIcon />
        </DockItem>

        <CentralActionButton onClick={() => { closeCart(); setMenuExpanded(!menuExpanded); }}>
          {menuExpanded ? <CloseIcon sx={{ color: 'white', fontSize: '32px' }} /> : <GridViewIcon sx={{ color: 'white', fontSize: '32px' }} />}
        </CentralActionButton>

        <DockItem onClick={handleToggleCart} sx={{ color: totalItems > 0 ? '#60a5fa' : 'inherit' }}>
          <Badge badgeContent={totalItems} color="error" overlap="circular">
            <ShoppingCartIcon />
          </Badge>
        </DockItem>

        <DockItem onClick={() => cleanNavigate(isAuthenticated ? '/profile' : '/login')} className={isActive('/profile') ? 'active' : ''}>
          {isAuthenticated ? (
            <Avatar sx={{ width: 28, height: 28, fontSize: '12px', bgcolor: '#3b82f6', fontWeight: 800 }}>
              {user?.name?.charAt(0).toUpperCase()}
            </Avatar>
          ) : (
            <PersonIcon />
          )}
        </DockItem>
      </MobileDockWrapper>

      {/* --- MOBILE FULLSCREEN OVERLAY --- */}
      <Fade in={menuExpanded} unmountOnExit>
        <MobileOverlay>
          <Typography variant="h4" sx={{ mb: 6, fontWeight: 900, color: 'white', letterSpacing: -1.5 }}>
            EXPLORE
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2.5, width: '100%', maxWidth: '350px' }}>
            {[
              { label: 'Store', icon: <StorefrontIcon />, path: '/store' },
              { label: 'Services', icon: <MiscellaneousServicesIcon />, path: '/services' },
              { label: 'My Orders', icon: <HistoryIcon />, path: '/my-orders' },
              { label: 'About Us', icon: <InfoIcon />, path: '/about' },
              { label: 'Contact', icon: <ContactSupportIcon />, path: '/contact' },
              { label: 'Account', icon: <PersonIcon />, path: '/profile' },
            ].map((item) => (
              <GridMenuButton key={item.label} onClick={() => cleanNavigate(item.path)}>
                {item.icon}
                <Typography variant="body2" sx={{ fontWeight: 700, opacity: 0.9 }}>{item.label}</Typography>
              </GridMenuButton>
            ))}
          </Box>

          {isAuthenticated && (
            <Button
              onClick={() => { logout(); cleanNavigate('/'); }}
              sx={{ mt: 8, color: '#f87171', fontWeight: 800, fontSize: '1.1rem' }}
              startIcon={<LogoutIcon />}
            >
              LOGOUT
            </Button>
          )}
        </MobileOverlay>
      </Fade>

      {/* Desktop Profile Menu */}
      <Menu
        anchorEl={profileAnchor}
        open={Boolean(profileAnchor)}
        onClose={() => setProfileAnchor(null)}
        disableScrollLock
        PaperProps={{
          sx: {
            bgcolor: 'rgba(10,10,10,0.96)',
            color: 'white',
            borderRadius: '20px',
            border: '1px solid rgba(255,255,255,0.1)',
            mt: 1.5,
            minWidth: 200,
            backdropFilter: 'blur(15px)'
          }
        }}
      >
        <MenuItem onClick={() => cleanNavigate('/profile')} sx={{ py: 1.5, fontWeight: 600 }}>My Profile</MenuItem>
        <MenuItem onClick={() => cleanNavigate('/my-orders')} sx={{ py: 1.5, fontWeight: 600 }}>Order History</MenuItem>
        <MenuItem onClick={() => cleanNavigate('/service-history')} sx={{ py: 1.5, fontWeight: 600 }}>Service History</MenuItem>
        <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)', my: 1 }} />
        <MenuItem onClick={() => { logout(); cleanNavigate('/'); }} sx={{ color: '#f87171', py: 1.5, fontWeight: 700 }}>Logout</MenuItem>
      </Menu>

      <ShoppingCart />
    </>
  );
};