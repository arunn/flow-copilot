import React, { useState, useEffect } from 'react';
import './Settings.css';

interface SettingsProps {
  onBack: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onBack }) => {
  const [workTime, setWorkTime] = useState(25);
  const [breakTime, setBreakTime] = useState(5);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    // Load saved settings when component mounts
    chrome.storage.local.get(['settings'], (result) => {
      if (result.settings) {
        setWorkTime(result.settings.workTime);
        setBreakTime(result.settings.breakTime);
        
        // Load sound setting if available
        if (result.settings.soundEnabled !== undefined) {
          setSoundEnabled(result.settings.soundEnabled);
        }
      }
    });
  }, []);

  const handleSave = () => {
    // Save settings to chrome storage
    const settings = {
      workTime,
      breakTime,
      soundEnabled
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
        
        <div className="form-group checkbox-group">
          <label htmlFor="soundEnabled">
            <input
              type="checkbox"
              id="soundEnabled"
              checked={soundEnabled}
              onChange={(e) => setSoundEnabled(e.target.checked)}
            />
            Enable Sound Notifications
          </label>
        </div>
        
        <button className="save-button" onClick={handleSave}>
          Save
        </button>
      </div>
    </div>
  );
};

export default Settings; 