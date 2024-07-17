import React from 'react';
import { Card, CardContent, Typography } from '@mui/material';

const StudentCard = ({ student }) => (
  <Card variant="outlined" sx={{ marginBottom: 2, backgroundColor: 'background.paper' }}>
    <CardContent>
      <Typography variant="h5" component="div" sx={{ color: 'text.primary' }}>
        {student.name}
      </Typography>
      <Typography color="text.secondary">
        Score: {student.score}
      </Typography>
      <Typography color="text.secondary">
        Grade: {student.grade}
      </Typography>
    </CardContent>
  </Card>
);

export default StudentCard;
