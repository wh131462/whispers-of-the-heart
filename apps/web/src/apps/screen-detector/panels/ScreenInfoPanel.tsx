import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { collectScreenInfo, type ScreenInfo } from '../utils/screenInfo';
import { useRefreshRate } from '../hooks/useRefreshRate';

type RowProps = {
  label: string;
  value: string;
};

function Row({ label, value }: RowProps) {
  return (
    <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 last:border-b-0">
      <span className="text-sm text-zinc-600">{label}</span>
      <span className="font-mono text-sm text-zinc-900">{value}</span>
    </div>
  );
}

export function ScreenInfoPanel() {
  const [info, setInfo] = useState<ScreenInfo>(() => collectScreenInfo());
  const { hz, avgFrameMs, sampling, remeasure } = useRefreshRate();

  useEffect(() => {
    const onResize = () => setInfo(collectScreenInfo());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <div className="flex h-full w-full items-center justify-center overflow-auto bg-zinc-50 p-6">
      <div
        className={cn(
          'w-full max-w-2xl overflow-hidden rounded-xl border border-zinc-200 bg-white/95 shadow-lg shadow-zinc-200/50'
        )}
      >
        <div className="border-b border-zinc-200 px-4 py-3">
          <h3 className="text-base font-semibold text-zinc-900">屏幕信息</h3>
          <p className="mt-1 text-xs text-zinc-500">
            数据来自浏览器 API，仅供参考
          </p>
        </div>
        <Row
          label="视口尺寸"
          value={`${info.viewportWidth} × ${info.viewportHeight}`}
        />
        <Row
          label="屏幕物理尺寸"
          value={`${info.screenWidth} × ${info.screenHeight}`}
        />
        <Row
          label="设备像素比 (DPR)"
          value={info.devicePixelRatio.toString()}
        />
        <Row label="颜色深度" value={`${info.colorDepth} bit`} />
        <Row label="色域 (color-gamut)" value={info.colorGamut} />
        <Row label="HDR (dynamic-range)" value={info.hdr} />
        <Row label="触摸支持" value={info.touchSupport ? '是' : '否'} />
        <Row
          label="刷新率 (估算)"
          value={
            sampling
              ? '采样中…'
              : hz !== null
                ? `${hz} Hz (avg ${avgFrameMs} ms)`
                : '未知'
          }
        />
        <div className="flex justify-end px-4 py-3">
          <button
            type="button"
            onClick={remeasure}
            disabled={sampling}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
          >
            重新测量刷新率
          </button>
        </div>
      </div>
    </div>
  );
}
