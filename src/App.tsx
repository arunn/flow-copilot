import React from 'react';
import './App.css';
import Pomodoro from './components/Pomodoro';
import './components/Pomodoro.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>FlowCoPilot</h1>
        <Pomodoro />
      </header>
    </div>
  );
}

export default App;
