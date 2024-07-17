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
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const PerformanceChart = ({ data }) => {
  const isAggregate = data.length > 1;

  const processStudentData = (student) => {
    const timeLabels = student.responses.map((_, index) => `t${index + 1}`);
    const scores = student.responses.map(response => response.correct ? 1 : 0);
    return { timeLabels, scores };
  };

  const individualDatasets = data.map(student => {
    const { timeLabels, scores } = processStudentData(student);
    return {
      labels: timeLabels,
      datasets: [
        {
          label: `Scores of ${student.studentID}`,
          data: scores,
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          fill: true,
        }
      ]
    };
  });

  // Class performance over time
  const timeLabels = [];
  const correctCounts = [];
  const incorrectCounts = [];

  data.forEach(student => {
    student.responses.forEach((response, index) => {
      const time = `t${index + 1}`;

      // Initialize counts if they don't exist
      if (!timeLabels.includes(time)) {
        timeLabels.push(time);
        correctCounts[timeLabels.indexOf(time)] = 0;
        incorrectCounts[timeLabels.indexOf(time)] = 0;
      }

      // Increment counts
      if (response.correct) {
        correctCounts[timeLabels.indexOf(time)] += 1;
      } else {
        incorrectCounts[timeLabels.indexOf(time)] += 1;
      }
    });
  });

  const classData = {
    labels: timeLabels,
    datasets: [
      {
        label: 'Correct Answers',
        data: correctCounts,
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
      },
      {
        label: 'Incorrect Answers',
        data: incorrectCounts,
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        fill: true,
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
        text: 'Performance Over Time',
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
      {isAggregate ? (
        <Line data={classData} options={options} />
      ) : (
        individualDatasets.map((studentData, index) => (
          <div key={index} style={{ marginBottom: '20px' }}>
            <Line data={studentData} options={{ ...options, title: { display: true, text: `Performance of ${data[index].studentID}` } }} />
          </div>
        ))
      )}
    </div>
  );
};

export default PerformanceChart;
