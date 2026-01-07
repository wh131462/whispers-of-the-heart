export type ViewMode = 'code' | 'tree';
export type IndentSize = 2 | 4;

export interface JsonState {
  input: string;
  output: string;
  error: string | null;
  viewMode: ViewMode;
  indentSize: IndentSize;
  isValid: boolean;
  stats: JsonStats | null;
}

export interface JsonStats {
  keys: number;
  arrays: number;
  objects: number;
  strings: number;
  numbers: number;
  booleans: number;
  nulls: number;
  depth: number;
}

export interface TreeNode {
  key: string;
  value: unknown;
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
  children?: TreeNode[];
  expanded?: boolean;
}
