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

const PerformanceChart = ({ data, isAggregate }) => {
  const [open, setOpen] = useState(false);
  const [eligibleStudents, setEligibleStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState({});

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [topics, setTopics] = useState([]);

  useEffect(() => {
    fetchTopics();
  }, []);

  const handleOpen = (adaptation) => {
    fetchEligibleStudents();
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleSnackbarClose = () => setSnackbarOpen(false);

  const handleStudentSelection = (studentID, adaptationType, adaptationValue) => {
    setSelectedStudents((prev) => ({
      ...prev,
      [studentID]: prev[studentID]
        ? undefined
        : { adaptationType, adaptationValue },
    }));
  };

  const applyAdaptations = async () => {
    const adaptationsToSave = Object.entries(selectedStudents).map(
      ([studentID, adaptation]) => ({
        studentID,
        ...adaptation,
      })
    );
    const body = JSON.stringify({ adaptations: adaptationsToSave });
    try {
      const response = await fetch('https://gala24demo-api-production.up.railway.app/save-adaptations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: body,
      });

      if (response.ok) {
        console.log('Adaptations applied to students:', adaptationsToSave);
        setSnackbarOpen(true);
        handleClose();
      } else {
        console.error('Error applying adaptations:', response.statusText);
      }
    } catch (error) {
      console.error('Error applying adaptations:', error);
    }
  };

  const fetchTopics = async () => {
    try {
      const response = await fetch('https://gala24demo-api-production.up.railway.app/get-topics?themeName=Plastic');
      const data = await response.json();
      const topicsArray = data[0].topics;
      setTopics(topicsArray);
    } catch (error) {
      console.error('Error fetching topics:', error);
    }
  };

  const determineAdaptationType = (correctAnswers, currentTopic, student) => {
    if (correctAnswers > 2) {
      const bloomLevels = ['Remembering', 'Understanding', 'Applying', 'Analyzing', 'Evaluating', 'Creating'];
      const currentLevelIndex = bloomLevels.indexOf(student.currentBloomLevel);
      const nextBloomLevel = bloomLevels[currentLevelIndex + 1] || bloomLevels[bloomLevels.length - 1];
      return { type: 'increase bloom level', value: nextBloomLevel };
    } else {
      let newTopic;
      do {
        newTopic = topics[Math.floor(Math.random() * topics.length)];
      } while (newTopic === currentTopic);
      return { type: 'change topic', value: newTopic };
    }
  };

  const fetchEligibleStudents = async () => {
    try {
      const eligibleResponse = await fetch('https://gala24demo-api-production.up.railway.app/eligible-students');
      const eligibleData = await eligibleResponse.json();

      const actionsResponse = await fetch('https://gala24demo-api-production.up.railway.app/student-actions');
      const actionsData = await actionsResponse.json();

      const studentsWithAdaptations = eligibleData.map(student => {
        const studentActions = actionsData.find(action => action.studentID === student.studentID);
        if (studentActions) {
          const correctAnswers = studentActions.responses.filter(response => response.correct).length;
          const currentTopic = studentActions.responses[0]?.topicID;
          const adaptation = determineAdaptationType(correctAnswers, currentTopic, student);
          return { ...student, adaptationType: adaptation.type, adaptationValue: adaptation.value };
        }
        return { ...student, adaptationType: "change topic", adaptationValue: topics[0] };
      });

      setEligibleStudents(studentsWithAdaptations);
    } catch (error) {
      console.error('Error fetching eligible students or student actions:', error);
    }
  };

  const filteredStudents = eligibleStudents.filter(student =>
    student.studentID.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const timeLabels = [];
  const aggregatedScores = [];

  data.forEach(student => {
    student.responses.forEach((response, index) => {
      const time = `t${index + 1}`;

      if (!timeLabels.includes(time)) {
        timeLabels.push(time);
        aggregatedScores[timeLabels.indexOf(time)] = 0;
      }

      aggregatedScores[timeLabels.indexOf(time)] += response.correct ? 1 : -1;
    });
  });

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
        borderDash: [5, 5],
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
        // Handle click events as needed
      }
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            size: 14,
            family: 'Arial', // Changed font family to Arial
            color: '#ffffff', // White text for visibility
          },
        },
      },
      title: {
        display: true,
        text: 'Performance Over Time',
        font: {
          size: 20,
          family: 'Arial', // Changed font family to Arial
          color: '#ffffff', // White title text
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)', // Darker background for tooltips
        titleFont: {
          size: 16,
          family: 'Arial', // Changed font family to Arial
          color: '#ffffff', // White tooltip title text
        },
        bodyFont: {
          size: 14,
          family: 'Arial', // Changed font family to Arial
          color: '#ffffff', // White tooltip body text
        },
      },
    },
    scales: {
      x: {
        ticks: {
          font: {
            size: 12,
            family: 'Arial', // Changed font family to Arial
            color: '#ffffff', // White tick labels for x-axis
          },
        },
      },
      y: {
        ticks: {
          font: {
            size: 12,
            family: 'Arial', // Changed font family to Arial
            color: '#ffffff', // White tick labels for y-axis
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
    <div style={{ padding: '20px', backgroundColor: '#000', borderRadius: '10px' }}>
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
          width: '80%',
          maxWidth: 800,
          bgcolor: '#333', // Darker background color for the modal
          border: '2px solid #000',
          boxShadow: 24,
          p: 4,
          overflowY: 'auto',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          color: '#fff', // White text inside the modal
        }}>
          <Typography id="adaptation-modal-title" variant="h6" component="h2" sx={{ color: '#fff' }}>
            Apply Adaptations
          </Typography>
          <Typography id="adaptation-modal-description" sx={{ mt: 2, mb: 2, color: '#ccc' }}>
            Select students and apply adaptations.
          </Typography>
          <TextField
            label="Search Student by ID"
            variant="outlined"
            fullWidth
            margin="dense"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{
              mb: 2,
              input: { color: '#fff' }, // White text in the input field
              label: { color: '#aaa' }, // Grey color for the label
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: '#777', // Border color for the input field
                },
                '&:hover fieldset': {
                  borderColor: '#fff', // Border color on hover
                },
              },
            }}
          />
          <TableContainer component={Paper} sx={{ width: '100%', bgcolor: '#444' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#fff' }}>Student ID</TableCell>
                  <TableCell sx={{ color: '#fff' }}>Adaptation Type</TableCell>
                  <TableCell sx={{ color: '#fff' }}>Adaptation Value</TableCell>
                  <TableCell sx={{ color: '#fff' }}>Select</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredStudents.map(student => (
                  <TableRow key={student.studentID}>
                    <TableCell sx={{ color: '#fff' }}>{student.studentID}</TableCell>
                    <TableCell sx={{ color: '#fff' }}>{student.adaptationType}</TableCell>
                    <TableCell sx={{ color: '#fff' }}>
                      {typeof student.adaptationValue === 'string'
                        ? student.adaptationValue
                        : student.adaptationValue}
                    </TableCell>
                    <TableCell>
                      <Checkbox
                        checked={selectedStudents[student.studentID] != null}
                        onChange={() => handleStudentSelection(student.studentID, student.adaptationType, student.adaptationValue)}
                        sx={{ color: '#fff' }} // White checkbox
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
