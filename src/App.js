import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Paper, Divider, TextField, Tabs, Tab } from '@mui/material';
import Header from './components/Header';
import PerformanceChart from './components/PerformanceChart';
import CorrectIncorrectChart from './components/CorrectIncorrectChart';
import PromptField from './components/PromptField';
import RadarChart from './components/RadarChart';


const data = [
  {"studentID": "student1", "skills": [1.87, 0.98, 0.5]},
  {"studentID": "student2", "skills": [0.32, 0.31, 0.2]},
  {"studentID": "student3", "skills": [2.44, 1.55, 0.3]},
  {"studentID": "student4", "skills": [3.79, 2.33, 0.4]},
  {"studentID": "student5", "skills": [3.67, 0.13, 0.1]},
  {"studentID": "student6", "skills": [4.82, 1.65, 0.2]},
  {"studentID": "student7", "skills": [3.12, 2.57, 0.5]},
  {"studentID": "student8", "skills": [1.14, 1.79, 0.3]},
  {"studentID": "student9", "skills": [2.17, 1.39, 0.4]},
  {"studentID": "student10", "skills": [2.83, 4.19, 0.2]},
  {"studentID": "student11", "skills": [3.89, 3.77, 0.4]},
  {"studentID": "student12", "skills": [1.43, 4.16, 0.3]},
  {"studentID": "student13", "skills": [0.49, 0.86, 0.2]},
  {"studentID": "student14", "skills": [3.53, 1.76, 0.1]},
  {"studentID": "student15", "skills": [4.83, 1.22, 0.2]},
  {"studentID": "student16", "skills": [1.12, 4.24, 0.1]},
  {"studentID": "student17", "skills": [2.87, 2.48, 0.3]},
  {"studentID": "student18", "skills": [2.22, 0.77, 0.4]},
  {"studentID": "student19", "skills": [2.66, 3.59, 0.2]},
  {"studentID": "student20", "skills": [2.99, 0.18, 0.3]}
];

const App = () => {
  const [studentData, setStudentData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [adaptations, setAdaptations] = useState([
    { time: 't1', type: 'Lower quiz difficulty' },
    { time: 't2', type: 'Provide additional resources' },
    // Add more adaptations as needed
  ]);
  const [tabIndex, setTabIndex] = useState(0);

  useEffect(() => {
    // Fetch student data from the API
    trainModel();
    const fetchData = async () => {
      try {
        const response = await fetch('https://gala24demo-api-production.up.railway.app/student-actions'); 
        const data = await response.json();
        setStudentData(data);
      } catch (error) {
        console.error('Error fetching student data:', error);
      }
    };

    fetchData();
  }, []);

  const handleSelectAdaptation = (adaptation) => {
    console.log(`Selected Adaptation: ${adaptation}`);
    // Handle the selected adaptation as needed
    setAdaptations([...adaptations, { time: `t${studentData[0].responses.length + 1}`, type: adaptation }]);
  };


  const trainModel = async () => {
    console.log("Starting to train the model");
    try {
        const response = await fetch('https://gala24-cogdiagnosis-production.up.railway.app/train', {
            method: 'GET',
            mode: 'cors', // Ensure CORS requests are sent with credentials
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Model training successful:', data);
        } else {
            console.error('Model training failed:', response.statusText);
        }
    } catch (error) {
        console.error('Error during model training:', error);
    }
};


  const handleSubmitPrompt = (prompt) => {
    console.log(`Teacher Request: ${prompt}`);
    // Handle the prompt submission as needed
  };

  const filteredStudents = studentData.filter(student =>
    student.studentID.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (studentData.length === 0) {
    return <Typography variant="h4" component="h2" gutterBottom sx={{ color: 'text.primary' }}>Loading...</Typography>;
  }

  return (
    <div>
      <Header />
      <Container sx={{ marginTop: 2 }}>
        <Typography variant="h4" component="h2" gutterBottom sx={{ color: 'text.primary' }}>
          Class Performance
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Paper sx={{ width: '100%', padding: 2, background: 'background.paper' }}>
            <Tabs value={tabIndex} onChange={(e, newValue) => setTabIndex(newValue)}>
              <Tab label="Aggregated Performance" />
              <Tab label="Correct/Incorrect Performance" />
              <Tab label="Skills Performance" />
            </Tabs>
            {tabIndex === 0 && (
              <PerformanceChart data={studentData} adaptations={adaptations} isAggregate={true} />
            )}
            {tabIndex === 1 && (
              <CorrectIncorrectChart data={studentData} adaptations={adaptations} />
            )}
            {tabIndex === 2 && (
             <RadarChart data={data} />
            )}
          </Paper>
      
         
         
        </Box>
        <Divider sx={{ marginY: 4, backgroundColor: 'text.secondary' }} />
        <Typography variant="h6" component="h4" sx={{ color: 'text.primary' }}>
          Individual Student Performance
        </Typography>
        <TextField
          fullWidth
          label="Search Student by ID"
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ marginBottom: 2 }}
        />
        {filteredStudents.map(student => (
          <Paper key={student.studentID} sx={{ padding: 2, background: 'background.paper', marginBottom: 2 }}>
            <Typography variant="h6" component="h6" sx={{ color: 'text.primary' }}>
              {`Student ID: ${student.studentID}`}
            </Typography>
            <PerformanceChart data={[student]} adaptations={adaptations} isAggregate={false} />
          </Paper>
        ))}
      </Container>
    </div>
  );
};

export default App;
