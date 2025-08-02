import React, { Component } from 'react';
import { Box, Typography, Button, Paper, Container } from '@mui/material';
import { Error as ErrorIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import errorTracking from '../services/errorTracking';

/**
 * ErrorBoundary component to catch and display errors gracefully
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console in development
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Update state with error details
    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));
    
    // Send error to tracking service
    errorTracking.trackComponentError(error, errorInfo, 'ErrorBoundary');
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
    
    // Optionally reload the page if errors persist
    if (this.state.errorCount > 3) {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      // Fallback UI
      return (
        <Container maxWidth="md" sx={{ mt: 8 }}>
          <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
            <ErrorIcon color="error" sx={{ fontSize: 64, mb: 2 }} />
            
            <Typography variant="h4" gutterBottom>
              Oops! Something went wrong
            </Typography>
            
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              We're sorry for the inconvenience. The application encountered an unexpected error.
            </Typography>
            
            {/* Show error details in development */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <Box 
                sx={{ 
                  mt: 2, 
                  p: 2, 
                  bgcolor: 'grey.100', 
                  borderRadius: 1,
                  textAlign: 'left',
                  maxHeight: 200,
                  overflow: 'auto'
                }}
              >
                <Typography variant="subtitle2" component="pre" sx={{ fontFamily: 'monospace', fontSize: 12 }}>
                  {this.state.error.toString()}
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </Typography>
              </Box>
            )}
            
            <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<RefreshIcon />}
                onClick={this.handleReset}
              >
                Try Again
              </Button>
              
              <Button
                variant="outlined"
                color="primary"
                onClick={() => window.location.href = '/'}
              >
                Go to Home
              </Button>
            </Box>
            
            {this.state.errorCount > 2 && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                If the problem persists, please try refreshing the page or contact support.
              </Typography>
            )}
          </Paper>
        </Container>
      );
    }

    // Return children if no error
    return this.props.children;
  }
}

/**
 * Error fallback component for specific sections
 */
export const ErrorFallback = ({ error, resetError, message }) => {
  return (
    <Box 
      sx={{ 
        p: 3, 
        textAlign: 'center',
        bgcolor: 'background.paper',
        borderRadius: 1,
        border: 1,
        borderColor: 'error.light'
      }}
    >
      <ErrorIcon color="error" sx={{ fontSize: 48, mb: 2 }} />
      
      <Typography variant="h6" gutterBottom>
        {message || 'Something went wrong'}
      </Typography>
      
      {process.env.NODE_ENV === 'development' && error && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontFamily: 'monospace' }}>
          {error.message || error.toString()}
        </Typography>
      )}
      
      {resetError && (
        <Button
          variant="outlined"
          color="primary"
          size="small"
          startIcon={<RefreshIcon />}
          onClick={resetError}
          sx={{ mt: 2 }}
        >
          Try Again
        </Button>
      )}
    </Box>
  );
};

export default ErrorBoundary;