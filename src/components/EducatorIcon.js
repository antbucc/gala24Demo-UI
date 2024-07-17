import React from 'react';
import { Avatar, Box, Typography } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';

const EducatorIcon = () => (
  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
    <Avatar sx={{ bgcolor: 'secondary.main' }}>
      <PersonIcon />
    </Avatar>
  </Box>
);

export default EducatorIcon;
