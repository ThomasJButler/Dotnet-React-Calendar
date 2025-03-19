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
  Box
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker, TimePicker } from '@mui/x-date-pickers';
import { useEvents } from '../context/EventContext';

/**
 * EventForm component for adding and editing events
 * @param {Object} props - Component props
 * @returns {JSX.Element} EventForm component
 */
const EventForm = ({ open, handleClose, event, isEditing }) => {
  // Get event context functions
  const { addEvent, updateEvent } = useEvents();
  
  // Form state
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set form values when editing an existing event
  useEffect(() => {
    if (isEditing && event) {
      setTitle(event.title || '');
      
      // Parse date from string if needed
      if (event.date) {
        const eventDate = new Date(event.date);
        setDate(eventDate);
        
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
    } else {
      // Reset form for new event
      resetForm();
    }
  }, [isEditing, event]);

  /**
   * Reset form fields to default values
   */
  const resetForm = () => {
    setTitle('');
    setDate(new Date());
    setTime(new Date());
    setDescription('');
    setErrors({});
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
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
    
    try {
      // Format time as string (HH:MM)
      const formattedTime = time ? 
        `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}` : 
        '';
      
      const eventData = {
        title,
        date: date.toISOString(),
        time: formattedTime,
        description
      };
      
      if (isEditing && event) {
        // Include ID when updating
        await updateEvent(event.id, { ...eventData, id: event.id });
      } else {
        await addEvent(eventData);
      }
      
      handleClose();
      resetForm();
    } catch (error) {
      console.error('Error submitting event:', error);
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

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEditing ? 'Edit Event' : 'Add New Event'}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
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
            
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <FormControl error={!!errors.date}>
                <DatePicker
                  label="Date"
                  value={date}
                  onChange={(newDate) => setDate(newDate)}
                />
                {errors.date && <FormHelperText>{errors.date}</FormHelperText>}
              </FormControl>
              
              <FormControl error={!!errors.time}>
                <TimePicker
                  label="Time"
                  value={time}
                  onChange={(newTime) => setTime(newTime)}
                />
                {errors.time && <FormHelperText>{errors.time}</FormHelperText>}
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
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EventForm;
