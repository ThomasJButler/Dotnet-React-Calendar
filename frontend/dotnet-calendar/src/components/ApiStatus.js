import React from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Chip, 
  LinearProgress,
  Tooltip,
  IconButton,
  Collapse,
  Grid
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Speed as SpeedIcon,
  Storage as StorageIcon,
  Sync as SyncIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  WifiOff as WifiOffIcon,
  Wifi as WifiIcon
} from '@mui/icons-material';
import { useApp } from '../context/AppContext';
import { useEvents } from '../context/EventContext';

/**
 * ApiStatus component for displaying API health and statistics
 */
const ApiStatus = ({ compact = false, disabled = false }) => {
  const { connectionStatus, rateLimit, apiHealth } = useApp();
  const { apiStats } = useEvents();
  const [expanded, setExpanded] = React.useState(!compact);
  
  // Don't render if disabled
  if (disabled) {
    return null;
  }
  
  // Get circuit breaker status color and icon
  const getCircuitBreakerStatus = () => {
    switch (apiHealth.circuitBreakerState) {
      case 'CLOSED':
        return { color: 'success', icon: <CheckCircleIcon />, text: 'Healthy' };
      case 'OPEN':
        return { color: 'error', icon: <ErrorIcon />, text: 'Circuit Open' };
      case 'HALF_OPEN':
        return { color: 'warning', icon: <WarningIcon />, text: 'Recovery Mode' };
      default:
        return { color: 'default', icon: <SyncIcon />, text: 'Unknown' };
    }
  };
  
  // Get connection status
  const getConnectionStatus = () => {
    if (!connectionStatus.isOnline) {
      return { color: 'error', icon: <WifiOffIcon />, text: 'Offline' };
    }
    if (!connectionStatus.apiReachable) {
      return { color: 'warning', icon: <WarningIcon />, text: 'API Unreachable' };
    }
    return { color: 'success', icon: <WifiIcon />, text: 'Connected' };
  };
  
  // Calculate rate limit percentage
  const getRateLimitPercentage = () => {
    if (!rateLimit.limit || !rateLimit.remaining) return 100;
    return (rateLimit.remaining / rateLimit.limit) * 100;
  };
  
  const circuitStatus = getCircuitBreakerStatus();
  const connStatus = getConnectionStatus();
  const rateLimitPercentage = getRateLimitPercentage();
  
  if (compact && !expanded) {
    return (
      <Box sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 1000 }}>
        <Paper elevation={3} sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Connection Status">
            <Chip
              size="small"
              icon={connStatus.icon}
              label={connStatus.text}
              color={connStatus.color}
            />
          </Tooltip>
          
          <Tooltip title="API Health">
            <Chip
              size="small"
              icon={circuitStatus.icon}
              label={circuitStatus.text}
              color={circuitStatus.color}
            />
          </Tooltip>
          
          {rateLimit.isLimited && (
            <Tooltip title={`Rate Limit: ${rateLimit.remaining}/${rateLimit.limit}`}>
              <Chip
                size="small"
                icon={<WarningIcon />}
                label="Rate Limited"
                color="warning"
              />
            </Tooltip>
          )}
          
          <IconButton size="small" onClick={() => setExpanded(true)}>
            <ExpandMoreIcon />
          </IconButton>
        </Paper>
      </Box>
    );
  }
  
  return (
    <Paper elevation={2} sx={{ p: 2, maxWidth: compact ? 400 : '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SpeedIcon /> API Status
        </Typography>
        {compact && (
          <IconButton size="small" onClick={() => setExpanded(false)}>
            <ExpandLessIcon />
          </IconButton>
        )}
      </Box>
      
      <Grid container spacing={2}>
        {/* Connection Status */}
        <Grid item xs={12} sm={6}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Connection
            </Typography>
            <Chip
              icon={connStatus.icon}
              label={connStatus.text}
              color={connStatus.color}
              sx={{ mb: 1 }}
            />
            <Typography variant="caption" display="block" color="text.secondary">
              Last checked: {new Date(connectionStatus.lastChecked).toLocaleTimeString()}
            </Typography>
          </Box>
        </Grid>
        
        {/* Circuit Breaker Status */}
        <Grid item xs={12} sm={6}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Circuit Breaker
            </Typography>
            <Chip
              icon={circuitStatus.icon}
              label={circuitStatus.text}
              color={circuitStatus.color}
              sx={{ mb: 1 }}
            />
            {apiHealth.circuitBreakerState === 'OPEN' && (
              <Typography variant="caption" display="block" color="error">
                Service is experiencing issues
              </Typography>
            )}
          </Box>
        </Grid>
        
        {/* Rate Limiting */}
        {rateLimit.limit && (
          <Grid item xs={12}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Rate Limit
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Box sx={{ flexGrow: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={rateLimitPercentage}
                    color={rateLimitPercentage > 25 ? 'primary' : 'warning'}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
                <Typography variant="body2">
                  {rateLimit.remaining}/{rateLimit.limit}
                </Typography>
              </Box>
              {rateLimit.reset && (
                <Typography variant="caption" color="text.secondary">
                  Resets: {new Date(rateLimit.reset).toLocaleTimeString()}
                </Typography>
              )}
            </Box>
          </Grid>
        )}
        
        {/* API Statistics */}
        <Grid item xs={12}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Statistics
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <StorageIcon fontSize="small" color="action" />
                  <Typography variant="body2">
                    Cache: {apiHealth.cacheSize || 0} items
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <SyncIcon fontSize="small" color="action" />
                  <Typography variant="body2">
                    Pending: {apiHealth.pendingRequests || 0}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <SpeedIcon fontSize="small" color="action" />
                  <Typography variant="body2">
                    Queued: {apiHealth.queuedRequests || 0}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Grid>
      </Grid>
      
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
        Updated: {new Date(apiHealth.lastUpdated).toLocaleTimeString()}
      </Typography>
    </Paper>
  );
};

export default ApiStatus;