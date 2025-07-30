import React, { useState, useEffect, useCallback } from 'react';
import { 
  Paper, 
  Grid, 
  Typography, 
  IconButton, 
  Box,
  Badge,
  useTheme
} from '@mui/material';
import { 
  ChevronLeft as ChevronLeftIcon, 
  ChevronRight as ChevronRightIcon,
  Add as AddIcon,
  CalendarMonth as CalendarMonthIcon
} from '@mui/icons-material';
import { useEvents } from '../context/EventContext';

/**
 * Calendar component to display a monthly calendar view
 * @param {Object} props - Component props
 * @returns {JSX.Element} Calendar component
 */
const Calendar = ({ onDateSelect, onAddEvent }) => {
  const { events } = useEvents();
  const [currentDate, setCurrentDate] = useState(new Date()); // Default to current date
  const [calendarDays, setCalendarDays] = useState([]);
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  /**
   * Generate calendar days for the current month
   */
  const generateCalendarDays = useCallback(() => {
    /**
     * Check if a date has any events
     * @param {Date} date - The date to check
     * @returns {boolean} Whether the date has events
     */
    const hasEventsOnDate = (date) => {
      // Convert date to date string for comparison (YYYY-MM-DD)
      const dateString = date.toISOString().split('T')[0];
      
      return events.some(event => {
        // Convert event date to date string for comparison
        const eventDateString = new Date(event.date).toISOString().split('T')[0];
        return eventDateString === dateString;
      });
    };
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    // Day of the week for the first day (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfWeek = firstDay.getDay();
    // Total days in the month
    const daysInMonth = lastDay.getDate();
    
    // Calculate days from previous month to display
    const prevMonthDays = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    
    const days = [];
    
    // Add days from previous month
    const prevMonth = new Date(year, month, 0);
    const prevMonthTotalDays = prevMonth.getDate();
    
    for (let i = prevMonthDays - 1; i >= 0; i--) {
      const day = prevMonthTotalDays - i;
      days.push({
        date: new Date(year, month - 1, day),
        isCurrentMonth: false,
        hasEvents: hasEventsOnDate(new Date(year, month - 1, day))
      });
    }
    
    // Add days from current month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        date: new Date(year, month, day),
        isCurrentMonth: true,
        hasEvents: hasEventsOnDate(new Date(year, month, day))
      });
    }
    
    // Add days from next month to complete the grid (6 rows x 7 days = 42 cells)
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        date: new Date(year, month + 1, day),
        isCurrentMonth: false,
        hasEvents: hasEventsOnDate(new Date(year, month + 1, day))
      });
    }
    
    setCalendarDays(days);
  }, [currentDate, events]);

  // Initialize calendar to today's date on first load
  useEffect(() => {
    // Ensure we start with today's date when component mounts
    const today = new Date();
    setCurrentDate(today);
  }, []);

  // Generate calendar days when the month changes
  useEffect(() => {
    generateCalendarDays();
  }, [generateCalendarDays]);

  /**
   * Navigate to the previous month
   */
  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  /**
   * Navigate to the next month
   */
  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  /**
   * Handle date selection
   * @param {Date} date - The selected date
   */
  const handleDateClick = (date) => {
    // Select the date first
    onDateSelect(date);
  };
  
  /**
   * Handle add event button click
   * @param {Date} date - The date for the new event
   * @param {Event} e - Click event
   */
  const handleAddEventClick = (date, e) => {
    e.stopPropagation();
    onAddEvent(date);
  };

  /**
   * Format month and year for display
   * @returns {string} Formatted month and year
   */
  const formatMonthYear = () => {
    const options = { month: 'long', year: 'numeric' };
    return currentDate.toLocaleDateString('en-GB', options);
  };

  // Go to today's date
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Day names for the calendar header
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Function to get event indicator color based on priority (for light mode traffic light system)
  const getEventColor = (day) => {
    if (isDarkMode) {
      return theme.palette.primary.light;
    }
    
    // Count the number of events on this day to determine "busyness"
    const dateString = day.date.toISOString().split('T')[0];
    const eventsOnDay = events.filter(event => {
      const eventDateString = new Date(event.date).toISOString().split('T')[0];
      return eventDateString === dateString;
    });
    
    // Traffic light system - green, amber, red based on number of events
    if (eventsOnDay.length === 0) return theme.palette.primary.main;
    if (eventsOnDay.length <= 1) return '#4caf50'; // Green
    if (eventsOnDay.length <= 3) return '#ff9800'; // Amber
    return '#f44336'; // Red - busy day
  };

  return (
    <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <IconButton onClick={handlePrevMonth} aria-label="previous month">
          <ChevronLeftIcon />
        </IconButton>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton 
            onClick={goToToday} 
            size="small" 
            sx={{ mr: 1 }}
            aria-label="go to today"
          >
            <CalendarMonthIcon fontSize="small" />
          </IconButton>
          <Typography variant="h6" component="h2" onClick={goToToday} sx={{ cursor: 'pointer' }}>
            {formatMonthYear()}
          </Typography>
        </Box>
        <IconButton onClick={handleNextMonth} aria-label="next month">
          <ChevronRightIcon />
        </IconButton>
      </Box>
      
      <Grid container spacing={1} className="calendar-grid">
        {/* Calendar header with day names */}
        {dayNames.map(day => (
          <Grid item xs={12/7} key={day}>
            <Typography 
              variant="subtitle2" 
              align="center" 
              sx={{ fontWeight: 'bold' }}
            >
              {day}
            </Typography>
          </Grid>
        ))}
        
        {/* Calendar days */}
        {calendarDays.map((day, index) => (
          <Grid item xs={12/7} key={index}>
            <Box
              onClick={() => handleDateClick(day.date)}
              sx={{
                p: 1,
                height: '60px',
                border: isDarkMode ? '1px solid #333' : '1px solid #eee',
                borderRadius: 1,
                backgroundColor: day.isCurrentMonth 
                  ? (isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'white') 
                  : (isDarkMode ? 'rgba(0, 0, 0, 0.2)' : '#f5f5f5'),
                opacity: day.isCurrentMonth ? 1 : 0.7,
                cursor: 'pointer',
                position: 'relative',
                '&:hover': {
                  backgroundColor: isDarkMode 
                    ? 'rgba(144, 202, 249, 0.15)' 
                    : 'rgba(25, 118, 210, 0.1)',
                },
                transition: 'background-color 0.2s',
              }}
              className="calendar-day"
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 
                      new Date().toDateString() === day.date.toDateString() 
                        ? 'bold' 
                        : 'normal',
                    color: 
                      new Date().toDateString() === day.date.toDateString() 
                        ? 'primary.main' 
                        : 'text.primary',
                  }}
                >
                  {day.date.getDate()}
                </Typography>
                
                {/* Add event button - only shown on hover */}
                {day.isCurrentMonth && (
                  <IconButton
                    size="small"
                    onClick={(e) => handleAddEventClick(day.date, e)}
                    sx={{ 
                      p: 0, 
                      opacity: 0,
                      '&:hover': { opacity: 1 },
                      '.MuiSvgIcon-root': { fontSize: '0.875rem' }
                    }}
                    className="add-event-button"
                    aria-label="add event"
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
              
              {/* Event indicator with traffic light colors */}
              {day.hasEvents && (
                <Badge
                  variant="dot"
                  sx={{
                    position: 'absolute',
                    bottom: 4,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    '& .MuiBadge-dot': {
                      height: 8,
                      width: 8,
                      borderRadius: '50%',
                      backgroundColor: getEventColor(day),
                    }
                  }}
                />
              )}
            </Box>
          </Grid>
        ))}
      </Grid>
      
      {/* Add hover effect for add event button */}
      <style jsx="true">{`
        .MuiBox-root:hover .add-event-button {
          opacity: 1 !important;
        }
      `}</style>
    </Paper>
  );
};

export default Calendar;
