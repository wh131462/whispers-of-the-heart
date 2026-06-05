export type ScreenInfo = {
  viewportWidth: number;
  viewportHeight: number;
  screenWidth: number;
  screenHeight: number;
  devicePixelRatio: number;
  colorDepth: number;
  colorGamut: 'srgb' | 'p3' | 'rec2020' | 'unknown';
  hdr: 'high' | 'standard' | 'unknown';
  touchSupport: boolean;
};

function detectColorGamut(): ScreenInfo['colorGamut'] {
  if (typeof window === 'undefined' || !window.matchMedia) return 'unknown';
  if (window.matchMedia('(color-gamut: rec2020)').matches) return 'rec2020';
  if (window.matchMedia('(color-gamut: p3)').matches) return 'p3';
  if (window.matchMedia('(color-gamut: srgb)').matches) return 'srgb';
  return 'unknown';
}

function detectHdr(): ScreenInfo['hdr'] {
  if (typeof window === 'undefined' || !window.matchMedia) return 'unknown';
  try {
    if (window.matchMedia('(dynamic-range: high)').matches) return 'high';
    if (window.matchMedia('(dynamic-range: standard)').matches)
      return 'standard';
  } catch {
    return 'unknown';
  }
  return 'unknown';
}

export function collectScreenInfo(): ScreenInfo {
  return {
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    devicePixelRatio: window.devicePixelRatio,
    colorDepth: window.screen.colorDepth,
    colorGamut: detectColorGamut(),
    hdr: detectHdr(),
    touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
  };
}
