import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import FreeTimeChart from './FreeTimeChart';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// Mock the EventContext hook
jest.mock('../context/EventContext', () => ({
  useEvents: jest.fn()
}));

// Get the mocked useEvents function
const useEvents = require('../context/EventContext').useEvents;

// Mock the recharts components to avoid rendering issues in tests
jest.mock('recharts', () => {
  const OriginalModule = jest.requireActual('recharts');
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }) => <div data-testid="mock-responsive-container">{children}</div>,
    PieChart: ({ children }) => <div data-testid="mock-pie-chart">{children}</div>,
    Pie: ({ children }) => <div data-testid="mock-pie">{children}</div>,
    Cell: () => <div data-testid="mock-cell" />,
    Tooltip: () => <div data-testid="mock-tooltip" />,
    Legend: () => <div data-testid="mock-legend" />
  };
});

describe('FreeTimeChart Component', () => {
  // Create theme for ThemeProvider
  const theme = createTheme({
    palette: {
      primary: { main: '#1976d2' },
      error: { main: '#d32f2f' }
    }
  });
  
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Default mock implementation - empty events array
    useEvents.mockReturnValue({ events: [] });
  });
  
  test('renders the free time chart correctly', () => {
    render(
      <ThemeProvider theme={theme}>
        <FreeTimeChart selectedDate={new Date(2025, 2, 19)} />
      </ThemeProvider>
    );
    
    // Check for title and chart components
    expect(screen.getByText('Free Time Analysis')).toBeInTheDocument();
    expect(screen.getByTestId('mock-responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('mock-pie-chart')).toBeInTheDocument();
    expect(screen.getByTestId('mock-pie')).toBeInTheDocument();
  });
  
  test('displays 100% free time when no events on a weekday', () => {
    // Mock with empty events
    useEvents.mockReturnValue({ events: [] });
    
    render(
      <ThemeProvider theme={theme}>
        <FreeTimeChart selectedDate={new Date(2025, 2, 19)} /> {/* Wednesday */}
      </ThemeProvider>
    );
    
    // For a weekday with no events, should show 100% free time (7 hours free)
    expect(screen.getByText('100% of your free time available')).toBeInTheDocument();
    expect(screen.getByText('7 hours free / 7 hours total')).toBeInTheDocument();
  });
  
  test('displays correct free time for a weekday with evening events', () => {
    // Mock with weekday evening events
    useEvents.mockReturnValue({
      events: [
        {
          id: 1,
          title: 'Evening Meeting',
          date: '2025-03-19T00:00:00.000Z', // A Wednesday
          time: '18:30', // After 5pm
          duration: 60,
          description: 'Team discussion'
        },
        {
          id: 2,
          title: 'Dinner',
          date: '2025-03-19T00:00:00.000Z',
          time: '20:00', // After 5pm
          duration: 90,
          description: 'Family dinner'
        }
      ]
    });
    
    render(
      <ThemeProvider theme={theme}>
        <FreeTimeChart selectedDate={new Date(2025, 2, 19)} /> {/* Wednesday */}
      </ThemeProvider>
    );
    
    // For weekday with 2.5 hours of events (60 + 90 min), should show ~64% free time
    // 7 hours available, 2.5 hours busy = 4.5 hours free = ~64%
    expect(screen.getByText(/64% of your free time available/)).toBeInTheDocument();
    expect(screen.getByText('4.5 hours free / 7 hours total')).toBeInTheDocument();
  });
  
  test('displays correct free time for a weekend day', () => {
    // Mock with weekend events
    useEvents.mockReturnValue({
      events: [
        {
          id: 3,
          title: 'Morning Hike',
          date: '2025-03-22T00:00:00.000Z', // A Saturday
          time: '09:00',
          duration: 180,
          description: 'Mountain trail'
        },
        {
          id: 4,
          title: 'Movie Night',
          date: '2025-03-22T00:00:00.000Z',
          time: '19:00',
          duration: 150,
          description: 'Watch latest releases'
        }
      ]
    });
    
    render(
      <ThemeProvider theme={theme}>
        <FreeTimeChart selectedDate={new Date(2025, 2, 22)} /> {/* Saturday */}
      </ThemeProvider>
    );
    
    // For weekend with 5.5 hours of events (180 + 150 min), should show ~66% free time
    // 16 hours available, 5.5 hours busy = 10.5 hours free = ~66%
    expect(screen.getByText(/66% of your free time available/)).toBeInTheDocument();
    expect(screen.getByText('10.5 hours free / 16 hours total')).toBeInTheDocument();
  });
  
  test('displays warning when schedule is very busy', () => {
    // Mock with a very busy schedule
    useEvents.mockReturnValue({
      events: [
        {
          id: 5,
          title: 'All-Day Conference',
          date: '2025-03-22T00:00:00.000Z', // Saturday
          time: '08:00',
          duration: 600, // 10 hours
          description: 'Annual industry conference'
        },
        {
          id: 6,
          title: 'Evening Networking',
          date: '2025-03-22T00:00:00.000Z',
          time: '19:00',
          duration: 180,
          description: 'Post-conference networking'
        }
      ]
    });
    
    render(
      <ThemeProvider theme={theme}>
        <FreeTimeChart selectedDate={new Date(2025, 2, 22)} /> {/* Saturday */}
      </ThemeProvider>
    );
    
    // For a weekend with 13 hours of events (600 + 180 min), should show ~19% free time
    // 16 hours available, 13 hours busy = 3 hours free = ~19%
    expect(screen.getByText(/19% of your free time available/)).toBeInTheDocument();
    expect(screen.getByText('Your schedule seems busy! Consider rescheduling some events.')).toBeInTheDocument();
  });
  
  test('handles undefined selectedDate gracefully', () => {
    render(
      <ThemeProvider theme={theme}>
        <FreeTimeChart selectedDate={undefined} />
      </ThemeProvider>
    );
    
    // Should still render but with 0 hours
    expect(screen.getByText('Free Time Analysis')).toBeInTheDocument();
    expect(screen.getByText('0% of your free time available')).toBeInTheDocument();
  });
});
