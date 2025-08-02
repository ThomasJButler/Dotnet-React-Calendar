import React, { useState } from 'react';
import { Box, Tabs, Tab, Paper } from '@mui/material';
import EventAnalytics from './EventAnalytics';
import WebVitalsMonitor from './WebVitalsMonitor';

/**
 * Combined Analytics Dashboard with tabs for different analytics views
 */
const AnalyticsDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box>
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} centered>
          <Tab label="Event Analytics" />
          <Tab label="Performance Metrics" />
        </Tabs>
      </Paper>
      
      {activeTab === 0 && <EventAnalytics />}
      {activeTab === 1 && <WebVitalsMonitor />}
    </Box>
  );
};

export default React.memo(AnalyticsDashboard);