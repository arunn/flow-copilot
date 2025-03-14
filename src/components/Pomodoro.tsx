import React, { useState, useEffect } from 'react';

interface TimerState {
  timeLeft: number;
  isRunning: boolean;
  isWorkTime: boolean;
  lastUpdated: number;
}

interface Settings {
  workTime: number;
  breakTime: number;
}

const Pomodoro: React.FC = () => {
  const DEFAULT_WORK_TIME = 25 * 60; // 25 minutes in seconds
  const DEFAULT_BREAK_TIME = 5 * 60; // 5 minutes in seconds
  
  const [workTime, setWorkTime] = useState(DEFAULT_WORK_TIME);
  const [breakTime, setBreakTime] = useState(DEFAULT_BREAK_TIME);
  const [timeLeft, setTimeLeft] = useState(workTime);
  const [isRunning, setIsRunning] = useState(false);
  const [isWorkTime, setIsWorkTime] = useState(true);

  // Load saved settings and state when component mounts
  useEffect(() => {
    chrome.storage.local.get(['settings', 'timerState'], (result) => {
      // Load settings if available
      if (result.settings) {
        const settings: Settings = result.settings;
        const newWorkTime = settings.workTime * 60; // Convert minutes to seconds
        const newBreakTime = settings.breakTime * 60; // Convert minutes to seconds
        
        setWorkTime(newWorkTime);
        setBreakTime(newBreakTime);
        
        // If timer state exists, use it, otherwise initialize with new work time
        if (!result.timerState) {
          setTimeLeft(newWorkTime);
        }
      }
      
      // Load timer state if available
      if (result.timerState) {
        const savedState: TimerState = result.timerState;
        const currentTime = Date.now();
        const elapsedSeconds = Math.floor((currentTime - savedState.lastUpdated) / 1000);

        if (savedState.isRunning) {
          // Calculate the correct time left based on elapsed time
          const newTimeLeft = Math.max(0, savedState.timeLeft - elapsedSeconds);
          
          if (newTimeLeft === 0) {
            // If timer would have ended, switch to the next phase
            setIsWorkTime(!savedState.isWorkTime);
            setTimeLeft(savedState.isWorkTime ? breakTime : workTime);
          } else {
            setTimeLeft(newTimeLeft);
            setIsWorkTime(savedState.isWorkTime);
          }
          setIsRunning(true);
        } else {
          setTimeLeft(savedState.timeLeft);
          setIsWorkTime(savedState.isWorkTime);
          setIsRunning(false);
        }
      }
    });
  }, []);

  // Listen for settings changes
  useEffect(() => {
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.settings) {
        const newSettings: Settings = changes.settings.newValue;
        const newWorkTime = newSettings.workTime * 60;
        const newBreakTime = newSettings.breakTime * 60;
        
        setWorkTime(newWorkTime);
        setBreakTime(newBreakTime);
        
        // If the timer is not running and we're in the corresponding phase, update the time left
        if (!isRunning) {
          if (isWorkTime) {
            setTimeLeft(newWorkTime);
          } else {
            setTimeLeft(newBreakTime);
          }
        }
      }
    };
    
    chrome.storage.onChanged.addListener(handleStorageChange);
    
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, [isRunning, isWorkTime]);

  // Save state when component updates
  useEffect(() => {
    const timerState: TimerState = {
      timeLeft,
      isRunning,
      isWorkTime,
      lastUpdated: Date.now()
    };
    chrome.storage.local.set({ timerState });
    
    // Send timer update to background script
    chrome.runtime.sendMessage({
      type: 'TIMER_UPDATE',
      timeLeft
    });
  }, [timeLeft, isRunning, isWorkTime]);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isRunning) {
      timer = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            // Switch between work and break time
            setIsWorkTime((prev) => !prev);
            return isWorkTime ? breakTime : workTime;
          }
          return prevTime - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRunning, isWorkTime, workTime, breakTime]);

  const handleStart = () => {
    setIsRunning(true);
  };

  const handleStop = () => {
    setIsRunning(false);
  };

  const handleRestart = () => {
    setIsRunning(false);
    setTimeLeft(isWorkTime ? workTime : breakTime);
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="pomodoro-container">
      <h2>{isWorkTime ? 'Work Time' : 'Break Time'}</h2>
      <div className="timer">{formatTime(timeLeft)}</div>
      <div className="controls">
        <button 
          onClick={handleStart} 
          disabled={isRunning}
          className="start-button"
        >
          START
        </button>
        <button 
          onClick={handleStop} 
          disabled={!isRunning}
          className="stop-button"
        >
          STOP
        </button>
        <button 
          onClick={handleRestart}
          className="restart-button"
        >
          RESTART
        </button>
      </div>
    </div>
  );
};

export default Pomodoro; 