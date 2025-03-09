import React, { useState, useEffect } from 'react';

const Pomodoro: React.FC = () => {
  const WORK_TIME = 25 * 60; // 25 minutes in seconds
  const BREAK_TIME = 5 * 60; // 5 minutes in seconds

  const [timeLeft, setTimeLeft] = useState(WORK_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [isWorkTime, setIsWorkTime] = useState(true);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isRunning) {
      timer = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            // Switch between work and break time
            setIsWorkTime((prev) => !prev);
            return isWorkTime ? BREAK_TIME : WORK_TIME;
          }
          return prevTime - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRunning, isWorkTime]);

  const handleStart = () => {
    setIsRunning(true);
  };

  const handleStop = () => {
    setIsRunning(false);
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
      </div>
    </div>
  );
};

export default Pomodoro; 