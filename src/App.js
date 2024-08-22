import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Paper, Tabs, Tab, CircularProgress } from '@mui/material';
import Header from './components/Header';
import PerformanceChart from './components/PerformanceChart';
import CorrectIncorrectChart from './components/CorrectIncorrectChart';
import RadarChart from './components/RadarChart';
import axios from 'axios';

const App = () => {
  const [studentData, setStudentData] = useState([]);
  const [diagnoseData, setDiagnoseData] = useState([]); // State to hold diagnose data
  const [loadingDiagnose, setLoadingDiagnose] = useState(true); // Initialize loading to true
  //const [recommendData, setRecommendData]=  useState([]); // State to hold recommendation data
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

        // First, train the model using cognitive service
        await trainModel(); // Assuming trainModel returns a Promise

        // No need to set loading to true here, it's already true

        // Second, extract the diagnosis from the Cognitive services using the studentIDs
        const diagnoseResult = await Diagnose(studentIDs); // Assuming Diagnose is the function to get diagnose data
        console.log("RESULT OF DIAGNOSE: " + diagnoseResult);

        // Set loading to false after fetching diagnose data
        setLoadingDiagnose(false);

        // Third, recommend the difficulty and the quiz for the students
        //  const recommendResult = await Recommend(studentIDs); 
      } catch (error) {
        console.error('Error fetching student data:', error);
        // Set loading to false if there's an error
        setLoadingDiagnose(false);
      }
    };

    // Fetch data for the student actions
    fetchData();

  }, []); // Dependency array is still empty to run only once on component mount

  const trainModel = async () => {
    // Backend for the Cognitive Services
    const apiClient = axios.create({
      baseURL: 'https://gala24demo-api-production.up.railway.app',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await apiClient.get('/train');
    console.log("RESPONSE: " + response + "Model trained");

  };

  const Diagnose = async (studentIDs) => {
    // Backend for the Cognitive Services
    const apiClient = axios.create({
      baseURL: 'https://gala24demo-api-production.up.railway.app/',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    try {
      // Call the POST API /diagnose with the provided student IDs
      const response = await apiClient.post('/diagnose', { studentID: studentIDs });
      console.log("RESPONSE DIAGNOSE: ", response.data);
      console.log("Diagnose completed successfully.");
      setDiagnoseData(response.data);
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
              loadingDiagnose ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <CircularProgress />
                </Box>
              ) : (
                <RadarChart data={diagnoseData} />
              )
            )}
            {tabIndex === 1 && (
              <CorrectIncorrectChart data={studentData} />
            )}
            {tabIndex === 2 && (
              <PerformanceChart data={studentData} isAggregate={true} />
            )}
          </Paper>
        </Box>
      </Container>
    </div>
  );
};

export default App;
