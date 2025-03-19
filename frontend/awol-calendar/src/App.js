import React, { useState, useMemo } from 'react';
import { Container, Typography, Box, Button, AppBar, Toolbar, CssBaseline, IconButton, useMediaQuery } from '@mui/material';
import { Add as AddIcon, DarkMode as DarkModeIcon, LightMode as LightModeIcon } from '@mui/icons-material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Calendar from './components/Calendar';
import EventList from './components/EventList';
import EventForm from './components/EventForm';
import { EventProvider } from './context/EventContext';
import './App.css';

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
  
  // Use media query to detect system preference for dark mode
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  // Initialize dark mode based on system preference
  const [darkMode, setDarkMode] = useState(prefersDarkMode);
  
  // Create a theme based on the current mode
  const theme = useMemo(() => 
    createTheme({
      palette: {
        mode: darkMode ? 'dark' : 'light',
        primary: {
          main: darkMode ? '#90caf9' : '#1976d2',
        },
        secondary: {
          main: darkMode ? '#f48fb1' : '#dc004e',
        },
        background: {
          default: darkMode ? '#121212' : '#f5f5f5',
          paper: darkMode ? '#1e1e1e' : '#ffffff',
        }
      },
      typography: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      },
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
    setSelectedDate(date);
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
      <EventProvider>
        <Box sx={{ flexGrow: 1 }}>
          <AppBar position="static" color="primary">
            <Toolbar>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                AWOL Calendar
              </Typography>
              
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
              >
                Add Event
              </Button>
            </Toolbar>
          </AppBar>
        </Box>
        
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
            {/* Calendar section */}
            <Box sx={{ flex: 2 }}>
              <Calendar 
                onDateSelect={handleDateSelect} 
                onAddEvent={handleAddEvent} 
              />
            </Box>
            
            {/* Event list section */}
            <Box sx={{ flex: 1 }}>
              <EventList 
                selectedDate={selectedDate} 
                onEditEvent={handleEditEvent} 
              />
            </Box>
          </Box>
          
          {/* Event form dialog */}
          <EventForm 
            open={eventFormOpen} 
            handleClose={handleCloseEventForm} 
            event={currentEvent} 
            isEditing={isEditing} 
          />
        </Container>
      </EventProvider>
    </ThemeProvider>
  );
}

export default App;
