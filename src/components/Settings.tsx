import React, { useState, useEffect } from 'react';
import './Settings.css';
import { WeekSchedule } from '../types/schedule';
import WorkSchedule from './WorkSchedule';

interface SettingsProps {
  onBack: () => void;
}

interface AlertSettings {
  enabled: boolean;
  minInterval: number;
  maxInterval: number;
}

const Settings: React.FC<SettingsProps> = ({ onBack }) => {
  const [workTime, setWorkTime] = useState(25);
  const [breakTime, setBreakTime] = useState(5);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [minAlertInterval, setMinAlertInterval] = useState(5);
  const [maxAlertInterval, setMaxAlertInterval] = useState(15);
  const [schedule, setSchedule] = useState<WeekSchedule>({
    monday: { enabled: true, timeRanges: [{ startTime: "09:00", endTime: "17:00" }] },
    tuesday: { enabled: true, timeRanges: [{ startTime: "09:00", endTime: "17:00" }] },
    wednesday: { enabled: true, timeRanges: [{ startTime: "09:00", endTime: "17:00" }] },
    thursday: { enabled: true, timeRanges: [{ startTime: "09:00", endTime: "17:00" }] },
    friday: { enabled: true, timeRanges: [{ startTime: "09:00", endTime: "17:00" }] },
    saturday: { enabled: true, timeRanges: [{ startTime: "09:00", endTime: "17:00" }] },
    sunday: { enabled: true, timeRanges: [{ startTime: "09:00", endTime: "17:00" }] }
  });
  useEffect(() => {
    // Load saved settings when component mounts
    chrome.storage.local.get(['settings', 'alertSettings'], (result) => {
      if (result.settings) {
        setWorkTime(result.settings.workTime);
        setBreakTime(result.settings.breakTime);
        
        // Load sound setting if available
        if (result.settings.soundEnabled !== undefined) {
          setSoundEnabled(result.settings.soundEnabled);
        }

        if(result.settings.schedule) {
          setSchedule(result.settings.schedule);
        }
      }

      // Load alert settings if available
      if (result.alertSettings) {
        const alertSettings: AlertSettings = result.alertSettings;
        setAlertsEnabled(alertSettings.enabled !== false);
        setMinAlertInterval(alertSettings.minInterval || 5);
        setMaxAlertInterval(alertSettings.maxInterval || 15);
      }
    });
  }, []);

  const handleSave = () => {
    // Save settings to chrome storage
    const settings = {
      workTime,
      breakTime,
      soundEnabled,
      schedule
    };

    const alertSettings = {
      enabled: alertsEnabled,
      minInterval: minAlertInterval,
      maxInterval: maxAlertInterval
    };

    // Save both settings objects
    chrome.storage.local.set({ 
      settings,
      alertSettings
    }, () => {
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
        <div className="form-group time-input-group single-line-group">
          <label htmlFor="workTime" className="single-line-label">Work Time (minutes):</label>
          <input
            type="number"
            id="workTime"
            min="1"
            max="60"
            value={workTime}
            onChange={(e) => setWorkTime(parseInt(e.target.value) || 1)}
            className="single-line-input"
          />
        </div>
        
        <div className="form-group time-input-group single-line-group">
          <label htmlFor="breakTime" className="single-line-label">Break Time (minutes):</label>
          <input
            type="number"
            id="breakTime"
            min="1"
            max="30"
            value={breakTime}
            onChange={(e) => setBreakTime(parseInt(e.target.value) || 1)}
            className="single-line-input"
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

        <div className="form-group alerts-section">
          <h3>Focus Reminders</h3>
          <div className="checkbox-group">
            <label htmlFor="alertsEnabled">
              <input
                type="checkbox"
                id="alertsEnabled"
                checked={alertsEnabled}
                onChange={(e) => setAlertsEnabled(e.target.checked)}
              />
              Enable Focus Reminders
            </label>
          </div>
          
          {alertsEnabled && (
            <>
              <div className="form-group time-input-group single-line-group">
                <label htmlFor="minAlertInterval" className="single-line-label">Minimum interval (minutes):</label>
                <input
                  type="number"
                  id="minAlertInterval"
                  min="1"
                  max={maxAlertInterval - 1}
                  value={minAlertInterval}
                  onChange={(e) => setMinAlertInterval(parseInt(e.target.value) || 1)}
                  className="single-line-input"
                />
              </div>
              
              <div className="form-group time-input-group single-line-group">
                <label htmlFor="maxAlertInterval" className="single-line-label">Maximum interval (minutes):</label>
                <input
                  type="number"
                  id="maxAlertInterval"
                  min={minAlertInterval + 1}
                  max="60"
                  value={maxAlertInterval}
                  onChange={(e) => setMaxAlertInterval(parseInt(e.target.value) || minAlertInterval + 1)}
                  className="single-line-input"
                />
              </div>
              <p className="settings-note">
                During scheduled work hours, you'll receive focus reminders at random intervals 
                between the minimum and maximum times if you're not in a work or break session.
              </p>
            </>
          )}
        </div>

        <div className="form-group schedule-form-group">
            <WorkSchedule 
              schedule={schedule}
              onScheduleChange={setSchedule}
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