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
    return <Typography variant="h6" component="h6" sx={{ color: 'text.primary' }}>No data available</Typography>;
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
          color: '#ccc', // Color of the angle lines (spokes)
        },
        grid: {
          color: '#ddd', // Color of the grid lines
        },
        ticks: {
          backdropColor: 'rgba(255, 255, 255, 0.75)', // Background color of the tick labels
          color: '#333', // Color of the tick labels
          showLabelBackdrop: true, // Show backdrop for tick labels
          font: {
            size: 12, // Font size for tick labels
          },
        },
        pointLabels: {
          color: '#000', // Color of the skill labels (axes labels)
          font: {
            size: 12, // Font size for skill labels
            weight: 'bold', // Font weight for skill labels
          },
        },
      },
    },
    plugins: {
      legend: {
        position: 'top', // Position of the legend (top, bottom, left, right)
        labels: {
          color: '#333', // Color of the legend labels
          font: {
            size: 12, // Font size for legend labels
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.7)', // Background color of the tooltip
        titleFont: {
          size: 12, // Font size for tooltip title
          weight: 'bold', // Font weight for tooltip title
        },
        bodyFont: {
          size: 10, // Font size for tooltip body
        },
        footerFont: {
          size: 10, // Font size for tooltip footer
        },
        callbacks: {
          labelColor: function(tooltipItem) {
            return {
              borderColor: datasets[tooltipItem.datasetIndex].borderColor,
              backgroundColor: datasets[tooltipItem.datasetIndex].backgroundColor,
            };
          },
        },
      },
    },
    onClick: async (event, elements) => {
      console.log("Number of elements clicked:", elements.length);
    
      if (elements.length > 0) {
        const studentsWithSkills = [];
    
        elements.forEach(element => {
          const dataset = datasets[element.datasetIndex];
          const index = element.index;
          const studentID = dataset.label;
          const skill = skillLabels[index];
          const skillCode = Object.keys(skillLabelsMapping).find(code => skillLabelsMapping[code] === skill);
    
          // Find or create an entry for this student
          let studentEntry = studentsWithSkills.find(entry => entry.studentID === studentID);
    
          if (!studentEntry) {
            studentEntry = { studentID, skills: [] };
            studentsWithSkills.push(studentEntry);
          }
    
          // Add the skill to the student's skill list
          studentEntry.skills.push(skillCode);
        });
    
        console.log("Students with skills for API request:", studentsWithSkills);
    
        try {
          const recommendationsMap = await fetchRecommendedDifficulty(studentsWithSkills);

    
          const studentsWithRecommendations = studentsWithSkills.map(({ studentID, skills }) => {
            return skills.map(skillCode => {
              const actualValue = datasets.find(ds => ds.label === studentID).data[skillLabels.indexOf(skillLabelsMapping[skillCode])];
              let recommendedDifficulty = recommendationsMap[`${studentID}-${skillCode}`];

              console.log("DIFFICOLTA RACCOMANDATA: "+recommendedDifficulty);
    
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
            skill: skillLabels[elements[0].index], // Assuming all indices correspond to the same skill
            studentsWithRecommendations
          });
          setOpenPopup(true);
        } catch (error) {
          console.error("Error fetching or processing recommendations:", error);
        }
      } else {
        console.log("No elements were clicked.");
      }
    },
    
    
  };

 // Function to fetch the recommended difficulty for the next exercise for a given student and skill
const fetchRecommendedDifficulty = async (studentsWithSkills) => {
  const apiEndpoint = 'https://gala24-cogdiagnosis-production.up.railway.app/recommend';
  const threshold = 0.5; // Example threshold value, you can adjust or pass dynamically

  // Ensure that studentsWithSkills is an array and contains valid data
  if (!Array.isArray(studentsWithSkills) || studentsWithSkills.length === 0) {
    console.error("Invalid studentsWithSkills input:", studentsWithSkills);
    return {};
  }

  // Prepare the payload for the API
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
    console.log("Payload for recommendation API:", JSON.stringify(payload, null, 2));

    // Send the payload as a POST request to the API
    const response = await axios.post(apiEndpoint, payload, {
      headers: {
        'Content-Type': 'application/json', // Ensure the request content type is JSON
      }
    });

    const recommendations = response.data;
    console.log("ECCCCC: "+recommendations);

   // console.log("Received recommendations:", JSON.stringify(recommendations, null, 2));

    // Map the recommendations to easily access by studentID and skill
    const recommendationsMap = recommendations.reduce((acc, rec) => {
      const key = `${rec.studentID}-${rec.skill}`;
      acc[key] = rec.recommendations[0].difficulty; // Assume we take the first recommendation
      return acc;
    }, {});

    return recommendationsMap;
  } catch (error) {
    if (error.response) {
      // The server responded with a status code out of the 2xx range
      console.error("Server responded with an error:", error.response.status);
      console.error("Response data:", error.response.data);
    } else if (error.request) {
      // The request was made, but no response was received
      console.error("No response received:", error.request);
    } else {
      // Something else caused the error
      console.error("Error setting up the request:", error.message);
    }
    return {}; // Return an empty object on error
  }
};




  // Handle closing the popup
  const handleClose = () => {
    setOpenPopup(false);
    setPopupData(null);
  };

  // Handle applying the changes
  const handleApply = () => {
    // Logic to apply the changes, such as updating the backend or state
    console.log('Applied changes:', popupData.studentsWithRecommendations);
    setOpenPopup(false);
    setPopupData(null);
  };

  // Handle adjusting the value for a skill
  const handleAdjustValue = (studentID, adjustment) => {
    setPopupData(prevData => ({
      ...prevData,
      studentsWithRecommendations: prevData.studentsWithRecommendations.map(student =>
        student.studentID === studentID
          ? { ...student, adjustedValue: student.adjustedValue + adjustment }
          : student
      ),
    }));
  };

  // Handle adjusting the recommended difficulty
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
    <Paper sx={{ padding: 2, marginBottom: 2 }}>
      <Typography variant="h6" component="h6" sx={{ color: 'text.primary', marginBottom: 2 }}>
        Skills Performance
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, marginBottom: 2 }}>
        {data.map(student => (
          <Button
            key={student.studentID}
            variant={selectedStudents.includes(student.studentID) ? 'contained' : 'outlined'}
            color="primary"
            onClick={() => handleStudentClick(student.studentID)}
            sx={{ textTransform: 'none' }}
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
          <Paper sx={{ padding: 2, margin: 'auto', width: '90%', height: '90%', overflow: 'auto' }}>
            {popupData && (
              <>
                <Typography variant="h6" component="h6" sx={{ marginBottom: 2, fontSize: '1rem' }}>
                  Adaptations for Skill: {popupData.skill}
                </Typography>
                <TableContainer sx={{ maxHeight: '70vh', overflow: 'auto' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontSize: '0.875rem' }}>Student ID</TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.875rem' }}>Current Value</TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.875rem' }}>Recommended Difficulty</TableCell>
                        <TableCell align="center" sx={{ fontSize: '0.875rem' }}>Adjust Difficulty</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {popupData.studentsWithRecommendations.map((student, index) => (
                        <TableRow key={index}>
                          <TableCell sx={{ fontSize: '0.875rem' }}>{student.studentID}</TableCell>
                          <TableCell align="right" sx={{ fontSize: '0.875rem' }}>{student.actualValue}</TableCell>
                          <TableCell align="right" sx={{ fontSize: '0.875rem' }}>{student.recommendedDifficulty}</TableCell>
                          <TableCell align="center">
                            <IconButton onClick={() => handleAdjustDifficulty(student.studentID, -0.1)} size="small">
                              <Remove />
                            </IconButton>
                            <IconButton onClick={() => handleAdjustDifficulty(student.studentID, 0.1)} size="small">
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
                  <Button variant="outlined" color="secondary" onClick={handleClose} sx={{ fontSize: '0.875rem' }}>
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
