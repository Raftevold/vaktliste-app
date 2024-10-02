import React from 'react';

const WeekSelector = ({ selectedYear, selectedWeek, setSelectedYear, setSelectedWeek }) => {
  return (
    <div className="week-selector">
      <label htmlFor="week-select">Velg uke: </label>
      <input 
        type="week" 
        id="week-select" 
        value={`${selectedYear}-W${selectedWeek.toString().padStart(2, '0')}`}
        onChange={(e) => {
          const [year, week] = e.target.value.split('-W');
          setSelectedYear(parseInt(year));
          setSelectedWeek(parseInt(week));
        }}
      />
    </div>
  );
};

export default WeekSelector;