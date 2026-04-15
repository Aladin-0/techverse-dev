import React from 'react';
import { styled } from '@mui/material/styles';
import { Box, Typography, Container } from '@mui/material';

const PageWrapper = styled(Box)({
    backgroundColor: '#FAF9F5',
    color: '#1A1814',
    fontFamily: "'Inter', sans-serif",
    minHeight: '100vh',
    width: '100%',
    paddingTop: '80px',
});

const ContentWrapper = styled(Box)({
    padding: '60px 64px',
    width: '100%',
});

const PageHeader = styled(Box)({
    textAlign: 'center',
    marginBottom: '48px',
});

const Title = styled(Typography)({
    fontSize: '48px',
    fontWeight: 700,
    fontFamily: "'Inter', sans-serif !important",
    letterSpacing: "normal !important",
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
        letterSpacing: "normal !important",
        textTransform: "none !important",
        color: '#1A1814',
        marginBottom: '20px',
        marginTop: '32px',
    },
    '& h3': {
        fontSize: '18px',
        fontWeight: 600,
        fontFamily: "'Inter', sans-serif !important",
        letterSpacing: "normal !important",
        textTransform: "none !important",
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
    '& ul': {
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
});

const UpdateDate = styled(Typography)({
    fontSize: '14px',
    color: '#6B6156',
    marginBottom: '24px',
    fontStyle: 'italic',
    textAlign: 'center',
});

export const ShippingPolicyPage: React.FC = () => {
    return (
        <PageWrapper>
            <ContentWrapper>
                <PageHeader>
                    <Title>Shipping Policy</Title>
                    <Subtitle>Delivery timelines and tracking</Subtitle>
                </PageHeader>

                <UpdateDate>Last Updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</UpdateDate>

                <Section>
                    <h2>1. Order Processing Time</h2>
                    <p>
                        All orders are processed within <strong>2 business days</strong> (excluding weekends and holidays) after receiving your order confirmation email.
                        You will receive another notification when your order has shipped.
                    </p>
                </Section>

                <Section>
                    <h2>2. Shipping Rates & Estimates</h2>
                    <p>
                        Shipping charges for your order will be calculated and displayed at checkout.
                    </p>
                    <ul>
                        <li><strong>Standard Shipping:</strong> Estimated delivery 5-7 business days.</li>
                        <li><strong>Express Shipping:</strong> Estimated delivery 2-4 business days.</li>
                    </ul>
                    <p>
                        Delivery delays can occasionally occur due to unforeseen circumstances with the courier partners.
                    </p>
                </Section>

                <Section>
                    <h2>3. Order Tracking</h2>
                    <p>
                        When your order has shipped, you will receive an email and/or SMS notification from us which will include a tracking number you can use to check its status.
                        Please allow 48 hours for the tracking information to become available.
                    </p>
                </Section>

                <Section>
                    <h2>4. International Shipping</h2>
                    <p>
                        Currently, we only ship within India. We do not offer international shipping at this time.
                    </p>
                </Section>

                <Section>
                    <h2>5. Damages during Shipping</h2>
                    <p>
                        Techverse Services is not liable for any products damaged or lost during shipping. If you received your order damaged, please contact the shipment carrier to file a claim.
                    </p>
                    <p>
                        Please save all packaging materials and damaged goods before filing a claim.
                    </p>
                </Section>
            </ContentWrapper>
        </PageWrapper>
    );
};
