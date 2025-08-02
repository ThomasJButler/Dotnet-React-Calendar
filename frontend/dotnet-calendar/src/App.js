import React, { useState, useMemo, lazy, Suspense } from 'react';
import { Container, Typography, Box, Button, AppBar, Toolbar, CssBaseline, IconButton, useMediaQuery } from '@mui/material';
import { Add as AddIcon, DarkMode as DarkModeIcon, LightMode as LightModeIcon, Analytics as AnalyticsIcon, ImportExport as ImportExportIcon, Speed as SpeedIcon } from '@mui/icons-material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Calendar from './components/Calendar';
import EventList from './components/EventList';
import EventForm from './components/EventForm';
import EventSearch from './components/EventSearch';
import ApiStatus from './components/ApiStatus';
import ErrorBoundary from './components/ErrorBoundary';
import SkipNavigation from './components/common/SkipNavigation';
import PerformanceMonitor from './components/PerformanceMonitor';
import { EventProvider } from './context/EventContext';
import { AppProvider } from './context/AppContext';
import ToastContainer from './components/common/Toast';
import './App.css';

// Lazy load heavy components for better performance
const FreeTimeChart = lazy(() => import('./components/FreeTimeChart'));
const AnalyticsDashboard = lazy(() => import('./components/AnalyticsDashboard'));
const BulkEventManager = lazy(() => import('./components/BulkEventManager'));

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
          main: darkMode ? '#0a84ff' : '#007aff', // Apple blue
          light: darkMode ? '#409cff' : '#3395ff', 
          dark: darkMode ? '#0064d0' : '#0062cc',
        },
        secondary: {
          main: darkMode ? '#98989d' : '#8e8e93',  // Apple gray
          light: darkMode ? '#aeaeb2' : '#aeaeb2', 
          dark: darkMode ? '#636366' : '#636366',
        },
        background: {
          default: darkMode ? '#1c1c1e' : '#f5f5f7', // Apple backgrounds
          paper: darkMode ? '#2c2c2e' : '#ffffff',   
        },
        text: {
          primary: darkMode ? '#f5f5f7' : '#1d1d1f',  // Apple text colors
          secondary: darkMode ? '#98989d' : '#86868b' 
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
            <SkipNavigation />
            <ToastContainer />
            <Box sx={{ flexGrow: 1 }}>
          <AppBar position="static" color="primary">
            <Toolbar>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                .NET Backend Calendar
              </Typography>
              
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
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
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
