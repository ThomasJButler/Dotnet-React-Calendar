/**
 * @author Tom Butler
 * @date 2025-10-25
 * @description Component for monitoring and displaying Core Web Vitals.
 */

import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  IconButton,
  Tooltip,
  Button,
  useTheme
} from '@mui/material';
import {
  Speed as SpeedIcon,
  TouchApp as TouchIcon,
  Visibility as VisibilityIcon,
  Timer as TimerIcon,
  NetworkCheck as NetworkIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { getWebVitalsHistory, clearWebVitalsHistory } from '../reportWebVitals';

/**
 * Web Vitals Monitor Component
 * Displays real-time and historical web performance metrics
 */
const WebVitalsMonitor = () => {
  const theme = useTheme();
  const [vitalsData, setVitalsData] = useState({});
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Load Web Vitals data
  const loadVitalsData = () => {
    const history = getWebVitalsHistory();
    setVitalsData(history);
    setLastUpdate(new Date());
  };

  useEffect(() => {
    loadVitalsData();
    
    // Refresh data every 5 seconds
    const interval = setInterval(loadVitalsData, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // Get the latest value for a metric
  const getLatestMetric = (metricName) => {
    const history = vitalsData[metricName];
    if (!history || history.length === 0) return null;
    return history[history.length - 1];
  };

  // Calculate average for a metric
  const getAverageMetric = (metricName) => {
    const history = vitalsData[metricName];
    if (!history || history.length === 0) return 0;
    const sum = history.reduce((acc, item) => acc + item.value, 0);
    return sum / history.length;
  };

  // Get metric info
  const getMetricInfo = (metricName) => {
    const metrics = {
      CLS: {
        name: 'Cumulative Layout Shift',
        icon: <VisibilityIcon />,
        description: 'Measures visual stability',
        unit: '',
        good: 0.1,
        poor: 0.25
      },
      FID: {
        name: 'First Input Delay',
        icon: <TouchIcon />,
        description: 'Measures interactivity',
        unit: 'ms',
        good: 100,
        poor: 300
      },
      FCP: {
        name: 'First Contentful Paint',
        icon: <SpeedIcon />,
        description: 'Time to first content',
        unit: 'ms',
        good: 1800,
        poor: 3000
      },
      LCP: {
        name: 'Largest Contentful Paint',
        icon: <TimerIcon />,
        description: 'Time to largest content',
        unit: 'ms',
        good: 2500,
        poor: 4000
      },
      TTFB: {
        name: 'Time to First Byte',
        icon: <NetworkIcon />,
        description: 'Server response time',
        unit: 'ms',
        good: 800,
        poor: 1800
      }
    };
    
    return metrics[metricName] || {};
  };

  // Get color based on rating
  const getRatingColor = (rating) => {
    switch (rating) {
      case 'good':
        return theme.palette.success.main;
      case 'needs improvement':
        return theme.palette.warning.main;
      case 'poor':
        return theme.palette.error.main;
      default:
        return theme.palette.grey[500];
    }
  };

  // Calculate score (0-100)
  const calculateScore = (value, good, poor) => {
    if (value <= good) return 100;
    if (value >= poor) return 0;
    
    const range = poor - good;
    const position = value - good;
    return Math.round(100 - (position / range * 100));
  };

  // Handle clear history
  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all Web Vitals history?')) {
      clearWebVitalsHistory();
      loadVitalsData();
    }
  };

  const metricNames = ['LCP', 'FID', 'CLS', 'FCP', 'TTFB'];

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          Web Vitals Monitor
        </Typography>
        <Box>
          <Tooltip title="Last updated">
            <Typography variant="caption" color="text.secondary" sx={{ mr: 2 }}>
              {lastUpdate.toLocaleTimeString()}
            </Typography>
          </Tooltip>
          <Tooltip title="Refresh">
            <IconButton size="small" onClick={loadVitalsData}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Clear history">
            <IconButton size="small" onClick={handleClearHistory}>
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {Object.keys(vitalsData).length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            No Web Vitals data available yet. Navigate around the app to generate metrics.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {metricNames.map((metricName) => {
            const latest = getLatestMetric(metricName);
            const average = getAverageMetric(metricName);
            const info = getMetricInfo(metricName);
            
            if (!latest) return null;
            
            const score = calculateScore(latest.value, info.good, info.poor);
            
            return (
              <Grid item xs={12} sm={6} md={4} key={metricName}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Box sx={{ mr: 2, color: getRatingColor(latest.rating) }}>
                        {info.icon}
                      </Box>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          {info.name}
                        </Typography>
                        <Typography variant="h4">
                          {latest.value.toFixed(metricName === 'CLS' ? 3 : 0)}
                          <Typography component="span" variant="body2" color="text.secondary">
                            {info.unit}
                          </Typography>
                        </Typography>
                      </Box>
                      <Chip
                        label={latest.rating}
                        size="small"
                        sx={{
                          backgroundColor: getRatingColor(latest.rating),
                          color: 'white'
                        }}
                      />
                    </Box>
                    
                    <Box sx={{ mb: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Score: {score}%
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Avg: {average.toFixed(metricName === 'CLS' ? 3 : 0)}{info.unit}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={score}
                        sx={{
                          height: 8,
                          borderRadius: 1,
                          backgroundColor: theme.palette.grey[300],
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: getRatingColor(latest.rating)
                          }
                        }}
                      />
                    </Box>
                    
                    <Typography variant="caption" color="text.secondary">
                      {info.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      <Box sx={{ mt: 3, p: 2, backgroundColor: theme.palette.grey[100], borderRadius: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <InfoIcon fontSize="small" sx={{ mr: 1, color: theme.palette.info.main }} />
          <Typography variant="subtitle2">
            About Web Vitals
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Web Vitals are essential metrics for measuring user experience on the web. 
          They help identify opportunities to improve performance and ensure a great experience for all users.
        </Typography>
        <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Chip
            label="Good"
            size="small"
            sx={{ backgroundColor: theme.palette.success.main, color: 'white' }}
          />
          <Chip
            label="Needs Improvement"
            size="small"
            sx={{ backgroundColor: theme.palette.warning.main, color: 'white' }}
          />
          <Chip
            label="Poor"
            size="small"
            sx={{ backgroundColor: theme.palette.error.main, color: 'white' }}
          />
        </Box>
      </Box>
    </Paper>
  );
};

export default React.memo(WebVitalsMonitor);