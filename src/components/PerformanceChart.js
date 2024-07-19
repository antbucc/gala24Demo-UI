import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import { 
  Modal, Box, Typography, Button, Checkbox, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Snackbar, Alert, TextField 
} from '@mui/material';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  annotationPlugin
);

const PerformanceChart = ({ data, adaptations, isAggregate }) => {
  const [open, setOpen] = useState(false);
  const [eligibleStudents, setEligibleStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [currentAdaptation, setCurrentAdaptation] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleOpen = (adaptation) => {
    setCurrentAdaptation(adaptation);
    fetchEligibleStudents();
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleSnackbarClose = () => setSnackbarOpen(false);

  const handleStudentSelection = (studentID) => {
    setSelectedStudents((prev) => 
      prev.includes(studentID) 
        ? prev.filter(id => id !== studentID) 
        : [...prev, studentID]
    );
  };

  const applyAdaptations = () => {
    // Handle applying adaptations here
    console.log(`Applying adaptations to students: ${selectedStudents.join(', ')}`);
    setSnackbarOpen(true);
    handleClose();
  };

  const fetchEligibleStudents = async () => {
    try {
      const response = await fetch('https://gala24demo-api-production.up.railway.app/eligible-students');
      const data = await response.json();
      setEligibleStudents(data);
    } catch (error) {
      console.error('Error fetching eligible students:', error);
    }
  };

  const filteredStudents = eligibleStudents.filter(student =>
    student.studentID.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const timeLabels = [];
  const aggregatedScores = [];
  const adaptationsAtTime = new Set();

  data.forEach(student => {
    student.responses.forEach((response, index) => {
      const time = `t${index + 1}`;

      if (!timeLabels.includes(time)) {
        timeLabels.push(time);
        aggregatedScores[timeLabels.indexOf(time)] = 0;
      }

      aggregatedScores[timeLabels.indexOf(time)] += response.correct ? 1 : -1;

      const adaptation = adaptations.find(adapt => adapt.time === time);
      if (adaptation) {
        adaptationsAtTime.add(time);
      }
    });
  });

  // Predictive projection (simple extrapolation)
  const projectionCount = timeLabels.length + 1;
  const lastScore = aggregatedScores[aggregatedScores.length - 1];
  const projectionScore = lastScore + (lastScore - aggregatedScores[aggregatedScores.length - 2]);

  const classData = {
    labels: [...timeLabels, `t${projectionCount}`],
    datasets: [
      {
        label: 'Aggregated Score',
        data: [...aggregatedScores, projectionScore],
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
        borderDash: [5, 5]
      },
    ],
  };

  const options = {
    responsive: true,
    onClick: (event, elements) => {
      if (isAggregate && elements.length > 0) {
        const element = elements[0];
        const index = element.index;
        const time = classData.labels[index];
        if (adaptationsAtTime.has(time)) {
          handleOpen(adaptations.find(adapt => adapt.time === time));
        }
      }
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            size: 14,
            family: '"Press Start 2P", cursive',
            color: '#ffffff',
          }
        }
      },
      title: {
        display: true,
        text: 'Class Performance Over Time',
        font: {
          size: 20,
          family: '"Press Start 2P", cursive',
          color: '#ffffff',
        }
      },
      tooltip: {
        titleFont: {
          size: 16,
          family: '"Press Start 2P", cursive',
          color: '#ffffff',
        },
        bodyFont: {
          size: 14,
          family: '"Press Start 2P", cursive',
          color: '#ffffff',
        },
      },
      annotation: {
        annotations: Array.from(adaptationsAtTime).map((time) => ({
          type: 'point',
          xValue: time,
          yValue: aggregatedScores[timeLabels.indexOf(time)],
          backgroundColor: 'red', // Use red for alert points
          borderColor: 'red',
          borderWidth: 2,
          radius: 5,
          label: {
            enabled: true,
            content: adaptations.find(adapt => adapt.time === time)?.type,
            position: 'top',
            backgroundColor: 'red',
            color: 'white',
            font: {
              size: 12,
              family: '"Press Start 2P", cursive'
            }
          }
        }))
      }
    },
    scales: {
      x: {
        ticks: {
          font: {
            size: 12,
            family: '"Press Start 2P", cursive',
            color: '#ffffff',
          },
        },
      },
      y: {
        ticks: {
          font: {
            size: 12,
            family: '"Press Start 2P", cursive',
            color: '#ffffff',
          },
        },
      },
    },
    layout: {
      padding: {
        top: 20,
        bottom: 20,
        left: 20,
        right: 20,
      },
    },
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#3c4043', borderRadius: '10px' }}>
      <Line data={classData} options={options} />
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="adaptation-modal-title"
        aria-describedby="adaptation-modal-description"
      >
        <Box sx={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)', 
          width: 500, 
          maxHeight: '80vh', // Ensure modal doesn't exceed viewport height
          bgcolor: 'background.paper', 
          border: '2px solid #000', 
          boxShadow: 24, 
          p: 4, 
          overflowY: 'auto' // Enable scrolling if content exceeds modal height
        }}>
          <Typography id="adaptation-modal-title" variant="h6" component="h2">
            Apply Adaptations
          </Typography>
          <Typography id="adaptation-modal-description" sx={{ mt: 2, mb: 2 }}>
            Select students and apply adaptations.
          </Typography>
          <TextField
            label="Search Student by ID"
            variant="outlined"
            fullWidth
            margin="dense"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Student ID</TableCell>
                  <TableCell>Adaptation Type</TableCell>
                  <TableCell>Select</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredStudents.map(student => (
                  <TableRow key={student.studentID}>
                    <TableCell>{student.studentID}</TableCell>
                    <TableCell>
                      { 'New Learning Objective'}
                    </TableCell>
                    <TableCell>
                      <Checkbox 
                        checked={selectedStudents.includes(student.studentID)} 
                        onChange={() => handleStudentSelection(student.studentID)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={applyAdaptations}
            fullWidth
            sx={{ mt: 2 }}
          >
            Apply
          </Button>
        </Box>
      </Modal>
      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={6000} 
        onClose={handleSnackbarClose}
      >
        <Alert onClose={handleSnackbarClose} severity="success" sx={{ width: '100%' }}>
          Adaptations successfully applied!
        </Alert>
      </Snackbar>
    </div>
  );
};

export default PerformanceChart;
