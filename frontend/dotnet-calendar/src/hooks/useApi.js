import { useState, useCallback, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';

/**
 * Custom hook for making API calls with loading, error, and abort handling
 * @param {Function} apiFunction - The API function to call
 * @param {Object} options - Hook options
 * @returns {Object} API state and methods
 */
export const useApi = (apiFunction, options = {}) => {
  const {
    onSuccess,
    onError,
    initialData = null,
    showErrorToast = true,
    showSuccessToast = false,
    successMessage = 'Operation completed successfully',
    errorMessage = null
  } = options;

  const { showError, showSuccess } = useApp();
  
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Use ref to store abort controller
  const abortControllerRef = useRef(null);
  
  // Track if component is mounted
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      // Abort any pending requests on unmount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Execute the API call
  const execute = useCallback(async (...params) => {
    try {
      setLoading(true);
      setError(null);
      
      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();
      
      // Call the API function with abort signal
      const result = await apiFunction(...params, {
        signal: abortControllerRef.current.signal
      });
      
      if (!isMountedRef.current) return;
      
      setData(result);
      
      // Call success callback
      if (onSuccess) {
        onSuccess(result);
      }
      
      // Show success toast
      if (showSuccessToast) {
        showSuccess(
          typeof successMessage === 'function' 
            ? successMessage(result) 
            : successMessage
        );
      }
      
      return result;
    } catch (err) {
      if (!isMountedRef.current) return;
      
      // Don't treat abort as error
      if (err.name === 'AbortError') {
        return;
      }
      
      setError(err);
      
      // Call error callback
      if (onError) {
        onError(err);
      }
      
      // Show error toast
      if (showErrorToast) {
        const message = errorMessage || err.message || 'An error occurred';
        showError(
          typeof message === 'function' 
            ? message(err) 
            : message
        );
      }
      
      throw err;
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        abortControllerRef.current = null;
      }
    }
  }, [apiFunction, onSuccess, onError, showSuccessToast, showErrorToast, successMessage, errorMessage, showError, showSuccess]);

  // Reset state
  const reset = useCallback(() => {
    setData(initialData);
    setError(null);
    setLoading(false);
  }, [initialData]);

  // Abort ongoing request
  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setLoading(false);
    }
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    reset,
    abort,
    setData
  };
};