// src/components/RatingModal.tsx - Star rating popup modal
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField,
  Rating,
  Avatar,
  Chip,
  Alert
} from '@mui/material';
import { styled } from '@mui/material/styles';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import PersonIcon from '@mui/icons-material/Person';
import { useSnackbar } from 'notistack';
import { useRating } from '../hooks/useRating';

const NAVY = '#1C2B4A';
const GOLD = '#D4922A';
const BG = '#FAF9F5';
const TEXT = '#1A1814';
const MUTED = '#6B7280';
const BORDER = 'rgba(28,43,74,0.1)';

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    background: BG,
    border: `1px solid ${BORDER}`,
    borderRadius: '24px',
    color: TEXT,
    width: 'calc(100% - 32px)',
    maxWidth: '480px',
    margin: '16px',
    boxShadow: '0 24px 48px -12px rgba(28,43,74,0.15)',
    fontFamily: "'Inter', sans-serif",
  }
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  color: NAVY,
  fontSize: '22px',
  fontWeight: 800,
  textAlign: 'center',
  padding: '24px 24px 8px 24px',
  letterSpacing: '-0.02em',
  fontFamily: "'Inter', sans-serif",
  [theme.breakpoints.down('sm')]: {
    fontSize: '20px',
    padding: '20px 20px 8px 20px',
  },
}));

const StyledDialogContent = styled(DialogContent)(({ theme }) => ({
  padding: '24px',
  [theme.breakpoints.down('sm')]: {
    padding: '20px',
  },
}));

const StyledRating = styled(Rating)(({ theme }) => ({
  fontSize: '3.5rem',
  color: GOLD,
  '& .MuiRating-iconEmpty': {
    color: 'rgba(212,146,42,0.2)',
  },
  '& .MuiRating-iconFilled': {
    color: GOLD,
  },
  '& .MuiRating-iconHover': {
    color: '#E09020',
  },
  [theme.breakpoints.down('sm')]: {
    fontSize: '3rem',
  },
}));

const TechnicianCard = styled(Box)(({ theme }) => ({
  background: '#ffffff',
  border: `1px solid ${BORDER}`,
  boxShadow: '0 2px 12px rgba(28,43,74,0.03)',
  borderRadius: '16px',
  padding: '16px',
  marginBottom: '24px',
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
    textAlign: 'center',
    gap: '12px',
    padding: '20px',
  },
}));

const SubmitButton = styled(Button)({
  backgroundColor: NAVY,
  color: '#fff',
  borderRadius: '12px',
  padding: '12px 28px',
  fontSize: '14px',
  fontWeight: 700,
  textTransform: 'none',
  boxShadow: '0 4px 12px rgba(28,43,74,0.15)',
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: '#111A2D',
    boxShadow: '0 6px 16px rgba(28,43,74,0.2)',
  },
  '&:disabled': {
    backgroundColor: 'rgba(28,43,74,0.05)',
    color: 'rgba(28,43,74,0.3)',
    boxShadow: 'none',
  },
});

const CancelButton = styled(Button)({
  color: MUTED,
  borderRadius: '12px',
  padding: '12px 24px',
  fontSize: '14px',
  fontWeight: 600,
  textTransform: 'none',
  '&:hover': {
    backgroundColor: 'rgba(28,43,74,0.04)',
    color: NAVY,
  },
});

const StyledTextField = styled(TextField)({
  '& .MuiOutlinedInput-root': {
    backgroundColor: '#ffffff',
    border: `1px solid ${BORDER}`,
    borderRadius: '12px',
    color: TEXT,
    fontFamily: "'Inter', sans-serif",
    transition: 'all 0.2s ease',
    '&:hover': {
      borderColor: 'rgba(28,43,74,0.3)',
    },
    '&.Mui-focused': {
      backgroundColor: '#ffffff',
      borderColor: NAVY,
      boxShadow: '0 0 0 3px rgba(28,43,74,0.08)',
    },
    '& fieldset': {
      border: 'none',
    },
  },
  '& .MuiInputLabel-root': {
    color: MUTED,
    fontFamily: "'Inter', sans-serif",
  },
  '& .MuiOutlinedInput-input': {
    color: TEXT,
    padding: '14px',
    '&::placeholder': {
      color: '#A0AABF',
    },
  },
});

const ratingLabels: { [index: string]: string } = {
  1: 'Poor',
  2: 'Fair', 
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent',
};

interface RatingModalProps {
  open: boolean;
  onClose: () => void;
  order?: {
    id: number;
    technician_name?: string;
    technician_phone?: string;
  };
  serviceRequest?: {
    id: number;
    technician?: {
      name: string;
      phone?: string;
    };
  };
  onRatingSubmitted?: () => void;
}

export const RatingModal: React.FC<RatingModalProps> = ({
  open,
  onClose,
  order,
  serviceRequest,
  onRatingSubmitted
}) => {
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const { submitRating, loading: submitting, error } = useRating();
  const { enqueueSnackbar } = useSnackbar();

  const handleSubmit = async () => {
    if (!rating) {
      enqueueSnackbar('Please select a rating', { variant: 'error' });
      return;
    }

    const payload = {
      rating,
      comment: comment.trim(),
      ...(order && { order_id: order.id }),
      ...(serviceRequest && { service_request_id: serviceRequest.id }),
    };

    const success = await submitRating(payload);

    if (success) {
      setRating(null);
      setComment('');
      if (onRatingSubmitted) {
        onRatingSubmitted();
      }
      onClose();
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setRating(null);
      setComment('');
      onClose();
    }
  };

  const getTechnicianInfo = () => {
    if (order) {
      return {
        name: order.technician_name || 'Technician',
        phone: order.technician_phone || 'N/A'
      };
    }
    if (serviceRequest?.technician) {
      return {
        name: serviceRequest.technician.name || 'Technician',
        phone: serviceRequest.technician.phone || 'N/A'
      };
    }
    return { name: 'Technician', phone: 'N/A' };
  };

  const technicianInfo = getTechnicianInfo();
  const isOrder = !!order;
  const serviceType = isOrder ? 'delivery/installation' : 'service';

  return (
    <StyledDialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <StyledDialogTitle>
        Rate Your Experience
      </StyledDialogTitle>

      <StyledDialogContent>
        {/* Technician Info */}
        <TechnicianCard>
          <Avatar sx={{ 
            width: 50, 
            height: 50, 
            background: `linear-gradient(135deg, ${NAVY}, #2a3f6a)`,
            fontSize: '20px',
            fontWeight: 700
          }}>
            {technicianInfo.name.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ color: TEXT, fontWeight: 700, mb: 0.5, fontFamily: "'Inter', sans-serif" }}>
              {technicianInfo.name}
            </Typography>
            <Typography sx={{ color: MUTED, fontSize: '13px', fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>
              Technician • {technicianInfo.phone}
            </Typography>
          </Box>
          <Chip 
            label={isOrder ? 'Order' : 'Service'}
            size="small"
            sx={{
              backgroundColor: isOrder ? 'rgba(59, 130, 246, 0.1)' : 'rgba(139, 92, 246, 0.1)',
              color: isOrder ? '#2563eb' : '#7c3aed',
              border: `1px solid ${isOrder ? 'rgba(59, 130, 246, 0.2)' : 'rgba(139, 92, 246, 0.2)'}`,
              fontWeight: 800,
              fontFamily: "'Inter', sans-serif"
            }}
          />
        </TechnicianCard>

        {/* Rating Section */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography sx={{ color: TEXT, mb: 2, fontSize: '15px', fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>
            How would you rate the {serviceType} experience?
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <StyledRating
              value={rating}
              onChange={(event, newValue) => {
                setRating(newValue);
              }}
              icon={<StarIcon fontSize="inherit" />}
              emptyIcon={<StarBorderIcon fontSize="inherit" />}
              size="large"
            />
          </Box>

          {rating && (
            <Typography sx={{ 
              color: GOLD, 
              fontWeight: 800, 
              fontSize: '16px',
              fontFamily: "'Inter', sans-serif",
              mb: 1 
            }}>
              {ratingLabels[rating]} ({rating}/5)
            </Typography>
          )}
        </Box>

        {/* Comment Section */}
        <Box sx={{ mb: 3 }}>
          <Typography sx={{ 
            color: TEXT, 
            mb: 1.5, 
            fontSize: '14px',
            fontWeight: 700,
            fontFamily: "'Inter', sans-serif"
          }}>
            Share your feedback <span style={{ color: MUTED, fontWeight: 500 }}>(optional)</span>
          </Typography>
          <StyledTextField
            fullWidth
            multiline
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell us about your experience..."
            variant="outlined"
            disabled={submitting}
          />
        </Box>

        {/* Error Display */}
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 2,
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              '& .MuiAlert-icon': {
                color: '#ef4444',
              },
            }}
          >
            {error}
          </Alert>
        )}
      </StyledDialogContent>

      <DialogActions sx={{ p: { xs: 2, sm: 3 }, gap: 2 }}>
        <CancelButton onClick={handleClose} disabled={submitting}>
          Cancel
        </CancelButton>
        <SubmitButton 
          onClick={handleSubmit} 
          disabled={!rating || submitting}
        >
          {submitting ? 'Submitting...' : 'Submit Rating'}
        </SubmitButton>
      </DialogActions>
    </StyledDialog>
  );
};