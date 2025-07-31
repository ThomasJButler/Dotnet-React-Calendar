import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import EventSearch from './EventSearch';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// Mock the contexts and hooks
jest.mock('../context/EventContext', () => ({
  useEvents: jest.fn()
}));

jest.mock('../hooks', () => ({
  useDebounce: jest.fn((value) => value), // Return value immediately for tests
  useLocalStorage: jest.fn()
}));

// Get the mocked functions
const useEvents = require('../context/EventContext').useEvents;
const { useDebounce, useLocalStorage } = require('../hooks');

describe('EventSearch Component', () => {
  const theme = createTheme();
  
  const mockSearchEvents = jest.fn();
  const mockClearSearch = jest.fn();
  const mockIsLoading = jest.fn();
  
  const mockSearchResults = {
    data: [
      {
        id: 1,
        title: 'Found Event',
        date: '2025-03-20T00:00:00.000Z',
        time: '15:00',
        duration: 90
      }
    ],
    totalCount: 1,
    page: 1,
    totalPages: 1
  };
  
  const mockSetSearchHistory = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset default mock implementations
    useEvents.mockReturnValue({
      searchEvents: mockSearchEvents,
      searchResults: null,
      isLoading: mockIsLoading,
      clearSearch: mockClearSearch
    });
    
    useLocalStorage.mockReturnValue([[], mockSetSearchHistory]);
    mockIsLoading.mockReturnValue(false);
  });
  
  const renderWithTheme = () => {
    return render(
      <ThemeProvider theme={theme}>
        <EventSearch />
      </ThemeProvider>
    );
  };

  test('renders search input field', () => {
    renderWithTheme();
    
    const searchInput = screen.getByPlaceholderText('Search events by title or description...');
    expect(searchInput).toBeInTheDocument();
  });

  test('toggles filter panel when filter button is clicked', () => {
    renderWithTheme();
    
    // Find filter button by looking for the icon button
    const filterButton = screen.getByRole('button', { name: /filter/i });
    
    // Initially filters should not be visible
    expect(screen.queryByLabelText('Start Date')).not.toBeInTheDocument();
    
    // Click filter button
    fireEvent.click(filterButton);
    
    // Filters should now be visible
    expect(screen.getByLabelText('Start Date')).toBeInTheDocument();
    expect(screen.getByLabelText('End Date')).toBeInTheDocument();
    expect(screen.getByLabelText('Time of Day')).toBeInTheDocument();
  });

  test('performs search when query is entered', async () => {
    renderWithTheme();
    
    const searchInput = screen.getByPlaceholderText('Search events by title or description...');
    
    // Type in search
    fireEvent.change(searchInput, { target: { value: 'meeting' } });
    
    // Search should be triggered (with debounced value)
    await waitFor(() => {
      expect(mockSearchEvents).toHaveBeenCalledWith(expect.objectContaining({
        query: 'meeting',
        page: 1,
        pageSize: 20
      }));
    });
  });

  test('displays search history when input is empty', () => {
    useLocalStorage.mockReturnValue([
      ['previous search', 'another search'],
      mockSetSearchHistory
    ]);
    
    renderWithTheme();
    
    // Should show search history
    expect(screen.getByText('Recent searches')).toBeInTheDocument();
    expect(screen.getByText('previous search')).toBeInTheDocument();
    expect(screen.getByText('another search')).toBeInTheDocument();
  });

  test('adds to search history when searching', async () => {
    renderWithTheme();
    
    const searchInput = screen.getByPlaceholderText('Search events by title or description...');
    
    // Type and search
    fireEvent.change(searchInput, { target: { value: 'new search' } });
    
    await waitFor(() => {
      expect(mockSetSearchHistory).toHaveBeenCalledWith(
        expect.arrayContaining(['new search'])
      );
    });
  });

  test('applies date range filter', async () => {
    renderWithTheme();
    
    // Open filters
    const filterButton = screen.getByRole('button', { name: /filter/i });
    fireEvent.click(filterButton);
    
    // Set start date
    const startDateInput = screen.getByLabelText('Start Date');
    fireEvent.change(startDateInput, { target: { value: '03/01/2025' } });
    
    // Set end date
    const endDateInput = screen.getByLabelText('End Date');
    fireEvent.change(endDateInput, { target: { value: '03/31/2025' } });
    
    // Search should be triggered with date filters
    await waitFor(() => {
      expect(mockSearchEvents).toHaveBeenCalledWith(expect.objectContaining({
        startDate: expect.any(Date),
        endDate: expect.any(Date)
      }));
    });
  });

  test('applies time of day filter', async () => {
    renderWithTheme();
    
    // Open filters
    const filterButton = screen.getByRole('button', { name: /filter/i });
    fireEvent.click(filterButton);
    
    // Open time of day dropdown
    const timeOfDayButton = screen.getByLabelText('Time of Day');
    fireEvent.mouseDown(timeOfDayButton);
    
    // Select morning option
    const morningOption = screen.getByRole('option', { name: 'Morning (6AM - 12PM)' });
    fireEvent.click(morningOption);
    
    // Search should be triggered with time filter
    await waitFor(() => {
      expect(mockSearchEvents).toHaveBeenCalledWith(expect.objectContaining({
        timeOfDay: 'morning'
      }));
    });
  });

  test('clears all filters and search', async () => {
    renderWithTheme();
    
    // Enter search query
    const searchInput = screen.getByPlaceholderText('Search events by title or description...');
    fireEvent.change(searchInput, { target: { value: 'test' } });
    
    // Clear button should appear
    await waitFor(() => {
      const clearButton = screen.getByRole('button', { name: /clear/i });
      expect(clearButton).toBeInTheDocument();
      
      // Click clear
      fireEvent.click(clearButton);
    });
    
    // Should clear search
    expect(mockClearSearch).toHaveBeenCalled();
    expect(searchInput).toHaveValue('');
  });

  test('shows loading state during search', () => {
    mockIsLoading.mockImplementation((operation) => operation === 'search');
    
    renderWithTheme();
    
    // Should show skeleton loader
    const skeletons = document.querySelectorAll('.MuiSkeleton-root');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  test('displays search results summary', () => {
    useEvents.mockReturnValue({
      searchEvents: mockSearchEvents,
      searchResults: mockSearchResults,
      isLoading: mockIsLoading,
      clearSearch: mockClearSearch
    });
    
    renderWithTheme();
    
    // Should show results count
    expect(screen.getByText('Found 1 events')).toBeInTheDocument();
  });

  test('shows active filter chips', async () => {
    renderWithTheme();
    
    // Open filters
    const filterButton = screen.getByRole('button', { name: /filter/i });
    fireEvent.click(filterButton);
    
    // Select time of day
    const timeOfDayButton = screen.getByLabelText('Time of Day');
    fireEvent.mouseDown(timeOfDayButton);
    const morningOption = screen.getByRole('option', { name: 'Morning (6AM - 12PM)' });
    fireEvent.click(morningOption);
    
    // Should show filter chip
    await waitFor(() => {
      expect(screen.getByText('Time: morning')).toBeInTheDocument();
    });
  });

  test('removes individual filter when chip is deleted', async () => {
    renderWithTheme();
    
    // Open filters and add time filter
    const filterButton = screen.getByRole('button', { name: /filter/i });
    fireEvent.click(filterButton);
    
    const timeOfDayButton = screen.getByLabelText('Time of Day');
    fireEvent.mouseDown(timeOfDayButton);
    const morningOption = screen.getByRole('option', { name: 'Morning (6AM - 12PM)' });
    fireEvent.click(morningOption);
    
    // Wait for chip to appear
    await waitFor(() => {
      const chip = screen.getByText('Time: morning');
      expect(chip).toBeInTheDocument();
      
      // Find and click the delete button on the chip
      const deleteButton = chip.closest('.MuiChip-root').querySelector('svg[data-testid="CancelIcon"]');
      fireEvent.click(deleteButton);
    });
    
    // Should trigger new search without time filter
    await waitFor(() => {
      const lastCall = mockSearchEvents.mock.calls[mockSearchEvents.mock.calls.length - 1][0];
      expect(lastCall.timeOfDay).toBe('');
    });
  });

  test('duration slider updates search parameters', async () => {
    renderWithTheme();
    
    // Open filters
    const filterButton = screen.getByRole('button', { name: /filter/i });
    fireEvent.click(filterButton);
    
    // Find duration slider
    const slider = screen.getByRole('slider');
    
    // Change slider value
    fireEvent.change(slider, { target: { value: [30, 240] } });
    
    // Should trigger search with duration filters
    await waitFor(() => {
      expect(mockSearchEvents).toHaveBeenCalledWith(expect.objectContaining({
        minDuration: 30,
        maxDuration: 240
      }));
    });
  });
});