// src/components/TechnicianNavBar.tsx - FULLY MOBILE-RESPONSIVE
import { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Chip,
  IconButton
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useUserStore } from '../stores/userStore';

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: 'transparent',
  backdropFilter: 'none',
  borderBottom: 'none',
  boxShadow: 'none',
  position: 'fixed',
  top: 0,
  zIndex: 1000,
  transition: 'all 0.3s ease-in-out',
  '&.scrolled': {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  }
}));

const NavContainer = styled(Container)(({ theme }) => ({
  width: '100%',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}));

const LogoContainer = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
});

const LogoImg = styled('img')({
  width: '46px',
  height: '46px',
  objectFit: 'contain',
});

// MODIFIED: Added responsive font size
const Logo = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  letterSpacing: '-0.025em',
  color: 'var(--text-color, #FAFAFA)',
  fontSize: '1.25rem',
  [theme.breakpoints.up('sm')]: {
    fontSize: '1.5rem',
  },
}));

const TechnicianBadge = styled(Chip)({
  backgroundColor: 'rgba(96, 165, 250, 0.15)',
  color: '#60a5fa',
  border: '1px solid rgba(96, 165, 250, 0.3)',
  fontSize: '12px',
  fontWeight: 600,
  height: '28px',
  marginLeft: '16px',
});

// MODIFIED: Added responsive padding, gap, and minWidth for mobile
const ProfileButton = styled(Button)(({ theme }) => ({
  backgroundColor: 'transparent',
  color: 'var(--text-color, #FAFAFA)',
  fontWeight: 600,
  fontSize: '1.05rem',
  textTransform: 'none',
  transition: 'all 0.3s ease',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  borderRadius: '12px',
  backdropFilter: 'blur(10px)',
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(1),
  minWidth: 'auto',
  gap: 0,
  [theme.breakpoints.up('md')]: {
    padding: theme.spacing(1, 2),
    gap: '12px',
  },
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
    transform: 'translateY(-1px)',
  },
}));

// MODIFIED: Added responsive margin
const RefreshButton = styled(IconButton)(({ theme }) => ({
  color: 'var(--text-color, #FAFAFA)',
  backgroundColor: 'transparent',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  borderRadius: '12px',
  padding: '12px',
  transition: 'all 0.3s ease',
  marginRight: theme.spacing(1),
  [theme.breakpoints.up('md')]: {
    marginRight: theme.spacing(2),
  },
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
    transform: 'translateY(-1px)',
  },
}));

const UserAvatar = styled(Avatar)({
  width: 32,
  height: 32,
  background: 'linear-gradient(135deg, rgba(96, 165, 250, 0.8), rgba(59, 130, 246, 0.9))',
  fontSize: '14px',
  fontWeight: 600,
});

const ProfileMenu = styled(Menu)(({ theme }) => ({
  '& .MuiPaper-root': {
    backgroundColor: 'rgba(10, 10, 10, 0.95)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '16px',
    marginTop: '8px',
    minWidth: '220px',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
  },
  '& .MuiMenuItem-root': {
    color: 'rgba(255, 255, 255, 0.9)',
    padding: '12px 20px',
    fontSize: '14px',
    fontWeight: 500,
    borderRadius: '8px',
    margin: '4px 8px',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
    },
    '&.logout-item': {
      color: '#ef4444',
      '&:hover': {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
      },
    },
  },
}));

const UserInfo = styled(Box)({
  padding: '16px 20px 12px',
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  margin: '0 8px 8px',
});

const UserName = styled(Typography)({
  color: 'rgba(255, 255, 255, 0.95)',
  fontSize: '16px',
  fontWeight: 600,
  marginBottom: '4px',
});

const UserEmail = styled(Typography)({
  color: 'rgba(255, 255, 255, 0.6)',
  fontSize: '12px',
  fontWeight: 400,
});

interface TechnicianNavBarProps {
  onRefresh?: () => void;
}

export const TechnicianNavBar: React.FC<TechnicianNavBarProps> = ({ onRefresh }) => {
  const [scrolled, setScrolled] = useState(false);
  const [profileAnchor, setProfileAnchor] = useState<null | HTMLElement>(null);

  const user = useUserStore((state) => state.user);
  const logout = useUserStore((state) => state.logout);

  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 50;
      setScrolled(isScrolled);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setProfileAnchor(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileAnchor(null);
  };

  const handleLogout = () => {
    logout();
    handleProfileMenuClose();
    navigate('/login');
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <StyledAppBar className={scrolled ? 'scrolled' : ''}>
        <Toolbar sx={{ py: 1.5, px: { xs: 2, sm: 3 } }}>
          <NavContainer>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <LogoContainer>
                <Logo>TechVerse</Logo>
              </LogoContainer>
              {/* MODIFIED: Badge is now hidden on mobile */}
              <TechnicianBadge
                label="TECHNICIAN DASHBOARD"
                sx={{ display: { xs: 'none', md: 'inline-flex' } }}
              />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {onRefresh && (
                <RefreshButton onClick={onRefresh} title="Refresh Dashboard">
                  <RefreshIcon />
                </RefreshButton>
              )}

              <ProfileButton onClick={handleProfileMenuOpen}>
                <UserAvatar>
                  {user?.name ? getUserInitials(user.name) : <PersonIcon fontSize="small" />}
                </UserAvatar>
                {/* MODIFIED: User name/role are now hidden on mobile */}
                <Box sx={{ display: { xs: 'none', md: 'block' }, textAlign: 'left' }}>
                  <Typography sx={{ fontSize: '14px', fontWeight: 600, lineHeight: 1.2, color: 'inherit' }}>
                    {user?.name || 'Technician'}
                  </Typography>
                  <Typography sx={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1 }}>
                    {user?.role}
                  </Typography>
                </Box>
              </ProfileButton>
            </Box>
          </NavContainer>
        </Toolbar>
      </StyledAppBar>

      <ProfileMenu
        anchorEl={profileAnchor}
        open={Boolean(profileAnchor)}
        onClose={handleProfileMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <UserInfo>
          <UserName>{user?.name || 'Technician'}</UserName>
          <UserEmail>{user?.email}</UserEmail>
        </UserInfo>

        <Divider sx={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', my: 1 }} />

        <MenuItem onClick={handleLogout} className="logout-item">
          <LogoutIcon sx={{ mr: 2, fontSize: '18px' }} />
          Logout
        </MenuItem>
      </ProfileMenu>
      
      {/* Spacer to prevent content from hiding behind the fixed AppBar */}
      <Toolbar sx={{ mb: 1 }} />
    </>
  );
};