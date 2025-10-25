/**
 * @author Tom Butler
 * @date 2025-10-25
 * @description Main application component with theme management and lazy-loaded features.
 */

import React, { useState, useMemo, lazy, Suspense, useEffect } from 'react';
import { Container, Typography, Box, Button, AppBar, Toolbar, CssBaseline, IconButton, useMediaQuery, Menu, MenuItem, Tooltip, Fab } from '@mui/material';
import { Add as AddIcon, DarkMode as DarkModeIcon, LightMode as LightModeIcon, Analytics as AnalyticsIcon, ImportExport as ImportExportIcon, Speed as SpeedIcon, MoreVert as MoreVertIcon } from '@mui/icons-material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Calendar from './components/Calendar';
import EventList from './components/EventList';
import EventForm from './components/EventForm';
import EventSearch from './components/EventSearch';
import ApiStatus from './components/ApiStatus';
import ErrorBoundary from './components/ErrorBoundary';
import PerformanceMonitor from './components/PerformanceMonitor';
import ServerWarmingLoader from './components/ServerWarmingLoader';
import { EventProvider } from './context/EventContext';
import { AppProvider } from './context/AppContext';
import ToastContainer from './components/common/Toast';
import apiClient from './services/apiClient';
import './App.css';

// Lazy load heavy components for better performance
const FreeTimeChart = lazy(() => 
  import('./components/FreeTimeChart').catch(err => {
    console.error('Failed to load FreeTimeChart:', err);
    return { default: () => <div>Error loading FreeTimeChart</div> };
  })
);
const AnalyticsDashboard = lazy(() => 
  import('./components/AnalyticsDashboard').catch(err => {
    console.error('Failed to load AnalyticsDashboard:', err);
    return { default: () => <div>Error loading AnalyticsDashboard</div> };
  })
);
const BulkEventManager = lazy(() => 
  import('./components/BulkEventManager').catch(err => {
    console.error('Failed to load BulkEventManager:', err);
    return { default: () => <div>Error loading BulkEventManager</div> };
  })
);

/**
 * App component with theme and dark mode support
 * @returns {JSX.Element} App component
 */
function App() {
  // State for selected date, event form, and theme mode
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [eventFormOpen, setEventFormOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [bulkManagerOpen, setBulkManagerOpen] = useState(false);
  const [performanceMonitorOpen, setPerformanceMonitorOpen] = useState(false);
  const [serverWarmingState, setServerWarmingState] = useState({
    isWarming: false,
    attempt: 0,
    maxAttempts: 10
  });
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState(null);
  
  // Use media query to detect system preference for dark mode
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  // Media query for mobile layout
  const isMobile = useMediaQuery('(max-width:900px)');
  // Initialize dark mode based on system preference
  const [darkMode, setDarkMode] = useState(prefersDarkMode);

  // Create a theme based on the current mode
  const theme = useMemo(() => 
    createTheme({
      palette: {
        mode: darkMode ? 'dark' : 'light',
        primary: {
          main: darkMode ? '#64B5F6' : '#2A7F7E', // Sky blue for dark, teal for light
          light: darkMode ? '#90CAF9' : '#3CA5A4', 
          dark: darkMode ? '#42A5F5' : '#1F5F5E',
        },
        secondary: {
          main: darkMode ? '#CE93D8' : '#6B5B5D',  // Purple for dark, warm gray for light
          light: darkMode ? '#E1BEE7' : '#8B7B7D', 
          dark: darkMode ? '#BA68C8' : '#4B3B3D',
        },
        background: {
          default: darkMode ? '#121212' : '#F7F3F0', // True black for dark mode
          paper: darkMode ? '#1E1E1E' : '#FFFFFF',   
        },
        text: {
          primary: darkMode ? '#E8E8E8' : '#2C2926',  
          secondary: darkMode ? '#B0B0B0' : '#5C5552'
        },
        error: {
          main: darkMode ? '#E57373' : '#C1666B',
        },
        warning: {
          main: darkMode ? '#FFB74D' : '#D4A574',
        },
        success: {
          main: darkMode ? '#81C784' : '#4A7C59',
        },
        info: {
          main: darkMode ? '#64B5F6' : '#2A7F7E',
        }
      },
      typography: {
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif',
      },
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            body: {
              transition: 'background-color 0.3s ease, color 0.3s ease' // Smoother transitions
            }
          }
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              transition: 'background-color 0.3s ease'
            }
          }
        }
      }
    }), [darkMode]);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Mobile menu handlers
  const handleMobileMenuOpen = (event) => {
    setMobileMenuAnchor(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuAnchor(null);
  };

  const handleMobileMenuAction = (action) => {
    handleMobileMenuClose();
    action();
  };

  // Subscribe to server warming state changes
  useEffect(() => {
    const unsubscribe = apiClient.onServerWarmingChange((state) => {
      setServerWarmingState(state);
    });

    return unsubscribe;
  }, []);

  // Apply dark mode class to body
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
      document.body.classList.remove('light-mode');
    } else {
      document.body.classList.add('light-mode');
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  /**
   * Handle date selection from calendar
   * @param {Date} date - The selected date
   */
  const handleDateSelect = (date) => {
    setSelectedDate(date);
  };

  /**
   * Open event form for adding a new event
   * @param {Date} date - The date for the new event
   */
  const handleAddEvent = (date) => {
    // Use provided date or current selected date
    const eventDate = date || selectedDate;
    setSelectedDate(eventDate);
    setCurrentEvent(null);
    setIsEditing(false);
    setEventFormOpen(true);
  };

  /**
   * Open event form for editing an existing event
   * @param {Object} event - The event to edit
   */
  const handleEditEvent = (event) => {
    setCurrentEvent(event);
    setIsEditing(true);
    setEventFormOpen(true);
  };

  /**
   * Close the event form
   */
  const handleCloseEventForm = () => {
    setEventFormOpen(false);
    setCurrentEvent(null);
    setIsEditing(false);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <AppProvider>
          <EventProvider>
            <ToastContainer />
            <ServerWarmingLoader 
              isWarming={serverWarmingState.isWarming}
              attempt={serverWarmingState.attempt}
              maxAttempts={serverWarmingState.maxAttempts}
            />
            <Box sx={{ flexGrow: 1 }}>
          <AppBar position="static" color="primary">
            <Toolbar>
                {!isMobile && (
                  <Typography 
                    variant="h6"
                    component="div" 
                    sx={{ 
                      flexGrow: 1,
                      fontWeight: 400
                    }}
                  >
                    .NET Backend Calendar
                  </Typography>
                )}
                {isMobile && (
                  <Typography 
                    variant="caption" 
                    component="div" 
                    sx={{ 
                      flexGrow: 1,
                      fontSize: '0.75rem',
                      opacity: 0.9,
                      letterSpacing: '0.5px'
                    }}
                  >
                    .NET Calendar
                  </Typography>
                )}
              
              {/* Desktop layout */}
              {!isMobile && (
                <>
                  {/* Performance Monitor button */}
                  <IconButton
                    color="inherit"
                    onClick={() => setPerformanceMonitorOpen(true)}
                    sx={{ mr: 1 }}
                    aria-label="performance monitor"
                  >
                    <SpeedIcon />
                  </IconButton>
                  
                  {/* Import/Export button */}
                  <IconButton
                    color="inherit"
                    onClick={() => setBulkManagerOpen(true)}
                    sx={{ mr: 1 }}
                    aria-label="import export events"
                  >
                    <ImportExportIcon />
                  </IconButton>
                  
                  {/* Analytics toggle */}
                  <Button 
                    color="inherit" 
                    startIcon={<AnalyticsIcon />}
                    onClick={() => setShowAnalytics(!showAnalytics)}
                    sx={{ mr: 2 }}
                  >
                    {showAnalytics ? 'Calendar' : 'Analytics'}
                  </Button>
                  
                  {/* Dark mode toggle */}
                  <IconButton 
                    color="inherit" 
                    onClick={toggleDarkMode} 
                    sx={{ mr: 1 }}
                    aria-label="toggle dark mode"
                  >
                    {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
                  </IconButton>
                  
                  <Button 
                    color="inherit" 
                    startIcon={<AddIcon />}
                    onClick={() => handleAddEvent(selectedDate)}
                    data-testid="toolbar-add-event-button"
                  >
                    Add Event
                  </Button>
                </>
              )}
              
              {/* Mobile layout */}
              {isMobile && (
                <>
                  {/* Dark mode toggle */}
                  <Tooltip title="Toggle dark mode">
                    <IconButton 
                      color="inherit" 
                      onClick={toggleDarkMode} 
                      sx={{ mr: 0.5 }}
                      aria-label="toggle dark mode"
                    >
                      {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
                    </IconButton>
                  </Tooltip>
                  
                  {/* Add Event button (icon only on mobile) */}
                  <Tooltip title="Add Event">
                    <IconButton 
                      color="inherit" 
                      onClick={() => handleAddEvent(selectedDate)}
                      data-testid="toolbar-add-event-button"
                      sx={{ mr: 0.5 }}
                    >
                      <AddIcon />
                    </IconButton>
                  </Tooltip>
                  
                  {/* Mobile menu button */}
                  <IconButton
                    color="inherit"
                    onClick={handleMobileMenuOpen}
                    aria-label="more options"
                  >
                    <MoreVertIcon />
                  </IconButton>
                  
                  {/* Mobile dropdown menu */}
                  <Menu
                    anchorEl={mobileMenuAnchor}
                    open={Boolean(mobileMenuAnchor)}
                    onClose={handleMobileMenuClose}
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'right',
                    }}
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'right',
                    }}
                  >
                    <MenuItem onClick={() => handleMobileMenuAction(() => setShowAnalytics(!showAnalytics))}>
                      <AnalyticsIcon sx={{ mr: 1 }} />
                      {showAnalytics ? 'Calendar View' : 'Analytics'}
                    </MenuItem>
                    <MenuItem onClick={() => handleMobileMenuAction(() => setBulkManagerOpen(true))}>
                      <ImportExportIcon sx={{ mr: 1 }} />
                      Import/Export
                    </MenuItem>
                    <MenuItem onClick={() => handleMobileMenuAction(() => setPerformanceMonitorOpen(true))}>
                      <SpeedIcon sx={{ mr: 1 }} />
                      Performance
                    </MenuItem>
                  </Menu>
                </>
              )}
              </Toolbar>
          </AppBar>
        </Box>
        
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }} component="main" id="main-content">
          {/* Event Search - Always visible at top when not in analytics mode */}
          {!showAnalytics && (
            <Box sx={{ mb: 3 }} id="search">
              <EventSearch />
            </Box>
          )}
          
          {/* Show Analytics Dashboard or Calendar/Events view */}
          {showAnalytics ? (
            <Suspense fallback={
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                <Typography>Loading analytics...</Typography>
              </Box>
            }>
              <AnalyticsDashboard />
            </Suspense>
          ) : (
            /* Layout changes for mobile - show date and events above calendar */
            isMobile ? (
            <>
              
              {/* Event list section */}
              <Box sx={{ mb: 3 }}>
                <EventList 
                  selectedDate={selectedDate} 
                  onEditEvent={handleEditEvent} 
                />
              </Box>
              
              {/* Calendar section */}
              <Box>
                <Calendar 
                  onDateSelect={handleDateSelect} 
                  onAddEvent={handleAddEvent} 
                />
              </Box>
              
              {/* Free Time Chart (mobile) */}
              <Box sx={{ mt: 3 }}>
                <Suspense fallback={
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <Typography>Loading chart...</Typography>
                  </Box>
                }>
                  <FreeTimeChart selectedDate={selectedDate} />
                </Suspense>
              </Box>
            </>
          ) : (
            /* Desktop layout - calendar beside event list */
            <Box sx={{ display: 'flex', flexDirection: 'row', gap: 3 }}>
              {/* Calendar section */}
              <Box sx={{ flex: 2 }}>
                <Calendar 
                  onDateSelect={handleDateSelect} 
                  onAddEvent={handleAddEvent} 
                />
              </Box>
              
              {/* Event list and Free Time Chart section */}
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <EventList 
                    selectedDate={selectedDate} 
                    onEditEvent={handleEditEvent} 
                  />
                </Box>
                
                {/* Free Time Chart (desktop) */}
                <Box>
                  <Suspense fallback={
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                      <Typography>Loading chart...</Typography>
                    </Box>
                  }>
                    <FreeTimeChart selectedDate={selectedDate} />
                  </Suspense>
                </Box>
              </Box>
            </Box>
          )
          )}
          
          {/* Event form dialog */}
          <EventForm 
            open={eventFormOpen} 
            handleClose={handleCloseEventForm} 
            event={currentEvent} 
            isEditing={isEditing}
            selectedDate={selectedDate}
          />
          
          {/* Attribution footer */}
          <Box className={`footer ${darkMode ? 'dark-mode' : ''}`}>
            <Typography variant="body2" component="p">
              Built by Thomas Butler using .NET 9, FastEndpoints, React.js, Material UI
            </Typography>
          </Box>
        </Container>
        
        {/* API Status indicator - compact mode */}
        <ApiStatus compact />
        
        {/* Floating Action Button for mobile */}
        {isMobile && !showAnalytics && (
          <Fab
            color="primary"
            aria-label="add event"
            onClick={() => handleAddEvent(selectedDate)}
            sx={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              zIndex: 1200,
            }}
          >
            <AddIcon />
          </Fab>
        )}
        
        {/* Bulk Event Manager Dialog */}
        <Suspense fallback={null}>
          <BulkEventManager 
            open={bulkManagerOpen} 
            onClose={() => setBulkManagerOpen(false)} 
          />
        </Suspense>
        
        {/* Performance Monitor Dialog */}
        <Suspense fallback={null}>
          <PerformanceMonitor 
            open={performanceMonitorOpen} 
            onClose={() => setPerformanceMonitorOpen(false)} 
          />
        </Suspense>
        
          </EventProvider>
        </AppProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
