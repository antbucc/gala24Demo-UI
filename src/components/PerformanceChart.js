import React from 'react';
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

const PerformanceChart = ({ data, adaptations }) => {
  // Aggregate class performance over time
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
          backgroundColor: 'yellow',
          borderColor: 'yellow',
          borderWidth: 2,
          radius: 5,
          label: {
            enabled: true,
            content: adaptations.find(adapt => adapt.time === time)?.type,
            position: 'top',
            backgroundColor: 'yellow',
            color: 'black',
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
    </div>
  );
};

export default PerformanceChart;
