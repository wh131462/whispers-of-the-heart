/**
 * 安全的数学表达式求值器
 * 使用 Shunting-yard 算法解析和计算
 */

type Token = {
  type: 'number' | 'operator' | 'function' | 'lparen' | 'rparen';
  value: string;
};

// 运算符优先级
const PRECEDENCE: Record<string, number> = {
  '+': 1,
  '-': 1,
  '×': 2,
  '÷': 2,
  '%': 2,
  '^': 3,
};

// 运算符结合性（true = 右结合）
const RIGHT_ASSOCIATIVE: Record<string, boolean> = {
  '^': true,
};

// 支持的函数
const FUNCTIONS = [
  'sin',
  'cos',
  'tan',
  'asin',
  'acos',
  'atan',
  'log',
  'ln',
  'log2',
  'sqrt',
  'cbrt',
  'abs',
  'floor',
  'ceil',
  'round',
  'exp',
  'pow10',
  'fact',
];

// 显示符号到内部函数名的映射
const DISPLAY_TO_FUNC: Record<string, string> = {
  '√': 'sqrt',
  '³√': 'cbrt',
  'sin⁻¹': 'asin',
  'cos⁻¹': 'acos',
  'tan⁻¹': 'atan',
};

// 需要识别的显示符号（按长度从长到短排序）
const DISPLAY_SYMBOLS = ['sin⁻¹', 'cos⁻¹', 'tan⁻¹', '³√', '√'];

// 常数
const CONSTANTS: Record<string, number> = {
  π: Math.PI,
  e: Math.E,
};

/**
 * 词法分析：将表达式字符串转换为 token 数组
 */
function tokenize(expression: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const expr = expression.replace(/\s+/g, '');

  while (i < expr.length) {
    const char = expr[i];

    // 数字（包括小数）
    if (/\d/.test(char) || (char === '.' && /\d/.test(expr[i + 1] || ''))) {
      let num = '';
      while (i < expr.length && (/\d/.test(expr[i]) || expr[i] === '.')) {
        num += expr[i];
        i++;
      }
      tokens.push({ type: 'number', value: num });
      continue;
    }

    // 常数
    if (CONSTANTS[char] !== undefined) {
      tokens.push({ type: 'number', value: String(CONSTANTS[char]) });
      i++;
      continue;
    }

    // 显示符号（如 √、³√、sin⁻¹ 等）
    let foundSymbol = false;
    for (const symbol of DISPLAY_SYMBOLS) {
      if (expr.slice(i, i + symbol.length) === symbol) {
        const funcName = DISPLAY_TO_FUNC[symbol];
        tokens.push({ type: 'function', value: funcName });
        i += symbol.length;
        foundSymbol = true;
        break;
      }
    }
    if (foundSymbol) continue;

    // 函数
    let foundFunc = false;
    for (const fn of FUNCTIONS) {
      if (expr.slice(i, i + fn.length) === fn) {
        tokens.push({ type: 'function', value: fn });
        i += fn.length;
        foundFunc = true;
        break;
      }
    }
    if (foundFunc) continue;

    // 运算符
    if ('+-×÷%^'.includes(char)) {
      // 处理负号（一元运算符）
      if (
        char === '-' &&
        (tokens.length === 0 ||
          tokens[tokens.length - 1].type === 'operator' ||
          tokens[tokens.length - 1].type === 'lparen')
      ) {
        // 负号作为数字的一部分
        let num = '-';
        i++;
        while (i < expr.length && (/\d/.test(expr[i]) || expr[i] === '.')) {
          num += expr[i];
          i++;
        }
        if (num === '-') {
          // 如果只有负号，当作 -1 乘以后面的数
          tokens.push({ type: 'number', value: '-1' });
          tokens.push({ type: 'operator', value: '×' });
        } else {
          tokens.push({ type: 'number', value: num });
        }
        continue;
      }
      tokens.push({ type: 'operator', value: char });
      i++;
      continue;
    }

    // 括号
    if (char === '(') {
      tokens.push({ type: 'lparen', value: '(' });
      i++;
      continue;
    }
    if (char === ')') {
      tokens.push({ type: 'rparen', value: ')' });
      i++;
      continue;
    }

    // 跳过未知字符
    i++;
  }

  return tokens;
}

/**
 * Shunting-yard 算法：将中缀表达式转换为后缀表达式（逆波兰表示法）
 */
function toPostfix(tokens: Token[]): Token[] {
  const output: Token[] = [];
  const operatorStack: Token[] = [];

  for (const token of tokens) {
    switch (token.type) {
      case 'number':
        output.push(token);
        break;

      case 'function':
        operatorStack.push(token);
        break;

      case 'operator': {
        while (operatorStack.length > 0) {
          const top = operatorStack[operatorStack.length - 1];
          if (top.type === 'lparen' || top.type === 'function') break;

          const topPrec = PRECEDENCE[top.value] || 0;
          const tokenPrec = PRECEDENCE[token.value] || 0;

          if (
            topPrec > tokenPrec ||
            (topPrec === tokenPrec && !RIGHT_ASSOCIATIVE[token.value])
          ) {
            output.push(operatorStack.pop()!);
          } else {
            break;
          }
        }
        operatorStack.push(token);
        break;
      }

      case 'lparen':
        operatorStack.push(token);
        break;

      case 'rparen':
        while (
          operatorStack.length > 0 &&
          operatorStack[operatorStack.length - 1].type !== 'lparen'
        ) {
          output.push(operatorStack.pop()!);
        }
        operatorStack.pop(); // 弹出左括号

        // 如果栈顶是函数，也弹出
        if (
          operatorStack.length > 0 &&
          operatorStack[operatorStack.length - 1].type === 'function'
        ) {
          output.push(operatorStack.pop()!);
        }
        break;
    }
  }

  // 将剩余的运算符弹出
  while (operatorStack.length > 0) {
    output.push(operatorStack.pop()!);
  }

  return output;
}

/**
 * 阶乘计算
 */
function factorial(n: number): number {
  if (n < 0) throw new Error('负数没有阶乘');
  if (n === 0 || n === 1) return 1;
  if (n > 170) throw new Error('数值过大');
  if (!Number.isInteger(n)) throw new Error('阶乘只支持整数');

  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}

/**
 * 计算后缀表达式
 */
function evaluatePostfix(
  tokens: Token[],
  angleMode: 'DEG' | 'RAD' = 'DEG'
): number {
  const stack: number[] = [];

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  for (const token of tokens) {
    if (token.type === 'number') {
      stack.push(parseFloat(token.value));
      continue;
    }

    if (token.type === 'operator') {
      const b = stack.pop()!;
      const a = stack.pop()!;

      switch (token.value) {
        case '+':
          stack.push(a + b);
          break;
        case '-':
          stack.push(a - b);
          break;
        case '×':
          stack.push(a * b);
          break;
        case '÷':
          if (b === 0) throw new Error('除数不能为零');
          stack.push(a / b);
          break;
        case '%':
          stack.push(a % b);
          break;
        case '^':
          stack.push(Math.pow(a, b));
          break;
      }
      continue;
    }

    if (token.type === 'function') {
      const a = stack.pop()!;

      switch (token.value) {
        case 'sin':
          stack.push(Math.sin(angleMode === 'DEG' ? toRad(a) : a));
          break;
        case 'cos':
          stack.push(Math.cos(angleMode === 'DEG' ? toRad(a) : a));
          break;
        case 'tan':
          stack.push(Math.tan(angleMode === 'DEG' ? toRad(a) : a));
          break;
        case 'asin':
          stack.push(angleMode === 'DEG' ? toDeg(Math.asin(a)) : Math.asin(a));
          break;
        case 'acos':
          stack.push(angleMode === 'DEG' ? toDeg(Math.acos(a)) : Math.acos(a));
          break;
        case 'atan':
          stack.push(angleMode === 'DEG' ? toDeg(Math.atan(a)) : Math.atan(a));
          break;
        case 'log':
          stack.push(Math.log10(a));
          break;
        case 'ln':
          stack.push(Math.log(a));
          break;
        case 'log2':
          stack.push(Math.log2(a));
          break;
        case 'sqrt':
          if (a < 0) throw new Error('负数没有实数平方根');
          stack.push(Math.sqrt(a));
          break;
        case 'cbrt':
          stack.push(Math.cbrt(a));
          break;
        case 'abs':
          stack.push(Math.abs(a));
          break;
        case 'floor':
          stack.push(Math.floor(a));
          break;
        case 'ceil':
          stack.push(Math.ceil(a));
          break;
        case 'round':
          stack.push(Math.round(a));
          break;
        case 'exp':
          stack.push(Math.exp(a));
          break;
        case 'pow10':
          stack.push(Math.pow(10, a));
          break;
        case 'fact':
          stack.push(factorial(a));
          break;
      }
    }
  }

  return stack[0];
}

/**
 * 主入口：安全计算数学表达式
 */
export function evaluate(
  expression: string,
  angleMode: 'DEG' | 'RAD' = 'DEG'
): string {
  try {
    if (!expression || expression.trim() === '') {
      return '0';
    }

    const tokens = tokenize(expression);
    if (tokens.length === 0) {
      return '0';
    }

    const postfix = toPostfix(tokens);
    const result = evaluatePostfix(postfix, angleMode);

    if (!isFinite(result)) {
      throw new Error('结果无穷大或无效');
    }

    // 格式化结果，避免浮点精度问题
    const formatted = parseFloat(result.toPrecision(15));

    // 如果结果是整数，直接返回；否则保留合理的小数位
    if (Number.isInteger(formatted)) {
      return String(formatted);
    }

    // 移除尾随的零
    return String(formatted).replace(/\.?0+$/, '');
  } catch (error) {
    throw error instanceof Error ? error : new Error('计算错误');
  }
}

/**
 * 格式化显示数字
 */
export function formatDisplay(value: string): string {
  if (!value || value === '') return '0';

  const num = parseFloat(value);
  if (isNaN(num)) return value;

  // 使用 toLocaleString 添加千分位分隔符
  if (Number.isInteger(num) && Math.abs(num) < 1e15) {
    return num.toLocaleString('en-US');
  }

  // 科学计数法处理大数
  if (Math.abs(num) >= 1e15 || (Math.abs(num) < 1e-10 && num !== 0)) {
    return num.toExponential(10).replace(/\.?0+e/, 'e');
  }

  return value;
}
