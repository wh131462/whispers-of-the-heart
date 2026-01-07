import { useState, useCallback, useEffect, useMemo } from 'react';
import type { TimestampState, TimestampUnit } from '../types';
import { getLocalTimezone, timeFormats } from '../utils/formats';

const initialState: TimestampState = {
  timestamp: '',
  unit: 'seconds',
  datetime: null,
  timezone: getLocalTimezone(),
  error: null,
};

export function useTimestamp() {
  const [state, setState] = useState<TimestampState>(initialState);
  const [currentTime, setCurrentTime] = useState(new Date());

  // 实时更新当前时间
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 设置时间戳
  const setTimestamp = useCallback((timestamp: string) => {
    setState(prev => {
      if (!timestamp.trim()) {
        return { ...prev, timestamp, datetime: null, error: null };
      }

      const num = parseInt(timestamp, 10);
      if (isNaN(num)) {
        return { ...prev, timestamp, datetime: null, error: '无效的时间戳' };
      }

      const ms = prev.unit === 'seconds' ? num * 1000 : num;
      const date = new Date(ms);

      if (isNaN(date.getTime())) {
        return { ...prev, timestamp, datetime: null, error: '无效的时间戳' };
      }

      return { ...prev, timestamp, datetime: date, error: null };
    });
  }, []);

  // 设置单位
  const setUnit = useCallback((unit: TimestampUnit) => {
    setState(prev => {
      if (!prev.timestamp.trim()) {
        return { ...prev, unit };
      }

      const num = parseInt(prev.timestamp, 10);
      if (isNaN(num)) {
        return { ...prev, unit };
      }

      // 转换时间戳
      let newTimestamp: string;
      if (prev.unit === 'seconds' && unit === 'milliseconds') {
        newTimestamp = String(num * 1000);
      } else if (prev.unit === 'milliseconds' && unit === 'seconds') {
        newTimestamp = String(Math.floor(num / 1000));
      } else {
        newTimestamp = prev.timestamp;
      }

      const ms =
        unit === 'seconds'
          ? parseInt(newTimestamp, 10) * 1000
          : parseInt(newTimestamp, 10);
      const date = new Date(ms);

      return { ...prev, unit, timestamp: newTimestamp, datetime: date };
    });
  }, []);

  // 设置时区
  const setTimezone = useCallback((timezone: string) => {
    setState(prev => ({ ...prev, timezone }));
  }, []);

  // 从日期时间设置时间戳
  const setFromDatetime = useCallback((date: Date) => {
    setState(prev => {
      const ms = date.getTime();
      const timestamp =
        prev.unit === 'seconds' ? String(Math.floor(ms / 1000)) : String(ms);

      return { ...prev, timestamp, datetime: date, error: null };
    });
  }, []);

  // 设置为当前时间
  const setNow = useCallback(() => {
    const now = new Date();
    setFromDatetime(now);
  }, [setFromDatetime]);

  // 清空
  const clear = useCallback(() => {
    setState(prev => ({
      ...initialState,
      unit: prev.unit,
      timezone: prev.timezone,
    }));
  }, []);

  // 复制时间戳
  const copyTimestamp = useCallback(async () => {
    if (!state.timestamp) return false;
    try {
      await navigator.clipboard.writeText(state.timestamp);
      return true;
    } catch {
      return false;
    }
  }, [state.timestamp]);

  // 当前时间的各种格式
  const currentTimeFormats = useMemo(() => {
    return timeFormats.map(format => ({
      ...format,
      value: format.format(currentTime, state.timezone),
    }));
  }, [currentTime, state.timezone]);

  // 转换结果的各种格式
  const resultFormats = useMemo(() => {
    if (!state.datetime) return [];
    return timeFormats.map(format => ({
      ...format,
      value: format.format(state.datetime!, state.timezone),
    }));
  }, [state.datetime, state.timezone]);

  // 当前时间戳
  const currentTimestamp = useMemo(() => {
    const ms = currentTime.getTime();
    return {
      seconds: Math.floor(ms / 1000),
      milliseconds: ms,
    };
  }, [currentTime]);

  return {
    state,
    currentTime,
    currentTimestamp,
    currentTimeFormats,
    resultFormats,
    setTimestamp,
    setUnit,
    setTimezone,
    setFromDatetime,
    setNow,
    clear,
    copyTimestamp,
  };
}
