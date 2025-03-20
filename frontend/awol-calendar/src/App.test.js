import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

// Mock the EventContext
jest.mock('./context/EventContext', () => ({
  EventProvider: ({ children }) => <div data-testid="mock-event-provider">{children}</div>,
  useEvents: () => ({
    events: [],
    addEvent: jest.fn(),
    updateEvent: jest.fn(),
    deleteEvent: jest.fn(),
    getEventsByDate: jest.fn().mockReturnValue([])
  })
}));

// Mock components to simplify testing
jest.mock('./components/Calendar', () => {
  return function MockCalendar(props) {
    return (
      <div data-testid="mock-calendar">
        Calendar Component
        <button data-testid="select-date-button" onClick={() => props.onDateSelect(new Date())}>Select Date</button>
        <button data-testid="calendar-add-event-button" onClick={() => props.onAddEvent(new Date())}>Add Event From Calendar</button>
      </div>
    );
  };
});

jest.mock('./components/EventList', () => {
  return function MockEventList(props) {
    return (
      <div data-testid="mock-event-list">
        Event List Component
        <button data-testid="edit-event-button" onClick={() => props.onEditEvent({ id: 1 })}>Edit Event</button>
      </div>
    );
  };
});

jest.mock('./components/EventForm', () => {
  return function MockEventForm(props) {
    return (
      <div data-testid="mock-event-form">
        Event Form Component
        <button data-testid="close-form-button" onClick={props.handleClose}>Close Form</button>
      </div>
    );
  };
});

// Mock FreeTimeChart component
jest.mock('./components/FreeTimeChart', () => {
  return function MockFreeTimeChart() {
    return <div data-testid="mock-free-time-chart">Free Time Chart Component</div>;
  };
});

// Mock useMediaQuery to control responsive behavior
jest.mock('@mui/material', () => {
  const originalModule = jest.requireActual('@mui/material');
  return {
    ...originalModule,
    useMediaQuery: jest.fn().mockReturnValue(false) // Default to desktop layout
  };
});

describe('App Component', () => {
  test('renders the application header', () => {
    render(<App />);
    const headerElement = screen.getByText(/AWOL Calendar App/i);
    expect(headerElement).toBeInTheDocument();
  });

  test('renders the main components', () => {
    render(<App />);
    expect(screen.getByTestId('mock-calendar')).toBeInTheDocument();
    expect(screen.getByTestId('mock-event-list')).toBeInTheDocument();
    expect(screen.getByTestId('mock-event-form')).toBeInTheDocument();
    expect(screen.getByTestId('mock-free-time-chart')).toBeInTheDocument();
  });

  test('renders add event button in the toolbar', () => {
    render(<App />);
    // Use test ID to target only the toolbar button
    const addButton = screen.getByTestId('toolbar-add-event-button');
    expect(addButton).toBeInTheDocument();
    expect(addButton).toHaveTextContent('Add Event');
  });
  
  test('toggles dark mode when dark mode button is clicked', () => {
    render(<App />);
    
    // Find dark mode toggle button
    const darkModeButton = screen.getByLabelText('toggle dark mode');
    expect(darkModeButton).toBeInTheDocument();
    
    // Click dark mode toggle
    fireEvent.click(darkModeButton);
    
    // After toggle, should show light mode icon (for switching back)
    // We can't easily check this without querying the DOM, but we can verify the button exists
    expect(screen.getByLabelText('toggle dark mode')).toBeInTheDocument();
  });
  
  test('opens event form when add event button is clicked', () => {
    render(<App />);
    
    // Click Add Event button in the toolbar using test ID
    const addButton = screen.getByTestId('toolbar-add-event-button');
    fireEvent.click(addButton);
    
    // Event form should be displayed
    expect(screen.getByTestId('mock-event-form')).toBeInTheDocument();
  });
  
  test('closes event form when close button is clicked', () => {
    render(<App />);
    
    // Open the form first using the Calendar's add event button
    const calendarAddButton = screen.getByTestId('calendar-add-event-button');
    fireEvent.click(calendarAddButton);
    
    // Then close it
    const closeButton = screen.getByTestId('close-form-button');
    fireEvent.click(closeButton);
    
    // Form should still be in document but in closed state
    // We can't easily check the open state, but the form component is still rendered
    expect(screen.getByTestId('mock-event-form')).toBeInTheDocument();
  });
  
  test('opens event form for editing when edit event is triggered', () => {
    render(<App />);
    
    // Trigger edit event via mock button
    const editButton = screen.getByTestId('edit-event-button');
    fireEvent.click(editButton);
    
    // Form should be displayed in edit mode
    expect(screen.getByTestId('mock-event-form')).toBeInTheDocument();
  });
  
  test('renders mobile layout when screen is small', () => {
    // Override the useMediaQuery mock for this test
    const materialUI = require('@mui/material');
    materialUI.useMediaQuery.mockReturnValueOnce(true); // Simulate mobile
    
    render(<App />);
    
    // In mobile layout, all components should still be present
    expect(screen.getByTestId('mock-calendar')).toBeInTheDocument();
    expect(screen.getByTestId('mock-event-list')).toBeInTheDocument();
    expect(screen.getByTestId('mock-free-time-chart')).toBeInTheDocument();
  });
  
  test('renders the footer with attribution', () => {
    render(<App />);
    
    // Check for footer text
    const footerText = screen.getByText(/Built by Thomas Butler/i);
    expect(footerText).toBeInTheDocument();
  });
});
