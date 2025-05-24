import { WeekSchedule, TimeRange } from '../types/schedule';

/**
 * Checks if the current time is within the user's work schedule
 */
export const isWithinWorkSchedule = (schedule: WeekSchedule): boolean => {
  const now = new Date();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayOfWeek = days[now.getDay()] as keyof WeekSchedule;
  
  // Check if the current day is enabled in the schedule
  const daySchedule = schedule[dayOfWeek];
  if (!daySchedule || !daySchedule.enabled) {
    return false;
  }
  
  // Check if current time is within any of the time ranges for today
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  return daySchedule.timeRanges.some((range: TimeRange) => {
    return currentTime >= range.startTime && currentTime <= range.endTime;
  });
};

/**
 * Generates random alert messages for inactive periods
 */
export const getRandomAlertMessage = (): string => {
  const messages = [
    "It looks like you're taking a break. Ready to get back to focused work?",
    "Don't let your focus fade away! Time to restart your Pomodoro timer.",
    "Remember your goals! Let's get back to focused work.",
    "Your productivity is waiting. Start your work session now!",
    "Taking too long of a break can disrupt your flow. Ready to focus again?",
    "Time flies when you're not tracking it. Let's restart your work session.",
    "Keep the momentum going! It's time to focus again.",
    "A small action now leads to big results later. Start your timer!",
    "Staying on track means staying on schedule. Ready to focus?",
    "Your future self will thank you for focusing now. Let's start!"
  ];
  
  return messages[Math.floor(Math.random() * messages.length)];
}; 