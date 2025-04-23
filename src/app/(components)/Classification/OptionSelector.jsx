import React, { useState } from 'react';

const OptionSelector = ({ onSubmit }) => {
  const [selectedOption, setSelectedOption] = useState('');

  const options = [
    { text: 'Angular', value: 'Angular' },
    { text: 'Sub-Angular', value: 'Sub-Angular' },
    { text: 'Rounded', value: 'Rounded' },
    { text: 'Sub-Rounded', value: 'Sub-Rounded' },
    { text: 'Ambiguous Shape', value: 'Ambiguous' },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted with:', selectedOption); // Debug log
    if (selectedOption !== '') {
      onSubmit(selectedOption);
      setSelectedOption('');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: '10px' }}>
      {options.map((option, index) => (
        <div
          key={index}
          style={{
            margin: '10px 0',
            padding: '10px',
            borderRadius: '10px',
            background: selectedOption === option.value ? '#c0c0c0' : '#e0e0e0',
          }}
        >
          <label style={{ cursor: 'pointer', display: 'block' }}>
            <input
              type="radio"
              name="shape"
              value={option.value}
              checked={selectedOption === option.value}
              onChange={() => setSelectedOption(option.value)}
              style={{ marginRight: '10px' }}
            />
            {option.text}
          </label>
        </div>
      ))}
      <button type="submit" disabled={!selectedOption} style={{ marginTop: '10px' }}>
        Submit
      </button>
    </form>
  );
};

export default OptionSelector;