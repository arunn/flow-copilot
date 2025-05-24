import React from 'react';
import './BlockingAlert.css';

interface BlockingAlertProps {
  onClose: () => void;
  message: string;
}

const BlockingAlert: React.FC<BlockingAlertProps> = ({ onClose, message }) => {
  return (
    <div className="blocking-alert-overlay">
      <div className="blocking-alert-container">
        <div className="blocking-alert-header">
          <h3>Time to Focus!</h3>
        </div>
        <div className="blocking-alert-content">
          <p>{message}</p>
        </div>
        <div className="blocking-alert-actions">
          <button 
            className="start-focus-button" 
            onClick={onClose}
          >
            Start Focusing
          </button>
        </div>
      </div>
    </div>
  );
};

export default BlockingAlert; 