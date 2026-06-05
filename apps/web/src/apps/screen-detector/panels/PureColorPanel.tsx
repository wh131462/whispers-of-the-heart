type Props = {
  color: string;
};

export function PureColorPanel({ color }: Props) {
  return <div className="h-full w-full" style={{ backgroundColor: color }} />;
}
