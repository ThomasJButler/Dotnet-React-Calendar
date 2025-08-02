import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  CircularProgress, 
  LinearProgress,
  Alert,
  AlertTitle,
  Fade,
  useTheme
} from '@mui/material';
import { 
  CloudQueue as CloudIcon,
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';

/**
 * ServerWarmingLoader component
 * Displays a friendly loading screen while the backend server warms up
 * @param {Object} props - Component props
 * @param {boolean} props.isWarming - Whether the server is warming up
 * @param {number} props.attempt - Current connection attempt number
 * @param {number} props.maxAttempts - Maximum number of attempts
 * @returns {JSX.Element|null} ServerWarmingLoader component or null
 */
const ServerWarmingLoader = ({ isWarming, attempt = 1, maxAttempts = 10 }) => {
  const [progress, setProgress] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const theme = useTheme();

  // Calculate progress based on attempts
  useEffect(() => {
    if (isWarming) {
      const newProgress = (attempt / maxAttempts) * 100;
      setProgress(Math.min(newProgress, 90)); // Cap at 90% until actually connected
    } else if (progress > 0) {
      // Server connected successfully
      setProgress(100);
      setShowSuccess(true);
      // Hide the loader after showing success
      setTimeout(() => {
        setShowSuccess(false);
        setProgress(0);
      }, 2000);
    }
  }, [isWarming, attempt, maxAttempts, progress]);

  // Don't render if not warming and not showing success
  if (!isWarming && !showSuccess) return null;

  // Estimate time remaining
  const estimatedSeconds = Math.max(30 - (attempt * 3), 0);

  return (
    <Fade in={isWarming || showSuccess}>
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          backdropFilter: 'blur(4px)'
        }}
      >
        <Paper
          elevation={6}
          sx={{
            p: 4,
            maxWidth: 500,
            width: '90%',
            textAlign: 'center',
            backgroundColor: theme.palette.background.paper,
            borderRadius: 2
          }}
        >
          {/* Icon */}
          <Box sx={{ mb: 3, position: 'relative', display: 'inline-block' }}>
            {showSuccess ? (
              <CheckIcon sx={{ fontSize: 64, color: 'success.main' }} />
            ) : (
              <>
                <CloudIcon sx={{ fontSize: 64, color: 'primary.main' }} />
                <CircularProgress
                  size={80}
                  thickness={2}
                  sx={{
                    position: 'absolute',
                    top: -8,
                    left: -8,
                    color: 'primary.light'
                  }}
                />
              </>
            )}
          </Box>

          {/* Title */}
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
            {showSuccess ? 'Connected!' : 'Starting Up Server'}
          </Typography>

          {/* Description */}
          {!showSuccess && (
            <>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                The backend server is waking up from sleep mode. This happens on the first visit after a period of inactivity.
              </Typography>

              {/* Progress bar */}
              <Box sx={{ width: '100%', mb: 2 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={progress} 
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>

              {/* Status message */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                <ScheduleIcon sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {estimatedSeconds > 0 
                    ? `Estimated time: ${estimatedSeconds} seconds`
                    : 'Almost ready...'
                  }
                </Typography>
              </Box>

              {/* Additional info */}
              <Alert severity="info" sx={{ mt: 3, textAlign: 'left' }}>
                <AlertTitle>Why the wait?</AlertTitle>
                <Typography variant="body2">
                  This portfolio app uses a free hosting service that puts the server to sleep after 15 minutes of inactivity to save resources. Once warmed up, the app will respond instantly!
                </Typography>
              </Alert>

              {/* Attempt counter */}
              <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                Connection attempt {attempt} of {maxAttempts}
              </Typography>
            </>
          )}

          {/* Success message */}
          {showSuccess && (
            <Typography variant="body1" color="success.main">
              Server is ready! Loading your calendar...
            </Typography>
          )}
        </Paper>
      </Box>
    </Fade>
  );
};

export default ServerWarmingLoader;