import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Paper, Tabs, Tab } from '@mui/material';
import Header from './components/Header';
import PerformanceChart from './components/PerformanceChart';
import CorrectIncorrectChart from './components/CorrectIncorrectChart';
import RadarChart from './components/RadarChart';

const App = () => {
  const [studentData, setStudentData] = useState([]);
  const [diagnoseData, setDiagnoseData] = useState([]); // State to hold diagnose data
  //const [adaptations, setAdaptations] = useState([
   // { time: 't1', type: 'Lower quiz difficulty' },
   // { time: 't2', type: 'Provide additional resources' },
    // Add more adaptations as needed
 // ]);
  const [tabIndex, setTabIndex] = useState(0);

  useEffect(() => {
    // Fetch student data from the API
    const fetchData = async () => {
      try {
        const response = await fetch('https://gala24demo-api-production.up.railway.app/student-actions'); 
        const data = await response.json();
        setStudentData(data);
  
        // Extract studentIDs and pass them to fetchDiagnoseData
        const studentIDs = data.map(student => student.studentID);
        const diagnoseData = await fetchDiagnoseData({ studentID: studentIDs });
        setDiagnoseData(diagnoseData); // Set the fetched diagnose data
      } catch (error) {
        console.error('Error fetching student data:', error);
      }
    };
  
    // fetch data for the student actions
    fetchData();
    
    // train the model
    trainModel();
  
  }, []); // Dependency array is still empty to run only once on component mount
  
  //const handleSelectAdaptation = (adaptation) => {
   // console.log(`Selected Adaptation: ${adaptation}`);
    // Handle the selected adaptation as needed
   // setAdaptations([...adaptations, { time: `t${studentData[0].responses.length + 1}`, type: adaptation }]);
 // };


  const trainModel = async () => {

    const response = await fetch('/train');
        if (response.ok) {
            console.log("Model training successful");
        } else {
            console.error('Model training failed:', response.statusText);
        }
    };


    const fetchDiagnoseData = async (students) => {
      
      console.log("STUDENTS: "+JSON.stringify(students));
      try {
        const response = await fetch('/diagnose', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(students),
        });
    
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
    
        const data = await response.json();
        console.log("Diagnose Data:", data);
        return data;
      } catch (error) {
        console.error('Error fetching diagnose data:', error);
      }
    };


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
            <Tab label="Skills Performance" />
              <Tab label="Correct/Incorrect Performance" />
              <Tab label="Aggregated Performance" />
            </Tabs>
            {tabIndex === 0 && (
                <RadarChart data={diagnoseData} />
            )}
            {tabIndex === 1 && (
              <CorrectIncorrectChart data={studentData}  />
            )}
            {tabIndex === 2 && (
             <PerformanceChart data={studentData}  isAggregate={true} />
            )}
          </Paper>
        </Box>
      </Container>
    </div>
  );
};

export default App;
