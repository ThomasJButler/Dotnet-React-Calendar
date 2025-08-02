import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EventList from './EventList';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// Mock the EventContext hook
jest.mock('../context/EventContext', () => ({
  useEvents: jest.fn()
}));

// Get the mocked useEvents function
const useEvents = require('../context/EventContext').useEvents;

describe('EventList Component', () => {
  const mockOnEditEvent = jest.fn();
  const theme = createTheme();
  
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
    },
    {
      id: 3,
      title: 'Evening Event',
      date: '2025-03-19T00:00:00.000Z',
      time: '19:00',
      duration: 120,
      description: 'Networking event'
    }
  ];
  
  // Mock delete event function
  const mockDeleteEvent = jest.fn().mockResolvedValue(true);
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset default mock implementation
    useEvents.mockReturnValue({
      events: defaultEvents,
      deleteEvent: mockDeleteEvent
    });
  });
  
  // Helper function to render component with Theme
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

  test('renders events for selected date', () => {
    // Render with March 19, 2025
    renderWithTheme(new Date(2025, 2, 19));
    
    // Should display both events for March 19
    expect(screen.getByText('Dentist Appointment')).toBeInTheDocument();
    expect(screen.getByText('Evening Event')).toBeInTheDocument();
    expect(screen.getByText('Regular checkup')).toBeInTheDocument();
    expect(screen.getByText('Networking event')).toBeInTheDocument();
    
    // The March 15 event should not be shown
    expect(screen.queryByText('Team Meeting')).not.toBeInTheDocument();
  });

  test('renders no events message when no events for selected date', () => {
    // Render with date that has no events
    renderWithTheme(new Date(2025, 2, 20));
    
    // Should show no events message
    expect(screen.getByText('No events scheduled for this day.')).toBeInTheDocument();
  });

  test('formats duration correctly', () => {
    renderWithTheme(new Date(2025, 2, 19));
    
    // 45 minute event
    expect(screen.getByText('14:30 (45min)')).toBeInTheDocument();
    
    // 2 hour event
    expect(screen.getByText('19:00 (2h)')).toBeInTheDocument();
  });

  test('calls onEditEvent when edit button is clicked', () => {
    renderWithTheme(new Date(2025, 2, 19));
    
    // Find all edit buttons
    const editButtons = screen.getAllByLabelText('edit');
    
    // Click the first edit button
    fireEvent.click(editButtons[0]);
    
    // Check if onEditEvent was called with the correct event
    expect(mockOnEditEvent).toHaveBeenCalledTimes(1);
    expect(mockOnEditEvent).toHaveBeenCalledWith(expect.objectContaining({
      id: 2, // The Dentist Appointment event (filtered by date)
      title: 'Dentist Appointment'
    }));
  });

  test('shows delete confirmation dialog when delete button is clicked', () => {
    renderWithTheme(new Date(2025, 2, 19));
    
    // Find delete buttons
    const deleteButtons = screen.getAllByLabelText('delete');
    
    // Click the first delete button
    fireEvent.click(deleteButtons[0]);
    
    // Check if confirmation dialog is shown
    expect(screen.getByText('Delete Event')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete "Dentist Appointment"/)).toBeInTheDocument();
  });

  test('closes delete dialog when cancel is clicked', async () => {
    renderWithTheme(new Date(2025, 2, 19));
    
    // Open delete dialog
    const deleteButtons = screen.getAllByLabelText('delete');
    fireEvent.click(deleteButtons[0]);
    
    // Cancel deletion
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelButton);
    
    // Dialog should be closed (need to use waitFor for async state updates)
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  test('calls deleteEvent when deletion is confirmed', async () => {
    renderWithTheme(new Date(2025, 2, 19));
    
    // Open delete dialog
    const deleteButtons = screen.getAllByLabelText('delete');
    fireEvent.click(deleteButtons[0]);
    
    // Confirm deletion
    const confirmButton = screen.getByRole('button', { name: 'Delete' });
    fireEvent.click(confirmButton);
    
    // Check if deleteEvent was called
    await waitFor(() => {
      expect(mockDeleteEvent).toHaveBeenCalled();
    });
    
    // Verify it was called with correct ID (separate assertion)
    expect(mockDeleteEvent).toHaveBeenCalledWith(2); // ID of the Dentist Appointment
  });

  test('handles event without time correctly', () => {
    // Override mock to include an event without time
    useEvents.mockReturnValue({
      events: [
        {
          id: 4,
          title: 'All Day Event',
          date: '2025-03-21T00:00:00.000Z',
          duration: 480,
          description: 'Full day activity'
        }
      ],
      deleteEvent: mockDeleteEvent
    });
    
    renderWithTheme(new Date(2025, 2, 21));
    
    // Should display the event with just duration
    expect(screen.getByText('All Day Event')).toBeInTheDocument();
    expect(screen.getByText('8h')).toBeInTheDocument();
  });

  test('handles event without duration correctly', () => {
    // Override mock to include an event without duration
    useEvents.mockReturnValue({
      events: [
        {
          id: 5,
          title: 'Quick Catch-up',
          date: '2025-03-21T00:00:00.000Z',
          time: '11:00',
          description: 'Brief team sync'
          // No duration specified
        }
      ],
      deleteEvent: mockDeleteEvent
    });
    
    renderWithTheme(new Date(2025, 2, 21));
    
    // Should display the event with just time but no duration
    expect(screen.getByText('Quick Catch-up')).toBeInTheDocument();
    expect(screen.getByText('11:00')).toBeInTheDocument();
  });
});
