// 密码选项
export interface PasswordOptions {
  length: number; // 8-128
  uppercase: boolean; // A-Z
  lowercase: boolean; // a-z
  numbers: boolean; // 0-9
  symbols: boolean; // !@#$%^&*
  excludeAmbiguous: boolean; // 排除易混淆字符 0O1lI
}

// 密码强度等级
export type StrengthLevel = 'weak' | 'fair' | 'good' | 'strong' | 'excellent';

// 强度信息
export interface StrengthInfo {
  level: StrengthLevel;
  score: number; // 0-100
  label: string;
}
