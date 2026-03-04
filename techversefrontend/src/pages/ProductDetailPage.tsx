import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import {
  Box,
  Typography,
  Button,
  Grid,
  CircularProgress,
  Alert,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import StraightenOutlinedIcon from '@mui/icons-material/StraightenOutlined';
import ScaleOutlinedIcon from '@mui/icons-material/ScaleOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';

import { useSpring, animated, config } from '@react-spring/web';
import { useCartStore } from '../stores/cartStore';
import { useSnackbar } from 'notistack';
import apiClient, { API_BASE_URL, getImageUrl } from '../api';

const PageWrapper = styled(Box)({
  backgroundColor: '#050505',
  backgroundImage: `
    radial-gradient(ellipse 800px 500px at 15% 30%, rgba(30, 58, 138, 0.15), transparent 100%),
    radial-gradient(ellipse 600px 400px at 85% 70%, rgba(96, 165, 250, 0.1), transparent 100%),
    linear-gradient(180deg, rgba(10, 10, 10, 0) 0%, rgba(0, 0, 0, 1) 100%)
  `,
  color: 'white',
  minHeight: '100vh',
  width: '100%',
  overflowX: 'hidden',
});

const ContentContainer = styled(Box)(({ theme }) => ({
  maxWidth: '1300px',
  margin: '0 auto',
  padding: '100px 24px 80px', // Top padding for navbar clear
  position: 'relative',
  zIndex: 1,
  [theme.breakpoints.down('sm')]: {
    padding: '70px 16px 40px',
  },
}));

const FloatingBackButton = styled(Button)({
  position: 'sticky',
  top: '88px', // md navbar
  zIndex: 100,
  background: 'rgba(20, 20, 20, 0.4)',
  backdropFilter: 'blur(16px)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  color: 'rgba(255, 255, 255, 0.9)',
  borderRadius: '24px',
  padding: '10px 24px',
  fontSize: '13px',
  fontWeight: 600,
  letterSpacing: '0.5px',
  textTransform: 'none',
  marginBottom: '40px',
  transition: 'all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
  '&:hover': {
    background: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
    transform: 'translateX(-4px) translateY(-2px)',
  },
  '@media (max-width: 900px)': {
    top: '64px', // mobile navbar
    marginBottom: '24px',
  }
});

const HeroGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: '1fr 1.2fr',
  gap: '60px',
  marginBottom: '80px',
  alignItems: 'center',
  [theme.breakpoints.down('md')]: {
    gridTemplateColumns: '1fr',
    gap: '40px',
    marginBottom: '60px',
  },
}));

// Premium Image Viewer
const ImageShowcase = styled(Box)({
  position: 'relative',
  borderRadius: '32px',
  background: 'linear-gradient(145deg, rgba(30,30,30,0.4), rgba(10,10,10,0.6))',
  border: '1px solid rgba(255,255,255,0.06)',
  padding: '60px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 40px 100px rgba(0,0,0,0.6), inset 0 2px 20px rgba(255,255,255,0.02)',
  aspectRatio: '1 / 1',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '70%',
    height: '70%',
    background: 'radial-gradient(circle, rgba(96, 165, 250, 0.15) 0%, transparent 70%)',
    filter: 'blur(50px)',
  },
  '@media (max-width: 900px)': {
    padding: '20px',
    borderRadius: '20px',
    aspectRatio: 'unset',
    height: '300px',
    width: '100%',
  }
});

const StyledProductImage = styled('img')({
  width: '100%',
  height: '100%',
  objectFit: 'contain',
  position: 'relative',
  zIndex: 2,
  filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.4))',
  transition: 'transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)',
  '&:hover': {
    transform: 'scale(1.08) translateY(-10px)',
  }
});

const ThumbnailGrid = styled(Box)({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '10px',
  marginTop: '20px',
  justifyContent: 'flex-start',
  maxHeight: '192px',   // fits 2 rows of 86px thumbnails + gap
  overflowY: 'auto',
  overflowX: 'hidden',
  paddingRight: '4px',
  paddingBottom: '4px',
  '&::-webkit-scrollbar': { width: '4px' },
  '&::-webkit-scrollbar-track': { background: 'rgba(255,255,255,0.04)', borderRadius: '4px' },
  '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.2)', borderRadius: '4px' },
  '@media (max-width: 900px)': {
    gap: '8px',
    maxHeight: '148px', // 2 rows of 68px on mobile
    justifyContent: 'flex-start',
  },
});

const ThumbnailImage = styled('img')<{ selected?: boolean }>(({ selected }) => ({
  width: '86px',
  height: '86px',
  flexShrink: 0,
  objectFit: 'cover',
  borderRadius: '14px',
  border: `2px solid ${selected ? '#60a5fa' : 'rgba(255,255,255,0.08)'}`,
  background: 'rgba(20,20,20,0.6)',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  filter: selected ? 'brightness(1.1)' : 'brightness(0.7)',
  '&:hover': {
    transform: 'scale(1.05)',
    filter: 'brightness(1)',
    borderColor: selected ? '#60a5fa' : 'rgba(255,255,255,0.3)',
  },
  '@media (max-width: 900px)': {
    width: '68px',
    height: '68px',
    borderRadius: '12px',
  },
}));

// Info Panel
const InfoPanel = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
});

const GlowingBadge = styled(Box)({
  display: 'inline-flex',
  alignItems: 'center',
  padding: '8px 16px',
  background: 'rgba(96, 165, 250, 0.1)',
  border: '1px solid rgba(96, 165, 250, 0.3)',
  color: '#93c5fd',
  borderRadius: '20px',
  fontSize: '12px',
  fontWeight: 700,
  letterSpacing: '1.2px',
  textTransform: 'uppercase',
  marginBottom: '24px',
  width: 'fit-content',
  boxShadow: '0 0 20px rgba(96, 165, 250, 0.15)',
});

const PremiumTitle = styled(Typography)({
  fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
  fontSize: '48px',
  fontWeight: 800,
  lineHeight: 1.15,
  color: '#ffffff',
  marginBottom: '24px',
  letterSpacing: '-1px',
  background: 'linear-gradient(135deg, #ffffff 30%, #a3a3a3 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  '@media (max-width: 900px)': {
    fontSize: '36px',
  }
});

const PriceBox = styled(Box)({
  display: 'flex',
  alignItems: 'baseline',
  gap: '12px',
  marginBottom: '32px',
});

const PriceTag = styled(Typography)({
  fontSize: '44px',
  fontWeight: 800,
  background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  letterSpacing: '-1px',
});

const DescText = styled(Typography)({
  fontSize: '16px',
  color: 'rgba(255, 255, 255, 0.7)',
  lineHeight: 1.8,
  marginBottom: '40px',
  fontWeight: 400,
});

const StockIndicator = styled(Box)<{ instock: boolean }>(({ instock }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  fontSize: '14px',
  fontWeight: 600,
  color: instock ? '#34d399' : '#f87171',
  marginBottom: '40px',
  padding: '12px 24px',
  background: instock ? 'rgba(52, 211, 153, 0.1)' : 'rgba(248, 113, 113, 0.1)',
  borderRadius: '16px',
  border: `1px solid ${instock ? 'rgba(52, 211, 153, 0.2)' : 'rgba(248, 113, 113, 0.2)'}`,
  width: 'fit-content',
}));

const ActionButtonGroup = styled(Box)({
  display: 'flex',
  gap: '20px',
  flexWrap: 'wrap',
});

const PrimaryButton = styled(Button)({
  background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
  color: 'white',
  padding: '18px 36px',
  borderRadius: '20px',
  fontSize: '16px',
  fontWeight: 700,
  textTransform: 'none',
  letterSpacing: '0.5px',
  flex: 1,
  minWidth: '220px',
  boxShadow: '0 15px 35px rgba(37, 99, 235, 0.4)',
  transition: 'all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'linear-gradient(rgba(255,255,255,0.2), transparent)',
    opacity: 0,
    transition: 'opacity 0.3s',
  },
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 25px 50px rgba(37, 99, 235, 0.5)',
    '&::after': { opacity: 1 },
  },
  '&:disabled': {
    background: 'rgba(255,255,255,0.05)',
    color: 'rgba(255,255,255,0.3)',
    boxShadow: 'none',
  }
});

const SecondaryButton = styled(Button)({
  background: 'rgba(255, 255, 255, 0.03)',
  color: 'white',
  padding: '18px 36px',
  borderRadius: '20px',
  fontSize: '16px',
  fontWeight: 600,
  textTransform: 'none',
  letterSpacing: '0.5px',
  flex: 1,
  minWidth: '220px',
  border: '1px solid rgba(255,255,255,0.1)',
  backdropFilter: 'blur(20px)',
  transition: 'all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
  '&:hover': {
    background: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.25)',
    transform: 'translateY(-4px)',
    boxShadow: '0 15px 35px rgba(0,0,0,0.3)',
  },
  '&:disabled': {
    background: 'transparent',
    borderColor: 'rgba(255,255,255,0.05)',
    color: 'rgba(255,255,255,0.3)',
  }
});

// Glassmorphic Details Section
const GlassCard = styled(Box)({
  background: 'rgba(20, 20, 20, 0.5)',
  backdropFilter: 'blur(30px)',
  borderRadius: '32px',
  border: '1px solid rgba(255, 255, 255, 0.06)',
  padding: '48px',
  boxShadow: '0 30px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
  position: 'relative',
  overflow: 'hidden',
  height: '100%',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '1px',
    background: 'linear-gradient(90deg, transparent, rgba(96, 165, 250, 0.3), transparent)',
  },
  '@media (max-width: 900px)': {
    padding: '32px 24px',
    borderRadius: '24px',
  }
});

const CardHeader = styled(Typography)({
  fontFamily: "'Nevera', sans-serif",
  fontSize: '28px',
  color: '#ffffff',
  marginBottom: '40px',
  letterSpacing: '1.5px',
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
});

const SectionGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: '32px',
  marginBottom: '60px',
  [theme.breakpoints.down('md')]: {
    gridTemplateColumns: '1fr',
  },
}));

// Spec Items
const StatsGrid = styled(Box)({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
  gap: '20px',
});

const StatBox = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  padding: '20px',
  background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01))',
  borderRadius: '20px',
  border: '1px solid rgba(255, 255, 255, 0.04)',
  transition: 'all 0.3s ease',
  '&:hover': {
    background: 'rgba(255, 255, 255, 0.06)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    transform: 'translateY(-2px)',
    boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
  }
});

const StatIconWrapper = styled(Box)({
  width: '48px',
  height: '48px',
  borderRadius: '14px',
  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#93c5fd',
  marginRight: '16px',
  border: '1px solid rgba(147, 197, 253, 0.2)',
});

const StatContent = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
});

const StatLabel = styled(Typography)({
  fontSize: '13px',
  color: 'rgba(255,255,255,0.5)',
  marginBottom: '4px',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  fontWeight: 600,
});

const StatValue = styled(Typography)({
  fontSize: '16px',
  color: '#ffffff',
  fontWeight: 600,
});

// Features List
const FeatureItem = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  padding: '20px',
  background: 'rgba(255, 255, 255, 0.02)',
  borderRadius: '16px',
  marginBottom: '16px',
  border: '1px solid rgba(255, 255, 255, 0.04)',
  transition: 'all 0.3s ease',
  '&:hover': {
    background: 'rgba(255, 255, 255, 0.05)',
    transform: 'translateX(4px)',
  },
  '& .icon': {
    color: '#60a5fa',
    fontSize: '24px',
    marginRight: '20px',
  }
});

const SpecRow = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '20px 24px',
  background: 'rgba(255,255,255,0.01)',
  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
  transition: 'background 0.3s ease',
  '&:last-child': {
    borderBottom: 'none',
  },
  '&:hover': {
    background: 'rgba(255,255,255,0.04)',
  }
});

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: string;
  image: string;
  stock: number;
  brand?: string;
  model_number?: string;
  warranty_period?: string;
  category: {
    name: string;
  };
  additional_images?: Array<{
    id: number;
    image: string;
    alt_text: string;
    is_primary: boolean;
    order: number;
  }>;
  all_images?: string[];
  dimensions?: string;
  weight?: any;
  delivery_time_info?: string;
  features?: string;
  features_list?: string[];
  specifications?: Array<{ name: string; value: string }>;
  specifications_dict?: Record<string, string>;
}

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const addToCart = useCartStore((state) => state.addToCart);

  // Animations
  const fadeIn = useSpring({
    from: { opacity: 0, transform: 'translateY(30px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
    config: config.gentle,
  });

  const slideLeft = useSpring({
    from: { opacity: 0, transform: 'translateX(-40px)' },
    to: { opacity: 1, transform: 'translateX(0)' },
    config: config.gentle,
    delay: 100,
  });

  const slideRight = useSpring({
    from: { opacity: 0, transform: 'translateX(40px)' },
    to: { opacity: 1, transform: 'translateX(0)' },
    config: config.gentle,
    delay: 200,
  });

  const cardsMount = useSpring({
    from: { opacity: 0, transform: 'translateY(40px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
    config: config.gentle,
    delay: 300,
  });

  useEffect(() => {
    const fetchProduct = async () => {
      if (!slug) return;
      try {
        const response = await apiClient.get(`/api/products/${slug}/`);
        setProduct(response.data);
      } catch (err: any) {
        setError('Product not found');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [slug]);

  const handleAddToCart = () => {
    if (!product) return;
    const cartProduct = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image: product.image,
      category: { name: product.category.name },
    };
    addToCart(cartProduct, 1);
    enqueueSnackbar(`${product.name} added to cart!`, { variant: 'success' });
  };

  const handleBuyNow = () => {
    if (!product) return;
    handleAddToCart();
    navigate('/checkout');
  };

  if (loading) {
    return (
      <PageWrapper sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress size={60} thickness={4} sx={{ color: '#60a5fa' }} />
      </PageWrapper>
    );
  }

  if (error || !product) {
    return (
      <PageWrapper>
        <ContentContainer>
          <FloatingBackButton onClick={() => navigate('/store')} startIcon={<ArrowBackIcon />}>
            Back to Store
          </FloatingBackButton>
          <Alert
            icon={<ErrorOutlineIcon fontSize="inherit" />}
            severity="error"
            sx={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '16px',
              fontSize: '16px',
              p: 3
            }}
          >
            Product not found. The item you're looking for might have been moved or deleted.
          </Alert>
        </ContentContainer>
      </PageWrapper>
    );
  }

  const inStock = product.stock > 0;
  const getAllImages = () => product.all_images?.length ? product.all_images : (product.image ? [product.image] : []);
  const displayImages = getAllImages();
  const currentImage = displayImages[selectedImageIndex];

  const processImageUrl = (imageUrl: string) => {
    return getImageUrl(imageUrl);
  };

  return (
    <PageWrapper>
      <ContentContainer>
        <animated.div style={fadeIn}>
          <FloatingBackButton onClick={() => navigate('/store')} startIcon={<ArrowBackIcon />}>
            Store
          </FloatingBackButton>
        </animated.div>

        <HeroGrid>
          {/* Left Column: Images */}
          <animated.div style={slideLeft}>
            <ImageShowcase>
              <StyledProductImage
                src={getImageUrl(currentImage)}
                alt={product.name}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = `https://via.placeholder.com/800x800/1a1a1a/ffffff?text=${encodeURIComponent(product.name)}`;
                }}
              />
            </ImageShowcase>
            {displayImages.length > 1 && (
              <ThumbnailGrid>
                {displayImages.map((img, index) => (
                  <ThumbnailImage
                    key={index}
                    src={getImageUrl(img)}
                    alt={`Thumbnail ${index + 1}`}
                    selected={selectedImageIndex === index}
                    onClick={() => setSelectedImageIndex(index)}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://via.placeholder.com/150x150/333333/ffffff?text=${index + 1}`;
                    }}
                  />
                ))}
              </ThumbnailGrid>
            )}
          </animated.div>

          {/* Right Column: Key Info */}
          <animated.div style={slideRight}>
            <InfoPanel>
              <GlowingBadge>
                {product.category.name}
              </GlowingBadge>

              <PremiumTitle>{product.name}</PremiumTitle>

              <PriceBox>
                <PriceTag>
                  ₹{product.price}
                </PriceTag>
              </PriceBox>

              <StockIndicator instock={inStock}>
                {inStock ? <CheckCircleOutlineIcon /> : <ErrorOutlineIcon />}
                {inStock ? `${product.stock} units securely in stock and ready to ship` : 'Currently out of stock'}
              </StockIndicator>

              <DescText>
                {product.description}
              </DescText>

              <ActionButtonGroup>
                <SecondaryButton
                  onClick={handleAddToCart}
                  disabled={!inStock}
                  startIcon={<ShoppingCartIcon />}
                >
                  Add to Cart
                </SecondaryButton>

                <PrimaryButton
                  onClick={handleBuyNow}
                  disabled={!inStock}
                  startIcon={<FlashOnIcon />}
                >
                  Buy It Now
                </PrimaryButton>
              </ActionButtonGroup>
            </InfoPanel>
          </animated.div>
        </HeroGrid>

        <animated.div style={cardsMount}>
          {/* Top details section: Overview Grid */}
          <GlassCard sx={{ mb: '60px' }}>
            <CardHeader variant="h2">
              <Inventory2OutlinedIcon fontSize="large" sx={{ color: '#60a5fa' }} />
              Product Overview
            </CardHeader>
            <StatsGrid>
              <StatBox>
                <StatIconWrapper><CategoryOutlinedIcon /></StatIconWrapper>
                <StatContent>
                  <StatLabel>Category</StatLabel>
                  <StatValue>{product.category.name}</StatValue>
                </StatContent>
              </StatBox>

              {product.brand && (
                <StatBox>
                  <StatIconWrapper><VerifiedUserOutlinedIcon /></StatIconWrapper>
                  <StatContent>
                    <StatLabel>Brand</StatLabel>
                    <StatValue>{product.brand}</StatValue>
                  </StatContent>
                </StatBox>
              )}

              {product.model_number && (
                <StatBox>
                  <StatIconWrapper><SettingsOutlinedIcon /></StatIconWrapper>
                  <StatContent>
                    <StatLabel>Model Number</StatLabel>
                    <StatValue>{product.model_number}</StatValue>
                  </StatContent>
                </StatBox>
              )}

              {product.warranty_period && (
                <StatBox>
                  <StatIconWrapper><VerifiedUserOutlinedIcon /></StatIconWrapper>
                  <StatContent>
                    <StatLabel>Warranty</StatLabel>
                    <StatValue>{product.warranty_period}</StatValue>
                  </StatContent>
                </StatBox>
              )}

              {product.dimensions && (
                <StatBox>
                  <StatIconWrapper><StraightenOutlinedIcon /></StatIconWrapper>
                  <StatContent>
                    <StatLabel>Dimensions</StatLabel>
                    <StatValue>{product.dimensions}</StatValue>
                  </StatContent>
                </StatBox>
              )}

              {product.weight && (
                <StatBox>
                  <StatIconWrapper><ScaleOutlinedIcon /></StatIconWrapper>
                  <StatContent>
                    <StatLabel>Weight</StatLabel>
                    <StatValue>{product.weight} kg</StatValue>
                  </StatContent>
                </StatBox>
              )}

              {product.delivery_time_info && (
                <StatBox sx={{ border: '1px solid rgba(52, 211, 153, 0.2)' }}>
                  <StatIconWrapper sx={{ background: 'rgba(52, 211, 153, 0.1)', color: '#34d399' }}>
                    <LocalShippingOutlinedIcon />
                  </StatIconWrapper>
                  <StatContent>
                    <StatLabel>Estimated Delivery</StatLabel>
                    <StatValue sx={{ color: '#34d399' }}>{product.delivery_time_info}</StatValue>
                  </StatContent>
                </StatBox>
              )}
            </StatsGrid>
          </GlassCard>

          {/* Bottom details section: Features & Tech Specs */}
          <SectionGrid>
            <GlassCard>
              <CardHeader variant="h2">
                <FlashOnIcon fontSize="large" sx={{ color: '#60a5fa' }} />
                Premium Features
              </CardHeader>

              {product.features_list && product.features_list.length > 0 ? (
                <Box>
                  {product.features_list.map((feature, index) => (
                    <FeatureItem key={index}>
                      <CheckCircleOutlineIcon className="icon" />
                      <Typography sx={{ color: 'rgba(255,255,255,0.9)', fontSize: '15px', lineHeight: 1.6 }}>
                        {feature}
                      </Typography>
                    </FeatureItem>
                  ))}
                </Box>
              ) : (
                <Typography sx={{ color: 'rgba(255, 255, 255, 0.5)', fontStyle: 'italic' }}>
                  {product.features || "Detailed features will be listed here soon."}
                </Typography>
              )}
            </GlassCard>

            <GlassCard>
              <CardHeader variant="h2">
                <SettingsOutlinedIcon fontSize="large" sx={{ color: '#60a5fa' }} />
                Technical Specs
              </CardHeader>

              <Box sx={{ background: 'rgba(0,0,0,0.2)', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.02)' }}>
                {product.specifications_dict && Object.keys(product.specifications_dict).length > 0 ? (
                  Object.entries(product.specifications_dict).map(([key, value]) => (
                    <SpecRow key={key}>
                      <Typography sx={{ color: 'rgba(255, 255, 255, 0.5)', fontWeight: 600, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {key}
                      </Typography>
                      <Typography sx={{ color: 'white', textAlign: 'right', fontWeight: 500, fontSize: '15px' }}>
                        {value}
                      </Typography>
                    </SpecRow>
                  ))
                ) : (
                  <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Typography sx={{ color: 'rgba(255, 255, 255, 0.5)', fontStyle: 'italic' }}>
                      Detailed technical specifications are not available.
                    </Typography>
                  </Box>
                )}
              </Box>
            </GlassCard>
          </SectionGrid>
        </animated.div>
      </ContentContainer>
    </PageWrapper>
  );
};
