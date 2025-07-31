import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Paper,
  Chip,
  IconButton,
  Collapse,
  Button,
  Grid,
  Typography,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Slider,
  Divider,
  InputAdornment
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  CalendarMonth as CalendarIcon,
  AccessTime as TimeIcon,
  Sort as SortIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useEvents } from '../context/EventContext';
import { useDebounce, useLocalStorage } from '../hooks';
import LoadingSpinner from './common/LoadingSpinner';
import SkeletonLoader from './common/SkeletonLoader';

/**
 * EventSearch component with advanced filtering capabilities
 */
const EventSearch = () => {
  const { searchEvents, searchResults, isLoading, clearSearch } = useEvents();
  const [searchHistory, setSearchHistory] = useLocalStorage('eventSearchHistory', []);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    timeOfDay: '',
    minDuration: 0,
    maxDuration: 480, // 8 hours max
    sortBy: 'date',
    sortDescending: false
  });
  
  // Debounced search query
  const debouncedQuery = useDebounce(searchQuery, 300);
  
  // Loading state
  const loading = isLoading('search');
  
  // Perform search when query or filters change
  useEffect(() => {
    if (debouncedQuery || hasActiveFilters()) {
      performSearch();
    }
  }, [debouncedQuery, filters]);
  
  // Check if any filters are active
  const hasActiveFilters = () => {
    return filters.startDate || filters.endDate || filters.timeOfDay || 
           filters.minDuration > 0 || filters.maxDuration < 480;
  };
  
  // Perform the search
  const performSearch = async () => {
    const searchParams = {
      query: debouncedQuery,
      startDate: filters.startDate,
      endDate: filters.endDate,
      timeOfDay: filters.timeOfDay,
      minDuration: filters.minDuration > 0 ? filters.minDuration : undefined,
      maxDuration: filters.maxDuration < 480 ? filters.maxDuration : undefined,
      sortBy: filters.sortBy,
      sortDescending: filters.sortDescending,
      page: 1,
      pageSize: 20
    };
    
    await searchEvents(searchParams);
    
    // Add to search history if query exists
    if (debouncedQuery && !searchHistory.includes(debouncedQuery)) {
      const updatedHistory = [debouncedQuery, ...searchHistory.slice(0, 9)];
      setSearchHistory(updatedHistory);
    }
  };
  
  // Clear all filters and search
  const handleClearAll = () => {
    setSearchQuery('');
    setFilters({
      startDate: null,
      endDate: null,
      timeOfDay: '',
      minDuration: 0,
      maxDuration: 480,
      sortBy: 'date',
      sortDescending: false
    });
    clearSearch();
  };
  
  // Handle search history click
  const handleHistoryClick = (query) => {
    setSearchQuery(query);
  };
  
  // Remove item from search history
  const removeFromHistory = (query) => {
    setSearchHistory(searchHistory.filter(item => item !== query));
  };
  
  // Format duration for display
  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };
  
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Paper elevation={2} sx={{ p: 3 }}>
        {/* Search Input */}
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search events by title or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                {(searchQuery || hasActiveFilters()) && (
                  <IconButton onClick={handleClearAll} size="small">
                    <ClearIcon />
                  </IconButton>
                )}
                <IconButton 
                  onClick={() => setShowFilters(!showFilters)} 
                  size="small"
                  color={hasActiveFilters() ? 'primary' : 'default'}
                >
                  <FilterIcon />
                </IconButton>
              </InputAdornment>
            )
          }}
        />
        
        {/* Search History */}
        {!searchQuery && searchHistory.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Recent searches
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
              {searchHistory.map((query) => (
                <Chip
                  key={query}
                  label={query}
                  size="small"
                  onClick={() => handleHistoryClick(query)}
                  onDelete={() => removeFromHistory(query)}
                />
              ))}
            </Box>
          </Box>
        )}
        
        {/* Advanced Filters */}
        <Collapse in={showFilters}>
          <Divider sx={{ my: 2 }} />
          <Grid container spacing={2}>
            {/* Date Range */}
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="Start Date"
                value={filters.startDate}
                onChange={(date) => setFilters({ ...filters, startDate: date })}
                slotProps={{ 
                  textField: { 
                    fullWidth: true,
                    InputProps: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <CalendarIcon />
                        </InputAdornment>
                      )
                    }
                  } 
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="End Date"
                value={filters.endDate}
                onChange={(date) => setFilters({ ...filters, endDate: date })}
                minDate={filters.startDate}
                slotProps={{ 
                  textField: { 
                    fullWidth: true,
                    InputProps: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <CalendarIcon />
                        </InputAdornment>
                      )
                    }
                  } 
                }}
              />
            </Grid>
            
            {/* Time of Day */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Time of Day</InputLabel>
                <Select
                  value={filters.timeOfDay}
                  onChange={(e) => setFilters({ ...filters, timeOfDay: e.target.value })}
                  label="Time of Day"
                  startAdornment={
                    <InputAdornment position="start">
                      <TimeIcon />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="">All Day</MenuItem>
                  <MenuItem value="morning">Morning (6AM - 12PM)</MenuItem>
                  <MenuItem value="afternoon">Afternoon (12PM - 6PM)</MenuItem>
                  <MenuItem value="evening">Evening (6PM - 12AM)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {/* Sort Options */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={filters.sortBy}
                  onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                  label="Sort By"
                  startAdornment={
                    <InputAdornment position="start">
                      <SortIcon />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="date">Date</MenuItem>
                  <MenuItem value="title">Title</MenuItem>
                  <MenuItem value="duration">Duration</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {/* Duration Range */}
            <Grid item xs={12}>
              <Typography gutterBottom>
                Duration Range: {formatDuration(filters.minDuration)} - {formatDuration(filters.maxDuration)}
              </Typography>
              <Slider
                value={[filters.minDuration, filters.maxDuration]}
                onChange={(e, newValue) => setFilters({ 
                  ...filters, 
                  minDuration: newValue[0], 
                  maxDuration: newValue[1] 
                })}
                valueLabelDisplay="auto"
                valueLabelFormat={formatDuration}
                min={0}
                max={480}
                step={15}
                marks={[
                  { value: 0, label: '0' },
                  { value: 120, label: '2h' },
                  { value: 240, label: '4h' },
                  { value: 360, label: '6h' },
                  { value: 480, label: '8h' }
                ]}
              />
            </Grid>
            
            {/* Sort Direction */}
            <Grid item xs={12}>
              <Button
                variant="outlined"
                onClick={() => setFilters({ ...filters, sortDescending: !filters.sortDescending })}
                startIcon={<SortIcon style={{ transform: filters.sortDescending ? 'scaleY(-1)' : 'none' }} />}
              >
                {filters.sortDescending ? 'Descending' : 'Ascending'}
              </Button>
            </Grid>
          </Grid>
        </Collapse>
        
        {/* Active Filters Display */}
        {hasActiveFilters() && (
          <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {filters.startDate && (
              <Chip
                label={`From: ${filters.startDate.toLocaleDateString()}`}
                onDelete={() => setFilters({ ...filters, startDate: null })}
                size="small"
              />
            )}
            {filters.endDate && (
              <Chip
                label={`To: ${filters.endDate.toLocaleDateString()}`}
                onDelete={() => setFilters({ ...filters, endDate: null })}
                size="small"
              />
            )}
            {filters.timeOfDay && (
              <Chip
                label={`Time: ${filters.timeOfDay}`}
                onDelete={() => setFilters({ ...filters, timeOfDay: '' })}
                size="small"
              />
            )}
            {(filters.minDuration > 0 || filters.maxDuration < 480) && (
              <Chip
                label={`Duration: ${formatDuration(filters.minDuration)}-${formatDuration(filters.maxDuration)}`}
                onDelete={() => setFilters({ ...filters, minDuration: 0, maxDuration: 480 })}
                size="small"
              />
            )}
          </Box>
        )}
        
        {/* Search Results Summary */}
        {searchResults && !loading && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Found {searchResults.totalCount || 0} events
              {searchQuery && ` matching "${searchQuery}"`}
            </Typography>
          </Box>
        )}
        
        {/* Loading State */}
        {loading && (
          <Box sx={{ mt: 2 }}>
            <SkeletonLoader variant="search" />
          </Box>
        )}
      </Paper>
    </LocalizationProvider>
  );
};

// Memoize the EventSearch component to prevent unnecessary re-renders
export default React.memo(EventSearch);