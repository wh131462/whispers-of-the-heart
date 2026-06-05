type Props = {
  to: string;
};

export function GradientPanel({ to }: Props) {
  return (
    <div
      className="h-full w-full"
      style={{ background: `linear-gradient(to right, #000000, ${to})` }}
    />
  );
}
