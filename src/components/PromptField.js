import React, { useState } from 'react';
import { TextField, Button } from '@mui/material';

const PromptField = ({ onSubmit }) => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = () => {
    onSubmit(prompt);
    setPrompt('');
  };

  return (
    <div>
      <TextField
        fullWidth
        label="Not happy? How can I help?"
        variant="outlined"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        sx={{ marginBottom: 2, input: { color: 'text.primary' }, label: { color: 'text.secondary' } }}
      />
      <Button variant="contained" color="primary" onClick={handleSubmit}>
        Send
      </Button>
    </div>
  );
};

export default PromptField;
