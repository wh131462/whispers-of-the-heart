import {
  CONTRAST_DARK,
  CONTRAST_LIGHT,
  grayscaleToHex,
  textColorForGrayscale,
} from '../utils/contrast';

type Props = {
  variant: 'dark' | 'light';
};

export function ContrastPanel({ variant }: Props) {
  const cells = variant === 'dark' ? CONTRAST_DARK : CONTRAST_LIGHT;
  return (
    <div className="grid h-full w-full grid-cols-10 grid-rows-4">
      {cells.map((cell, i) => {
        const bg = grayscaleToHex(cell.value);
        const fg = textColorForGrayscale(cell.value);
        return (
          <div
            key={i}
            className="flex flex-col items-center justify-center text-center"
            style={{
              backgroundColor: bg,
              color: fg,
              fontSize: 'clamp(10px, 1.2vw, 16px)',
            }}
          >
            <span>{cell.percent.toFixed(2)}%</span>
            <span style={{ opacity: 0.85 }}>({cell.value}/255)</span>
          </div>
        );
      })}
    </div>
  );
}
