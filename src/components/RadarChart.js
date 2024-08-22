import React, { useState } from 'react';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Paper, Typography, Button, Box, Modal, Backdrop, Fade, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton } from '@mui/material';
import { Add, Remove } from '@mui/icons-material';
import axios from 'axios';

// Register the necessary components
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

// Helper function to generate random colors
const generateRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

// Skill labels mapping
const skillLabelsMapping = {
  "66ab571cc92cc90278b759a1": "Plastic",
  "66ab5734c92cc90278b759a2": "Detergents",
  "66ab575fc92cc90278b759a3": "Bees",
  // Add more mappings as needed
};

const RadarChart = ({ data }) => {
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [openPopup, setOpenPopup] = useState(false);
  const [popupData, setPopupData] = useState(null);

  if (!data || data.length === 0) {
    return <Typography variant="h6" component="h6" sx={{ color: '#ddd' }}>No data available</Typography>;
  }

  // Handle student ID click to toggle selection
  const handleStudentClick = (studentID) => {
    setSelectedStudents(prevSelected =>
      prevSelected.includes(studentID)
        ? prevSelected.filter(id => id !== studentID)
        : [...prevSelected, studentID]
    );
  };

  // Filter data based on selected students
  const filteredData = selectedStudents.length > 0
    ? data.filter(student => selectedStudents.includes(student.studentID))
    : data;

  // Extract skill labels and data
  const skillLabels = Object.keys(data[0].skills).map(skillCode => skillLabelsMapping[skillCode] || skillCode);

  const datasets = filteredData.map(student => {
    const color = generateRandomColor();
    return {
      label: student.studentID,
      data: skillLabels.map(skill => student.skills[Object.keys(skillLabelsMapping).find(code => skillLabelsMapping[code] === skill)]),
      fill: true,
      backgroundColor: `${color}33`, // 20% opacity for background color
      borderColor: color,
      pointBackgroundColor: color,
      pointBorderColor: '#ddd',
      pointHoverBackgroundColor: '#ddd',
      pointHoverBorderColor: color,
    };
  });

  const chartData = {
    labels: skillLabels,
    datasets: datasets,
  };

  const chartOptions = {
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: {
          color: '#888', // Medium grey for the angle lines (spokes)
        },
        grid: {
          color: '#777', // Darker grey for the grid lines
        },
        ticks: {
          backdropColor: 'rgba(0, 0, 0, 0.7)', // Dark background for tick labels
          color: '#ddd', // Light grey color for the tick labels
          showLabelBackdrop: true, // Show backdrop for tick labels
          font: {
            size: 14, // Larger font size for tick labels
            weight: 'bold', // Bold font weight for tick labels
          },
        },
        pointLabels: {
          color: '#ddd', // Light grey color for the skill labels (axes labels)
          font: {
            size: 14, // Larger font size for skill labels
            weight: 'bold', // Bold font weight for skill labels
          },
        },
      },
    },
    plugins: {
      legend: {
        position: 'top', // Position of the legend (top, bottom, left, right)
        labels: {
          color: '#ddd', // Light grey color for the legend labels
          font: {
            size: 14, // Larger font size for legend labels
            weight: 'bold', // Bold font weight for legend labels
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(50, 50, 50, 0.9)', // Darker background color for the tooltip
        titleFont: {
          size: 14, // Larger font size for tooltip title
          weight: 'bold', // Bold font weight for tooltip title
          color: '#fff', // White text color for the tooltip title
        },
        bodyFont: {
          size: 12, // Slightly larger font size for tooltip body
          color: '#fff', // White text color for the tooltip body
        },
        footerFont: {
          size: 12, // Slightly larger font size for tooltip footer
          color: '#fff', // White text color for the tooltip footer
        },
        callbacks: {
          labelColor: function (tooltipItem) {
            return {
              borderColor: datasets[tooltipItem.datasetIndex].borderColor,
              backgroundColor: datasets[tooltipItem.datasetIndex].backgroundColor,
            };
          },
        },
      },
    },
    onClick: (event, elements) => {
      if (elements.length > 0) {
        const studentsWithSkills = [];
        elements.forEach(element => {
          const dataset = datasets[element.datasetIndex];
          const index = element.index;
          const studentID = dataset.label;
          const skill = skillLabels[index];
          const skillCode = Object.keys(skillLabelsMapping).find(code => skillLabelsMapping[code] === skill);
          let studentEntry = studentsWithSkills.find(entry => entry.studentID === studentID);
          if (!studentEntry) {
            studentEntry = { studentID, skills: [] };
            studentsWithSkills.push(studentEntry);
          }
          studentEntry.skills.push(skillCode);
        });

        const studentsWithDiagnose = studentsWithSkills.map(({ studentID, skills }) => {
          return skills.map(skillCode => {
            const diagnoseValue = datasets.find(ds => ds.label === studentID).data[skillLabels.indexOf(skillLabelsMapping[skillCode])];
            return {
              studentID,
              diagnoseValue,
              idealValue: 1 - diagnoseValue,
            };
          });
        }).flat();

        setPopupData({
          skill: skillLabels[elements[0].index],
          studentsWithDiagnose
        });
        setOpenPopup(true);
      }
    },
  };

  const handleApply = async () => {
    try {
      // Collect the updated data to be sent to the API
      const updatedData = popupData.studentsWithDiagnose.map(student => ({
        studentID: student.studentID,
        idealDifficulty: student.idealValue,
      }));
  
      // Make an API call to save the updated data (array of difficulties)
      await saveUpdatedData(updatedData);
  
      console.log('Applied changes and saved to DB:', updatedData);
  
      // Optionally, update the UI or state after saving
      setOpenPopup(false);
      setPopupData(null);
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };
  
  // Function to save the updated data to the backend
  const saveUpdatedData = async (difficultiesArray) => {
    try {
      const response = await axios.post('/save-difficulties', { difficulties: difficultiesArray });
      console.log('Save response:', response.data);
    } catch (error) {
      console.error('Error in saving difficulties:', error);
      throw error; // Re-throw the error to be handled by handleApply
    }
  };
  

  const handleClose = () => {
    setOpenPopup(false);
    setPopupData(null);
  };

  const handleAdjustDifficulty = (studentID, adjustment) => {
    setPopupData(prevData => ({
      ...prevData,
      studentsWithDiagnose: prevData.studentsWithDiagnose.map(student =>
        student.studentID === studentID
          ? {
            ...student,
            idealValue: typeof student.idealValue === 'number'
              ? parseFloat((student.idealValue + adjustment).toFixed(2))
              : student.idealValue
          }
          : student
      ),
    }));
  };

  return (
    <Paper sx={{ padding: 2, marginBottom: 2, backgroundColor: '#111' }}>
      <Typography variant="h6" component="h6" sx={{ color: '#ddd', marginBottom: 2 }}>
        Skills Performance
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, marginBottom: 2 }}>
        {data.map(student => (
          <Button
            key={student.studentID}
            variant={selectedStudents.includes(student.studentID) ? 'contained' : 'outlined'}
            color="primary"
            onClick={() => handleStudentClick(student.studentID)}
            sx={{ textTransform: 'none', color: '#ddd', borderColor: '#ddd' }}
          >
            {student.studentID}
          </Button>
        ))}
      </Box>
      <Box sx={{ height: 600, width: 600, margin: '0 auto' }}>
        <Radar data={chartData} options={chartOptions} />
      </Box>

      <Modal
        open={openPopup}
        onClose={handleClose}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 500,
        }}
      >
        <Fade in={openPopup}>
          <Paper sx={{ padding: 2, margin: 'auto', width: '90%', height: '90%', overflow: 'auto', backgroundColor: '#222' }}>
            {popupData && (
              <>
                <Typography variant="h6" component="h6" sx={{ marginBottom: 2, fontSize: '1rem', color: '#ddd' }}>
                  Adaptations for Skill: {popupData.skill}
                </Typography>
                <TableContainer sx={{ maxHeight: '70vh', overflow: 'auto' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontSize: '0.875rem', color: '#ddd' }}>Student ID</TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.875rem', color: '#ddd' }}>Current Value</TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.875rem', color: '#ddd' }}>Ideal Difficulty</TableCell>
                        <TableCell align="center" sx={{ fontSize: '0.875rem', color: '#ddd' }}>Adjust Difficulty</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {popupData.studentsWithDiagnose.map((student, index) => (
                        <TableRow key={index}>
                          <TableCell sx={{ fontSize: '0.875rem', color: '#ddd' }}>{student.studentID}</TableCell>
                          <TableCell align="right" sx={{ fontSize: '0.875rem', color: '#ddd' }}>{student.diagnoseValue.toFixed(2)}</TableCell>
                          <TableCell align="right" sx={{ fontSize: '0.875rem', color: '#ddd' }}>{student.idealValue.toFixed(2)}</TableCell>
                          <TableCell align="center">
                            <IconButton onClick={() => handleAdjustDifficulty(student.studentID, -0.01)} size="small" sx={{ color: '#ddd' }}>
                              <Remove />
                            </IconButton>
                            <IconButton onClick={() => handleAdjustDifficulty(student.studentID, 0.01)} size="small" sx={{ color: '#ddd' }}>
                              <Add />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Box sx={{ display: 'flex', justifyContent: 'center', marginTop: 2, gap: 2 }}>
                  <Button variant="contained" color="primary" onClick={handleApply} sx={{ fontSize: '0.875rem' }}>
                    Apply
                  </Button>
                  <Button variant="outlined" color="secondary" onClick={handleClose} sx={{ fontSize: '0.875rem', color: '#ddd', borderColor: '#ddd' }}>
                    Close
                  </Button>
                </Box>
              </>
            )}
          </Paper>
        </Fade>
      </Modal>
    </Paper>
  );
};

export default RadarChart;
