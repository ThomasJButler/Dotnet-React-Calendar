import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EventForm from './EventForm';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import EventService from '../services/eventService';

// Mock the EventContext
jest.mock('../context/EventContext', () => ({
  useEvents: () => ({
    addEvent: jest.fn().mockResolvedValue({ id: 1, title: 'Test Event' }),
    updateEvent: jest.fn().mockResolvedValue({ id: 1, title: 'Updated Event' })
  })
}));

// Mock EventService for overlap checking
jest.mock('../services/eventService', () => ({
  checkEventOverlap: jest.fn().mockResolvedValue(false)
}));

describe('EventForm Component', () => {
  const mockHandleClose = jest.fn();
  const mockEvent = {
    id: 1,
    title: 'Test Event',
    date: '2025-03-15T00:00:00.000Z',
    time: '10:00',
    description: 'Test description'
  };
  const theme = createTheme();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper function to render EventForm with ThemeProvider
  const renderEventForm = (props) => {
    return render(
      <div data-testid="test-container">
        <ThemeProvider theme={theme}>
          <EventForm {...props} />
        </ThemeProvider>
      </div>
    );
  };

  test('renders form correctly for adding new event', () => {
    renderEventForm({
      open: true,
      handleClose: mockHandleClose,
      event: null,
      isEditing: false
    });
    
    expect(screen.getByText('Add New Event')).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toBeInTheDocument();
    expect(screen.getByLabelText('Date')).toBeInTheDocument();
    expect(screen.getByLabelText('Time')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  test('renders form correctly for editing an event', () => {
    renderEventForm({
      open: true,
      handleClose: mockHandleClose,
      event: mockEvent,
      isEditing: true
    });
    
    expect(screen.getByText('Edit Event')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Event')).toBeInTheDocument();
    expect(screen.getByText('Update')).toBeInTheDocument();
  });

  test('validates form fields', async () => {
    renderEventForm({
      open: true,
      handleClose: mockHandleClose,
      event: null,
      isEditing: false
    });
    
    // Clear title field and submit
    const titleInput = screen.getByLabelText('Title');
    fireEvent.change(titleInput, { target: { value: '' } });
    
    // Try to submit the form
    const submitButton = screen.getByRole('button', { name: 'Add' });
    fireEvent.click(submitButton);
    
    // Check for validation error
    await waitFor(() => {
      expect(screen.getByText('Title is required')).toBeInTheDocument();
    });
  });

  test('calls event service when checking for overlap', async () => {
    renderEventForm({
      open: true,
      handleClose: mockHandleClose,
      event: null,
      isEditing: false
    });
    
    // Fill in form
    const titleInput = screen.getByLabelText('Title');
    fireEvent.change(titleInput, { target: { value: 'New Test Event' } });
    
    // Try to submit the form
    const submitButton = screen.getByRole('button', { name: 'Add' });
    fireEvent.click(submitButton);
    
    // Check if overlap checking was called
    await waitFor(() => {
      expect(EventService.checkEventOverlap).toHaveBeenCalled();
    });
  });

  test('closes form when cancelled', () => {
    renderEventForm({
      open: true,
      handleClose: mockHandleClose,
      event: null,
      isEditing: false
    });
    
    // Click cancel button
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelButton);
    
    // Check if handleClose was called
    expect(mockHandleClose).toHaveBeenCalledTimes(1);
  });

  test('shows overlap error when events overlap', async () => {
    // Mock overlap detection
    EventService.checkEventOverlap.mockResolvedValueOnce(true);
    
    renderEventForm({
      open: true,
      handleClose: mockHandleClose,
      event: null,
      isEditing: false
    });
    
    // Fill in form
    const titleInput = screen.getByLabelText('Title');
    fireEvent.change(titleInput, { target: { value: 'Overlapping Event' } });
    
    // Try to submit the form
    const submitButton = screen.getByRole('button', { name: 'Add' });
    fireEvent.click(submitButton);
    
    // Check for overlap error
    await waitFor(() => {
      expect(screen.getByText(/overlaps with an existing event/i)).toBeInTheDocument();
    });
  });

  test('renders UK date format correctly', () => {
    const testDate = new Date(2025, 2, 15); // March 15, 2025
    
    renderEventForm({
      open: true,
      handleClose: mockHandleClose,
      event: {
        ...mockEvent,
        date: testDate.toISOString()
      },
      isEditing: true
    });
    
    // Check for UK date format
    expect(screen.getByText(/15th March 2025/i)).toBeInTheDocument();
  });
});
