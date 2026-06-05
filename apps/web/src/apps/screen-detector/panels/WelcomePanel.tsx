import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { collectScreenInfo, type ScreenInfo } from '../utils/screenInfo';

export function WelcomePanel() {
  const [info, setInfo] = useState<ScreenInfo>(() => collectScreenInfo());

  useEffect(() => {
    const onResize = () => setInfo(collectScreenInfo());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <div className="flex h-full w-full items-center justify-center overflow-auto bg-zinc-50 p-6">
      <div
        className={cn(
          'w-full max-w-2xl rounded-xl border border-zinc-200 bg-white/95 p-6 shadow-lg shadow-zinc-200/50'
        )}
      >
        <h2 className="mb-3 text-xl font-semibold text-zinc-900">
          在线屏幕检测
        </h2>
        <p className="mb-4 text-sm leading-relaxed text-zinc-600">
          想知道屏幕是否有缺陷？本工具提供纯色、漏光、干扰、对焦、呼吸效应、对比度、色阶、饱和度等检测项，覆盖手动目视检测的常见需求。
        </p>

        <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg border border-zinc-200 bg-white p-3">
            <div className="text-xs text-zinc-500">当前视口</div>
            <div className="mt-1 font-mono text-zinc-900">
              {info.viewportWidth} × {info.viewportHeight}
            </div>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-3">
            <div className="text-xs text-zinc-500">屏幕分辨率</div>
            <div className="mt-1 font-mono text-zinc-900">
              {info.screenWidth} × {info.screenHeight} × {info.colorDepth}bit
            </div>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-3">
            <div className="text-xs text-zinc-500">DPR</div>
            <div className="mt-1 font-mono text-zinc-900">
              {info.devicePixelRatio}
            </div>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-3">
            <div className="text-xs text-zinc-500">色域 / HDR</div>
            <div className="mt-1 font-mono text-zinc-900">
              {info.colorGamut} / {info.hdr}
            </div>
          </div>
        </div>

        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
          <strong>光敏警告：</strong>
          「闪烁方块」面板会以 ~2Hz
          的频率闪烁。光敏性癫痫患者或对闪烁敏感者请避免使用该面板。
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-3 text-xs leading-relaxed text-zinc-500">
          <strong className="text-zinc-700">键盘操作：</strong>
          <ul className="mt-2 space-y-1">
            <li>← / → 切换上一项 / 下一项</li>
            <li>F 进入或退出全屏，Esc 退出全屏</li>
            <li>Space 自动巡检；[ / ] 切换 1s/2s/5s 间隔</li>
            <li>H 强制隐藏控制条，R 清空多点触控轨迹</li>
            <li>单击主画布空白 → 下一项</li>
          </ul>
        </div>

        <p className="mt-4 text-xs text-zinc-500">
          请关闭浏览器缩放以获取最准确的分辨率信息。本工具仅供参考，不能代替专业检测器械。
        </p>
      </div>
    </div>
  );
}
