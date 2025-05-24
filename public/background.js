/* ********** Helpers Section ********** */

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
  if (isRunning) {
    chrome.action.setBadgeText({ text: formatTime(timeLeft) });
    chrome.action.setBadgeBackgroundColor({ color: isWorkTime ? '#ff0000' : '#008000' });
    chrome.action.setIcon({ path: 'icons/logo.png' });
  } else {
    disableBadge();
  }
}

function disableBadge() {
  chrome.action.setBadgeText({ text: '-' });
  chrome.action.setBadgeBackgroundColor({ color: '#94a3b8' });
  chrome.action.setIcon({ path: 'icons/logo-disabled.png' });
}

function setPreviousTimeLeft(timeLeft) {
  previousTimeLeft = timeLeft;
}

function restartMode(timeLeft, isWorkTime, sendResponse) {
  const newTimerState = {
    timeLeft: timeLeft,
    isRunning: false,
    isWorkTime: isWorkTime,
    lastUpdated: Date.now()
  }
  chrome.storage.local.set({ timerState: newTimerState }, () => {
    updateBadge(timeLeft, isWorkTime, false);
    setPreviousTimeLeft(timeLeft);
    sendResponse({ timeLeft: timeLeft, isWorkTime: isWorkTime });
  });
}

/* ********** End of Helpers Section ********** */


/* ********** Offscreen & Audio Section ********** */

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
      console.error('No offscreen document available for sound playback');
    }
  } catch (error) {
    console.error('Error playing notification sound:', error);
  }
}

// Listen for messages from the offscreen document
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.target === 'background' && message.type === 'OFFSCREEN_CLOSED') {
    // Offscreen document was closed
    hasOffscreenDocument = false;
  }
  // Always return false for non-async responses
  return false;
});

// Handle notification clicks
chrome.notifications.onClicked.addListener((notificationId) => {
  if (notificationId === 'focus-co-pilot-inactivity-alert') {
    // Clear the notification
    chrome.notifications.clear(notificationId);
    // Open the popup
    chrome.action.openPopup().catch((error) => {
      console.error('Failed to open popup from notification click:', error);
    });
  }
});

/* ********** End of Offscreen & Audio Section ********** */


/* ********** Timer Section ********** */

// Track previous time to detect timer completion
let previousTimeLeft = null;

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
    }
  });
  
  // Set up random alerts alarm
  setupBlockingAlerts();
});

// Listen for timer updates from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'TIMER_UPDATE':
      updateBadge(message.timeLeft, message.isWorkTime, message.isRunning);
      // Update previous values
      previousTimeLeft = message.timeLeft;
      break;
    case 'PLAY_SOUND':
      // Directly play a sound when requested by the popup
      chrome.storage.local.get(['settings'], (result) => {
        if (result.settings && result.settings.soundEnabled !== false) {
          playNotificationSound(message.timerType);
        }
      });
      break;
    case 'DISABLE_BADGE':
      disableBadge();
      break;
    case 'RESTART_WORK':
      chrome.storage.local.get(['settings'], (result) => {
        let workTime = 25 * 60;
        if (result.settings && typeof result.settings.workTime === 'number') {
          workTime = result.settings.workTime * 60;
        }
        restartMode(workTime, true, sendResponse);
      });
      return true;
    case 'RESTART_BREAK':
      chrome.storage.local.get(['settings'], (result) => {
        let breakTime = 5 * 60;
        if (result.settings && typeof result.settings.breakTime === 'number') {
          breakTime = result.settings.breakTime * 60;
        }
        restartMode(breakTime, false, sendResponse);
      });
      return true;
    default:
      break;
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
        if (previousTimeLeft > 0 && newTimeLeft === 0) {
          // Timer completed, play sound if enabled
          if (result.settings && result.settings.soundEnabled !== false) {
            playNotificationSound(isWorkTime ? 'work' : 'break');
          }
          disableBadge();
          
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
        } else {
          // Just update previous values
          previousTimeLeft = newTimeLeft;
        }
      }
    });
  } else if (alarm.name === 'inactivityAlert') {
    // Check if we should show an alert
    checkAndTriggerInactivityAlert();
  }
});

/* ********** End of Timer Section ********** */


/* ********** Blocking Alerts Section ********** */

// Set up random alerts with random intervals between 5-15 minutes
function setupBlockingAlerts() {
  // Create initial alarm
  scheduleNextInactivityAlert();
  
  // Store default alert settings if not already set
  chrome.storage.local.get(['alertSettings'], (result) => {
    if (!result.alertSettings) {
      chrome.storage.local.set({
        alertSettings: {
          enabled: true,
          minInterval: 5, // minimum 5 minutes
          maxInterval: 15 // maximum 15 minutes
        }
      });
    }
  });
}

// Schedule the next random alert
function scheduleNextInactivityAlert() {
  chrome.storage.local.get(['alertSettings'], (result) => {
    // Default values if settings don't exist
    const minInterval = result.alertSettings?.minInterval || 5;
    const maxInterval = result.alertSettings?.maxInterval || 15;
    const enabled = result.alertSettings?.enabled !== false;
    
    if (enabled) {
      // Calculate a random interval between min and max (in minutes)
      const randomInterval = Math.random() * (maxInterval - minInterval) + minInterval;
      
      // Clear any existing alarm
      chrome.alarms.clear('inactivityAlert', () => {
        // Create a new alarm with the random interval
        chrome.alarms.create('inactivityAlert', { delayInMinutes: randomInterval });
      });
    }
  });
}

// Check conditions and trigger alert if needed
function checkAndTriggerInactivityAlert() {
  chrome.storage.local.get(['timerState', 'settings'], (result) => {
    // Only show alert if timer is not running
    if (!result.timerState || !result.timerState.isRunning) {
      // Check if current time is within work schedule
      const schedule = result.settings?.schedule;
      if (schedule) {
        const isWorkingHours = isWithinWorkSchedule(schedule);
        if (isWorkingHours) {
          // Set a flag to show the alert in the popup
          chrome.storage.local.set({ showInactivityAlert: true });
          
          // Open the popup to show the alert
          // Check if browser window is active before opening popup
          chrome.windows.getCurrent((window) => {
            chrome.action.openPopup().catch((error) => {
              console.error('Failed to open popup:', error);
              // Fallback to notification if popup fails
              showNotification();
            });
          });
        }
      }
    }
    console.log('checkAndTriggerInactivityAlert 9');
    // Schedule the next alert regardless
    scheduleNextInactivityAlert();
  });
}

// Helper function to show notification with proper error handling
function showNotification() {
  try {
    chrome.notifications.create('focus-co-pilot-inactivity-alert', {
      type: 'basic',
      iconUrl: 'icons/logo.png',
      title: 'Focus Co-Pilot Inactivity Alert',
      message: "You've been inactive for a while. Start your work session now!",
      priority: 2
    }, (notificationId) => {
      if (chrome.runtime.lastError) {
        console.error('Notification creation failed:', chrome.runtime.lastError);
      } else {
        console.log('Notification created successfully:', notificationId);
        chrome.storage.local.set({ showInactivityAlert: false });
      }
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
}

// Helper function to check if current time is within work schedule
function isWithinWorkSchedule(schedule) {
  const now = new Date();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayOfWeek = days[now.getDay()];
  
  // Check if the current day is enabled in the schedule
  const daySchedule = schedule[dayOfWeek];
  if (!daySchedule || !daySchedule.enabled) {
    return false;
  }
  
  // Check if current time is within any of the time ranges for today
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const currentTime = `${hours}:${minutes}`;
  
  return daySchedule.timeRanges.some((range) => {
    return currentTime >= range.startTime && currentTime <= range.endTime;
  });
}

/* ********** End of Blocking Alerts Section ********** */