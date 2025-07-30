import React from 'react';
import { 
  List, 
  ListItem, 
  ListItemText, 
  IconButton, 
  Typography, 
  Paper, 
  Box,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { useEvents } from '../context/EventContext';

/**
 * Format duration in minutes to a readable string (e.g., "1h 30min")
 * @param {number} durationMinutes - Duration in minutes
 * @returns {string} Formatted duration
 */
const formatDuration = (durationMinutes) => {
  if (!durationMinutes && durationMinutes !== 0) return '';
  
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  
  if (hours === 0) {
    return `${minutes}min`;
  } else if (minutes === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${minutes}min`;
  }
};

/**
 * EventList component to display events for a selected day
 * @param {Object} props - Component props
 * @returns {JSX.Element} EventList component
 */
const EventList = ({ selectedDate, onEditEvent }) => {
  const { events, deleteEvent } = useEvents();
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [eventToDelete, setEventToDelete] = React.useState(null);

  // Filter events for the selected date
  const filteredEvents = React.useMemo(() => {
    if (!selectedDate) return [];
    
    // Convert selectedDate to date string for comparison (YYYY-MM-DD)
    const dateString = selectedDate.toISOString().split('T')[0];
    
    return events.filter(event => {
      // Convert event date to date string for comparison
      const eventDateString = new Date(event.date).toISOString().split('T')[0];
      return eventDateString === dateString;
    });
  }, [selectedDate, events]);

  /**
   * Open delete confirmation dialog
   * @param {Object} event - The event to delete
   */
  const handleDeleteClick = (event) => {
    setEventToDelete(event);
    setDeleteDialogOpen(true);
  };

  /**
   * Close delete confirmation dialog
   */
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setEventToDelete(null);
  };

  /**
   * Confirm event deletion
   */
  const handleConfirmDelete = async () => {
    if (eventToDelete) {
      try {
        await deleteEvent(eventToDelete.id);
      } catch (error) {
        console.error('Error deleting event:', error);
      }
    }
    handleCloseDeleteDialog();
  };

  return (
    <>
      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
        {selectedDate && (
          <>
            {filteredEvents.length > 0 ? (
              <List>
                {filteredEvents.map((event, index) => (
                  <React.Fragment key={event.id}>
                    {index > 0 && <Divider component="li" />}
                    <ListItem
                      secondaryAction={
                        <Box>
                          <IconButton 
                            edge="end" 
                            aria-label="edit"
                            onClick={() => onEditEvent(event)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton 
                            edge="end" 
                            aria-label="delete"
                            onClick={() => handleDeleteClick(event)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      }
                    >
                      <ListItemText
                        primary={
                          <Typography variant="subtitle1" component="div">
                            {event.title}
                          </Typography>
                        }
                        secondary={
                          <div>
                            <Typography variant="body2" color="text.secondary" component="span">
                              {event.time ? 
                                `${event.time} ${event.duration ? `(${formatDuration(event.duration)})` : ''}` : 
                                formatDuration(event.duration)
                              }
                            </Typography>
                            <Typography variant="body2" component="div" sx={{ mt: 1 }}>
                              {event.description}
                            </Typography>
                          </div>
                        }
                      />
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Typography variant="body1" color="text.secondary">
                No events scheduled for this day.
              </Typography>
            )}
          </>
        )}
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          Delete Event
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete "{eventToDelete?.title}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default EventList;
