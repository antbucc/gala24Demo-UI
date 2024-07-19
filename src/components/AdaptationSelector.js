import React from 'react';
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';

const AdaptationSelector = ({ adaptations, onSelect }) => {
  return (
    <FormControl fullWidth variant="outlined">
      <InputLabel id="adaptation-selector-label">Adaptation</InputLabel>
      <Select
        labelId="adaptation-selector-label"
        id="adaptation-selector"
        label="Adaptation"
        onChange={(e) => onSelect(e.target.value)}
      >
        {adaptations.map((adaptation, index) => (
          <MenuItem key={index} value={adaptation}>
            {adaptation}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default AdaptationSelector;