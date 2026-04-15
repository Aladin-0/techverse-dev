import React from 'react';
import {
  Box,
  Container,
  Typography,
  Divider,
  styled,
} from '@mui/material';

const PageContainer = styled(Box)({
  backgroundColor: '#FAF9F5',
  color: '#1A1814',
  fontFamily: "'Inter', sans-serif",
  minHeight: '100vh',
  width: '100%',
  paddingTop: '80px',
});

const ContentContainer = styled(Box)({
  padding: '60px 64px',
  width: '100%',
});

const HeaderSection = styled(Box)({
  textAlign: 'center',
  marginBottom: '48px',
});

const MainTitle = styled(Typography)({
  fontSize: '48px',
  fontWeight: 700,
  fontFamily: "'Inter', sans-serif !important",
  letterSpacing: 'normal !important',
  marginBottom: '16px',
  background: 'linear-gradient(135deg, #1C2B4A 0%, #1A1814 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  '@media (max-width: 600px)': {
    fontSize: '32px',
  },
});

const Subtitle = styled(Typography)({
  fontSize: '16px',
  color: '#6B6156',
});

const Section = styled(Box)({
  marginBottom: '40px',
  '& h2': {
    fontSize: '24px',
    fontWeight: 700,
    fontFamily: "'Inter', sans-serif !important",
    letterSpacing: 'normal !important',
    textTransform: 'none !important',
    color: '#1A1814',
    marginBottom: '20px',
    marginTop: '32px',
  },
  '& h3': {
    fontSize: '18px',
    fontWeight: 600,
    fontFamily: "'Inter', sans-serif !important",
    letterSpacing: 'normal !important',
    textTransform: 'none !important',
    color: '#1A1814',
    marginBottom: '16px',
    marginTop: '24px',
  },
  '& p': {
    marginBottom: '16px',
    color: '#6B6156',
    fontSize: '16px',
    fontFamily: "'Inter', sans-serif",
    lineHeight: 1.7,
  },
  '& ul, & ol': {
    paddingLeft: '24px',
    marginBottom: '24px',
    fontFamily: "'Inter', sans-serif",
    '& li': {
      marginBottom: '10px',
      color: '#6B6156',
      fontSize: '16px',
      lineHeight: 1.7,
      fontFamily: "'Inter', sans-serif",
    },
  },
  '& strong': {
    color: '#1A1814',
    fontWeight: 600,
    fontFamily: "'Inter', sans-serif",
  },
});

const HighlightBox = styled(Box)({
  background: 'rgba(28, 43, 74, 0.03)',
  border: '1px solid rgba(28, 43, 74, 0.1)',
  borderRadius: '16px',
  padding: '24px',
  marginBottom: '32px',
});

const LastUpdated = styled(Typography)({
  fontSize: '14px',
  color: '#6B6156',
  marginBottom: '24px',
  fontStyle: 'italic',
  textAlign: 'center',
});

export const TermsConditionsPage: React.FC = () => {
  return (
    <PageContainer>
      <ContentContainer>
        <HeaderSection>
          <MainTitle>Terms and Conditions</MainTitle>
          <Subtitle>Please read these terms carefully before using our services</Subtitle>
        </HeaderSection>

        <LastUpdated>
          Last Updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
        </LastUpdated>

        <Section>
          <HighlightBox>
            <p><strong>Business Name:</strong> Techverse Services</p>
            <p><strong>GST Registration:</strong> GSTIN: 27CJLPP1870M1ZJ</p>
            <p><strong>Contact:</strong> contact@techverseservices.in | +91 8805147490</p>
          </HighlightBox>
          <p>
            Welcome to Techverse Services. By using our website and services, you agree to these terms and conditions.
          </p>
        </Section>

        <Divider sx={{ backgroundColor: 'rgba(28, 43, 74, 0.1)', my: 4 }} />

        <Section>
          <h2>1. Acceptance of Terms</h2>
          <p>By accessing this website, you confirm that you agree to these terms.</p>
        </Section>

        <Section>
          <h2>2. Products and Services</h2>
          <p>We offer computer hardware, accessories, repair services, CCTV installation, and technical support.</p>
        </Section>

        <Section>
          <h2>3. Payment Terms</h2>
          <h3>3.1 Payment Methods</h3>
          <ul>
            <li>PhonePe (UPI, Cards, Net Banking)</li>
            <li>Cash on Delivery (select products)</li>
          </ul>
          <h3>3.2 PhonePe Gateway</h3>
          <p>By paying via PhonePe, you agree to their terms. Refunds take 7-10 business days for failed transactions.</p>
        </Section>

        <Section>
          <h2>4. Delivery</h2>
          <ul>
            <li>5-7 days within Maharashtra</li>
            <li>7-10 days other states</li>
            <li>Inspect packages before accepting</li>
          </ul>
        </Section>

        <Section>
          <h2>5. Returns and Refunds</h2>
          <p>See our Return Policy and Refund Policy pages for details.</p>
        </Section>

        <Section>
          <h2>6. Warranty</h2>
          <p>Products come with manufacturer warranty. Service work guaranteed for 30 days.</p>
        </Section>

        <Section>
          <h2>7. Data Backup</h2>
          <p><strong>Important:</strong> Backup all data before repairs. We are not liable for data loss.</p>
        </Section>

        <Section>
          <h2>8. Limitation of Liability</h2>
          <p>Our liability is limited to the purchase price. Not responsible for indirect damages.</p>
        </Section>

        <Section>
          <h2>9. Governing Law</h2>
          <p>These terms are governed by Indian law. Disputes subject to Chhatrapati Sambhajinagar jurisdiction.</p>
        </Section>

        <Section>
          <h2>10. Contact Us</h2>
          <HighlightBox>
            <p><strong>Techverse Services</strong></p>
            <p>Email: contact@techverseservices.in</p>
            <p>Phone: +91 8805147490</p>
            <p>GSTIN: 27CJLPP1870M1ZJ</p>
          </HighlightBox>
        </Section>
      </ContentContainer>
    </PageContainer>
  );
};
