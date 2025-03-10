import React from 'react';
import './App.css';
import Pomodoro from './components/Pomodoro';
import './components/Pomodoro.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <div className="logo-container">
          <div className="logo-title">
            <img src="/icons/logo.svg" alt="FlowCoPilot Logo" className="app-logo" />
            <h1>FlowCoPilot</h1>
          </div>
        </div>
        <Pomodoro />
      </header>
    </div>
  );
}

export default App;
