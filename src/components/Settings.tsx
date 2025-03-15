import React, { useState, useEffect } from 'react';
import './Settings.css';

interface SettingsProps {
  onBack: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onBack }) => {
  const [workTime, setWorkTime] = useState(25);
  const [breakTime, setBreakTime] = useState(5);

  useEffect(() => {
    // Load saved settings when component mounts
    chrome.storage.local.get(['settings'], (result) => {
      if (result.settings) {
        setWorkTime(result.settings.workTime);
        setBreakTime(result.settings.breakTime);
      }
    });
  }, []);

  const handleSave = () => {
    // Save settings to chrome storage
    const settings = {
      workTime,
      breakTime
    };
    chrome.storage.local.set({ settings }, () => {
      onBack(); // Navigate back to the main screen
    });
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <button className="back-button" onClick={onBack}>
          <span>←</span>
        </button>
        <h2>Settings</h2>
      </div>
      
      <div className="settings-form">
        <div className="form-group">
          <label htmlFor="workTime">Work Time (minutes):</label>
          <input
            type="number"
            id="workTime"
            min="1"
            max="60"
            value={workTime}
            onChange={(e) => setWorkTime(parseInt(e.target.value) || 1)}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="breakTime">Break Time (minutes):</label>
          <input
            type="number"
            id="breakTime"
            min="1"
            max="30"
            value={breakTime}
            onChange={(e) => setBreakTime(parseInt(e.target.value) || 1)}
          />
        </div>
        
        <button className="save-button" onClick={handleSave}>
          Save
        </button>
      </div>
    </div>
  );
};

export default Settings; 