// src/components/Footer.tsx
import React from 'react';
import { styled } from '@mui/material/styles';
import { Box, Typography, Grid, IconButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import FacebookIcon from '@mui/icons-material/Facebook';
import TwitterIcon from '@mui/icons-material/Twitter';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import InstagramIcon from '@mui/icons-material/Instagram';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';

const FooterWrapper = styled(Box)({
  background: 'linear-gradient(135deg, #0a0a0a 0%, #000000 100%)',
  borderTop: '1px solid rgba(255, 255, 255, 0.05)',
  position: 'relative',
  overflow: 'hidden',
  marginTop: '60px',
  paddingBottom: '0',
  '@media (max-width:900px)': {
    paddingBottom: '100px', // Gives enough extra space so the dock sits seamlessly above footer text
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '1px',
    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
  }
});

const FooterTop = styled(Box)({
  padding: '50px 55px 35px',
  maxWidth: '1400px',
  margin: '0 auto',
  '@media (max-width:900px)': {
    padding: '40px 24px 30px',
  },
});

const FooterBottom = styled(Box)({
  borderTop: '1px solid rgba(255, 255, 255, 0.05)',
  padding: '20px 55px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  maxWidth: '1400px',
  margin: '0 auto',
  '@media (max-width:900px)': {
    flexDirection: 'column',
    gap: '16px',
    padding: '20px 24px',
    textAlign: 'center',
  },
});

const FooterBrand = styled(Box)({
  marginBottom: '18px',
});

const BrandLogo = styled(Typography)({
  fontSize: '18px',
  fontWeight: 700,
  letterSpacing: '1.2px',
  color: '#ffffff',
  marginBottom: '10px',
  background: 'linear-gradient(135deg, #ffffff, #a0a0a0)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
});

const BrandTagline = styled(Typography)({
  fontSize: '13px',
  color: 'rgba(255, 255, 255, 0.45)',
  lineHeight: 1.5,
  maxWidth: '280px',
  fontWeight: 400,
  letterSpacing: '0.2px',
});

const FooterSection = styled(Box)({
  '& h4': {
    fontSize: '14px',
    fontWeight: 700,
    marginBottom: '18px',
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: '0.4px',
    position: 'relative',
    paddingBottom: '10px',
    '&::after': {
      content: '""',
      position: 'absolute',
      bottom: 0,
      left: 0,
      width: '30px',
      height: '2px',
      background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.5), transparent)',
    }
  },
});

const FooterLink = styled('a')({
  display: 'block',
  color: 'rgba(255, 255, 255, 0.45)',
  textDecoration: 'none',
  fontSize: '13px',
  marginBottom: '10px',
  transition: 'all 0.3s ease',
  fontWeight: 400,
  letterSpacing: '0.2px',
  cursor: 'pointer',
  '&:hover': {
    color: 'rgba(255, 255, 255, 0.85)',
    transform: 'translateX(3px)',
  },
});

const ContactItem = styled('a')({
  display: 'flex',
  alignItems: 'flex-start',
  gap: '10px',
  marginBottom: '12px',
  color: 'rgba(255, 255, 255, 0.45)',
  fontSize: '13px',
  transition: 'all 0.3s ease',
  textDecoration: 'none',
  cursor: 'pointer',
  '&:hover': {
    color: 'rgba(255, 255, 255, 0.75)',
  },
  '& svg': {
    fontSize: '16px',
    marginTop: '2px',
    flexShrink: 0,
  },
});

const SocialIconsBox = styled(Box)({
  display: 'flex',
  gap: '10px',
  marginTop: '16px',
});

const SocialIconBtn = styled(IconButton)({
  width: '36px',
  height: '36px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '50%',
  color: 'rgba(255, 255, 255, 0.45)',
  transition: 'all 0.3s ease',
  background: 'rgba(255, 255, 255, 0.02)',
  '&:hover': {
    background: 'rgba(255, 255, 255, 0.08)',
    color: 'rgba(255, 255, 255, 0.85)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    transform: 'translateY(-2px)',
  },
});

const CopyrightText = styled(Typography)({
  fontSize: '12px',
  color: 'rgba(255, 255, 255, 0.35)',
  fontWeight: 400,
  letterSpacing: '0.2px',
});

const PaymentIcons = styled(Box)({
  display: 'flex',
  gap: '10px',
  alignItems: 'center',
  '@media (max-width:900px)': {
    justifyContent: 'center',
  },
});

const PaymentIcon = styled(Box)({
  width: '42px',
  height: '28px',
  background: 'rgba(255, 255, 255, 0.06)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: '5px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '9px',
  color: 'rgba(255, 255, 255, 0.45)',
  fontWeight: 600,
  transition: 'all 0.3s ease',
  '&:hover': {
    background: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
});

export const Footer: React.FC = () => {
  const navigate = useNavigate();

  return (
    <FooterWrapper>
      <FooterTop>
        <Grid container spacing={4}>
          {/* Brand Section */}
          <Grid item xs={12} sm={6} md={3}>
            <FooterBrand>
              <BrandLogo>TECHVERSE</BrandLogo>
              <BrandTagline>
                Your gateway to innovation. Bringing cutting-edge technology to your fingertips.
              </BrandTagline>
            </FooterBrand>
            <SocialIconsBox>
              <SocialIconBtn aria-label="Facebook" href="https://facebook.com" target="_blank">
                <FacebookIcon sx={{ fontSize: '18px' }} />
              </SocialIconBtn>
              <SocialIconBtn aria-label="Twitter" href="https://twitter.com" target="_blank">
                <TwitterIcon sx={{ fontSize: '18px' }} />
              </SocialIconBtn>
              <SocialIconBtn aria-label="LinkedIn" href="https://linkedin.com" target="_blank">
                <LinkedInIcon sx={{ fontSize: '18px' }} />
              </SocialIconBtn>
              <SocialIconBtn aria-label="Instagram" href="https://instagram.com" target="_blank">
                <InstagramIcon sx={{ fontSize: '18px' }} />
              </SocialIconBtn>
            </SocialIconsBox>
          </Grid>

          {/* Quick Links */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FooterSection>
              <Typography variant="h4">Quick Links</Typography>
              <FooterLink onClick={() => navigate('/')}>Home</FooterLink>
              <FooterLink onClick={() => navigate('/store')}>Shop</FooterLink>
              <FooterLink onClick={() => navigate('/services')}>Services</FooterLink>
              <FooterLink onClick={() => navigate('/my-orders')}>My Orders</FooterLink>
              <FooterLink onClick={() => navigate('/profile')}>Profile</FooterLink>
            </FooterSection>
          </Grid>

          {/* Categories */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FooterSection>
              <Typography variant="h4">Categories</Typography>
              <FooterLink onClick={() => navigate('/store?category=Laptop%20%2F%20PC')}>
                Laptops & PCs
              </FooterLink>
              <FooterLink onClick={() => navigate('/store?category=Printer')}>
                Printers
              </FooterLink>
              <FooterLink onClick={() => navigate('/store?category=Keyboard')}>
                Keyboards
              </FooterLink>
              <FooterLink onClick={() => navigate('/store?category=Mouse')}>
                Mice
              </FooterLink>
              <FooterLink onClick={() => navigate('/store?category=Headphones')}>
                Headphones
              </FooterLink>
            </FooterSection>
          </Grid>

          {/* Contact */}
          <Grid size={{ xs: 12, sm: 12, md: 3 }}>
            <FooterSection>
              <Typography variant="h4">Get In Touch</Typography>
              <ContactItem href="mailto:contact@techverseservices.in">
                <EmailIcon />
                <span>contact@techverseservices.in</span>
              </ContactItem>
              <ContactItem href="tel:+918805147490">
                <PhoneIcon />
                <span>+91 8805147490</span>
              </ContactItem>
              <ContactItem
                href="https://www.google.com/maps/search/?api=1&query=123+Tech+Street+Innovation+City+TC+12345"
                target="_blank"
                rel="noopener noreferrer"
              >
                <LocationOnIcon />
                <span>Chhatrapati Sambhajinagar, 431003</span>
              </ContactItem>
            </FooterSection>
          </Grid>
        </Grid>
      </FooterTop>

      <FooterBottom>
        <CopyrightText>
          © {new Date().getFullYear()} TechVerse. All rights reserved.
        </CopyrightText>
        <Box sx={{ display: 'flex', gap: '20px', '@media (max-width:900px)': { flexDirection: 'column', gap: '10px', alignItems: 'center' } }}>
          <FooterLink onClick={() => navigate('/privacy-policy')} style={{ display: 'inline', margin: 0, fontSize: '12px' }}>
            Privacy Policy
          </FooterLink>
          <FooterLink onClick={() => navigate('/return-policy')} style={{ display: 'inline', margin: 0, fontSize: '12px' }}>
            Return Policy
          </FooterLink>
          <FooterLink onClick={() => navigate('/refund-policy')} style={{ display: 'inline', margin: 0, fontSize: '12px' }}>
            Refund Policy
          </FooterLink>
          <FooterLink onClick={() => navigate('/shipping-policy')} style={{ display: 'inline', margin: 0, fontSize: '12px' }}>
            Shipping Policy
          </FooterLink>
          <FooterLink onClick={() => navigate('/terms-conditions')} style={{ display: 'inline', margin: 0, fontSize: '12px' }}>
            Terms & Conditions
          </FooterLink>
        </Box>
        <PaymentIcons>
          <PaymentIcon>VISA</PaymentIcon>
          <PaymentIcon>MC</PaymentIcon>
          <PaymentIcon>AMEX</PaymentIcon>
        </PaymentIcons>
      </FooterBottom>
    </FooterWrapper >
  );
};

export default Footer;
