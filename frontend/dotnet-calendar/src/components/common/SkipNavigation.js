import React from 'react';
import { Box, Link } from '@mui/material';

/**
 * Skip navigation links for keyboard users and screen readers
 * Provides quick access to main content areas
 */
const SkipNavigation = () => {
  const skipLinks = [
    { href: '#main-content', label: 'Skip to main content' },
    { href: '#calendar', label: 'Skip to calendar' },
    { href: '#event-list', label: 'Skip to events' },
    { href: '#search', label: 'Skip to search' }
  ];

  return (
    <Box
      sx={{
        position: 'absolute',
        left: '-9999px',
        top: 0,
        zIndex: 9999,
        '& a': {
          position: 'absolute',
          left: '9999px',
          backgroundColor: 'primary.main',
          color: 'primary.contrastText',
          padding: 2,
          textDecoration: 'none',
          borderRadius: 1,
          '&:focus': {
            left: 0,
          }
        }
      }}
    >
      {skipLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          sx={{
            display: 'block',
            marginBottom: 1
          }}
        >
          {link.label}
        </Link>
      ))}
    </Box>
  );
};

export default SkipNavigation;