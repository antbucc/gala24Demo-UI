import React from 'react';
import { AppBar, Toolbar, Typography, Box } from '@mui/material';
import EducatorIcon from './EducatorIcon';

const Header = () => (
  <AppBar position="static" sx={{ background: '#3c3c3c' }}>
    <Toolbar>
      <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
        <EducatorIcon />
        <Typography variant="h6" sx={{ ml: 2, fontFamily: 'Press Start 2P, cursive', color: '#FFD700' }}>
          Welcome Educator!
        </Typography>
      </Box>
    </Toolbar>
  </AppBar>
);

export default Header;
