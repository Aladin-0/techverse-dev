// src/hooks/useRating.ts - Fixed with better error handling and correct URL
import { useState } from 'react';
import { useSnackbar } from 'notistack';
import apiClient from '../api';

interface RatingSubmission {
  rating: number;
  comment?: string;
  order_id?: number;
  service_request_id?: number;
}

interface UseRatingResult {
  submitRating: (data: RatingSubmission) => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

export const useRating = (): UseRatingResult => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { enqueueSnackbar } = useSnackbar();

  const submitRating = async (data: RatingSubmission): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {


      // Try the correct endpoint path
      const response = await apiClient.post('/api/ratings/create/', data);



      if (response.status === 201) {
        enqueueSnackbar('Rating submitted successfully!', { variant: 'success' });
        return true;
      } else {
        throw new Error('Unexpected response status: ' + response.status);
      }
    } catch (err: any) {




      let errorMessage = 'Failed to submit rating';

      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.status === 404) {
        errorMessage = 'Rating endpoint not found. Please check the API configuration.';
      } else if (err.response?.status === 403) {
        errorMessage = 'You are not authorized to submit this rating.';
      } else if (err.response?.status === 400) {
        errorMessage = 'Invalid rating data. Please check your inputs.';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      enqueueSnackbar(errorMessage, { variant: 'error' });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    submitRating,
    loading,
    error,
  };
};