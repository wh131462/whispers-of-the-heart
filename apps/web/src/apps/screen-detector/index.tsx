import { useCallback, useEffect, useMemo, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { ControlBar } from './components/ControlBar';
import { FullscreenStage } from './components/FullscreenStage';
import { useFullscreen } from './hooks/useFullscreen';
import { useAutoHide } from './hooks/useAutoHide';
import { useAutoCycle } from './hooks/useAutoCycle';
import { buildPanelGroups, flattenPanels } from './panels';

const WELCOME_ID = 'welcome';
const END_ID = 'end';

export default function ScreenDetector() {
  const [currentId, setCurrentId] = useState<string>(WELCOME_ID);

  const goToWelcome = useCallback(() => setCurrentId(WELCOME_ID), []);

  const panelGroups = useMemo(
    () => buildPanelGroups({ goToWelcome }),
    [goToWelcome]
  );
  const flatPanels = useMemo(() => flattenPanels(panelGroups), [panelGroups]);
  const currentIndex = useMemo(
    () =>
      Math.max(
        0,
        flatPanels.findIndex(p => p.id === currentId)
      ),
    [flatPanels, currentId]
  );
  const currentPanel = flatPanels[currentIndex];

  const goNext = useCallback(() => {
    setCurrentId(flatPanels[(currentIndex + 1) % flatPanels.length].id);
  }, [flatPanels, currentIndex]);

  const goPrev = useCallback(() => {
    setCurrentId(
      flatPanels[(currentIndex - 1 + flatPanels.length) % flatPanels.length].id
    );
  }, [flatPanels, currentIndex]);

  const { targetRef, isFullscreen, isFakeFullscreen, toggle, exit } =
    useFullscreen();
  const autoHide = useAutoHide(isFullscreen);
  const cycle = useAutoCycle(goNext);

  const handleEnd = useCallback(() => {
    if (isFullscreen) void exit();
    setCurrentId(END_ID);
  }, [isFullscreen, exit]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          goNext();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          goPrev();
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggle();
          break;
        case 'Escape':
          if (isFullscreen) {
            e.preventDefault();
            void exit();
          }
          break;
        case ' ':
          e.preventDefault();
          cycle.toggle();
          break;
        case '[':
          e.preventDefault();
          cycle.prevInterval();
          break;
        case ']':
          e.preventDefault();
          cycle.nextInterval();
          break;
        case 'h':
        case 'H':
          if (isFullscreen) {
            e.preventDefault();
            autoHide.toggleForceHidden();
          }
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goNext, goPrev, toggle, exit, isFullscreen, cycle, autoHide]);

  const handleStageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    goNext();
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden bg-zinc-50">
      {!isFullscreen && (
        <Sidebar
          groups={panelGroups}
          currentId={currentId}
          onSelect={setCurrentId}
        />
      )}

      <div className="flex flex-1 flex-col">
        {!isFullscreen && (
          <ControlBar
            title={currentPanel?.name ?? ''}
            description={currentPanel?.description ?? ''}
            isFullscreen={false}
            isFakeFullscreen={false}
            cycleRunning={cycle.running}
            cycleIntervalMs={cycle.intervalMs}
            visible
            onPrev={goPrev}
            onNext={goNext}
            onToggleFullscreen={toggle}
            onToggleCycle={cycle.toggle}
            onEnd={handleEnd}
          />
        )}

        <FullscreenStage ref={targetRef} isFakeFullscreen={isFakeFullscreen}>
          <div className="h-full w-full" onClick={handleStageClick}>
            {currentPanel?.render()}
          </div>
          {isFullscreen && (
            <ControlBar
              title={currentPanel?.name ?? ''}
              description={currentPanel?.description ?? ''}
              isFullscreen
              isFakeFullscreen={isFakeFullscreen}
              cycleRunning={cycle.running}
              cycleIntervalMs={cycle.intervalMs}
              visible={autoHide.visible}
              onPrev={goPrev}
              onNext={goNext}
              onToggleFullscreen={toggle}
              onToggleCycle={cycle.toggle}
              onEnd={handleEnd}
            />
          )}
        </FullscreenStage>
      </div>
    </div>
  );
}
