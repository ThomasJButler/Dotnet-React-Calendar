import React, { useMemo } from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend 
} from 'recharts';
import { 
  Box, 
  Typography, 
  Paper,
  useTheme
} from '@mui/material';
import { useEvents } from '../context/EventContext';

/**
 * FreeTimeChart component to display a breakdown of free/busy time
 * @param {Object} props - Component props
 * @returns {JSX.Element} FreeTimeChart component
 */
const FreeTimeChart = ({ selectedDate }) => {
  const theme = useTheme();
  const { events } = useEvents();
  
  // Colors for the pie chart segments
  const COLORS = [
    theme.palette.primary.main,   // Free time
    theme.palette.error.main,     // Busy time
  ];
  
  // Calculate free time data for the selected date
  const freeTimeData = useMemo(() => {
    if (!selectedDate) {
      return { freeTimeHours: 0, busyTimeHours: 0, freeTimePercentage: 0 };
    }
    
    // Determine if it's a weekday or weekend
    const dayOfWeek = selectedDate.getDay(); // 0 = Sunday, 6 = Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    // Calculate available free time based on day type
    // For weekdays: Free time is from 5pm to midnight (7 hours)
    // For weekends: Free time is all day (16 hours assuming 8 hours of sleep)
    const availableHours = isWeekend ? 16 : 7;
    
    // Filter events for the selected date
    const dateString = selectedDate.toISOString().split('T')[0];
    const dayEvents = events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.toISOString().split('T')[0] === dateString;
    });
    
    // Calculate busy hours based on event durations
    // Only count events that occur during free time 
    let busyMinutes = 0;
    
    dayEvents.forEach(event => {
      // Skip events without time
      if (!event.time) return;
      
      // Parse event time (format: "HH:MM")
      const [hours, minutes] = event.time.split(':').map(num => parseInt(num, 10));
      
      // For weekdays, only count events after 5pm
      if (!isWeekend && hours < 17) {
        return;
      }
      
      // Get the event duration (default to 60 minutes if not specified)
      const eventDuration = event.duration || 60;
      
      // Add the event duration to busy minutes
      busyMinutes += eventDuration;
    });
    
    // Convert busy minutes to hours
    let busyHours = busyMinutes / 60;
    
    // Cap busy hours at available hours
    busyHours = Math.min(busyHours, availableHours);
    
    // Calculate free hours and percentage
    const freeHours = availableHours - busyHours;
    const freeTimePercentage = Math.round((freeHours / availableHours) * 100);
    
    return {
      freeTimeHours: freeHours,
      busyTimeHours: busyHours,
      freeTimePercentage,
    };
  }, [selectedDate, events]);
  
  // Prepare chart data
  const chartData = [
    { name: 'Free Time', value: freeTimeData.freeTimeHours },
    { name: 'Scheduled', value: freeTimeData.busyTimeHours },
  ];
  
  // Custom tooltip for the pie chart
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <Paper elevation={3} sx={{ p: 1 }}>
          <Typography variant="body2">
            {`${payload[0].name}: ${payload[0].value} hours`}
          </Typography>
        </Paper>
      );
    }
    return null;
  };
  
  return (
    <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" component="h3" gutterBottom>
        Free Time Analysis
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography variant="body1" gutterBottom>
          {freeTimeData.freeTimePercentage}% of your free time available
        </Typography>
        
        <Box sx={{ width: '100%', height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
          {freeTimeData.freeTimeHours} hours free / {freeTimeData.freeTimeHours + freeTimeData.busyTimeHours} hours total
          {freeTimeData.freeTimePercentage < 30 && (
            <Typography variant="body2" color="error" sx={{ mt: 0.5 }}>
              Your schedule seems busy! Consider rescheduling some events.
            </Typography>
          )}
        </Typography>
      </Box>
    </Paper>
  );
};

export default FreeTimeChart;
