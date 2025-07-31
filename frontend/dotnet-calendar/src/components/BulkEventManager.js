import React, { useState, useRef } from 'react';
import {
  Paper,
  Typography,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  LinearProgress,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  CloudDownload as DownloadIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Delete as DeleteIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { useEvents } from '../context/EventContext';
import { useApp } from '../context/AppContext';
import { format } from 'date-fns';
import { validateEvent } from '../utils/validators';

/**
 * BulkEventManager component for importing and exporting events
 */
const BulkEventManager = ({ open, onClose }) => {
  const { events, addEvent, isLoading } = useEvents();
  const { showSuccess, showError, showWarning } = useApp();
  const fileInputRef = useRef(null);
  
  const [activeStep, setActiveStep] = useState(0);
  const [importData, setImportData] = useState([]);
  const [validationResults, setValidationResults] = useState([]);
  const [importProgress, setImportProgress] = useState(0);
  const [exportFormat, setExportFormat] = useState('csv');
  const [filterCriteria, setFilterCriteria] = useState({
    startDate: null,
    endDate: null,
    includeDescription: true
  });

  const steps = ['Select File', 'Validate Data', 'Import Events'];

  /**
   * Parse CSV content
   */
  const parseCSV = (content) => {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV file must have headers and at least one data row');
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const requiredHeaders = ['title', 'date', 'time'];
    
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
    }

    const data = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      
      // Parse duration if present
      if (row.duration) {
        row.duration = parseInt(row.duration) || 60;
      } else {
        row.duration = 60; // Default 1 hour
      }
      
      data.push(row);
    }
    
    return data;
  };

  /**
   * Parse JSON content
   */
  const parseJSON = (content) => {
    try {
      const data = JSON.parse(content);
      if (!Array.isArray(data)) {
        throw new Error('JSON must be an array of events');
      }
      return data;
    } catch (error) {
      throw new Error(`Invalid JSON format: ${error.message}`);
    }
  };

  /**
   * Handle file selection
   */
  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target.result;
        let parsedData;
        
        if (file.name.endsWith('.csv')) {
          parsedData = parseCSV(content);
        } else if (file.name.endsWith('.json')) {
          parsedData = parseJSON(content);
        } else {
          throw new Error('Please select a CSV or JSON file');
        }
        
        setImportData(parsedData);
        setActiveStep(1);
        validateImportData(parsedData);
      } catch (error) {
        showError(error.message);
      }
    };
    
    reader.readAsText(file);
  };

  /**
   * Validate import data
   */
  const validateImportData = (data) => {
    const results = data.map((item, index) => {
      const validation = validateEvent({
        title: item.title,
        date: item.date,
        time: item.time,
        description: item.description || '',
        duration: item.duration || 60
      });
      
      return {
        index,
        data: item,
        isValid: validation.isValid,
        errors: validation.errors,
        warnings: []
      };
    });
    
    // Check for duplicates
    const titles = new Set();
    results.forEach(result => {
      if (result.data.title && titles.has(result.data.title)) {
        result.warnings.push('Duplicate event title');
      }
      titles.add(result.data.title);
    });
    
    setValidationResults(results);
  };

  /**
   * Handle import
   */
  const handleImport = async () => {
    setActiveStep(2);
    const validEvents = validationResults.filter(r => r.isValid);
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < validEvents.length; i++) {
      try {
        const eventData = {
          title: validEvents[i].data.title,
          date: new Date(validEvents[i].data.date).toISOString(),
          time: validEvents[i].data.time,
          description: validEvents[i].data.description || '',
          duration: parseInt(validEvents[i].data.duration) || 60
        };
        
        await addEvent(eventData);
        successCount++;
        setImportProgress((i + 1) / validEvents.length * 100);
      } catch (error) {
        errorCount++;
        console.error('Failed to import event:', error);
      }
    }
    
    if (successCount > 0) {
      showSuccess(`Successfully imported ${successCount} events`);
    }
    if (errorCount > 0) {
      showError(`Failed to import ${errorCount} events`);
    }
    
    setTimeout(() => {
      handleClose();
    }, 2000);
  };

  /**
   * Handle export
   */
  const handleExport = () => {
    let filteredEvents = [...events];
    
    // Apply date filters
    if (filterCriteria.startDate) {
      filteredEvents = filteredEvents.filter(event => 
        new Date(event.date) >= filterCriteria.startDate
      );
    }
    if (filterCriteria.endDate) {
      filteredEvents = filteredEvents.filter(event => 
        new Date(event.date) <= filterCriteria.endDate
      );
    }
    
    let content;
    let filename;
    let mimeType;
    
    if (exportFormat === 'csv') {
      // Generate CSV
      const headers = ['title', 'date', 'time', 'duration'];
      if (filterCriteria.includeDescription) {
        headers.push('description');
      }
      
      const rows = [headers.join(',')];
      filteredEvents.forEach(event => {
        const row = [
          `"${event.title}"`,
          format(new Date(event.date), 'yyyy-MM-dd'),
          event.time || '',
          event.duration || 60
        ];
        if (filterCriteria.includeDescription) {
          row.push(`"${event.description || ''}"`);
        }
        rows.push(row.join(','));
      });
      
      content = rows.join('\n');
      filename = `events-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      mimeType = 'text/csv';
    } else {
      // Generate JSON
      const exportData = filteredEvents.map(event => ({
        title: event.title,
        date: format(new Date(event.date), 'yyyy-MM-dd'),
        time: event.time || '',
        duration: event.duration || 60,
        ...(filterCriteria.includeDescription && { description: event.description || '' })
      }));
      
      content = JSON.stringify(exportData, null, 2);
      filename = `events-export-${format(new Date(), 'yyyy-MM-dd')}.json`;
      mimeType = 'application/json';
    }
    
    // Create download
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showSuccess(`Exported ${filteredEvents.length} events`);
  };

  /**
   * Reset state
   */
  const handleClose = () => {
    setActiveStep(0);
    setImportData([]);
    setValidationResults([]);
    setImportProgress(0);
    onClose();
  };

  /**
   * Get validation statistics
   */
  const getValidationStats = () => {
    const valid = validationResults.filter(r => r.isValid).length;
    const warnings = validationResults.filter(r => r.warnings.length > 0).length;
    const errors = validationResults.filter(r => !r.isValid).length;
    
    return { valid, warnings, errors, total: validationResults.length };
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Bulk Event Manager</Typography>
          <Box>
            <Button
              startIcon={<DownloadIcon />}
              onClick={() => setActiveStep(-1)}
              variant="outlined"
              size="small"
              sx={{ mr: 1 }}
            >
              Export
            </Button>
            <Button
              startIcon={<UploadIcon />}
              onClick={() => {
                setActiveStep(0);
                fileInputRef.current?.click();
              }}
              variant="contained"
              size="small"
            >
              Import
            </Button>
          </Box>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {/* Export View */}
        {activeStep === -1 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Export Events
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Export Format</InputLabel>
                <Select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value)}
                  label="Export Format"
                >
                  <MenuItem value="csv">CSV</MenuItem>
                  <MenuItem value="json">JSON</MenuItem>
                </Select>
              </FormControl>
              
              <TextField
                label="Start Date (Optional)"
                type="date"
                value={filterCriteria.startDate ? format(filterCriteria.startDate, 'yyyy-MM-dd') : ''}
                onChange={(e) => setFilterCriteria({
                  ...filterCriteria,
                  startDate: e.target.value ? new Date(e.target.value) : null
                })}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              
              <TextField
                label="End Date (Optional)"
                type="date"
                value={filterCriteria.endDate ? format(filterCriteria.endDate, 'yyyy-MM-dd') : ''}
                onChange={(e) => setFilterCriteria({
                  ...filterCriteria,
                  endDate: e.target.value ? new Date(e.target.value) : null
                })}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              
              <Alert severity="info">
                {events.length} total events available for export
              </Alert>
            </Box>
          </Box>
        )}
        
        {/* Import View */}
        {activeStep >= 0 && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.json"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
            
            <Stepper activeStep={activeStep} sx={{ mt: 2, mb: 3 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
            
            {/* Step 0: File Selection */}
            {activeStep === 0 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <UploadIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Select a file to import
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Supported formats: CSV, JSON
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<UploadIcon />}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Choose File
                </Button>
                
                <Box sx={{ mt: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    CSV Format: title, date (YYYY-MM-DD), time (HH:MM), duration (minutes), description
                  </Typography>
                </Box>
              </Box>
            )}
            
            {/* Step 1: Validation */}
            {activeStep === 1 && (
              <Box>
                <Box sx={{ mb: 2 }}>
                  {(() => {
                    const stats = getValidationStats();
                    return (
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Chip
                          icon={<CheckIcon />}
                          label={`${stats.valid} Valid`}
                          color="success"
                          variant="outlined"
                        />
                        <Chip
                          icon={<WarningIcon />}
                          label={`${stats.warnings} Warnings`}
                          color="warning"
                          variant="outlined"
                        />
                        <Chip
                          icon={<ErrorIcon />}
                          label={`${stats.errors} Errors`}
                          color="error"
                          variant="outlined"
                        />
                      </Box>
                    );
                  })()}
                </Box>
                
                <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Status</TableCell>
                        <TableCell>Title</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Time</TableCell>
                        <TableCell>Issues</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {validationResults.map((result, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            {result.isValid ? (
                              <CheckIcon color="success" />
                            ) : (
                              <ErrorIcon color="error" />
                            )}
                          </TableCell>
                          <TableCell>{result.data.title || '-'}</TableCell>
                          <TableCell>{result.data.date || '-'}</TableCell>
                          <TableCell>{result.data.time || '-'}</TableCell>
                          <TableCell>
                            {Object.entries(result.errors).map(([field, error]) => (
                              <Typography key={field} variant="caption" color="error" display="block">
                                {field}: {error}
                              </Typography>
                            ))}
                            {result.warnings.map((warning, i) => (
                              <Typography key={i} variant="caption" color="warning.main" display="block">
                                {warning}
                              </Typography>
                            ))}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
            
            {/* Step 2: Import Progress */}
            {activeStep === 2 && (
              <Box sx={{ py: 4 }}>
                <Typography variant="h6" gutterBottom align="center">
                  Importing Events...
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={importProgress} 
                  sx={{ mt: 2, mb: 1 }}
                />
                <Typography variant="body2" color="text.secondary" align="center">
                  {Math.round(importProgress)}% Complete
                </Typography>
              </Box>
            )}
          </>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose}>
          {activeStep === 2 ? 'Close' : 'Cancel'}
        </Button>
        {activeStep === -1 && (
          <Button onClick={handleExport} variant="contained" startIcon={<DownloadIcon />}>
            Export
          </Button>
        )}
        {activeStep === 1 && (
          <Button 
            onClick={handleImport} 
            variant="contained"
            disabled={validationResults.filter(r => r.isValid).length === 0}
          >
            Import {validationResults.filter(r => r.isValid).length} Events
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default React.memo(BulkEventManager);