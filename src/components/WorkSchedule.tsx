import React from 'react';
import { WeekSchedule, TimeRange } from '../types/schedule';
import './Settings.css';

interface WorkScheduleProps {
  schedule: WeekSchedule;
  onScheduleChange: (newSchedule: WeekSchedule) => void;
}

const WorkSchedule: React.FC<WorkScheduleProps> = ({ schedule, onScheduleChange }) => {
  const [showSchedule, setShowSchedule] = React.useState(false);

  const toggleDayEnabled = (day: keyof WeekSchedule) => {
    onScheduleChange({
      ...schedule,
      [day]: {
        ...schedule[day],
        enabled: !schedule[day].enabled
      }
    });
  };

  const handleTimeChange = (
    day: keyof WeekSchedule, 
    rangeIndex: number, 
    field: keyof TimeRange, 
    value: string
  ) => {
    const updatedRanges = [...schedule[day].timeRanges];
    updatedRanges[rangeIndex] = {
      ...updatedRanges[rangeIndex],
      [field]: value
    };
    
    onScheduleChange({
      ...schedule,
      [day]: {
        ...schedule[day],
        timeRanges: updatedRanges
      }
    });
  };

  const addTimeRange = (day: keyof WeekSchedule) => {
    const updatedRanges = [...schedule[day].timeRanges, { startTime: "09:00", endTime: "17:00" }];
    
    onScheduleChange({
      ...schedule,
      [day]: {
        ...schedule[day],
        timeRanges: updatedRanges
      }
    });
  };

  const removeTimeRange = (day: keyof WeekSchedule, rangeIndex: number) => {
    // Don't remove if it's the only time range
    if (schedule[day].timeRanges.length <= 1) return;
    
    const updatedRanges = schedule[day].timeRanges.filter((_: TimeRange, idx: number) => idx !== rangeIndex);
    
    onScheduleChange({
      ...schedule,
      [day]: {
        ...schedule[day],
        timeRanges: updatedRanges
      }
    });
  };

  const copyTimeRange = (day: keyof WeekSchedule, sourceDay: keyof WeekSchedule) => {
    onScheduleChange({
      ...schedule,
      [day]: {
        ...schedule[day],
        timeRanges: [...schedule[sourceDay].timeRanges]
      }
    });
  };

  return (
    <div className="form-group schedule-form-group">
      <div className="schedule-header" onClick={() => setShowSchedule(!showSchedule)}>
        <h3>My Work Schedule</h3>
        <span className={`toggle-arrow ${showSchedule ? 'open' : ''}`}>▼</span>
      </div>
      
      {showSchedule && (
        <div className="schedule-container">
          <p className="schedule-description">
            Set your work days and time periods. This helps you plan your Pomodoro sessions.
          </p>
          
          {(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as Array<keyof WeekSchedule>).map((day) => (
            <div key={String(day)} className="day-schedule">
              <div className="day-header">
                <label htmlFor={`day-${String(day)}`} className="day-label">
                  <input
                    type="checkbox"
                    id={`day-${String(day)}`}
                    checked={schedule[day].enabled}
                    onChange={() => toggleDayEnabled(day)}
                  />
                  <span className="day-name">{String(day).charAt(0).toUpperCase() + String(day).slice(1)}</span>
                </label>
                
                {day !== 'monday' && schedule[day].enabled && (
                  <button 
                    className="copy-button" 
                    onClick={() => copyTimeRange(day, 'monday')}
                    title="Copy Monday's schedule"
                  >
                    Copy from Monday
                  </button>
                )}
              </div>
              
              {schedule[day].enabled && (
                <div className="time-ranges">
                  {schedule[day].timeRanges.map((timeRange: TimeRange, idx: number) => (
                    <div key={idx} className="time-range">
                      <div className="time-inputs">
                        <input
                          type="time"
                          value={timeRange.startTime}
                          onChange={(e) => handleTimeChange(day, idx, 'startTime', e.target.value)}
                          className="time-input"
                        />
                        <span className="time-separator">to</span>
                        <input
                          type="time"
                          value={timeRange.endTime}
                          onChange={(e) => handleTimeChange(day, idx, 'endTime', e.target.value)}
                          className="time-input"
                        />
                      </div>
                      
                      <div className="time-buttons">
                        {idx === schedule[day].timeRanges.length - 1 && (
                          <button 
                            className="add-time-button" 
                            onClick={() => addTimeRange(day)}
                            title="Add time period"
                          >
                            +
                          </button>
                        )}
                        <button 
                          className="remove-time-button"
                          onClick={() => removeTimeRange(day, idx)}
                          disabled={schedule[day].timeRanges.length <= 1}
                          title="Remove time period"
                        >
                          ✕
                        </button>

                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WorkSchedule; 