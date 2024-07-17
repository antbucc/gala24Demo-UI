import React, { useState } from 'react';
import { FormControl, InputLabel, MenuItem, Select, Button, Typography } from '@mui/material';

const AdaptationSelector = ({ adaptations, onSelect }) => {
  const [selectedAdaptation, setSelectedAdaptation] = useState('');

  const handleChange = (event) => {
    setSelectedAdaptation(event.target.value);
  };

  const handleSelect = () => {
    onSelect(selectedAdaptation);
  };

  return (
    <div>
      <FormControl fullWidth>
        <InputLabel id="adaptation-select-label" sx={{ color: 'text.secondary' }}>Suggested Adaptations</InputLabel>
        <Select
          labelId="adaptation-select-label"
          value={selectedAdaptation}
          label="Suggested Adaptations"
          onChange={handleChange}
          sx={{ color: 'text.primary' }}
        >
          {adaptations.map((adaptation, index) => (
            <MenuItem key={index} value={adaptation} sx={{ color: 'text.primary' }}>
              {adaptation}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Button variant="contained" color="primary" onClick={handleSelect} sx={{ marginTop: 2 }}>
        Apply Adaptation
      </Button>
    </div>
  );
};

export default AdaptationSelector;
