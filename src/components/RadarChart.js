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
    return <Typography variant="h6" component="h6" sx={{ color: '#fff' }}>No data available</Typography>;
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
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: color,
    };
  });

  const chartData = {
    labels: skillLabels,
    datasets: datasets,
  };

  const chartOptions = {
    scales: {
      r: {
        angleLines: {
          color: '#ccc', // Light grey for the angle lines (spokes)
        },
        grid: {
          color: '#ddd', // Light grey for the grid lines
        },
        ticks: {
          backdropColor: 'rgba(0, 0, 0, 0.85)', // Dark background for tick labels to blend with black background
          color: '#fff', // White color for the tick labels
          showLabelBackdrop: true, // Show backdrop for tick labels
          font: {
            size: 14, // Larger font size for tick labels
            weight: 'bold', // Bold font weight for tick labels
          },
        },
        pointLabels: {
          color: '#fff', // White color for the skill labels (axes labels)
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
          color: '#fff', // White color for the legend labels
          font: {
            size: 14, // Larger font size for legend labels
            weight: 'bold', // Bold font weight for legend labels
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)', // Light background color for the tooltip
        titleFont: {
          size: 14, // Larger font size for tooltip title
          weight: 'bold', // Bold font weight for tooltip title
          color: '#000', // Dark text color for the tooltip title
        },
        bodyFont: {
          size: 12, // Slightly larger font size for tooltip body
          color: '#000', // Dark text color for the tooltip body
        },
        footerFont: {
          size: 12, // Slightly larger font size for tooltip footer
          color: '#000', // Dark text color for the tooltip footer
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

  // Function to fetch the recommended difficulty for the next exercise for a given student and skill
  const fetchRecommendedDifficulty = async (studentsWithSkills) => {
    const apiEndpoint = 'https://gala24-cogdiagnosis-production.up.railway.app/recommend';
    const threshold = 0.5; // Example threshold value, you can adjust or pass dynamically
    if (!Array.isArray(studentsWithSkills) || studentsWithSkills.length === 0) {
      console.error("Invalid studentsWithSkills input:", studentsWithSkills);
      return {};
    }
    const payload = [];
    studentsWithSkills.forEach(({ studentID, skills }) => {
      skills.forEach(skill => {
        payload.push({
          studentID,
          skill,
          threshold
        });
      });
    });

    try {
      const response = await axios.post(apiEndpoint, payload, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const recommendations = response.data;
      const recommendationsMap = recommendations.reduce((acc, rec) => {
        const key = `${rec.studentID}-${rec.skill}`;
        acc[key] = rec.recommendations[0].difficulty;
        return acc;
      }, {});

      return recommendationsMap;
    } catch (error) {
      if (error.response) {
        console.error("Server responded with an error:", error.response.status);
        console.error("Response data:", error.response.data);
      } else if (error.request) {
        console.error("No response received:", error.request);
      } else {
        console.error("Error setting up the request:", error.message);
      }
      return {};
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
    <Paper sx={{ padding: 2, marginBottom: 2, backgroundColor: '#000' }}>
      <Typography variant="h6" component="h6" sx={{ color: '#fff', marginBottom: 2 }}>
        Skills Performance
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, marginBottom: 2 }}>
        {data.map(student => (
          <Button
            key={student.studentID}
            variant={selectedStudents.includes(student.studentID) ? 'contained' : 'outlined'}
            color="primary"
            onClick={() => handleStudentClick(student.studentID)}
            sx={{ textTransform: 'none', color: '#fff', borderColor: '#fff' }}
          >
            {student.studentID}
          </Button>
        ))}
      </Box>
      <Radar data={chartData} options={chartOptions} />

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
                <Typography variant="h6" component="h6" sx={{ marginBottom: 2, fontSize: '1rem', color: '#fff' }}>
                  Adaptations for Skill: {popupData.skill}
                </Typography>
                <TableContainer sx={{ maxHeight: '70vh', overflow: 'auto' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontSize: '0.875rem', color: '#fff' }}>Student ID</TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.875rem', color: '#fff' }}>Current Value</TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.875rem', color: '#fff' }}>Recommended Difficulty</TableCell>
                        <TableCell align="center" sx={{ fontSize: '0.875rem', color: '#fff' }}>Adjust Difficulty</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {popupData.studentsWithRecommendations.map((student, index) => (
                        <TableRow key={index}>
                          <TableCell sx={{ fontSize: '0.875rem', color: '#fff' }}>{student.studentID}</TableCell>
                          <TableCell align="right" sx={{ fontSize: '0.875rem', color: '#fff' }}>{student.actualValue}</TableCell>
                          <TableCell align="right" sx={{ fontSize: '0.875rem', color: '#fff' }}>{student.recommendedDifficulty}</TableCell>
                          <TableCell align="center">
                            <IconButton onClick={() => handleAdjustDifficulty(student.studentID, -0.1)} size="small" sx={{ color: '#fff' }}>
                              <Remove />
                            </IconButton>
                            <IconButton onClick={() => handleAdjustDifficulty(student.studentID, 0.1)} size="small" sx={{ color: '#fff' }}>
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
                  <Button variant="outlined" color="secondary" onClick={handleClose} sx={{ fontSize: '0.875rem', color: '#fff', borderColor: '#fff' }}>
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
