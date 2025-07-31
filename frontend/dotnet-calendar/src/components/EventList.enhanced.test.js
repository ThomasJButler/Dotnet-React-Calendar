import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EventList from './EventList';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// Mock the contexts
jest.mock('../context/EventContext', () => ({
  useEvents: jest.fn()
}));

jest.mock('../context/AppContext', () => ({
  useApp: jest.fn()
}));

// Get the mocked functions
const useEvents = require('../context/EventContext').useEvents;
const useApp = require('../context/AppContext').useApp;

describe('EventList Enhanced Features', () => {
  const mockOnEditEvent = jest.fn();
  const theme = createTheme();
  
  // Mock toast functions
  const mockShowSuccess = jest.fn();
  const mockShowError = jest.fn();
  
  // Default mock data
  const defaultEvents = [
    {
      id: 1,
      title: 'Team Meeting',
      date: '2025-03-15T00:00:00.000Z',
      time: '10:00',
      duration: 60,
      description: 'Weekly sprint planning'
    },
    {
      id: 2,
      title: 'Dentist Appointment',
      date: '2025-03-19T00:00:00.000Z',
      time: '14:30',
      duration: 45,
      description: 'Regular checkup'
    }
  ];
  
  const searchResults = {
    data: [
      {
        id: 3,
        title: 'Search Result Event',
        date: '2025-03-20T00:00:00.000Z',
        time: '15:00',
        duration: 90,
        description: 'Found via search'
      }
    ],
    totalCount: 1,
    page: 1,
    totalPages: 1
  };
  
  const mockDeleteEvent = jest.fn().mockResolvedValue(true);
  const mockIsLoading = jest.fn();
  const mockGetError = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset default mock implementations
    useEvents.mockReturnValue({
      events: defaultEvents,
      deleteEvent: mockDeleteEvent,
      searchResults: null,
      isLoading: mockIsLoading,
      getError: mockGetError
    });
    
    useApp.mockReturnValue({
      showSuccess: mockShowSuccess,
      showError: mockShowError
    });
    
    mockIsLoading.mockReturnValue(false);
    mockGetError.mockReturnValue(null);
  });
  
  const renderWithTheme = (selectedDate) => {
    return render(
      <ThemeProvider theme={theme}>
        <EventList 
          selectedDate={selectedDate} 
          onEditEvent={mockOnEditEvent} 
        />
      </ThemeProvider>
    );
  };

  test('shows loading skeleton when loading', () => {
    mockIsLoading.mockImplementation((operation) => operation === 'fetch' ? true : false);
    
    renderWithTheme(new Date(2025, 2, 19));
    
    // Should show skeleton loader
    expect(screen.queryByText('Dentist Appointment')).not.toBeInTheDocument();
    // Look for skeleton elements (they have specific structure)
    const skeletons = document.querySelectorAll('.MuiSkeleton-root');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  test('displays error message when fetch fails', () => {
    mockGetError.mockImplementation((operation) => 
      operation === 'fetch' ? 'Failed to load events' : null
    );
    
    renderWithTheme(new Date(2025, 2, 19));
    
    // Should show error alert
    expect(screen.getByText('Failed to load events')).toBeInTheDocument();
  });

  test('shows search results with tabs when available', () => {
    useEvents.mockReturnValue({
      events: defaultEvents,
      deleteEvent: mockDeleteEvent,
      searchResults: searchResults,
      isLoading: mockIsLoading,
      getError: mockGetError
    });
    
    renderWithTheme(new Date(2025, 2, 19));
    
    // Should show tabs
    expect(screen.getByText('Selected Date')).toBeInTheDocument();
    expect(screen.getByText('Search Results (1)')).toBeInTheDocument();
    
    // Should default to search view
    expect(screen.getByText('Search Result Event')).toBeInTheDocument();
  });

  test('switches between date and search views', async () => {
    useEvents.mockReturnValue({
      events: defaultEvents,
      deleteEvent: mockDeleteEvent,
      searchResults: searchResults,
      isLoading: mockIsLoading,
      getError: mockGetError
    });
    
    renderWithTheme(new Date(2025, 2, 19));
    
    // Initially shows search results
    expect(screen.getByText('Search Result Event')).toBeInTheDocument();
    
    // Click on Selected Date tab
    const dateTab = screen.getByText('Selected Date');
    fireEvent.click(dateTab);
    
    // Should show date events
    await waitFor(() => {
      expect(screen.getByText('Dentist Appointment')).toBeInTheDocument();
      expect(screen.queryByText('Search Result Event')).not.toBeInTheDocument();
    });
  });

  test('shows toast notification on successful delete', async () => {
    renderWithTheme(new Date(2025, 2, 19));
    
    // Open delete dialog
    const deleteButtons = screen.getAllByLabelText('delete');
    fireEvent.click(deleteButtons[0]);
    
    // Confirm deletion
    const confirmButton = screen.getByRole('button', { name: 'Delete' });
    fireEvent.click(confirmButton);
    
    await waitFor(() => {
      expect(mockShowSuccess).toHaveBeenCalledWith('Event deleted successfully');
    });
  });

  test('shows toast notification on delete failure', async () => {
    // Make deleteEvent fail
    mockDeleteEvent.mockRejectedValueOnce(new Error('Delete failed'));
    
    renderWithTheme(new Date(2025, 2, 19));
    
    // Open delete dialog
    const deleteButtons = screen.getAllByLabelText('delete');
    fireEvent.click(deleteButtons[0]);
    
    // Confirm deletion
    const confirmButton = screen.getByRole('button', { name: 'Delete' });
    fireEvent.click(confirmButton);
    
    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalledWith('Failed to delete event. Please try again.');
    });
  });

  test('shows optimistic update indicator for temporary events', () => {
    const eventsWithTemp = [
      ...defaultEvents,
      {
        id: 'temp-123',
        title: 'New Event',
        date: '2025-03-19T00:00:00.000Z',
        time: '16:00',
        duration: 60,
        isTemp: true
      }
    ];
    
    useEvents.mockReturnValue({
      events: eventsWithTemp,
      deleteEvent: mockDeleteEvent,
      searchResults: null,
      isLoading: mockIsLoading,
      getError: mockGetError
    });
    
    renderWithTheme(new Date(2025, 2, 19));
    
    // Should show saving indicator
    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });

  test('formats time in 12-hour format', () => {
    renderWithTheme(new Date(2025, 2, 19));
    
    // 14:30 should be displayed as 2:30 PM
    expect(screen.getByText(/2:30 PM/)).toBeInTheDocument();
  });

  test('disables action buttons while deleting', () => {
    mockIsLoading.mockImplementation((operation) => operation === 'delete' ? true : false);
    
    renderWithTheme(new Date(2025, 2, 19));
    
    // All edit and delete buttons should be disabled
    const editButtons = screen.getAllByLabelText('edit');
    const deleteButtons = screen.getAllByLabelText('delete');
    
    editButtons.forEach(button => {
      expect(button).toBeDisabled();
    });
    
    deleteButtons.forEach(button => {
      expect(button).toBeDisabled();
    });
  });

  test('shows delete button as deleting during operation', async () => {
    mockIsLoading.mockImplementation((operation) => operation === 'delete' ? true : false);
    
    renderWithTheme(new Date(2025, 2, 19));
    
    // Open delete dialog
    const deleteButtons = screen.getAllByLabelText('delete');
    fireEvent.click(deleteButtons[0]);
    
    // The confirm button should show "Deleting..."
    const confirmButton = screen.getByRole('button', { name: 'Deleting...' });
    expect(confirmButton).toBeDisabled();
  });
});