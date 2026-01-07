export type TimestampUnit = 'seconds' | 'milliseconds';

export interface TimeFormat {
  id: string;
  label: string;
  format: (date: Date, timezone: string) => string;
}

export interface TimestampState {
  timestamp: string;
  unit: TimestampUnit;
  datetime: Date | null;
  timezone: string;
  error: string | null;
}

export interface CommonTimezone {
  id: string;
  label: string;
  offset: string;
}
