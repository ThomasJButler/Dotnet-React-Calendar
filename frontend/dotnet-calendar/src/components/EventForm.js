import React, { useState, useEffect } from 'react';
import { 
  Button, 
  TextField, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogTitle,
  FormControl,
  FormHelperText,
  Box,
  Alert,
  Snackbar,
  Typography,
  Grid,
  MenuItem,
  Select,
  InputLabel
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker, TimePicker } from '@mui/x-date-pickers';
import { format } from 'date-fns';
import { enGB } from 'date-fns/locale';
import { useEvents } from '../context/EventContext';
import EventService from '../services/eventService';

/**
 * Format a date in UK style with ordinal suffix on day (e.g., "15th March 2025")
 * @param {Date} date - The date to format
 * @returns {string} Formatted date string
 */
const formatDateUK = (date) => {
  if (!date) return '';
  
  try {
    // Format using date-fns with British locale
    return format(date, "do MMMM yyyy", { locale: enGB });
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'Invalid date';
  }
};

/**
 * EventForm component for adding and editing events
 * @param {Object} props - Component props
 * @returns {JSX.Element} EventForm component
 */
const EventForm = ({ open, handleClose, event, isEditing, selectedDate }) => {
  // Get event context functions
  const { addEvent, updateEvent } = useEvents();
  
  // Form state
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [description, setDescription] = useState('');
  const [durationHours, setDurationHours] = useState(1); // Default: 1 hour
  const [durationMinutes, setDurationMinutes] = useState(0); // Default: 0 minutes
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [yearPickerYear, setYearPickerYear] = useState(new Date().getFullYear());
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Set form values when editing an existing event or opening form for new event
  useEffect(() => {
    if (isEditing && event) {
      // When editing an existing event
      setTitle(event.title || '');
      
      // Parse date from string if needed
      if (event.date) {
        const eventDate = new Date(event.date);
        setDate(eventDate);
        setYearPickerYear(eventDate.getFullYear());
        
        // If time is stored separately as a string (e.g. "14:30"), create a date object
        if (event.time) {
          const timeParts = event.time.split(':');
          const timeDate = new Date();
          if (timeParts.length >= 2) {
            timeDate.setHours(parseInt(timeParts[0], 10));
            timeDate.setMinutes(parseInt(timeParts[1], 10));
          }
          setTime(timeDate);
        }
      }
      
      setDescription(event.description || '');
      
      // Set duration in hours and minutes
      if (event.duration) {
        setDurationHours(Math.floor(event.duration / 60));
        setDurationMinutes(event.duration % 60);
      } else {
        setDurationHours(1);
        setDurationMinutes(0);
      }
    } else {
      // When adding a new event
      resetForm();
      
      // Use the selected date from calendar if available
      if (selectedDate) {
        setDate(selectedDate);
        setYearPickerYear(selectedDate.getFullYear());
      }
    }
  }, [isEditing, event, selectedDate, open]);

  /**
   * Reset form fields to default values
   */
  const resetForm = () => {
    setTitle('');
    setDate(new Date());
    setYearPickerYear(new Date().getFullYear());
    setTime(new Date());
    setDescription('');
    setDurationHours(1);
    setDurationMinutes(0);
    setErrors({});
    setShowYearPicker(false);
  };

  /**
   * Validate form fields
   * @returns {boolean} Whether the form is valid
   */
  const validateForm = () => {
    const newErrors = {};
    
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!date) {
      newErrors.date = 'Date is required';
    }
    
    if (!time) {
      newErrors.time = 'Time is required';
    }
    
    // Validate duration
    if (durationHours === 0 && durationMinutes < 15) {
      newErrors.duration = 'Duration must be at least 15 minutes';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Toggle year picker visibility
  const toggleYearPicker = (e) => {
    if (e) e.stopPropagation();
    setShowYearPicker(!showYearPicker);
  };

  // Handle year selection
  const handleYearSelect = (year) => {
    try {
      // Store the selected year for the year picker
      setYearPickerYear(year);
      
      // Get current month and day 
      const currentMonth = date.getMonth();
      const currentDay = date.getDate();
      
      // Create a new date with the selected year
      const newDate = new Date(year, currentMonth, currentDay);
      
      // Verify it's a valid date
      if (isNaN(newDate.getTime())) {
        throw new Error('Invalid date created');
      }
      
      setDate(newDate);
      setShowYearPicker(false);
    } catch (error) {
      console.error('Year selection error:', error);
      // Fallback to January 1st of the selected year if there's an issue
      setDate(new Date(year, 0, 1));
      setShowYearPicker(false);
    }
  };

  /**
   * Handle form submission
   * @param {Event} e - Form submit event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setErrors({});
    
    try {
      // Format time as string (HH:MM)
      const formattedTime = time ? 
        `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}` : 
        '';
      
      // Calculate total duration in minutes
      const totalDuration = (durationHours * 60) + durationMinutes;
      
      const eventData = {
        title,
        date: date.toISOString(),
        time: formattedTime,
        description,
        duration: totalDuration
      };
      
      // Check for event overlap
      const eventId = isEditing && event ? event.id : null;
      const hasOverlap = await EventService.checkEventOverlap(eventData, eventId);
      
      if (hasOverlap) {
        setErrors({
          ...errors,
          overlap: 'This event overlaps with an existing event. Please choose a different time.'
        });
        setIsSubmitting(false);
        return;
      }
      
      if (isEditing && event) {
        // Include ID when updating
        const updatedEvent = await updateEvent(event.id, { ...eventData, id: event.id });
        if (updatedEvent) {
          setSnackbar({
            open: true,
            message: 'Event updated successfully!',
            severity: 'success'
          });
          // Close the form after a brief delay to show feedback
          setTimeout(() => {
            handleClose();
            resetForm();
          }, 1500);
        }
      } else {
        const newEvent = await addEvent(eventData);
        if (newEvent) {
          setSnackbar({
            open: true,
            message: 'Event added successfully!',
            severity: 'success'
          });
          // Close the form after a brief delay to show feedback
          setTimeout(() => {
            handleClose();
            resetForm();
          }, 1500);
        }
      }
    } catch (error) {
      console.error('Error submitting event:', error);
      setSnackbar({
        open: true,
        message: 'Failed to save event. Please try again.',
        severity: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle dialog close
   */
  const onClose = () => {
    resetForm();
    handleClose();
  };

  // Generate years for the year picker
  const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    
    // Show 10 years before and 10 years after the current year
    for (let year = currentYear - 10; year <= currentYear + 10; year++) {
      years.push(year);
    }
    
    return years;
  };

  // Generate hours options (0-23)
  const hourOptions = Array.from({ length: 24 }, (_, i) => i);
  
  // Generate minutes options (0-55, step 5)
  const minuteOptions = Array.from({ length: 12 }, (_, i) => i * 5);

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>{isEditing ? 'Edit Event' : 'Add New Event'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            {errors.overlap && (
              <Box sx={{ mb: 2 }}>
                <Alert severity="error">{errors.overlap}</Alert>
              </Box>
            )}
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <FormControl error={!!errors.title}>
                <TextField
                  label="Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  fullWidth
                  error={!!errors.title}
                />
                {errors.title && <FormHelperText>{errors.title}</FormHelperText>}
              </FormControl>
              
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={enGB}>
                <FormControl error={!!errors.date}>
                  {showYearPicker ? (
                    <Box sx={{ mt: 2, mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>Select Year</Typography>
                      <Box 
                        sx={{ 
                          display: 'grid', 
                          gridTemplateColumns: 'repeat(5, 1fr)',
                          gap: 1
                        }}
                      >
                        {getYearOptions().map(year => (
                          <Button
                            key={year}
                            variant={year === yearPickerYear ? "contained" : "outlined"}
                            onClick={() => handleYearSelect(year)}
                            size="small"
                          >
                            {year}
                          </Button>
                        ))}
                      </Box>
                      <Button 
                        size="small" 
                        onClick={toggleYearPicker}
                        sx={{ mt: 2 }}
                      >
                        Back to Date Picker
                      </Button>
                    </Box>
                  ) : (
                    <DatePicker
                      label="Date"
                      value={date}
                      onChange={(newDate) => setDate(newDate)}
                      format="dd/MM/yyyy"
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: !!errors.date,
                          helperText: errors.date || formatDateUK(date)
                        }
                      }}
                      slots={{
                        openPickerIcon: () => (
                          <Box 
                            sx={{ 
                              display: 'flex', 
                              alignItems: 'center',
                              cursor: 'pointer',
                              '&:hover': {
                                textDecoration: 'underline'
                              }
                            }}
                            onClick={toggleYearPicker}
                          >
                            <Typography variant="body2" sx={{ mr: 1 }}>
                              {date.getFullYear()}
                            </Typography>
                          </Box>
                        )
                      }}
                    />
                  )}
                </FormControl>
                
                <FormControl error={!!errors.time}>
                  <TimePicker
                    label="Start Time"
                    value={time}
                    onChange={(newTime) => setTime(newTime)}
                    ampm={false}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!errors.time,
                        helperText: errors.time
                      }
                    }}
                  />
                </FormControl>
                
                {/* Duration selection with dropdown pickers */}
                <FormControl error={!!errors.duration}>
                  <Typography variant="subtitle2" gutterBottom>
                    Duration
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <FormControl fullWidth>
                        <InputLabel id="duration-hours-label">Hours</InputLabel>
                        <Select
                          labelId="duration-hours-label"
                          value={durationHours}
                          label="Hours"
                          onChange={(e) => setDurationHours(e.target.value)}
                        >
                          {hourOptions.map(hour => (
                            <MenuItem key={`hour-${hour}`} value={hour}>
                              {hour}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={6}>
                      <FormControl fullWidth>
                        <InputLabel id="duration-minutes-label">Minutes</InputLabel>
                        <Select
                          labelId="duration-minutes-label"
                          value={durationMinutes}
                          label="Minutes"
                          onChange={(e) => setDurationMinutes(e.target.value)}
                        >
                          {minuteOptions.map(minute => (
                            <MenuItem key={`minute-${minute}`} value={minute}>
                              {minute}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                  {errors.duration ? (
                    <FormHelperText error>{errors.duration}</FormHelperText>
                  ) : (
                    <FormHelperText>
                      Specify how long the event will last
                    </FormHelperText>
                  )}
                </FormControl>
              </LocalizationProvider>
              
              <TextField
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                multiline
                rows={4}
                fullWidth
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose} color="primary">
              Cancel
            </Button>
            <Button 
              type="submit" 
              color="primary" 
              variant="contained" 
              disabled={isSubmitting || (durationHours === 0 && durationMinutes < 15)}
            >
              {isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      
      {/* Snackbar notification */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default EventForm;
