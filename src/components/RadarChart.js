import React from 'react';
import { Radar } from 'react-chartjs-2';
import { Paper, Typography } from '@mui/material';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const RadarChart = () => {
  const data = {
    labels: ['Plastic', 'Detergents', 'Bees'],
    datasets: [
      {
        label: 'Sample Data',
        data: [4, 3, 2],
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
      },
    },
  };

  return (
    <Paper sx={{ padding: 2, background: 'background.paper', marginTop: 2 }}>
      <Typography variant="h6" component="h6" gutterBottom sx={{ color: 'text.primary' }}>
        Radar Chart Example
      </Typography>
      <Radar data={data} options={options} />
    </Paper>
  );
};

export default RadarChart;
