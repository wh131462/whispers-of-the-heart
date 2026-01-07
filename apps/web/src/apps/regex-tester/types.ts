export interface RegexFlags {
  global: boolean; // g
  ignoreCase: boolean; // i
  multiline: boolean; // m
  dotAll: boolean; // s
  unicode: boolean; // u
}

export interface MatchResult {
  match: string;
  index: number;
  length: number;
  groups: string[];
  namedGroups?: Record<string, string>;
}

export interface RegexState {
  pattern: string;
  flags: RegexFlags;
  testString: string;
  matches: MatchResult[];
  error: string | null;
  isValid: boolean;
}

export interface CommonPattern {
  id: string;
  name: string;
  pattern: string;
  description: string;
  flags?: Partial<RegexFlags>;
}
