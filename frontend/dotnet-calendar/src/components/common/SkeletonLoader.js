import React from 'react';
import { Skeleton, Box, Card, CardContent } from '@mui/material';

/**
 * SkeletonLoader component for displaying loading placeholders
 * @param {Object} props - Component props
 * @param {string} props.variant - Type of skeleton to display
 * @param {number} props.count - Number of skeleton items to show
 * @returns {JSX.Element} SkeletonLoader component
 */
const SkeletonLoader = ({ variant = 'event', count = 1 }) => {
  const renderEventSkeleton = () => (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Skeleton variant="text" width="60%" height={32} />
        <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
          <Skeleton variant="text" width="30%" />
          <Skeleton variant="text" width="20%" />
        </Box>
        <Skeleton variant="text" width="100%" sx={{ mt: 1 }} />
      </CardContent>
    </Card>
  );
  
  const renderCalendarDaySkeleton = () => (
    <Box sx={{ p: 1, minHeight: 80 }}>
      <Skeleton variant="text" width="30px" height={20} />
      <Box sx={{ mt: 1 }}>
        <Skeleton variant="rectangular" width="100%" height={12} sx={{ mb: 0.5 }} />
        <Skeleton variant="rectangular" width="80%" height={12} />
      </Box>
    </Box>
  );
  
  const renderListSkeleton = () => (
    <Box sx={{ p: 2 }}>
      {Array.from({ length: 3 }).map((_, index) => (
        <Box key={index} sx={{ mb: 2 }}>
          <Skeleton variant="text" width="70%" height={24} />
          <Skeleton variant="text" width="40%" height={20} />
        </Box>
      ))}
    </Box>
  );
  
  const renderFormSkeleton = () => (
    <Box sx={{ p: 2 }}>
      <Skeleton variant="text" width="40%" height={32} sx={{ mb: 3 }} />
      <Skeleton variant="rectangular" width="100%" height={56} sx={{ mb: 2 }} />
      <Skeleton variant="rectangular" width="100%" height={56} sx={{ mb: 2 }} />
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Skeleton variant="rectangular" width="48%" height={56} />
        <Skeleton variant="rectangular" width="48%" height={56} />
      </Box>
      <Skeleton variant="rectangular" width="100%" height={80} sx={{ mt: 2 }} />
      <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'flex-end' }}>
        <Skeleton variant="rectangular" width={100} height={36} />
        <Skeleton variant="rectangular" width={100} height={36} />
      </Box>
    </Box>
  );
  
  const renderChartSkeleton = () => (
    <Box sx={{ p: 2 }}>
      <Skeleton variant="text" width="50%" height={28} sx={{ mb: 2 }} />
      <Skeleton variant="rectangular" width="100%" height={200} />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
        <Skeleton variant="text" width="20%" />
        <Skeleton variant="text" width="20%" />
        <Skeleton variant="text" width="20%" />
      </Box>
    </Box>
  );
  
  const renderSearchSkeleton = () => (
    <Box sx={{ p: 2 }}>
      <Skeleton variant="rectangular" width="100%" height={56} sx={{ mb: 2 }} />
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Skeleton variant="rectangular" width="25%" height={40} />
        <Skeleton variant="rectangular" width="25%" height={40} />
        <Skeleton variant="rectangular" width="25%" height={40} />
        <Skeleton variant="rectangular" width="25%" height={40} />
      </Box>
      <Skeleton variant="text" width="30%" height={24} sx={{ mb: 1 }} />
    </Box>
  );
  
  const skeletonMap = {
    event: renderEventSkeleton,
    calendarDay: renderCalendarDaySkeleton,
    list: renderListSkeleton,
    form: renderFormSkeleton,
    chart: renderChartSkeleton,
    search: renderSearchSkeleton
  };
  
  const renderSkeleton = skeletonMap[variant] || renderEventSkeleton;
  
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <Box key={index} sx={{ 
          animation: 'pulse 1.5s ease-in-out infinite',
          '@keyframes pulse': {
            '0%': { opacity: 1 },
            '50%': { opacity: 0.7 },
            '100%': { opacity: 1 }
          }
        }}>
          {renderSkeleton()}
        </Box>
      ))}
    </>
  );
};

export default SkeletonLoader;