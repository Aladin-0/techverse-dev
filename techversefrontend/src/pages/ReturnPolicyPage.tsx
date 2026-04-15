import React from 'react';
import { styled } from '@mui/material/styles';
import { Box, Typography, Container, Divider } from '@mui/material';

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

export const ReturnPolicyPage: React.FC = () => {
    return (
        <PageWrapper>
            <ContentWrapper>
                <PageHeader>
                    <Title>Return Policy</Title>
                    <Subtitle>Simple and transparent return process</Subtitle>
                </PageHeader>

                <UpdateDate>Last Updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</UpdateDate>

                <Section>
                    <h2>1. 7-Day Return Policy</h2>
                    <p>
                        At Techverse Services, we want you to be completely satisfied with your purchase.
                        We offer a <strong>7-day return policy</strong>, which means you have 7 days after receiving your item to request a return.
                    </p>
                </Section>

                <Section>
                    <h2>2. Eligibility for Returns</h2>
                    <p>To be eligible for a return, your item must meet the following criteria:</p>
                    <ul>
                        <li>The item must be in the same condition that you received it, unworn or unused.</li>
                        <li>It must be in its original packaging with all tags, manuals, and accessories intact.</li>
                        <li>You must provide the receipt or proof of purchase.</li>
                    </ul>
                    <p>
                        Items that are damaged, missing parts, or not in their original condition for reasons not due to our error may not be eligible for a full return.
                    </p>
                </Section>

                <Section>
                    <h2>3. Damages and Issues</h2>
                    <p>
                        Please inspect your order upon reception and contact us immediately if the item is defective, damaged, or if you receive the wrong item,
                        so that we can evaluate the issue and make it right immediately.
                    </p>
                </Section>

                <Divider sx={{ backgroundColor: 'rgba(28, 43, 74, 0.1)', my: 4 }} />

                <Section>
                    <p>
                        For any return-related questions, please contact us at contact@techverseservices.in.
                    </p>
                </Section>
            </ContentWrapper>
        </PageWrapper>
    );
};
