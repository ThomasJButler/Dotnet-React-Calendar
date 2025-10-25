/**
 * @author Tom Butler
 * @date 2025-10-25
 * @description Toast notification component with auto-dismiss.
 */

import React from 'react';
import { Alert, Snackbar, Slide, IconButton } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useApp } from '../../context/AppContext';

/**
 * Individual Toast component
 */
const Toast = ({ toast }) => {
  const { removeToast } = useApp();
  
  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    removeToast(toast.id);
  };
  
  return (
    <Snackbar
      key={toast.id}
      open={true}
      autoHideDuration={toast.duration > 0 ? toast.duration : null}
      onClose={handleClose}
      TransitionComponent={Slide}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      sx={{ 
        position: 'relative',
        minWidth: '300px',
        mb: 1
      }}
    >
      <Alert
        severity={toast.type}
        onClose={handleClose}
        action={
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={handleClose}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
        sx={{ 
          width: '100%',
          boxShadow: 3,
          '& .MuiAlert-message': {
            maxWidth: '400px',
            wordBreak: 'break-word'
          }
        }}
      >
        {toast.message}
      </Alert>
    </Snackbar>
  );
};

/**
 * Toast Container component that renders all toasts
 */
const ToastContainer = () => {
  const { toasts } = useApp();
  
  return (
    <div
      style={{
        position: 'fixed',
        top: 16,
        right: 16,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        pointerEvents: 'none'
      }}
    >
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          style={{
            transform: `translateY(${index * 8}px)`,
            pointerEvents: 'auto'
          }}
        >
          <Toast toast={toast} />
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;