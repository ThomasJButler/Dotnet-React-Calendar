import React from 'react';
import { render, screen } from '@testing-library/react';
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
  return function MockCalendar() {
    return <div data-testid="mock-calendar">Calendar Component</div>;
  };
});

jest.mock('./components/EventList', () => {
  return function MockEventList() {
    return <div data-testid="mock-event-list">Event List Component</div>;
  };
});

jest.mock('./components/EventForm', () => {
  return function MockEventForm() {
    return <div data-testid="mock-event-form">Event Form Component</div>;
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
  });

  test('renders add event button', () => {
    render(<App />);
    const addButton = screen.getByText(/Add Event/i);
    expect(addButton).toBeInTheDocument();
  });
});
