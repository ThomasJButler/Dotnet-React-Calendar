/**
 * @author Tom Butler
 * @date 2025-10-25
 * @description Analytics visualisation component for event data.
 */

import React, { useMemo, useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  useTheme,
  Tooltip
} from '@mui/material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar
} from 'recharts';
import { 
  CalendarMonth as CalendarIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingIcon,
  PieChart as PieChartIcon
} from '@mui/icons-material';
import { useEvents } from '../context/EventContext';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

/**
 * Event Analytics Dashboard Component
 * Provides visualizations and insights about event patterns
 */
const EventAnalytics = () => {
  const { events } = useEvents();
  const theme = useTheme();
  const [timeRange, setTimeRange] = useState('month'); // week, month, year
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Calculate date range based on selection
  const dateRange = useMemo(() => {
    const now = new Date();
    let start, end;

    switch (timeRange) {
      case 'week':
        start = startOfWeek(now, { weekStartsOn: 1 });
        end = endOfWeek(now, { weekStartsOn: 1 });
        break;
      case 'month':
        start = startOfMonth(new Date(selectedYear, selectedMonth));
        end = endOfMonth(new Date(selectedYear, selectedMonth));
        break;
      case 'year':
        start = new Date(selectedYear, 0, 1);
        end = new Date(selectedYear, 11, 31);
        break;
      default:
        start = startOfMonth(now);
        end = endOfMonth(now);
    }

    return { start, end };
  }, [timeRange, selectedMonth, selectedYear]);

  // Filter events within date range
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return isWithinInterval(eventDate, dateRange);
    });
  }, [events, dateRange]);

  // Calculate total stats
  const stats = useMemo(() => {
    const totalEvents = filteredEvents.length;
    const totalDuration = filteredEvents.reduce((sum, event) => sum + (event.duration || 0), 0);
    const avgDuration = totalEvents > 0 ? Math.round(totalDuration / totalEvents) : 0;
    
    // Events by day of week
    const dayOfWeekCounts = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
    filteredEvents.forEach(event => {
      const day = format(new Date(event.date), 'EEE');
      if (dayOfWeekCounts[day] !== undefined) {
        dayOfWeekCounts[day]++;
      }
    });

    // Busiest day
    const busiestDay = Object.entries(dayOfWeekCounts)
      .reduce((max, [day, count]) => count > max.count ? { day, count } : max, { day: '', count: 0 });

    return {
      totalEvents,
      totalDuration,
      avgDuration,
      dayOfWeekCounts,
      busiestDay
    };
  }, [filteredEvents]);

  // Generate daily event counts for the selected period
  const dailyEventCounts = useMemo(() => {
    if (timeRange === 'year') {
      // Monthly counts for year view
      const monthlyCounts = Array.from({ length: 12 }, (_, i) => {
        const monthEvents = filteredEvents.filter(event => {
          const eventDate = new Date(event.date);
          return eventDate.getMonth() === i;
        });
        return {
          name: format(new Date(selectedYear, i, 1), 'MMM'),
          events: monthEvents.length,
          duration: monthEvents.reduce((sum, event) => sum + (event.duration || 0), 0)
        };
      });
      return monthlyCounts;
    } else {
      // Daily counts for week/month view
      const days = eachDayOfInterval(dateRange);
      return days.map(day => {
        const dayEvents = filteredEvents.filter(event => {
          const eventDate = new Date(event.date);
          return format(eventDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
        });
        return {
          name: format(day, timeRange === 'week' ? 'EEE' : 'd'),
          date: format(day, 'MMM d'),
          events: dayEvents.length,
          duration: dayEvents.reduce((sum, event) => sum + (event.duration || 0), 0)
        };
      });
    }
  }, [filteredEvents, dateRange, timeRange, selectedYear]);

  // Time distribution (morning, afternoon, evening, night)
  const timeDistribution = useMemo(() => {
    const distribution = {
      'Morning (6-12)': 0,
      'Afternoon (12-18)': 0,
      'Evening (18-22)': 0,
      'Night (22-6)': 0
    };

    filteredEvents.forEach(event => {
      if (event.time) {
        const hour = parseInt(event.time.split(':')[0]);
        if (hour >= 6 && hour < 12) distribution['Morning (6-12)']++;
        else if (hour >= 12 && hour < 18) distribution['Afternoon (12-18)']++;
        else if (hour >= 18 && hour < 22) distribution['Evening (18-22)']++;
        else distribution['Night (22-6)']++;
      }
    });

    return Object.entries(distribution).map(([name, value]) => ({ name, value }));
  }, [filteredEvents]);

  // Duration distribution
  const durationDistribution = useMemo(() => {
    const distribution = {
      '< 30 min': 0,
      '30-60 min': 0,
      '1-2 hours': 0,
      '2-4 hours': 0,
      '> 4 hours': 0
    };

    filteredEvents.forEach(event => {
      const duration = event.duration || 0;
      if (duration < 30) distribution['< 30 min']++;
      else if (duration <= 60) distribution['30-60 min']++;
      else if (duration <= 120) distribution['1-2 hours']++;
      else if (duration <= 240) distribution['2-4 hours']++;
      else distribution['> 4 hours']++;
    });

    return Object.entries(distribution)
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0);
  }, [filteredEvents]);

  // Colors for charts
  const COLORS = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main
  ];

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 1 }} elevation={3}>
          <Typography variant="body2">{label}</Typography>
          {payload.map((entry, index) => (
            <Typography key={index} variant="body2" color={entry.color}>
              {entry.name}: {entry.value}
            </Typography>
          ))}
        </Paper>
      );
    }
    return null;
  };

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" component="h2">
          Event Analytics
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {timeRange === 'month' && (
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Month</InputLabel>
              <Select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                label="Month"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <MenuItem key={i} value={i}>
                    {format(new Date(2024, i, 1), 'MMMM')}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          
          {(timeRange === 'month' || timeRange === 'year') && (
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel>Year</InputLabel>
              <Select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                label="Year"
              >
                {Array.from({ length: 5 }, (_, i) => {
                  const year = new Date().getFullYear() - 2 + i;
                  return <MenuItem key={year} value={year}>{year}</MenuItem>;
                })}
              </Select>
            </FormControl>
          )}
          
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              label="Time Range"
            >
              <MenuItem value="week">This Week</MenuItem>
              <MenuItem value="month">Month</MenuItem>
              <MenuItem value="year">Year</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CalendarIcon color="primary" sx={{ mr: 1 }} />
                <Typography color="text.secondary" variant="body2">
                  Total Events
                </Typography>
              </Box>
              <Typography variant="h4">{stats.totalEvents}</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ScheduleIcon color="secondary" sx={{ mr: 1 }} />
                <Typography color="text.secondary" variant="body2">
                  Total Hours
                </Typography>
              </Box>
              <Typography variant="h4">
                {Math.round(stats.totalDuration / 60 * 10) / 10}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingIcon color="success" sx={{ mr: 1 }} />
                <Typography color="text.secondary" variant="body2">
                  Avg Duration
                </Typography>
              </Box>
              <Typography variant="h4">{stats.avgDuration} min</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PieChartIcon color="warning" sx={{ mr: 1 }} />
                <Typography color="text.secondary" variant="body2">
                  Busiest Day
                </Typography>
              </Box>
              <Typography variant="h4">
                {stats.busiestDay.day || 'N/A'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {stats.busiestDay.count} events
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        {/* Events Over Time */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Events Over Time
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dailyEventCounts}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="events" fill={theme.palette.primary.main} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Time Distribution */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Time of Day Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={timeDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {timeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Duration Distribution */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Event Duration Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={durationDistribution} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey="value" fill={theme.palette.secondary.main} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Day of Week Distribution */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Events by Day of Week
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <RadialBarChart 
                  cx="50%" 
                  cy="50%" 
                  innerRadius="10%" 
                  outerRadius="80%" 
                  data={Object.entries(stats.dayOfWeekCounts).map(([day, count], index) => ({
                    name: day,
                    value: count,
                    fill: COLORS[index % COLORS.length]
                  }))}
                >
                  <RadialBar dataKey="value" />
                  <Legend />
                  <RechartsTooltip />
                </RadialBarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Insights */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Insights
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {stats.totalEvents === 0 && (
            <Chip label="No events in selected period" color="default" />
          )}
          {stats.busiestDay.count > 0 && (
            <Chip 
              label={`${stats.busiestDay.day} is your busiest day`} 
              color="primary" 
            />
          )}
          {stats.avgDuration > 120 && (
            <Chip 
              label="Your events tend to be long (>2 hours average)" 
              color="warning" 
            />
          )}
          {timeDistribution[0].value > stats.totalEvents * 0.5 && (
            <Chip 
              label="Most events are in the morning" 
              color="info" 
            />
          )}
        </Box>
      </Box>
    </Paper>
  );
};

export default React.memo(EventAnalytics);