import React, { useRef, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import {
  ListItem,
  ListItemText,
  IconButton,
  Typography,
  Box,
  Divider,
  Tooltip,
  Paper,
  useTheme
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { formatTime12Hour, formatDuration as formatDurationUtil } from '../utils/formatters';

/**
 * Virtualized event list component for handling large numbers of events
 * Uses react-window for efficient rendering of only visible items
 */
const VirtualizedEventList = ({
  events,
  onEditEvent,
  onDeleteClick,
  deleting,
  focusedEventIndex,
  setFocusedEventIndex,
  viewMode
}) => {
  const theme = useTheme();
  const listRef = useRef();
  const itemRefs = useRef([]);

  // Row height for list items
  const ITEM_HEIGHT = 100;

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
   * Check if all items are loaded
   */
  const isItemLoaded = useCallback((index) => {
    return index < events.length;
  }, [events.length]);

  /**
   * Load more items (placeholder for future pagination)
   */
  const loadMoreItems = useCallback(() => {
    // This is where we would load more items if implementing pagination
    return Promise.resolve();
  }, []);

  /**
   * Render a single event item
   */
  const renderItem = ({ index, style }) => {
    const event = events[index];
    if (!event) return null;

    const isFocused = focusedEventIndex === index;
    const eventTime = formatTime12Hour(event.startTime || event.time);
    const duration = formatDurationUtil(event.duration);

    return (
      <div style={style}>
        <ListItem
          ref={el => itemRefs.current[index] = el}
          tabIndex={isFocused ? 0 : -1}
          onFocus={() => setFocusedEventIndex(index)}
          role="article"
          aria-label={`Event: ${event.title} at ${eventTime} for ${duration}`}
          sx={{
            '&:focus': {
              backgroundColor: 'action.hover',
              outline: `2px solid ${theme.palette.primary.main}`,
              outlineOffset: '-2px',
            },
            '&:hover': {
              backgroundColor: 'action.hover',
            },
            borderBottom: `1px solid ${theme.palette.divider}`,
            height: ITEM_HEIGHT,
            alignItems: 'flex-start',
            py: 2
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
                  onClick={() => onDeleteClick(event)}
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
                  <Typography 
                    variant="body2" 
                    component="div" 
                    sx={{ 
                      mt: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {event.description}
                  </Typography>
                )}
              </Box>
            }
          />
        </ListItem>
      </div>
    );
  };

  // Calculate list height based on container
  const getListHeight = () => {
    const maxHeight = 600; // Maximum height for the list
    const calculatedHeight = Math.min(events.length * ITEM_HEIGHT, maxHeight);
    return calculatedHeight;
  };

  return (
    <Paper elevation={0} sx={{ height: getListHeight(), overflow: 'hidden' }}>
      <InfiniteLoader
        isItemLoaded={isItemLoaded}
        itemCount={events.length}
        loadMoreItems={loadMoreItems}
      >
        {({ onItemsRendered, ref }) => (
          <List
            ref={(list) => {
              ref(list);
              listRef.current = list;
            }}
            height={getListHeight()}
            itemCount={events.length}
            itemSize={ITEM_HEIGHT}
            onItemsRendered={onItemsRendered}
            overscanCount={5}
            style={{ overflow: 'auto' }}
          >
            {renderItem}
          </List>
        )}
      </InfiniteLoader>
    </Paper>
  );
};

export default VirtualizedEventList;