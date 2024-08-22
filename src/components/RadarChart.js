
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
    onClick: async (event, elements) => {
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

        try {
          const recommendationsMap = await fetchRecommendedDifficulty(studentsWithSkills);
          const studentsWithRecommendations = studentsWithSkills.map(({ studentID, skills }) => {
            return skills.map(skillCode => {
              const actualValue = datasets.find(ds => ds.label === studentID).data[skillLabels.indexOf(skillLabelsMapping[skillCode])];
              let recommendedDifficulty = recommendationsMap[`${studentID}-${skillCode}`];
              if (typeof recommendedDifficulty === 'number') {
                recommendedDifficulty = parseFloat(recommendedDifficulty.toFixed(2));
              } else {
                recommendedDifficulty = 'N/A';
              }
              return {
                studentID,
                actualValue,
                adjustedValue: actualValue,
                recommendedDifficulty,
              };
            });
          }).flat();

          setPopupData({
            skill: skillLabels[elements[0].index],
            studentsWithRecommendations
          });
          setOpenPopup(true);
        } catch (error) {
          console.error("Error fetching or processing recommendations:", error);
        }
      }
    },
  };

  const fetchRecommendedDifficulty = async (studentsWithSkills) => {
    // Backend for the Cognitive Services
    const apiClient = axios.create({
      baseURL: 'https://gala24demo-api-production.up.railway.app/',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const threshold = 0.5; // Example threshold value, you can adjust or pass dynamically

    // Validate input
    if (!Array.isArray(studentsWithSkills) || studentsWithSkills.length === 0) {
      console.error("Invalid studentsWithSkills input:", studentsWithSkills);
      return {};
    }

    // Prepare the payload as an array of objects
    const payload = studentsWithSkills.flatMap(({ studentID, skills }) =>
      skills.map(skill => ({
        studentID,
        skill,
        threshold,
      }))
    );

    try {
      // Send `payload` directly as an array
      const response = await apiClient.post('/recommend', payload);
      console.log("RESPONSE RECOMMEND: ", response.data);
      console.log("RECOMMEND completed successfully.");

      // Build a recommendations map: { "studentID-skill": recommendedDifficulty }
      const recommendationsMap = response.data.reduce((acc, rec) => {
        const key = `${rec.studentID}-${rec.skill}`;
        acc[key] = rec.recommendations[0].difficulty; // Assuming we take the first recommendation
        return acc;
      }, {});

      return recommendationsMap; // Return the map for further processing

    } catch (error) {
      if (error.response) {
        console.error('Server responded with a status other than 2xx:', error.response.statusText);
        console.error('Status Code:', error.response.status);
        console.error('Response Data:', error.response.data);
      } else if (error.request) {
        console.error('No response received:', error.request);
        console.error('Request details:', error.config);
      } else {
        console.error('Error setting up request:', error.message);
      }
      return {}; // Return an empty object in case of error
    }
  };

  const handleClose = () => {
    setOpenPopup(false);
    setPopupData(null);
  };

  const handleApply = () => {
    console.log('Applied changes:', popupData.studentsWithRecommendations);
    setOpenPopup(false);
    setPopupData(null);
  };

  const handleAdjustDifficulty = (studentID, adjustment) => {
    setPopupData(prevData => ({
      ...prevData,
      studentsWithRecommendations: prevData.studentsWithRecommendations.map(student =>
        student.studentID === studentID
          ? {
            ...student,
            recommendedDifficulty: typeof student.recommendedDifficulty === 'number'
              ? parseFloat((student.recommendedDifficulty + adjustment).toFixed(2))
              : student.recommendedDifficulty
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
                        <TableCell align="right" sx={{ fontSize: '0.875rem', color: '#ddd' }}>Recommended Difficulty</TableCell>
                        <TableCell align="center" sx={{ fontSize: '0.875rem', color: '#ddd' }}>Adjust Difficulty</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {popupData.studentsWithRecommendations.map((student, index) => (
                        <TableRow key={index}>
                          <TableCell sx={{ fontSize: '0.875rem', color: '#ddd' }}>{student.studentID}</TableCell>
                          <TableCell align="right" sx={{ fontSize: '0.875rem', color: '#ddd' }}>{student.actualValue}</TableCell>
                          <TableCell align="right" sx={{ fontSize: '0.875rem', color: '#ddd' }}>{student.recommendedDifficulty}</TableCell>
                          <TableCell align="center">
                            <IconButton onClick={() => handleAdjustDifficulty(student.studentID, -0.1)} size="small" sx={{ color: '#ddd' }}>
                              <Remove />
                            </IconButton>
                            <IconButton onClick={() => handleAdjustDifficulty(student.studentID, 0.1)} size="small" sx={{ color: '#ddd' }}>
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
