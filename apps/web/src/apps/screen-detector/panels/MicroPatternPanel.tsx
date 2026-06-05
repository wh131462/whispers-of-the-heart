const PATCH_STYLE: React.CSSProperties = {
  width: 200,
  height: 200,
  backgroundImage: 'repeating-conic-gradient(#fff 0 25%, #000 0 50%)',
  backgroundSize: '4px 4px',
};

export function MicroPatternPanel() {
  return (
    <div className="relative h-full w-full" style={{ backgroundColor: '#000' }}>
      <div className="absolute left-8 top-8" style={PATCH_STYLE} />
      <div className="absolute right-8 top-8" style={PATCH_STYLE} />
      <div className="absolute bottom-8 left-8" style={PATCH_STYLE} />
      <div className="absolute bottom-8 right-8" style={PATCH_STYLE} />
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={PATCH_STYLE}
      />
    </div>
  );
}
