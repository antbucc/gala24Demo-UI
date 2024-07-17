import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider } from '@mui/material/styles';
import theme from './theme';
import CssBaseline from '@mui/material/CssBaseline';

// Create the root element using ReactDOM's createRoot
const root = ReactDOM.createRoot(document.getElementById('root'));

// Render the App inside the ThemeProvider with CssBaseline
root.render(
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <App />
  </ThemeProvider>
);
