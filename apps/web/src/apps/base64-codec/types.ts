export type InputMode = 'text' | 'file';
export type Direction = 'encode' | 'decode';

export interface Base64State {
  mode: InputMode;
  direction: Direction;
  input: string;
  output: string;
  error: string | null;
  fileName: string | null;
  fileType: string | null;
  fileSize: number | null;
}

export interface FileInfo {
  name: string;
  type: string;
  size: number;
  data: string; // base64 data
}
