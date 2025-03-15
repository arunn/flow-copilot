function formatTime(seconds) {
  const minutes = Math.round(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes > 1 || (minutes === 1 && remainingSeconds < 30)) {
    return minutes.toString() + 'm';
  } else {
    return remainingSeconds.toString() + 's';
  }
}

// Update badge with current time
function updateBadge(timeLeft, isWorkTime) {
  chrome.action.setBadgeText({ text: formatTime(timeLeft) });
  chrome.action.setBadgeBackgroundColor({ color: isWorkTime ? '#ff0000' : '#008000' });
}

// Initialize timer state
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['timerState'], (result) => {
    if (result.timerState) {
      const { timeLeft, isRunning, lastUpdated, isWorkTime } = result.timerState;
      const currentTime = Date.now();
      const elapsedSeconds = Math.floor((currentTime - lastUpdated) / 1000);
      const newTimeLeft = Math.max(0, timeLeft - elapsedSeconds);
      updateBadge(newTimeLeft, isWorkTime);
    }
  });
});

// Listen for timer updates from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'TIMER_UPDATE') {
    updateBadge(message.timeLeft, message.isWorkTime);
  }
});

// Set up alarm for timer updates every second
chrome.alarms.create('timerUpdate', { periodInMinutes: 1/60 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'timerUpdate') {
    chrome.storage.local.get(['timerState'], (result) => {
      if (result.timerState && result.timerState.isRunning) {
        const { timeLeft, lastUpdated } = result.timerState;
        const currentTime = Date.now();
        const elapsedSeconds = Math.floor((currentTime - lastUpdated) / 1000);
        const newTimeLeft = Math.max(0, timeLeft - elapsedSeconds);
        updateBadge(newTimeLeft, result.timerState.isWorkTime);
      }
    });
  }
}); 