/**
 * @author Tom Butler
 * @date 2025-10-25
 * @description List component displaying events for a selected date.
 */

import React, { useRef, lazy, Suspense } from 'react';
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
  Tab,
  Tooltip,
  CircularProgress
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon, Search as SearchIcon } from '@mui/icons-material';
import { useEvents } from '../context/EventContext';
import { useApp } from '../context/AppContext';
import SkeletonLoader from './common/SkeletonLoader';
import { formatTime12Hour, formatDuration as formatDurationUtil } from '../utils/formatters';
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation';

// Lazy load the virtualized list for better performance
const VirtualizedEventList = lazy(() => import('./VirtualizedEventList'));

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
  const [focusedEventIndex, setFocusedEventIndex] = React.useState(0);
  const listRef = useRef(null);
  const eventRefs = useRef([]);

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

  // Keyboard navigation handlers
  const handleKeyboardNavigation = React.useCallback((direction) => {
    const totalEvents = displayEvents.length;
    if (totalEvents === 0) return;

    let newIndex = focusedEventIndex;
    
    switch(direction) {
      case 'up':
        newIndex = Math.max(0, focusedEventIndex - 1);
        break;
      case 'down':
        newIndex = Math.min(totalEvents - 1, focusedEventIndex + 1);
        break;
      case 'home':
        newIndex = 0;
        break;
      case 'end':
        newIndex = totalEvents - 1;
        break;
      default:
        return;
    }
    
    setFocusedEventIndex(newIndex);
    eventRefs.current[newIndex]?.focus();
  }, [focusedEventIndex, displayEvents]);

  // Use keyboard navigation hook
  useKeyboardNavigation({
    containerRef: listRef,
    enabled: displayEvents.length > 0,
    onArrowUp: () => handleKeyboardNavigation('up'),
    onArrowDown: () => handleKeyboardNavigation('down'),
    onHome: () => handleKeyboardNavigation('home'),
    onEnd: () => handleKeyboardNavigation('end'),
    onEnter: () => {
      if (displayEvents[focusedEventIndex]) {
        onEditEvent(displayEvents[focusedEventIndex]);
      }
    },
    onDelete: () => {
      if (displayEvents[focusedEventIndex]) {
        handleDeleteClick(displayEvents[focusedEventIndex]);
      }
    }
  });

  /**
   * Render event item
   */
  const renderEventItem = (event, index) => {
    const isFocused = focusedEventIndex === index;
    const eventTime = formatTime12Hour(event.startTime);
    const duration = formatDurationUtil(event.duration);
    
    return (
      <React.Fragment key={event.id}>
        {index > 0 && <Divider component="li" />}
        <ListItem
          ref={el => eventRefs.current[index] = el}
          tabIndex={isFocused ? 0 : -1}
          onFocus={() => setFocusedEventIndex(index)}
          role="article"
          aria-label={`Event: ${event.title} at ${eventTime} for ${duration}`}
          sx={{
            '&:focus': {
              backgroundColor: 'action.hover',
              outline: `2px solid ${theme => theme.palette.primary.main}`,
              outlineOffset: '-2px',
            },
            '&:hover': {
              backgroundColor: 'action.hover',
            }
          }}
          secondaryAction={
            <Box aria-label="Event actions">
              <Tooltip title="Edit event (Enter)">
                <IconButton 
                  edge="end" 
                  aria-label={`edit ${event.title}`}
                  onClick={() => onEditEvent(event)}
                  disabled={deleting}
                  tabIndex={-1}
                >
                  <EditIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete event (Delete)">
                <IconButton 
                  edge="end" 
                  aria-label={`delete ${event.title}`}
                  onClick={() => handleDeleteClick(event)}
                  disabled={deleting}
                  tabIndex={-1}
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
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
  };

  return (
    <>
      <Paper 
        elevation={3} 
        sx={{ p: 2, mb: 3 }}
        ref={listRef}
        role="region"
        aria-label="Event list"
        id="event-list"
      >
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
              <>
                <Typography 
                  variant="srOnly" 
                  component="div"
                  aria-live="polite"
                  aria-atomic="true"
                  sx={{ 
                    position: 'absolute', 
                    left: '-9999px',
                    width: '1px',
                    height: '1px',
                    overflow: 'hidden'
                  }}
                >
                  {`${displayEvents.length} event${displayEvents.length > 1 ? 's' : ''} found. Use arrow keys to navigate.`}
                </Typography>
                {/* Use virtualization for lists with more than 20 items */}
                {displayEvents.length > 20 ? (
                  <Suspense fallback={
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                      <CircularProgress />
                    </Box>
                  }>
                    <VirtualizedEventList
                      events={displayEvents}
                      onEditEvent={onEditEvent}
                      onDeleteClick={handleDeleteClick}
                      deleting={deleting}
                      focusedEventIndex={focusedEventIndex}
                      setFocusedEventIndex={setFocusedEventIndex}
                      viewMode={viewMode}
                    />
                  </Suspense>
                ) : (
                  <List role="list" aria-label={`Events for ${selectedDate?.toLocaleDateString() || 'search results'}`}>
                    {displayEvents.map((event, index) => renderEventItem(event, index))}
                  </List>
                )}
              </>
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