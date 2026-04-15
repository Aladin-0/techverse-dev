// src/components/JobSheetForm.tsx - FULLY MOBILE-RESPONSIVE
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Box,
  Typography,
  IconButton,
  Divider,
  Alert,
  CircularProgress,
  useMediaQuery,
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useJobSheetStore } from '../stores/jobSheetStore';
import type { JobSheetMaterial } from '../stores/jobSheetStore';
import { useSnackbar } from 'notistack';

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    background: 'linear-gradient(135deg, rgba(20, 20, 20, 0.98) 0%, rgba(10, 10, 10, 0.98) 100%)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '20px',
    color: 'white',
    maxWidth: '900px',
    width: '100%',
    // MODIFIED: Remove border radius when in fullscreen mobile view
    [theme.breakpoints.down('sm')]: {
      borderRadius: 0,
    },
  },
}));

const StyledTextField = styled(TextField)({
  '& .MuiOutlinedInput-root': {
    color: 'white',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    '& fieldset': {
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    '&:hover fieldset': {
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#1C2B4A',
    },
  },
  '& .MuiInputLabel-root': {
    color: 'rgba(255, 255, 255, 0.7)',
    '&.Mui-focused': {
      color: '#1C2B4A',
    },
  },
  '& .MuiInputBase-input': {
    color: 'white',
  },
});

const PremiumButton = styled(Button)({
  backgroundColor: 'rgba(96, 165, 250, 0.15)',
  border: '1px solid rgba(28, 43, 74, 0.2)',
  color: '#1C2B4A',
  borderRadius: '12px',
  padding: '10px 24px',
  fontSize: '14px',
  fontWeight: 600,
  textTransform: 'none',
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: 'rgba(96, 165, 250, 0.25)',
    borderColor: 'rgba(96, 165, 250, 0.4)',
  },
  '&.success': {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
    color: '#22c55e',
    '&:hover': {
      backgroundColor: 'rgba(34, 197, 94, 0.25)',
    },
  },
  '&:disabled': {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    color: 'rgba(255, 255, 255, 0.3)',
  },
});

const MaterialRow = styled(Box)({
  background: 'rgba(255, 255, 255, 0.03)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: '12px',
  padding: '16px',
  marginBottom: '12px',
});

interface JobSheetFormProps {
  open: boolean;
  onClose: () => void;
  serviceRequest: {
    id: number;
    customer: { name: string; phone: string };
    service_location: {
      street_address: string;
      city: string;
      state: string;
      pincode: string;
    };
  };
  onSuccess?: () => void;
}

export const JobSheetForm: React.FC<JobSheetFormProps> = ({
  open,
  onClose,
  serviceRequest,
  onSuccess,
}) => {
  const { createJobSheet, loading, error, clearError } = useJobSheetStore();
  const { enqueueSnackbar } = useSnackbar();

  // MODIFIED: Use hooks to determine if on mobile for fullscreen dialog
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [formData, setFormData] = useState({
    equipment_type: '',
    serial_number: '',
    equipment_brand: '',
    equipment_model: '',
    problem_description: '',
    work_performed: '',
    date_of_service: new Date().toISOString().split('T')[0],
    start_time: '09:00',
    finish_time: '17:00',
  });

  const [materials, setMaterials] = useState<Omit<JobSheetMaterial, 'id'>[]>([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddMaterial = () => {
    setMaterials((prev) => [
      ...prev,
      {
        date_used: new Date().toISOString().split('T')[0],
        item_description: '',
        quantity: 1,
        unit_cost: 0,
      },
    ]);
  };

  const handleMaterialChange = (index: number, field: keyof Omit<JobSheetMaterial, 'id'>, value: any) => {
    setMaterials((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleRemoveMaterial = (index: number) => {
    setMaterials((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!formData.equipment_type || !formData.problem_description || !formData.work_performed || !formData.start_time || !formData.finish_time) {
      enqueueSnackbar('Please fill in all required fields marked with *', { variant: 'error' });
      return;
    }

    try {
      const serviceAddress = `${serviceRequest.service_location.street_address}, ${serviceRequest.service_location.city}, ${serviceRequest.service_location.state} - ${serviceRequest.service_location.pincode}`;
      const data = {
        service_request_id: serviceRequest.id,
        customer_name: serviceRequest.customer.name,
        customer_contact: serviceRequest.customer.phone,
        service_address: serviceAddress,
        ...formData,
        materials: materials.filter(
          (m) => m.item_description.trim() !== '' && m.quantity > 0
        ),
      };

      await createJobSheet(data);
      enqueueSnackbar('Job sheet created successfully!', { variant: 'success' });
      handleClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      enqueueSnackbar(err.message || 'Failed to create job sheet', { variant: 'error' });
    }
  };

  const handleClose = () => {
    setFormData({
      equipment_type: '', serial_number: '', equipment_brand: '',
      equipment_model: '', problem_description: '', work_performed: '',
      date_of_service: new Date().toISOString().split('T')[0],
      start_time: '09:00', finish_time: '17:00',
    });
    setMaterials([]);
    clearError();
    onClose();
  };

  return (
    <StyledDialog open={open} onClose={handleClose} maxWidth="md" fullWidth fullScreen={isMobile}>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5" component="h2" fontWeight={700} sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
            Create Job Sheet
          </Typography>
          <IconButton onClick={handleClose} sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', p: { xs: 2, sm: 3 } }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3, backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
            {error}
          </Alert>
        )}

        <Typography variant="h6" sx={{ mb: 2, color: '#1C2B4A', fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
          Customer Information
        </Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <StyledTextField fullWidth label="Customer Name" value={serviceRequest.customer.name} disabled />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <StyledTextField fullWidth label="Contact" value={serviceRequest.customer.phone} disabled />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <StyledTextField fullWidth label="Service Address" value={`${serviceRequest.service_location.street_address}, ${serviceRequest.service_location.city}`} disabled multiline rows={2} />
          </Grid>
        </Grid>

        <Divider sx={{ my: 3, backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />

        <Typography variant="h6" sx={{ mb: 2, color: '#1C2B4A', fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
          Equipment Details
        </Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6 }}><StyledTextField fullWidth label="Equipment Type *" name="equipment_type" value={formData.equipment_type} onChange={handleInputChange} placeholder="e.g., Laptop, Printer" required /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}><StyledTextField fullWidth label="Serial Number" name="serial_number" value={formData.serial_number} onChange={handleInputChange} /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}><StyledTextField fullWidth label="Brand/Make" name="equipment_brand" value={formData.equipment_brand} onChange={handleInputChange} placeholder="e.g., HP, Dell, Canon" /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}><StyledTextField fullWidth label="Model" name="equipment_model" value={formData.equipment_model} onChange={handleInputChange} /></Grid>
        </Grid>

        <Divider sx={{ my: 3, backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />

        <Typography variant="h6" sx={{ mb: 2, color: '#1C2B4A', fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
          Problem & Work Performed
        </Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12}><StyledTextField fullWidth label="Problem Description *" name="problem_description" value={formData.problem_description} onChange={handleInputChange} multiline rows={3} required /></Grid>
          <Grid item xs={12}><StyledTextField fullWidth label="Work Performed *" name="work_performed" value={formData.work_performed} onChange={handleInputChange} multiline rows={4} required /></Grid>
        </Grid>

        <Divider sx={{ my: 3, backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />

        <Typography variant="h6" sx={{ mb: 2, color: '#1C2B4A', fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
          Time Record
        </Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}><StyledTextField fullWidth label="Date *" name="date_of_service" type="date" value={formData.date_of_service} onChange={handleInputChange} InputLabelProps={{ shrink: true }} required /></Grid>
          <Grid item xs={12} sm={4}><StyledTextField fullWidth label="Start Time *" name="start_time" type="time" value={formData.start_time} onChange={handleInputChange} InputLabelProps={{ shrink: true }} required /></Grid>
          <Grid item xs={12} sm={4}><StyledTextField fullWidth label="Finish Time *" name="finish_time" type="time" value={formData.finish_time} onChange={handleInputChange} InputLabelProps={{ shrink: true }} required /></Grid>
        </Grid>

        <Divider sx={{ my: 3, backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />

        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" sx={{ color: '#1C2B4A', fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
            Materials Used
          </Typography>
          <PremiumButton onClick={handleAddMaterial} size="small">
            <AddIcon sx={{ mr: 1 }} /> Add
          </PremiumButton>
        </Box>

        {materials.length === 0 ? (
          <Alert severity="info" sx={{ mb: 2, backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#1C2B4A' }}>
            No materials added.
          </Alert>
        ) : (
          materials.map((material, index) => (
            <MaterialRow key={index}>
              {/* MODIFIED: Grid items now have both `xs` and `sm` props for a responsive layout */}
              <Grid container spacing={2} alignItems="center">
                <Grid size={{ xs: 12, sm: 3 }}><StyledTextField fullWidth label="Date" type="date" value={material.date_used} onChange={(e) => handleMaterialChange(index, 'date_used', e.target.value)} InputLabelProps={{ shrink: true }} size="small" /></Grid>
                <Grid size={{ xs: 12, sm: 4 }}><StyledTextField fullWidth label="Item Description" value={material.item_description} onChange={(e) => handleMaterialChange(index, 'item_description', e.target.value)} size="small" /></Grid>
                <Grid size={{ xs: 5, sm: 2 }}><StyledTextField fullWidth label="Qty" type="number" value={material.quantity} onChange={(e) => handleMaterialChange(index, 'quantity', parseFloat(e.target.value) || 0)} size="small" /></Grid>
                <Grid size={{ xs: 5, sm: 2 }}><StyledTextField fullWidth label="Cost (₹)" type="number" value={material.unit_cost} onChange={(e) => handleMaterialChange(index, 'unit_cost', parseFloat(e.target.value) || 0)} size="small" /></Grid>
                <Grid size={{ xs: 2, sm: 1 }} sx={{ textAlign: 'right' }}><IconButton onClick={() => handleRemoveMaterial(index)} sx={{ color: '#ef4444' }}><DeleteIcon /></IconButton></Grid>
              </Grid>
              <Typography variant="body2" sx={{ mt: 1, color: 'rgba(255, 255, 255, 0.7)', textAlign: 'right' }}>
                Total: ₹{(material.quantity * material.unit_cost).toFixed(2)}
              </Typography>
            </MaterialRow>
          ))
        )}

        {materials.length > 0 && (
          <Box sx={{ textAlign: 'right', mt: 2 }}>
            <Typography variant="h6" sx={{ color: '#22c55e' }}>
              Total Material Cost: ₹{materials.reduce((sum, m) => sum + m.quantity * m.unit_cost, 0).toFixed(2)}
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: { xs: 2, sm: 3 }, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <Button onClick={handleClose} sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Cancel</Button>
        <PremiumButton className="success" onClick={handleSubmit} disabled={loading}>
          {loading && <CircularProgress size={20} sx={{ mr: 1, color: 'white' }} />}
          Create Job Sheet
        </PremiumButton>
      </DialogActions>
    </StyledDialog>
  );
};