// Audio context for sound generation
let audioContext = null;
// Track if we're currently playing a sound
let isPlayingSound = false;

// Initialize audio context
function initAudioContext() {
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      console.log('Audio context initialized');
    } catch (err) {
      console.error('Failed to initialize audio context:', err);
    }
  }
  return audioContext;
}

// Play work completion sound (higher pitch, double beep)
function playWorkCompletionSound(context) {
  if (!context) return 0;
  
  try {
    // First beep
    const oscillator1 = context.createOscillator();
    const gainNode1 = context.createGain();
    
    oscillator1.type = 'sine';
    oscillator1.frequency.value = 880; // A5 note
    
    gainNode1.gain.value = 0;
    
    oscillator1.connect(gainNode1);
    gainNode1.connect(context.destination);
    
    // Start with fade in
    const now = context.currentTime;
    gainNode1.gain.setValueAtTime(0, now);
    gainNode1.gain.linearRampToValueAtTime(0.5, now + 0.1);
    
    // Fade out
    gainNode1.gain.linearRampToValueAtTime(0, now + 0.5);
    
    oscillator1.start(now);
    oscillator1.stop(now + 0.5);
    
    // Second beep after a short delay
    const oscillator2 = context.createOscillator();
    const gainNode2 = context.createGain();
    
    oscillator2.type = 'sine';
    oscillator2.frequency.value = 880; // Same note
    
    gainNode2.gain.value = 0;
    
    oscillator2.connect(gainNode2);
    gainNode2.connect(context.destination);
    
    // Start with fade in
    gainNode2.gain.setValueAtTime(0, now + 0.7);
    gainNode2.gain.linearRampToValueAtTime(0.5, now + 0.8);
    
    // Fade out
    gainNode2.gain.linearRampToValueAtTime(0, now + 1.2);
    
    oscillator2.start(now + 0.7);
    oscillator2.stop(now + 1.2);
    
    console.log('Work completion sound played successfully');
    
    // Return the duration of the sound
    return 1.3; // seconds
  } catch (err) {
    console.error('Error playing work completion sound:', err);
    return 0;
  }
}

// Play break completion sound (lower pitch, single longer beep)
function playBreakCompletionSound(context) {
  if (!context) return 0;
  
  try {
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.value = 523.25; // C5 note
    
    gainNode.gain.value = 0;
    
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    
    // Start with fade in
    const now = context.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.4, now + 0.1);
    
    // Hold tone
    gainNode.gain.setValueAtTime(0.4, now + 0.4);
    
    // Fade out
    gainNode.gain.linearRampToValueAtTime(0, now + 0.8);
    
    oscillator.start(now);
    oscillator.stop(now + 0.8);
    
    console.log('Break completion sound played successfully');
    
    // Return the duration of the sound
    return 0.9; // seconds
  } catch (err) {
    console.error('Error playing break completion sound:', err);
    return 0;
  }
}

// Play notification sound based on timer type
function playNotificationSound(type) {
  if (isPlayingSound) {
    console.log('Already playing sound, ignoring request');
    return 1.5; // Return a default duration
  }
  
  isPlayingSound = true;
  
  try {
    const context = initAudioContext();
    let duration = 0;
    
    if (type === 'work') {
      duration = playWorkCompletionSound(context);
    } else {
      duration = playBreakCompletionSound(context);
    }
    
    return duration || 1.5; // Default to 1.5s if duration is 0
  } catch (error) {
    console.error('Error playing notification sound in offscreen document:', error);
    return 1.5; // Default duration
  } finally {
    // Reset the playing flag after a short delay
    setTimeout(() => {
      isPlayingSound = false;
    }, 1500);
  }
}

// Close the offscreen document after sound playback
function closeAfterSound(duration) {
  const buffer = 500; // Additional buffer time in ms
  const totalDelay = duration * 1000 + buffer;
  
  console.log(`Scheduling offscreen document close in ${totalDelay}ms`);
  
  setTimeout(() => {
    try {
      // Notify background script before closing
      chrome.runtime.sendMessage({
        target: 'background',
        type: 'OFFSCREEN_CLOSED'
      }).catch(err => {
        console.log('Error notifying background of closure (might be ok):', err);
      });
      
      // Close the document if the API is available
      if (chrome.offscreen && chrome.offscreen.closeDocument) {
        chrome.offscreen.closeDocument().catch(err => {
          console.error('Error closing offscreen document:', err);
        });
      }
    } catch (err) {
      console.error('Error during offscreen document cleanup:', err);
    }
  }, totalDelay);
}

// Listen for messages from the service worker
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Offscreen document received message:', message);
  
  // Only handle messages targeted to this offscreen document
  if (message.target === 'offscreen' && message.type === 'PLAY_SOUND') {
    console.log('Playing sound:', message.soundType);
    
    // Play the requested sound and get duration
    const duration = playNotificationSound(message.soundType);
    
    // Schedule closing the document after sound finishes
    closeAfterSound(duration);
    
    // Send immediate response
    sendResponse({ success: true });
    
    // Return true to indicate we'll send a response asynchronously
    return true;
  }
});

// Initialize AudioContext when page loads
document.addEventListener('DOMContentLoaded', () => {
  // Initialize audio context
  initAudioContext();
  console.log('Offscreen document ready for audio playback');
}); 