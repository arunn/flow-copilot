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
function updateBadge(timeLeft, isWorkTime, isRunning) {
  chrome.action.setBadgeText({ text: formatTime(timeLeft) });
  chrome.action.setBadgeBackgroundColor({ color: isWorkTime ? '#ff0000' : '#008000' });
  chrome.action.setIcon({ path: 'icons/logo.png' });
}

// Flag to track if offscreen document is being created
let creatingOffscreen = false;
// Flag to keep track of offscreen document existence
let hasOffscreenDocument = false;

// Create an offscreen document for audio playback if needed
async function setupOffscreenDocument() {
  if (hasOffscreenDocument || creatingOffscreen) {
    return; // Already exists or being created
  }

  creatingOffscreen = true;

  try {
    // Check if the offscreen API is available
    if (!chrome.offscreen) {
      console.error('Offscreen API not available');
      return;
    }

    // Create an offscreen document
    await chrome.offscreen.createDocument({
      url: '/offscreen.html',
      reasons: ['AUDIO_PLAYBACK'],
      justification: 'Play timer completion sounds'
    });
    
    hasOffscreenDocument = true;
    console.log('Offscreen document created successfully');
  } catch (err) {
    console.error('Error creating offscreen document:', err);
    // If there's a "duplicate" error, the document might already exist
    if (err.message && err.message.includes('duplicate')) {
      hasOffscreenDocument = true;
    }
  } finally {
    creatingOffscreen = false;
  }
}

// Play notification sound based on timer type
async function playNotificationSound(type) {
  try {
    // Set up the offscreen document for audio
    await setupOffscreenDocument();

    // Send message to the offscreen document to play the sound
    if (hasOffscreenDocument) {
      // Use a try-catch block for message sending
      try {
        await chrome.runtime.sendMessage({
          target: 'offscreen',
          type: 'PLAY_SOUND',
          soundType: type
        });
        console.log('Sound message sent to offscreen document');
      } catch (err) {
        // Handle specific error about receiving end not existing
        if (err.message && err.message.includes('receiving end does not exist')) {
          console.log('Offscreen document not ready, resetting flag');
          hasOffscreenDocument = false;
          // Try again after a short delay
          setTimeout(() => playNotificationSound(type), 100);
        } else {
          console.error('Error sending message to offscreen document:', err);
        }
      }
    } else {
      console.log('No offscreen document available for sound playback');
    }
  } catch (error) {
    console.error('Error playing notification sound:', error);
  }
}

// Listen for messages from the offscreen document
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.target === 'background' && message.type === 'OFFSCREEN_CLOSED') {
    // Offscreen document was closed
    console.log('Received confirmation that offscreen document closed');
    hasOffscreenDocument = false;
  }
  // Always return false for non-async responses
  return false;
});

// Track previous time to detect timer completion
let previousTimeLeft = null;
let previousIsWorkTime = null;

// Initialize timer state
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['timerState'], (result) => {
    if (result.timerState) {
      const { timeLeft, isRunning, lastUpdated, isWorkTime } = result.timerState;
      const currentTime = Date.now();
      const elapsedSeconds = Math.floor((currentTime - lastUpdated) / 1000);
      const newTimeLeft = Math.max(0, timeLeft - elapsedSeconds);
      updateBadge(newTimeLeft, isWorkTime, isRunning);
      
      // Initialize previous values
      previousTimeLeft = newTimeLeft;
      previousIsWorkTime = isWorkTime;
    }
  });
});

// Listen for timer updates from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'TIMER_UPDATE') {
    updateBadge(message.timeLeft, message.isWorkTime, message.isRunning);
    
    // Update previous values
    previousTimeLeft = message.timeLeft;
    previousIsWorkTime = message.isWorkTime;
  } else if (message.type === 'PLAY_SOUND') {
    // Directly play a sound when requested by the popup
    chrome.storage.local.get(['settings'], (result) => {
      if (result.settings && result.settings.soundEnabled !== false) {
        playNotificationSound(message.timerType);
      }
    });
  }
  // Always return false for non-async responses
  return false;
});

// Set up alarm for timer updates every second
chrome.alarms.create('timerUpdate', { periodInMinutes: 1/60 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'timerUpdate') {
    chrome.storage.local.get(['timerState', 'settings'], (result) => {
      if (result.timerState && result.timerState.isRunning) {
        const { timeLeft, lastUpdated, isWorkTime, isRunning } = result.timerState;
        const currentTime = Date.now();
        const elapsedSeconds = Math.floor((currentTime - lastUpdated) / 1000);
        const newTimeLeft = Math.max(0, timeLeft - elapsedSeconds);
        
        // Update badge
        updateBadge(newTimeLeft, isWorkTime, isRunning);
        
        // Check if timer just completed (previousTimeLeft > 0 and newTimeLeft === 0)
        if (previousTimeLeft > 0 && newTimeLeft === 0 && isRunning) {
          // Timer completed, play sound if enabled
          if (result.settings && result.settings.soundEnabled !== false) {
            playNotificationSound(isWorkTime ? 'work' : 'break');
          }
          
          // Update timer state to switch between work/break time
          const newIsWorkTime = !isWorkTime;
          const newTimerDuration = newIsWorkTime 
            ? result.settings.workTime * 60 
            : result.settings.breakTime * 60;
            
          chrome.storage.local.set({
            timerState: {
              timeLeft: newTimerDuration,
              isRunning: false,
              isWorkTime: newIsWorkTime,
              lastUpdated: currentTime
            }
          });
          
          // Update previous values
          previousTimeLeft = newTimerDuration;
          previousIsWorkTime = newIsWorkTime;
        } else {
          // Just update previous values
          previousTimeLeft = newTimeLeft;
          previousIsWorkTime = isWorkTime;
        }
      }
    });
  }
}); 