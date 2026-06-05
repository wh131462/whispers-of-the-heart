import { useCallback, useEffect, useRef, useState } from 'react';

type FsElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void>;
};

type FsDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void>;
};

export function useFullscreen() {
  const targetRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFakeFullscreen, setIsFakeFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => {
      const doc = document as FsDocument;
      const fsEl = document.fullscreenElement ?? doc.webkitFullscreenElement;
      setIsFullscreen(Boolean(fsEl));
      if (fsEl) setIsFakeFullscreen(false);
    };
    document.addEventListener('fullscreenchange', onChange);
    document.addEventListener('webkitfullscreenchange', onChange);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      document.removeEventListener('webkitfullscreenchange', onChange);
    };
  }, []);

  const enter = useCallback(async () => {
    const el = targetRef.current as FsElement | null;
    if (!el) return;
    try {
      if (el.requestFullscreen) {
        await el.requestFullscreen();
      } else if (el.webkitRequestFullscreen) {
        await el.webkitRequestFullscreen();
      } else {
        setIsFakeFullscreen(true);
      }
    } catch {
      setIsFakeFullscreen(true);
    }
  }, []);

  const exit = useCallback(async () => {
    const doc = document as FsDocument;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else if (doc.webkitFullscreenElement && doc.webkitExitFullscreen) {
      await doc.webkitExitFullscreen();
    }
    setIsFakeFullscreen(false);
  }, []);

  const toggle = useCallback(() => {
    if (isFullscreen || isFakeFullscreen) {
      void exit();
    } else {
      void enter();
    }
  }, [isFullscreen, isFakeFullscreen, enter, exit]);

  return {
    targetRef,
    isFullscreen: isFullscreen || isFakeFullscreen,
    isFakeFullscreen,
    enter,
    exit,
    toggle,
  };
}
