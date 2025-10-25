/**
 * @author Tom Butler
 * @date 2025-10-25
 * @description Web Vitals reporting for performance monitoring.
 */

const reportWebVitals = onPerfEntry => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
};

// Enhanced Web Vitals reporting with console logging and thresholds
export const reportWebVitalsWithAnalytics = () => {
  const logMetric = (metric) => {
    // Define thresholds based on Google's recommendations
    const thresholds = {
      CLS: { good: 0.1, needsImprovement: 0.25 },
      FID: { good: 100, needsImprovement: 300 },
      FCP: { good: 1800, needsImprovement: 3000 },
      LCP: { good: 2500, needsImprovement: 4000 },
      TTFB: { good: 800, needsImprovement: 1800 }
    };

    const threshold = thresholds[metric.name];
    let rating = 'poor';
    
    if (metric.value <= threshold.good) {
      rating = 'good';
    } else if (metric.value <= threshold.needsImprovement) {
      rating = 'needs improvement';
    }

    // Log to console with color coding
    const color = rating === 'good' ? 'color: green' : rating === 'needs improvement' ? 'color: orange' : 'color: red';
    console.log(
      `%c[Web Vitals] ${metric.name}: ${metric.value.toFixed(2)}${metric.name === 'CLS' ? '' : 'ms'} (${rating})`,
      color,
      metric
    );

    // Send to analytics if available
    if (window.gtag) {
      window.gtag('event', metric.name, {
        event_category: 'Web Vitals',
        event_label: metric.id,
        value: Math.round(metric.value),
        metric_rating: rating,
        non_interaction: true
      });
    }

    // Store in localStorage for historical tracking
    try {
      const storedMetrics = JSON.parse(localStorage.getItem('webVitalsHistory') || '{}');
      if (!storedMetrics[metric.name]) {
        storedMetrics[metric.name] = [];
      }
      
      storedMetrics[metric.name].push({
        value: metric.value,
        rating,
        timestamp: new Date().toISOString(),
        id: metric.id
      });
      
      // Keep only last 50 entries per metric
      if (storedMetrics[metric.name].length > 50) {
        storedMetrics[metric.name] = storedMetrics[metric.name].slice(-50);
      }
      
      localStorage.setItem('webVitalsHistory', JSON.stringify(storedMetrics));
    } catch (e) {
      console.error('Failed to store web vitals history:', e);
    }
  };

  reportWebVitals(logMetric);
};

// Get historical Web Vitals data
export const getWebVitalsHistory = () => {
  try {
    return JSON.parse(localStorage.getItem('webVitalsHistory') || '{}');
  } catch (e) {
    console.error('Failed to retrieve web vitals history:', e);
    return {};
  }
};

// Clear Web Vitals history
export const clearWebVitalsHistory = () => {
  try {
    localStorage.removeItem('webVitalsHistory');
  } catch (e) {
    console.error('Failed to clear web vitals history:', e);
  }
};

export default reportWebVitals;
