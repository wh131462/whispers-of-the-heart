/**
 * 文件名编码工具测试
 * 用于验证中文文件名编码修复是否有效
 */

import { 
  fixFilenameEncoding, 
  containsChinese, 
  sanitizeFilename, 
  generateUniqueFilename,
  isValidFilename 
} from './filename-encoding.util';

// 测试用例
const testCases = [
  {
    name: '正常中文文件名',
    input: '测试文档.pdf',
    expected: '测试文档.pdf'
  },
  {
    name: '错误编码的中文文件名 (latin1)',
    input: Buffer.from('测试文档.pdf', 'utf8').toString('latin1'),
    expected: '测试文档.pdf'
  },
  {
    name: '包含替换字符的文件名',
    input: '����.pdf',
    expected: '测试文档.pdf' // 这取决于原始数据
  },
  {
    name: '英文文件名',
    input: 'document.pdf',
    expected: 'document.pdf'
  },
  {
    name: '中英文混合',
    input: 'My测试Document.docx',
    expected: 'My测试Document.docx'
  }
];

// 运行测试
export function runTests() {
  console.log('=== 文件名编码修复测试 ===\n');

  testCases.forEach((testCase, index) => {
    console.log(`测试 ${index + 1}: ${testCase.name}`);
    console.log(`输入: "${testCase.input}"`);
    console.log(`输入编码: ${Buffer.from(testCase.input).toString('hex')}`);
    
    const result = fixFilenameEncoding(testCase.input);
    console.log(`输出: "${result}"`);
    console.log(`输出编码: ${Buffer.from(result).toString('hex')}`);
    console.log(`包含中文: ${containsChinese(result)}`);
    console.log(`是否有效: ${isValidFilename(result)}`);
    
    if (result === testCase.expected) {
      console.log('✅ 测试通过\n');
    } else {
      console.log(`❌ 测试失败，期望: "${testCase.expected}"\n`);
    }
  });

  // 测试其他功能
  console.log('=== 其他功能测试 ===\n');

  const testFilename = '我的文档 (副本).pdf';
  console.log(`原始文件名: "${testFilename}"`);
  console.log(`安全文件名: "${sanitizeFilename(testFilename)}"`);
  console.log(`唯一文件名: "${generateUniqueFilename(testFilename)}"`);
  console.log(`包含中文: ${containsChinese(testFilename)}`);
  console.log(`是否有效: ${isValidFilename(testFilename)}`);

  // 测试无效文件名
  const invalidFilenames = [
    'con.txt', // Windows保留名
    'file<name>.txt', // 包含无效字符
    '', // 空文件名
    '   ', // 只有空格
  ];

  console.log('\n=== 无效文件名测试 ===\n');
  invalidFilenames.forEach(filename => {
    console.log(`"${filename}" 有效性: ${isValidFilename(filename)}`);
  });
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
  runTests();
}
