import { useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = 640; // sm breakpoint

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    // 初始检测
    checkIsMobile();

    // 监听窗口大小变化
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return isMobile;
}
