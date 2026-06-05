import { useCallback, useEffect, useRef, useState } from 'react';

const HIDE_DELAY_MS = 1500;

export function useAutoHide(enabled: boolean) {
  const [visible, setVisible] = useState(true);
  const [forceHidden, setForceHidden] = useState(false);
  const timerRef = useRef<number | null>(null);

  const clear = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const schedule = useCallback(() => {
    clear();
    timerRef.current = window.setTimeout(() => {
      setVisible(false);
    }, HIDE_DELAY_MS);
  }, []);

  const wake = useCallback(() => {
    if (forceHidden) return;
    setVisible(true);
    schedule();
  }, [forceHidden, schedule]);

  const toggleForceHidden = useCallback(() => {
    setForceHidden(prev => {
      const next = !prev;
      if (next) {
        setVisible(false);
        clear();
      } else {
        setVisible(true);
        schedule();
      }
      return next;
    });
  }, [schedule]);

  useEffect(() => {
    if (!enabled) {
      setVisible(true);
      clear();
      return;
    }
    if (forceHidden) {
      setVisible(false);
      return;
    }
    schedule();
    return clear;
  }, [enabled, forceHidden, schedule]);

  useEffect(() => {
    if (!enabled) return;
    const onMove = () => wake();
    const onKey = () => wake();
    window.addEventListener('mousemove', onMove);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('keydown', onKey);
    };
  }, [enabled, wake]);

  return {
    visible: enabled ? visible && !forceHidden : true,
    forceHidden,
    toggleForceHidden,
    wake,
  };
}
