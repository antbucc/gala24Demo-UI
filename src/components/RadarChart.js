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
import { Paper, Typography, Button, Box } from '@mui/material';

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
  const [selectedStudents, setSelectedStudents] = useState([]); // State to track selected student IDs

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

  // Chart options to enhance the appearance
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
            size: 14, // Font size for skill labels
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
            size: 14, // Font size for legend labels
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.7)', // Background color of the tooltip
        titleFont: {
          size: 14, // Font size for tooltip title
          weight: 'bold', // Font weight for tooltip title
        },
        bodyFont: {
          size: 12, // Font size for tooltip body
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
    </Paper>
  );
};

export default RadarChart;
