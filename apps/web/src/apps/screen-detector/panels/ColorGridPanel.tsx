const COLORS = [
  '#ff0000',
  '#00ff00',
  '#0000ff',
  '#00ffff',
  '#ff00ff',
  '#ffff00',
];
const TILE = 80;

export function ColorGridPanel() {
  return (
    <div
      className="grid h-full w-full content-start"
      style={{ gridTemplateColumns: `repeat(auto-fill, ${TILE}px)` }}
    >
      {Array.from({ length: 2000 }, (_, i) => (
        <div
          key={i}
          style={{
            width: TILE,
            height: TILE,
            backgroundColor: COLORS[i % COLORS.length],
          }}
        />
      ))}
    </div>
  );
}
