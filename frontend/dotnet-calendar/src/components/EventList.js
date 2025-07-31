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
  Button,
  Alert,
  Chip,
  Tabs,
  Tab
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon, Search as SearchIcon } from '@mui/icons-material';
import { useEvents } from '../context/EventContext';
import { useApp } from '../context/AppContext';
import SkeletonLoader from './common/SkeletonLoader';
import { formatTime12Hour, formatDuration as formatDurationUtil } from '../utils/formatters';

/**
 * EventList component to display events for a selected day or search results
 * @param {Object} props - Component props
 * @returns {JSX.Element} EventList component
 */
const EventList = ({ selectedDate, onEditEvent }) => {
  const { events, deleteEvent, searchResults, isLoading, getError } = useEvents();
  const { showSuccess, showError } = useApp();
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [eventToDelete, setEventToDelete] = React.useState(null);
  const [viewMode, setViewMode] = React.useState('date'); // 'date' or 'search'

  // Loading states
  const loading = isLoading('fetch');
  const deleting = isLoading('delete');
  const searching = isLoading('search');
  
  // Error states
  const fetchError = getError('fetch');

  // Filter events for the selected date
  const filteredEvents = React.useMemo(() => {
    if (!selectedDate || viewMode === 'search') return [];
    
    // Convert selectedDate to date string for comparison (YYYY-MM-DD)
    const dateString = selectedDate.toISOString().split('T')[0];
    
    return events.filter(event => {
      // Convert event date to date string for comparison
      const eventDateString = new Date(event.date).toISOString().split('T')[0];
      return eventDateString === dateString;
    });
  }, [selectedDate, events, viewMode]);

  // Get display events based on view mode
  const displayEvents = viewMode === 'search' && searchResults?.data 
    ? searchResults.data 
    : filteredEvents;

  // Switch to search view if search results are available
  React.useEffect(() => {
    if (searchResults?.data && searchResults.data.length > 0) {
      setViewMode('search');
    }
  }, [searchResults]);

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
        showSuccess('Event deleted successfully');
      } catch (error) {
        showError('Failed to delete event. Please try again.');
      }
    }
    handleCloseDeleteDialog();
  };

  /**
   * Format event date for display
   */
  const formatEventDate = (event) => {
    const date = new Date(event.date);
    return date.toLocaleDateString(undefined, { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  /**
   * Render event item
   */
  const renderEventItem = (event, index) => (
    <React.Fragment key={event.id}>
      {index > 0 && <Divider component="li" />}
      <ListItem
        secondaryAction={
          <Box>
            <IconButton 
              edge="end" 
              aria-label="edit"
              onClick={() => onEditEvent(event)}
              disabled={deleting}
            >
              <EditIcon />
            </IconButton>
            <IconButton 
              edge="end" 
              aria-label="delete"
              onClick={() => handleDeleteClick(event)}
              disabled={deleting}
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        }
      >
        <ListItemText
          primary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle1" component="span">
                {event.title}
              </Typography>
              {event.isTemp && (
                <Chip label="Saving..." size="small" color="info" />
              )}
            </Box>
          }
          secondary={
            <Box>
              <Typography variant="body2" color="text.secondary" component="div">
                {viewMode === 'search' && (
                  <>
                    {formatEventDate(event)} • 
                  </>
                )}
                {event.time ? 
                  ` ${formatTime12Hour(event.time)}` : 
                  'All day'
                }
                {event.duration && ` (${formatDurationUtil(event.duration)})`}
              </Typography>
              {event.description && (
                <Typography variant="body2" component="div" sx={{ mt: 1 }}>
                  {event.description}
                </Typography>
              )}
            </Box>
          }
        />
      </ListItem>
    </React.Fragment>
  );

  return (
    <>
      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
        {/* View mode tabs if search results exist */}
        {searchResults && (
          <Tabs 
            value={viewMode} 
            onChange={(e, newValue) => setViewMode(newValue)}
            sx={{ mb: 2 }}
          >
            <Tab label="Selected Date" value="date" />
            <Tab 
              label={`Search Results (${searchResults.totalCount || 0})`} 
              value="search" 
              icon={<SearchIcon />}
              iconPosition="start"
            />
          </Tabs>
        )}

        {/* Error display */}
        {fetchError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {fetchError}
          </Alert>
        )}

        {/* Loading state */}
        {(loading || searching) && !displayEvents.length ? (
          <SkeletonLoader variant="event" count={3} />
        ) : (
          <>
            {/* Events list */}
            {displayEvents.length > 0 ? (
              <List>
                {displayEvents.map((event, index) => renderEventItem(event, index))}
              </List>
            ) : (
              <Typography variant="body1" color="text.secondary">
                {viewMode === 'search' 
                  ? 'No events found matching your search criteria.'
                  : selectedDate 
                    ? 'No events scheduled for this day.'
                    : 'Select a date to view events.'
                }
              </Typography>
            )}

            {/* Search pagination info */}
            {viewMode === 'search' && searchResults && searchResults.totalPages > 1 && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  Showing page {searchResults.page} of {searchResults.totalPages}
                </Typography>
              </Box>
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
          <Button 
            onClick={handleConfirmDelete} 
            color="error" 
            autoFocus
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default EventList;