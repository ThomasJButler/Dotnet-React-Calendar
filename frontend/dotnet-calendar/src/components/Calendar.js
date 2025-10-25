/**
 * @author Tom Butler
 * @date 2025-10-25
 * @description Monthly calendar view with event display and navigation.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Paper, 
  Grid, 
  Typography, 
  IconButton, 
  Box,
  Badge,
  useTheme,
  Tooltip,
  useMediaQuery,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import { 
  ChevronLeft as ChevronLeftIcon, 
  ChevronRight as ChevronRightIcon,
  Add as AddIcon,
  CalendarMonth as CalendarMonthIcon,
  ViewWeek as ViewWeekIcon,
  ViewModule as ViewModuleIcon
} from '@mui/icons-material';
import { useEvents } from '../context/EventContext';
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation';

/**
 * Calendar component to display a monthly calendar view
 * @param {Object} props - Component props
 * @returns {JSX.Element} Calendar component
 */
const Calendar = ({ onDateSelect, onAddEvent }) => {
  const { events } = useEvents();
  const [currentDate, setCurrentDate] = useState(new Date()); // Default to current date
  const [calendarDays, setCalendarDays] = useState([]);
  const [focusedDayIndex, setFocusedDayIndex] = useState(null);
  const [isKeyboardMode, setIsKeyboardMode] = useState(false);
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery('(max-width:900px)');
  const [viewMode, setViewMode] = useState(isMobile ? 'weekly' : 'monthly');
  const calendarRef = useRef(null);
  const dayRefs = useRef([]);

  /**
   * Generate calendar days for the current month or week
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
    
    // Generate weekly view
    if (viewMode === 'weekly') {
      const days = [];
      const startOfWeek = new Date(currentDate);
      const dayOfWeek = startOfWeek.getDay();
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Start from Monday
      startOfWeek.setDate(startOfWeek.getDate() + diff);
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        days.push({
          date: new Date(date),
          day: date.getDate(),
          month: date.getMonth(),
          year: date.getFullYear(),
          isCurrentMonth: true,
          hasEvents: hasEventsOnDate(date)
        });
      }
      
      setCalendarDays(days);
      return;
    }
    
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
  }, [currentDate, events, viewMode]);

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
    if (viewMode === 'weekly') {
      setCurrentDate(prev => {
        const newDate = new Date(prev);
        newDate.setDate(newDate.getDate() - 7);
        return newDate;
      });
    } else {
      setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    }
  };

  /**
   * Navigate to the next month/week
   */
  const handleNextMonth = () => {
    if (viewMode === 'weekly') {
      setCurrentDate(prev => {
        const newDate = new Date(prev);
        newDate.setDate(newDate.getDate() + 7);
        return newDate;
      });
    } else {
      setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    }
  };

  /**
   * Handle date selection
   * @param {Date} date - The selected date
   * @param {number} index - The index of the day in the calendar
   */
  const handleDateClick = (date, index) => {
    // Select the date first
    onDateSelect(date);
    setFocusedDayIndex(index);
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
    if (viewMode === 'weekly') {
      const startOfWeek = new Date(currentDate);
      const dayOfWeek = startOfWeek.getDay();
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      startOfWeek.setDate(startOfWeek.getDate() + diff);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      
      const startMonth = startOfWeek.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
      const endMonth = endOfWeek.toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' });
      
      return `${startMonth} - ${endMonth}`;
    }
    const options = { month: 'long', year: 'numeric' };
    return currentDate.toLocaleDateString('en-GB', options);
  };

  // Go to today's date
  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    // Find and focus today's date
    const todayIndex = calendarDays.findIndex(day => 
      day.date.toDateString() === today.toDateString()
    );
    if (todayIndex !== -1) {
      setFocusedDayIndex(todayIndex);
      setTimeout(() => {
        dayRefs.current[todayIndex]?.focus();
      }, 100);
    }
  };

  // Keyboard navigation handlers
  const moveFocus = useCallback((direction) => {
    setIsKeyboardMode(true);
    let newIndex = focusedDayIndex;
    
    if (newIndex === null) {
      // Find today or first day of current month
      const today = new Date();
      newIndex = calendarDays.findIndex(day => 
        day.date.toDateString() === today.toDateString()
      );
      if (newIndex === -1) {
        newIndex = calendarDays.findIndex(day => day.isCurrentMonth);
      }
    } else {
      switch(direction) {
        case 'left':
          newIndex = Math.max(0, newIndex - 1);
          break;
        case 'right':
          newIndex = Math.min(calendarDays.length - 1, newIndex + 1);
          break;
        case 'up':
          newIndex = Math.max(0, newIndex - 7);
          break;
        case 'down':
          newIndex = Math.min(calendarDays.length - 1, newIndex + 7);
          break;
        case 'home':
          newIndex = calendarDays.findIndex(day => day.isCurrentMonth);
          break;
        case 'end':
          // Find last day of current month
          for (let i = calendarDays.length - 1; i >= 0; i--) {
            if (calendarDays[i].isCurrentMonth) {
              newIndex = i;
              break;
            }
          }
          break;
        default:
          break;
      }
    }
    
    setFocusedDayIndex(newIndex);
    // Focus the day element
    setTimeout(() => {
      dayRefs.current[newIndex]?.focus();
    }, 0);
  }, [focusedDayIndex, calendarDays]);

  // Keyboard navigation hook
  useKeyboardNavigation({
    containerRef: calendarRef,
    enabled: true,
    onArrowLeft: () => moveFocus('left'),
    onArrowRight: () => moveFocus('right'),
    onArrowUp: () => moveFocus('up'),
    onArrowDown: () => moveFocus('down'),
    onHome: () => moveFocus('home'),
    onEnd: () => moveFocus('end'),
    onEnter: () => {
      if (focusedDayIndex !== null && calendarDays[focusedDayIndex]) {
        handleDateClick(calendarDays[focusedDayIndex].date, focusedDayIndex);
      }
    },
    onPageUp: () => handlePrevMonth(),
    onPageDown: () => handleNextMonth(),
  });

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
    <Paper 
      elevation={3} 
      sx={{ p: 2, mb: 3 }}
      ref={calendarRef}
      role="application"
      aria-label="Calendar"
      id="calendar"
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Tooltip title={viewMode === 'weekly' ? "Previous week" : "Previous month (Page Up)"}>
          <IconButton onClick={handlePrevMonth} aria-label={viewMode === 'weekly' ? "previous week" : "previous month"}>
            <ChevronLeftIcon />
          </IconButton>
        </Tooltip>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title="Go to today">
              <IconButton 
                onClick={goToToday} 
                size="small" 
                sx={{ mr: 1 }}
                aria-label="go to today"
              >
                <CalendarMonthIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Typography 
              variant={isMobile ? "subtitle1" : "h6"}
              component="h2" 
              onClick={goToToday} 
              sx={{ cursor: 'pointer', fontWeight: isMobile ? 600 : 400 }}
              id="calendar-heading"
              aria-live="polite"
              aria-atomic="true"
            >
              {formatMonthYear()}
            </Typography>
          </Box>
          {isMobile && (
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(event, newView) => {
                if (newView !== null) {
                  setViewMode(newView);
                }
              }}
              size="small"
              aria-label="calendar view mode"
            >
              <ToggleButton value="weekly" aria-label="weekly view">
                <Tooltip title="Weekly view">
                  <ViewWeekIcon fontSize="small" />
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="monthly" aria-label="monthly view">
                <Tooltip title="Monthly view">
                  <ViewModuleIcon fontSize="small" />
                </Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>
          )}
        </Box>
        <Tooltip title={viewMode === 'weekly' ? "Next week" : "Next month (Page Down)"}>
          <IconButton onClick={handleNextMonth} aria-label={viewMode === 'weekly' ? "next week" : "next month"}>
            <ChevronRightIcon />
          </IconButton>
        </Tooltip>
      </Box>
      
      {/* Keyboard navigation instructions - visually hidden but available to screen readers */}
      <Box 
        sx={{ 
          position: 'absolute',
          left: '-9999px',
          width: '1px',
          height: '1px',
          overflow: 'hidden'
        }}
        aria-live="polite"
        role="status"
      >
        Use arrow keys to navigate dates, Enter to select, Page Up/Down to change months
      </Box>
      
      <Grid container spacing={viewMode === 'weekly' && isMobile ? 2 : 1} className="calendar-grid" role="grid" aria-labelledby="calendar-heading">
        {/* Calendar header with day names */}
        <Grid item xs={12} role="row">
          <Grid container>
            {dayNames.map(day => (
              <Grid item xs={12/7} key={day} role="columnheader">
                <Typography 
                  variant={viewMode === 'weekly' && isMobile ? "caption" : "subtitle2"}
                  align="center" 
                  sx={{ fontWeight: 'bold' }}
                  aria-label={day === 'Mon' ? 'Monday' : day === 'Tue' ? 'Tuesday' : day === 'Wed' ? 'Wednesday' : day === 'Thu' ? 'Thursday' : day === 'Fri' ? 'Friday' : day === 'Sat' ? 'Saturday' : 'Sunday'}
                >
                  {viewMode === 'weekly' && isMobile ? day.charAt(0) : day}
                </Typography>
              </Grid>
            ))}
          </Grid>
        </Grid>
        
        {/* Calendar days */}
        {calendarDays.map((day, index) => {
          const isToday = new Date().toDateString() === day.date.toDateString();
          const isFocused = focusedDayIndex === index;
          const dateString = day.date.toLocaleDateString('en-GB', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          });
          const eventCount = events.filter(event => 
            new Date(event.date).toDateString() === day.date.toDateString()
          ).length;
          
          return (
            <Grid item xs={12/7} key={index} role="gridcell">
              <Box
                ref={el => dayRefs.current[index] = el}
                onClick={() => handleDateClick(day.date, index)}
                onKeyDown={(e) => {
                  if (e.key === ' ') {
                    e.preventDefault();
                    handleDateClick(day.date, index);
                  }
                }}
                tabIndex={isFocused || (focusedDayIndex === null && isToday) ? 0 : -1}
                role="button"
                aria-label={`${dateString}${eventCount > 0 ? `, ${eventCount} event${eventCount > 1 ? 's' : ''}` : ''}`}
                aria-current={isToday ? 'date' : undefined}
                aria-selected={isFocused}
                sx={{
                  p: viewMode === 'weekly' && isMobile ? 2 : 1,
                  height: viewMode === 'weekly' && isMobile ? '100px' : '60px',
                  border: isDarkMode ? '1px solid #333' : '1px solid #eee',
                  borderRadius: viewMode === 'weekly' && isMobile ? 2 : 1,
                  backgroundColor: day.isCurrentMonth 
                    ? (isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'white') 
                    : (isDarkMode ? 'rgba(0, 0, 0, 0.2)' : '#f5f5f5'),
                  opacity: day.isCurrentMonth ? 1 : 0.7,
                  cursor: 'pointer',
                  position: 'relative',
                  outline: isFocused && isKeyboardMode ? `2px solid ${theme.palette.primary.main}` : 'none',
                  outlineOffset: '-2px',
                  '&:hover': {
                    backgroundColor: isDarkMode 
                      ? 'rgba(144, 202, 249, 0.15)' 
                      : 'rgba(25, 118, 210, 0.1)',
                  },
                  '&:focus': {
                    outline: `2px solid ${theme.palette.primary.main}`,
                    outlineOffset: '-2px',
                  },
                  '&:focus-visible': {
                    outline: `2px solid ${theme.palette.primary.main}`,
                    outlineOffset: '-2px',
                  },
                  transition: 'background-color 0.2s',
                }}
                className="calendar-day"
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Box>
                  <Typography
                    variant={viewMode === 'weekly' && isMobile ? "h6" : "body2"}
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
                  {viewMode === 'weekly' && isMobile && (
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {day.date.toLocaleDateString('en-GB', { month: 'short' })}
                    </Typography>
                  )}
                </Box>
                
                {/* Add event button - only shown on hover or focus */}
                {day.isCurrentMonth && (
                  <Tooltip title="Add event">
                    <IconButton
                      size="small"
                      onClick={(e) => handleAddEventClick(day.date, e)}
                      sx={{ 
                        p: 0, 
                        opacity: isFocused ? 1 : 0,
                        '&:hover': { opacity: 1 },
                        '&:focus': { opacity: 1 },
                        '.MuiSvgIcon-root': { fontSize: '0.875rem' }
                      }}
                      className="add-event-button"
                      aria-label={`add event on ${dateString}`}
                      tabIndex={-1}
                    >
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
              
              {/* Event indicator or count for weekly view */}
              {day.hasEvents && viewMode === 'weekly' && isMobile && eventCount > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" sx={{ color: getEventColor(day) }}>
                    {eventCount} event{eventCount > 1 ? 's' : ''}
                  </Typography>
                </Box>
              )}
              
              {/* Event indicator with traffic light colors */}
              {day.hasEvents && !(viewMode === 'weekly' && isMobile) && (
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
          );
        })}
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

// Memoize the Calendar component to prevent unnecessary re-renders
export default React.memo(Calendar, (prevProps, nextProps) => {
  // Only re-render if the callbacks change
  return prevProps.onDateSelect === nextProps.onDateSelect &&
         prevProps.onAddEvent === nextProps.onAddEvent;
});
