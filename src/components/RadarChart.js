// components/RadarChart.js
import React from 'react';
import { Radar } from 'react-chartjs-2';
import { Paper, Typography, Button } from '@mui/material';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const RadarChart = ({ data, threshold = 0.5 }) => {
  // Calculate the aggregated values
  const aggregateSkills = (students) => {
    const total = students.reduce(
      (acc, student) => {
        acc[0] += student.skills[0];
        acc[1] += student.skills[1];
        acc[2] += student.skills[2];
        return acc;
      },
      [0, 0, 0]
    );
    return total.map(value => value / students.length);
  };

  const aggregatedData = aggregateSkills(data);

  const chartData = {
    labels: ['Plastic', 'Detergents', 'Bees'],
    datasets: [
      {
        label: 'Average Skills',
        data: aggregatedData,
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    scales: {
      r: {
        beginAtZero: true,
        ticks: {
          color: 'white', // Color of the scale numbers
        },
        pointLabels: {
          color: 'white', // Color of the labels around the radar chart
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.2)', // Color of the grid lines
        },
        angleLines: {
          color: 'rgba(255, 255, 255, 0.2)', // Color of the angle lines
        },
      },
    },
  };

  const handleClick = (skill) => {
    alert(`Skill ${skill} is performing under the threshold`);
  };

  return (
    <Paper sx={{ padding: 2, background: 'background.paper', marginTop: 2 }}>
      <Typography variant="h6" component="h6" gutterBottom sx={{ color: 'text.primary' }}>
        
      </Typography>
      <Radar data={chartData} options={options} />
      <div>
        {aggregatedData.map((value, index) => {
          if (value < threshold) {
            return (
              <Button
                key={index}
                variant="contained"
                color="secondary"
                onClick={() => handleClick(chartData.labels[index])}
                sx={{ marginTop: 2 }}
              >
                {`Low Performance: ${chartData.labels[index]}`}
              </Button>
            );
          }
          return null;
        })}
      </div>
    </Paper>
  );
};

export default RadarChart;
