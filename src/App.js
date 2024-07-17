import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Paper, Divider, TextField } from '@mui/material';
import Header from './components/Header';
import PerformanceChart from './components/PerformanceChart';
import AdaptationSelector from './components/AdaptationSelector';
import PromptField from './components/PromptField';

const App = () => {
  const [studentData, setStudentData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [adaptations] = useState([
    'Lower quiz difficulty',
    'Provide additional resources',
    'Assign peer tutoring',
    // Add more adaptations as needed
  ]);

  useEffect(() => {
    // Fetch student data from the API
    const fetchData = async () => {
      try {
        const response = await fetch('https://gala24demo-api-production.up.railway.app/student-actions'); // Update this URL to your actual endpoint
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
          <Paper sx={{ width: '60%', padding: 2, background: 'background.paper' }}>
            <PerformanceChart data={studentData} />
          </Paper>
          <Box sx={{ width: '35%', marginLeft: 2 }}>
            <Paper sx={{ padding: 2, background: 'background.paper', mb: 2 }}>
              <Typography variant="h5" component="h3" gutterBottom sx={{ color: 'text.primary' }}>
                Suggested Adaptations
              </Typography>
              <AdaptationSelector adaptations={adaptations} onSelect={handleSelectAdaptation} />
            </Paper>
            <Paper sx={{ padding: 2, background: 'background.paper' }}>
              <Typography variant="h5" component="h3" gutterBottom sx={{ color: 'text.primary' }}>
                Not happy? How can I help?
              </Typography>
              <PromptField onSubmit={handleSubmitPrompt} />
            </Paper>
          </Box>
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
            <PerformanceChart data={[student]} />
          </Paper>
        ))}
      </Container>
    </div>
  );
};

export default App;
