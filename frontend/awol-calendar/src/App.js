import React, { useState } from 'react';
import { Container, Typography, Box, Button, AppBar, Toolbar, CssBaseline } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Calendar from './components/Calendar';
import EventList from './components/EventList';
import EventForm from './components/EventForm';
import { EventProvider } from './context/EventContext';
import './App.css';

// Create a custom theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

/**
 * Main App component
 * @returns {JSX.Element} App component
 */
function App() {
  // State for selected date and event form
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [eventFormOpen, setEventFormOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

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
