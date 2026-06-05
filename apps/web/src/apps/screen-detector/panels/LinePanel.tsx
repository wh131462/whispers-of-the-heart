export type LineDirection = 'horizontal' | 'vertical' | 'diagonal';

type Props = {
  direction: LineDirection;
  step: 1 | 2;
};

function buildBackground(direction: LineDirection, step: 1 | 2): string {
  const total = step * 2;
  if (direction === 'horizontal') {
    return `repeating-linear-gradient(to bottom, #000 0 ${step}px, #fff ${step}px ${total}px)`;
  }
  if (direction === 'vertical') {
    return `repeating-linear-gradient(to right, #000 0 ${step}px, #fff ${step}px ${total}px)`;
  }
  return `repeating-linear-gradient(45deg, #000 0 ${step}px, #fff ${step}px ${total}px)`;
}

export function LinePanel({ direction, step }: Props) {
  return (
    <div
      className="h-full w-full"
      style={{ background: buildBackground(direction, step) }}
    />
  );
}
