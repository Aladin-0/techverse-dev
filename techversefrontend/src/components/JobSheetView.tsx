// src/components/JobSheetView.tsx - Job Sheet View and Approval for Customers

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Divider,
  Grid,
  Chip,
  TextField,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BuildIcon from '@mui/icons-material/Build';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useJobSheetStore } from '../stores/jobSheetStore';
import type { JobSheet } from '../stores/jobSheetStore';
import { useSnackbar } from 'notistack';

const NAVY = '#1C2B4A';
const GOLD = '#D4922A';
const D_BG = '#FAF9F5';
const D_TEXT = '#1A1814';
const D_MUTED = '#6B7280';
const D_BORDER = 'rgba(28,43,74,0.1)';

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    background: D_BG,
    border: `1px solid ${D_BORDER}`,
    borderRadius: '20px',
    color: D_TEXT,
    maxWidth: '1000px',
    width: '100%',
    boxShadow: '0 24px 64px -12px rgba(28,43,74,0.15)',
    fontFamily: "'Inter', sans-serif",
  },
}));

const StyledTextField = styled(TextField)({
  '& .MuiOutlinedInput-root': {
    color: D_TEXT,
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    '& fieldset': {
      borderColor: D_BORDER,
    },
    '&:hover fieldset': {
      borderColor: 'rgba(28,43,74,0.3)',
    },
    '&.Mui-focused fieldset': {
      borderColor: NAVY,
      boxShadow: '0 0 0 3px rgba(28,43,74,0.08)',
    },
  },
  '& .MuiInputLabel-root': {
    color: D_MUTED,
    '&.Mui-focused': {
      color: NAVY,
    },
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
  '&.danger': {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    color: '#ef4444',
    '&:hover': {
      backgroundColor: 'rgba(239, 68, 68, 0.25)',
    },
  },
  '&:disabled': {
    opacity: 0.5,
  },
});

const InfoCard = styled(Box)({
  background: '#ffffff',
  border: `1px solid ${D_BORDER}`,
  borderRadius: '12px',
  padding: '16px',
  marginBottom: '16px',
  boxShadow: '0 2px 8px rgba(28,43,74,0.04)',
});

const StatusChip = styled(Chip)<{ status: string }>(({ status }) => {
  const getStatusColor = () => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return { bg: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24', border: 'rgba(251, 191, 36, 0.3)' };
      case 'approved':
        return { bg: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', border: 'rgba(34, 197, 94, 0.3)' };
      case 'declined':
        return { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' };
      default:
        return { bg: 'rgba(156, 163, 175, 0.15)', color: '#9ca3af', border: 'rgba(156, 163, 175, 0.3)' };
    }
  };

  const colors = getStatusColor();
  return {
    backgroundColor: colors.bg,
    color: colors.color,
    border: `1px solid ${colors.border}`,
    fontWeight: 600,
    fontSize: '12px',
  };
});

interface JobSheetViewProps {
  open: boolean;
  onClose: () => void;
  jobSheet: JobSheet | null;
  onUpdate?: () => void;
}

export const JobSheetView: React.FC<JobSheetViewProps> = ({
  open,
  onClose,
  jobSheet,
  onUpdate,
}) => {
  const { approveJobSheet, declineJobSheet, loading } = useJobSheetStore();
  const { enqueueSnackbar } = useSnackbar();

  const [showDeclineForm, setShowDeclineForm] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!jobSheet) return null;

  const handleApprove = async () => {
    try {
      await approveJobSheet(jobSheet.id);
      enqueueSnackbar('Job sheet approved successfully!', { variant: 'success' });
      if (onUpdate) onUpdate();
      onClose();
    } catch (error: any) {
      enqueueSnackbar(error.message || 'Failed to approve job sheet', { variant: 'error' });
    }
  };

  const handleDecline = async () => {
    if (!declineReason.trim()) {
      enqueueSnackbar('Please provide a reason for declining', { variant: 'error' });
      return;
    }

    try {
      await declineJobSheet(jobSheet.id, declineReason);
      enqueueSnackbar('Job sheet declined', { variant: 'info' });
      if (onUpdate) onUpdate();
      onClose();
    } catch (error: any) {
      enqueueSnackbar(error.message || 'Failed to decline job sheet', { variant: 'error' });
    }
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (duration: string) => {
    if (!duration) return '';
    const parts = duration.split(':');
    const hours = parseInt(parts[0]);
    const minutes = parseInt(parts[1]);
    return `${hours}h ${minutes}m`;
  };

  if (isMobile) {
    return (
      <Dialog open={open} onClose={onClose} fullScreen sx={{ '& .MuiDialog-paper': { background: '#FAF9F5', fontFamily: "'Inter', sans-serif" } }}>
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', minHeight: '100%', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#1C2B4A', letterSpacing: '-0.5px' }}>Job Sheet #{jobSheet.id}</h2>
              <p style={{ margin: '4px 0 0', fontSize: 12, fontWeight: 600, color: '#6B7280' }}>Req #{jobSheet.service_request_id} • {jobSheet.service_category_name}</p>
            </div>
            <IconButton onClick={onClose} sx={{ color: '#1A1814', background: 'rgba(28,43,74,0.05)' }}>
              <CloseIcon />
            </IconButton>
          </div>

          <StatusChip label={jobSheet.approval_status} status={jobSheet.approval_status} sx={{ alignSelf: 'flex-start', mb: 1 }} />

          <div style={{ background: '#fff', border: '1px solid rgba(28,43,74,0.1)', borderRadius: 16, padding: 16 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 800, color: '#1C2B4A', display: 'flex', alignItems: 'center', gap: 6 }}><PersonIcon fontSize="small"/> Details & Tech</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
              <div>
                <p style={{ margin: 0, fontSize: 10, color: '#6B7280', textTransform: 'uppercase', fontWeight: 700 }}>Customer Name / Contact</p>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#1A1814' }}>{jobSheet.customer_name} • {jobSheet.customer_contact}</p>
              </div>
              <Divider />
              <div>
                <p style={{ margin: 0, fontSize: 10, color: '#6B7280', textTransform: 'uppercase', fontWeight: 700 }}>Technician Assigned</p>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#1A1814' }}>{jobSheet.technician_name}</p>
              </div>
            </div>
          </div>

          <div style={{ background: '#fff', border: '1px solid rgba(28,43,74,0.1)', borderRadius: 16, padding: 16 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 800, color: '#1C2B4A', display: 'flex', alignItems: 'center', gap: 6 }}><BuildIcon fontSize="small"/> Equipment & Work</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <p style={{ margin: 0, fontSize: 10, color: '#6B7280', textTransform: 'uppercase', fontWeight: 700 }}>{jobSheet.equipment_type} • {jobSheet.equipment_brand}</p>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#1A1814' }}>SN: {jobSheet.serial_number || 'N/A'}</p>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 10, color: '#6B7280', textTransform: 'uppercase', fontWeight: 700 }}>Problem Logged</p>
                <p style={{ margin: 0, fontSize: 13, color: '#1A1814', background: '#FAF9F5', padding: 8, borderRadius: 8, mt: 4 }}>{jobSheet.problem_description}</p>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 10, color: '#6B7280', textTransform: 'uppercase', fontWeight: 700 }}>Work Performed By Tech</p>
                <p style={{ margin: 0, fontSize: 13, color: '#1A1814', background: '#FAF9F5', padding: 8, borderRadius: 8, mt: 4 }}>{jobSheet.work_performed}</p>
              </div>
            </div>
          </div>

          <div style={{ background: '#fff', border: '1px solid rgba(28,43,74,0.1)', borderRadius: 16, padding: 16 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 800, color: '#1C2B4A', display: 'flex', alignItems: 'center', gap: 6 }}><AccessTimeIcon fontSize="small"/> Materials & Cost Wrap-up</h3>
            {(!jobSheet.materials || jobSheet.materials.length === 0) ? (
              <p style={{ margin: 0, fontSize: 12, color: '#6B7280' }}>No spare components required.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {jobSheet.materials.map(m => (
                  <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px solid #f3f4f6', paddingBottom: 6 }}>
                    <span style={{ color: '#1A1814', fontWeight: 500 }}>{m.quantity}x {m.item_description}</span>
                    <span style={{ color: '#1A1814', fontWeight: 800 }}>₹{Number(m.total_cost).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, paddingTop: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#6B7280', textTransform: 'uppercase' }}>Grand Total</span>
              <span style={{ fontSize: 22, fontWeight: 900, color: '#22c55e' }}>₹{Number(jobSheet.total_material_cost).toFixed(2)}</span>
            </div>
          </div>

          <div style={{ flex: 1 }} />

          {jobSheet.approval_status === 'PENDING' && (
            <div style={{ position: 'sticky', bottom: 0, background: '#FAF9F5', paddingTop: 16, pb: 4, display: 'flex', flexDirection: 'column', gap: 12, zIndex: 10 }}>
              {!showDeclineForm ? (
                <div style={{ display: 'flex', gap: 12 }}>
                  <button onClick={() => setShowDeclineForm(true)} disabled={loading} style={{ flex: 1, padding: '16px', background: '#FEF2F2', color: '#EF4444', border: '1px solid #FECACA', borderRadius: 12, fontWeight: 800, fontSize: 14 }}>Reject</button>
                  <button onClick={handleApprove} disabled={loading} style={{ flex: 1.5, padding: '16px', background: '#10B981', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 800, fontSize: 14, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}>
                    {loading ? <CircularProgress size={16} color="inherit" /> : <CheckCircleIcon sx={{ fontSize: 18 }}/>} Approve
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, background: '#fff', padding: 16, borderRadius: 16, border: '1px solid #FECACA' }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#EF4444' }}>Why are you declining this?</p>
                  <textarea rows={3} value={declineReason} onChange={e => setDeclineReason(e.target.value)} placeholder="Provide your reason..." style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #FCA5A5', outline: 'none', fontFamily: 'inherit', fontSize: 13 }} />
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => { setShowDeclineForm(false); setDeclineReason(''); }} style={{ flex: 1, padding: '12px', background: 'transparent', color: '#6B7280', border: 'none', fontWeight: 700, fontSize: 13 }}>Cancel</button>
                    <button onClick={handleDecline} disabled={loading || !declineReason.trim()} style={{ flex: 1, padding: '12px', background: '#EF4444', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 800, fontSize: 13 }}>{loading ? '...' : 'Confirm'}</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Dialog>
    );
  }

  return (
    <StyledDialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h5" fontWeight={700}>
              Job Sheet #{jobSheet.id}
            </Typography>
            <Typography variant="body2" sx={{ color: D_MUTED, mt: 0.5 }}>
              Service Request #{jobSheet.service_request_id} - {jobSheet.service_category_name}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={2}>
            <StatusChip label={jobSheet.approval_status} status={jobSheet.approval_status} />
            <IconButton onClick={onClose} sx={{ color: D_MUTED }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ borderColor: D_BORDER }}>
        {/* Customer Information */}
        <Typography variant="h6" sx={{ mb: 2, color: '#1C2B4A', display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonIcon /> Customer Information
        </Typography>
        <InfoCard>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Typography variant="body2" sx={{ color: D_MUTED, mb: 0.5 }}>
                Name
              </Typography>
              <Typography variant="body1" fontWeight={500}>
                {jobSheet.customer_name}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Typography variant="body2" sx={{ color: D_MUTED, mb: 0.5 }}>
                Contact
              </Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <PhoneIcon sx={{ fontSize: '16px', color: D_MUTED }} />
                <Typography variant="body1" fontWeight={500}>
                  {jobSheet.customer_contact}
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Typography variant="body2" sx={{ color: D_MUTED, mb: 0.5 }}>
                Technician
              </Typography>
              <Typography variant="body1" fontWeight={500}>
                {jobSheet.technician_name}
              </Typography>
              <Typography variant="caption" sx={{ color: D_MUTED }}>
                {jobSheet.technician_phone}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Typography variant="body2" sx={{ color: D_MUTED, mb: 0.5 }}>
                <LocationOnIcon sx={{ fontSize: '14px', mr: 0.5 }} />
                Service Location
              </Typography>
              <Typography variant="body1" fontWeight={500}>
                {jobSheet.service_address}
              </Typography>
            </Grid>
          </Grid>
        </InfoCard>

        <Divider sx={{ my: 3, backgroundColor: D_BORDER }} />

        {/* Equipment Details */}
        <Typography variant="h6" sx={{ mb: 2, color: '#1C2B4A', display: 'flex', alignItems: 'center', gap: 1 }}>
          <BuildIcon /> Equipment Details
        </Typography>
        <InfoCard>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', mb: 0.5 }}>
                Equipment Type
              </Typography>
              <Typography variant="body1" fontWeight={500}>
                {jobSheet.equipment_type}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', mb: 0.5 }}>
                Serial Number
              </Typography>
              <Typography variant="body1" fontWeight={500}>
                {jobSheet.serial_number || 'N/A'}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', mb: 0.5 }}>
                Brand/Make
              </Typography>
              <Typography variant="body1" fontWeight={500}>
                {jobSheet.equipment_brand || 'N/A'}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', mb: 0.5 }}>
                Model
              </Typography>
              <Typography variant="body1" fontWeight={500}>
                {jobSheet.equipment_model || 'N/A'}
              </Typography>
            </Grid>
          </Grid>
        </InfoCard>

        <Divider sx={{ my: 3, backgroundColor: D_BORDER }} />

        {/* Problem & Work */}
        <Typography variant="h6" sx={{ mb: 2, color: '#1C2B4A' }}>
          Problem & Work Performed
        </Typography>
        <InfoCard>
          <Typography variant="body2" sx={{ color: D_MUTED, mb: 1 }}>
            Problem Description
          </Typography>
          <Typography variant="body1" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
            {jobSheet.problem_description}
          </Typography>

          <Typography variant="body2" sx={{ color: D_MUTED, mb: 1 }}>
            Work Performed
          </Typography>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
            {jobSheet.work_performed}
          </Typography>
        </InfoCard>

        <Divider sx={{ my: 3, backgroundColor: D_BORDER }} />

        {/* Time Record */}
        <Typography variant="h6" sx={{ mb: 2, color: '#1C2B4A', display: 'flex', alignItems: 'center', gap: 1 }}>
          <AccessTimeIcon /> Time Record
        </Typography>
        <InfoCard>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 3 }}>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', mb: 0.5 }}>
                Date
              </Typography>
              <Typography variant="body1" fontWeight={500}>
                {new Date(jobSheet.date_of_service).toLocaleDateString()}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', mb: 0.5 }}>
                Start Time
              </Typography>
              <Typography variant="body1" fontWeight={500}>
                {formatTime(jobSheet.start_time)}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', mb: 0.5 }}>
                Finish Time
              </Typography>
              <Typography variant="body1" fontWeight={500}>
                {formatTime(jobSheet.finish_time)}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', mb: 0.5 }}>
                Total Time
              </Typography>
              <Typography variant="body1" fontWeight={600} sx={{ color: NAVY }}>
                {formatDuration(jobSheet.total_time_taken)}
              </Typography>
            </Grid>
          </Grid>
        </InfoCard>

        <Divider sx={{ my: 3, backgroundColor: D_BORDER }} />

        {/* Materials Used */}
        <Typography variant="h6" sx={{ mb: 2, color: '#1C2B4A' }}>
          Materials Used
        </Typography>
        {(!jobSheet.materials || jobSheet.materials.length === 0) ? (
          <Alert
            severity="info"
            sx={{
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
              color: '#1C2B4A',
              border: '1px solid rgba(59, 130, 246, 0.3)',
            }}
          >
            No materials were used in this job.
          </Alert>
        ) : (
          <>
            <TableContainer
              sx={{
                background: '#ffffff',
                border: `1px solid ${D_BORDER}`,
                borderRadius: '12px',
              }}
            >
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: D_MUTED, fontWeight: 700, border: 'none', background: '#f9fafb' }}>
                      Date
                    </TableCell>
                    <TableCell sx={{ color: D_MUTED, fontWeight: 700, border: 'none', background: '#f9fafb' }}>
                      Item Description
                    </TableCell>
                    <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600, border: 'none' }} align="right">
                      Qty
                    </TableCell>
                    <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600, border: 'none' }} align="right">
                      Cost
                    </TableCell>
                    <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600, border: 'none' }} align="right">
                      Total
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {jobSheet.materials?.map((material) => (
                    <TableRow key={material.id}>
                      <TableCell sx={{ color: D_TEXT, border: 'none' }}>
                        {new Date(material.date_used).toLocaleDateString()}
                      </TableCell>
                      <TableCell sx={{ color: D_TEXT, border: 'none' }}>
                        {material.item_description}
                      </TableCell>
                      <TableCell sx={{ color: 'white', border: 'none' }} align="right">
                        {material.quantity}
                      </TableCell>
                      <TableCell sx={{ color: 'white', border: 'none' }} align="right">
                        ₹{Number(material.unit_cost).toFixed(2)}
                      </TableCell>
                      <TableCell sx={{ color: 'white', border: 'none' }} align="right">
                        ₹{Number(material.total_cost).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={4} sx={{ color: '#1C2B4A', fontWeight: 700, border: 'none' }} align="right">
                      Total Material Cost:
                    </TableCell>
                    <TableCell sx={{ color: '#22c55e', fontWeight: 700, fontSize: '16px', border: 'none' }} align="right">
                      ₹{Number(jobSheet.total_material_cost).toFixed(2)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}

        {/* Decline Form */}
        {showDeclineForm && jobSheet.approval_status === 'PENDING' && (
          <Box sx={{ mt: 3 }}>
            <Alert
              severity="warning"
              sx={{
                mb: 2,
                backgroundColor: 'rgba(251, 191, 36, 0.15)',
                color: '#fbbf24',
                border: '1px solid rgba(251, 191, 36, 0.3)',
              }}
            >
              Please provide a reason for declining this job sheet
            </Alert>
            <StyledTextField
              fullWidth
              label="Reason for Declining"
              multiline
              rows={3}
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="Please explain why you're declining this job sheet..."
            />
          </Box>
        )}

        {/* Declined Reason Display */}
        {jobSheet.approval_status === 'DECLINED' && jobSheet.declined_reason && (
          <Box sx={{ mt: 3 }}>
            <Alert
              severity="error"
              sx={{
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                color: '#ef4444',
                border: '1px solid rgba(239, 68, 68, 0.3)',
              }}
            >
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                Decline Reason:
              </Typography>
              <Typography variant="body2">{jobSheet.declined_reason}</Typography>
            </Alert>
          </Box>
        )}

        {/* Approval Info */}
        {jobSheet.approval_status === 'APPROVED' && jobSheet.approved_at && (
          <Box sx={{ mt: 3 }}>
            <Alert
              severity="success"
              sx={{
                backgroundColor: 'rgba(34, 197, 94, 0.15)',
                color: '#22c55e',
                border: '1px solid rgba(34, 197, 94, 0.3)',
              }}
            >
              <Typography variant="body2">
                Approved on {new Date(jobSheet.approved_at).toLocaleString()}
              </Typography>
            </Alert>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 2 }}>
        <Button
          onClick={onClose}
          sx={{
            color: 'rgba(255, 255, 255, 0.7)',
            '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)' },
          }}
        >
          Close
        </Button>

        {jobSheet.approval_status === 'PENDING' && (
          <>
            {!showDeclineForm ? (
              <>
                <PremiumButton
                  className="danger"
                  onClick={() => setShowDeclineForm(true)}
                  disabled={loading}
                >
                  <CancelIcon sx={{ mr: 1 }} />
                  Decline
                </PremiumButton>
                <PremiumButton
                  className="success"
                  onClick={handleApprove}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={20} sx={{ mr: 1 }} /> : <CheckCircleIcon sx={{ mr: 1 }} />}
                  Approve Job Sheet
                </PremiumButton>
              </>
            ) : (
              <>
                <Button
                  onClick={() => {
                    setShowDeclineForm(false);
                    setDeclineReason('');
                  }}
                  sx={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)' },
                  }}
                >
                  Cancel Decline
                </Button>
                <PremiumButton
                  className="danger"
                  onClick={handleDecline}
                  disabled={loading || !declineReason.trim()}
                >
                  {loading ? <CircularProgress size={20} sx={{ mr: 1 }} /> : <CancelIcon sx={{ mr: 1 }} />}
                  Confirm Decline
                </PremiumButton>
              </>
            )}
          </>
        )}
      </DialogActions>
    </StyledDialog>
  );
};