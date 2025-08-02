import React from 'react';
import { CircularProgress, Box, Typography } from '@mui/material';

/**
 * LoadingSpinner component for displaying loading states
 * @param {Object} props - Component props
 * @param {string} props.message - Optional loading message
 * @param {string} props.size - Size of spinner (small, medium, large)
 * @param {boolean} props.fullScreen - Whether to show full screen loading
 * @param {string} props.color - Color of the spinner
 * @returns {JSX.Element} LoadingSpinner component
 */
const LoadingSpinner = ({ 
  message = '', 
  size = 'medium', 
  fullScreen = false,
  color = 'primary'
}) => {
  const sizeMap = {
    small: 20,
    medium: 40,
    large: 60
  };
  
  const spinnerSize = sizeMap[size] || sizeMap.medium;
  
  if (fullScreen) {
    return (
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 9999,
          gap: 2
        }}
      >
        <CircularProgress size={spinnerSize} color={color} />
        {message && (
          <Typography variant="body1" color="white">
            {message}
          </Typography>
        )}
      </Box>
    );
  }
  
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2,
        gap: 2
      }}
    >
      <CircularProgress size={spinnerSize} color={color} />
      {message && (
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      )}
    </Box>
  );
};

export default LoadingSpinner;