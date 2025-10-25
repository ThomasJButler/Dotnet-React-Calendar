/**
 * @author Tom Butler
 * @date 2025-10-25
 * @description Application entry point that renders the React app.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
// import AppSimple from './AppSimple'; // Uncomment to test simple app
import { reportWebVitalsWithAnalytics } from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
    {/* <AppSimple /> */}
  </React.StrictMode>
);

// Enable enhanced Web Vitals reporting with console logging and historical tracking
reportWebVitalsWithAnalytics();
