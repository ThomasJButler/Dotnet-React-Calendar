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

  // Format date for display
  const formatDate = (date) => {
    if (!date) return '';
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(date).toLocaleDateString('en-GB', options);
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
                          <>
                            <Typography variant="body2" color="text.secondary" component="span">
                              {event.time}
                            </Typography>
                            <Typography variant="body2" component="div" sx={{ mt: 1 }}>
                              {event.description}
                            </Typography>
                          </>
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
