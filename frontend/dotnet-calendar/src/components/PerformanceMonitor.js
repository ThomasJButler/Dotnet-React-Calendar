/**
 * @author Tom Butler
 * @date 2025-10-25
 * @description Performance monitoring dashboard for API and render metrics.
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Paper,
  Grid,
  LinearProgress,
  Chip,
  IconButton,
  Tooltip,
  Alert
} from '@mui/material';
import {
  Speed as SpeedIcon,
  Timer as TimerIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { getWebVitalsHistory, clearWebVitalsHistory } from '../reportWebVitals';
import { format } from 'date-fns';

/**
 * Performance Monitor Component
 * Displays Web Vitals metrics and historical performance data
 */
const PerformanceMonitor = ({ open, onClose }) => {
  const [vitalsData, setVitalsData] = useState({});
  const [currentMetrics, setCurrentMetrics] = useState({});
  const [loading, setLoading] = useState(false);

  // Web Vitals thresholds
  const thresholds = {
    CLS: { good: 0.1, needsImprovement: 0.25, unit: '', name: 'Cumulative Layout Shift' },
    FID: { good: 100, needsImprovement: 300, unit: 'ms', name: 'First Input Delay' },
    FCP: { good: 1800, needsImprovement: 3000, unit: 'ms', name: 'First Contentful Paint' },
    LCP: { good: 2500, needsImprovement: 4000, unit: 'ms', name: 'Largest Contentful Paint' },
    TTFB: { good: 800, needsImprovement: 1800, unit: 'ms', name: 'Time to First Byte' }
  };

  // Load Web Vitals data
  useEffect(() => {
    if (open) {
      loadVitalsData();
    }
  }, [open]);

  const loadVitalsData = () => {
    const history = getWebVitalsHistory();
    setVitalsData(history);
    
    // Get most recent metrics
    const recent = {};
    Object.keys(thresholds).forEach(metric => {
      if (history[metric] && history[metric].length > 0) {
        recent[metric] = history[metric][history[metric].length - 1];
      }
    });
    setCurrentMetrics(recent);
  };

  /**
   * Get rating color
   */
  const getRatingColor = (rating) => {
    switch (rating) {
      case 'good':
        return 'success';
      case 'needs improvement':
        return 'warning';
      case 'poor':
        return 'error';
      default:
        return 'default';
    }
  };

  /**
   * Get rating for a metric value
   */
  const getRating = (metric, value) => {
    const threshold = thresholds[metric];
    if (!threshold) return 'unknown';
    
    if (value <= threshold.good) return 'good';
    if (value <= threshold.needsImprovement) return 'needs improvement';
    return 'poor';
  };

  /**
   * Format chart data
   */
  const formatChartData = (metric) => {
    if (!vitalsData[metric]) return [];
    
    return vitalsData[metric].slice(-20).map((entry, index) => ({
      index: index + 1,
      value: entry.value,
      timestamp: format(new Date(entry.timestamp), 'HH:mm:ss'),
      rating: entry.rating
    }));
  };

  /**
   * Calculate average for a metric
   */
  const calculateAverage = (metric) => {
    if (!vitalsData[metric] || vitalsData[metric].length === 0) return 0;
    
    const sum = vitalsData[metric].reduce((acc, entry) => acc + entry.value, 0);
    return (sum / vitalsData[metric].length).toFixed(2);
  };

  /**
   * Get trend for a metric
   */
  const getTrend = (metric) => {
    if (!vitalsData[metric] || vitalsData[metric].length < 2) return null;
    
    const recent = vitalsData[metric].slice(-5);
    const older = vitalsData[metric].slice(-10, -5);
    
    if (older.length === 0) return null;
    
    const recentAvg = recent.reduce((acc, entry) => acc + entry.value, 0) / recent.length;
    const olderAvg = older.reduce((acc, entry) => acc + entry.value, 0) / older.length;
    
    const percentChange = ((recentAvg - olderAvg) / olderAvg) * 100;
    
    return {
      improving: percentChange < -5,
      degrading: percentChange > 5,
      change: percentChange
    };
  };

  /**
   * Clear all data
   */
  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all performance history?')) {
      clearWebVitalsHistory();
      loadVitalsData();
    }
  };

  /**
   * Reload page to get fresh metrics
   */
  const handleRefresh = () => {
    setLoading(true);
    window.location.reload();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Performance Monitor</Typography>
          <Box>
            <Tooltip title="Refresh page for new metrics">
              <IconButton onClick={handleRefresh} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Clear history">
              <IconButton onClick={handleClearData}>
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {loading && <LinearProgress sx={{ mb: 2 }} />}
        
        {/* Current Metrics */}
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <SpeedIcon sx={{ mr: 1 }} />
          Current Metrics
        </Typography>
        
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {Object.entries(thresholds).map(([metric, config]) => {
            const current = currentMetrics[metric];
            const trend = getTrend(metric);
            
            return (
              <Grid item xs={12} sm={6} md={4} key={metric}>
                <Paper sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        {metric}
                      </Typography>
                      <Typography variant="h4">
                        {current ? `${current.value.toFixed(2)}${config.unit}` : '-'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {config.name}
                      </Typography>
                    </Box>
                    
                    {trend && (
                      <Tooltip title={`${Math.abs(trend.change).toFixed(1)}% ${trend.improving ? 'improvement' : 'change'}`}>
                        {trend.improving ? (
                          <TrendingDownIcon color="success" />
                        ) : trend.degrading ? (
                          <TrendingUpIcon color="error" />
                        ) : null}
                      </Tooltip>
                    )}
                  </Box>
                  
                  {current && (
                    <Box sx={{ mt: 1 }}>
                      <Chip
                        label={current.rating}
                        size="small"
                        color={getRatingColor(current.rating)}
                      />
                    </Box>
                  )}
                  
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Avg: {calculateAverage(metric)}{config.unit}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
        
        {/* Historical Charts */}
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <TimerIcon sx={{ mr: 1 }} />
          Historical Performance
        </Typography>
        
        <Grid container spacing={3}>
          {Object.entries(thresholds).map(([metric, config]) => {
            const data = formatChartData(metric);
            
            if (data.length === 0) return null;
            
            return (
              <Grid item xs={12} md={6} key={metric}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    {config.name} ({metric})
                  </Typography>
                  
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="index" />
                      <YAxis />
                      <RechartsTooltip
                        labelFormatter={(value) => `Sample ${value}`}
                        formatter={(value) => [`${value.toFixed(2)}${config.unit}`, metric]}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#8884d8"
                        strokeWidth={2}
                        dot={{ fill: '#8884d8' }}
                      />
                      {/* Good threshold line */}
                      <Line
                        type="monotone"
                        dataKey={() => config.good}
                        stroke="#4caf50"
                        strokeDasharray="5 5"
                        dot={false}
                        name="Good"
                      />
                      {/* Needs improvement threshold line */}
                      <Line
                        type="monotone"
                        dataKey={() => config.needsImprovement}
                        stroke="#ff9800"
                        strokeDasharray="5 5"
                        dot={false}
                        name="Needs Improvement"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
        
        {/* Information */}
        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="body2">
            Web Vitals are essential metrics for measuring user experience. Data is collected automatically when pages load.
            Refresh the page to capture new metrics.
          </Typography>
        </Alert>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default React.memo(PerformanceMonitor);