export interface TimeRange {
  startTime: string;
  endTime: string;
}

export interface DaySchedule {
  enabled: boolean;
  timeRanges: TimeRange[];
}

export interface WeekSchedule {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
} 