import React, { useState } from 'react'
import { MarkdownRenderer } from '@whispers/ui'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Textarea } from '../components/ui/textarea'
import ProtectedPage from '../components/ProtectedPage'

const MarkdownTestPage: React.FC = () => {
  const [markdownContent, setMarkdownContent] = useState(`# Markdown 渲染测试

这是一个用于测试 **MarkdownRenderer** 组件的页面。

## 基本格式测试

### 文本格式
- **粗体文本**
- *斜体文本*
- ~~删除线文本~~
- \`行内代码\`

### 列表测试

#### 无序列表
- 项目 1
- 项目 2
  - 嵌套项目 2.1
  - 嵌套项目 2.2
- 项目 3

#### 有序列表
1. 第一项
2. 第二项
3. 第三项

### 引用块
> 这是一个引用块的示例
> 可以包含多行内容

### 代码块

\`\`\`javascript
function greet(name) {
  console.log("Hello, " + name + "!");
}

greet("World");
\`\`\`

### 表格

| 姓名 | 年龄 | 城市 |
|------|------|------|
| 张三 | 25   | 北京 |
| 李四 | 30   | 上海 |
| 王五 | 28   | 广州 |

### 链接和图片

[访问 GitHub](https://github.com)

![示例图片](https://picsum.photos/300/200)

### 分割线

---

## 任务列表

- [x] 已完成的任务
- [ ] 未完成的任务
- [x] 另一个已完成的任务

### 数学公式（如果支持）

内联数学：$E = mc^2$

块级数学：
$$
\\sum_{i=1}^{n} x_i = x_1 + x_2 + \\ldots + x_n
$$

---

*测试完成！*`)

  const testSamples = [
    {
      name: '简单文本',
      content: '这是一段**简单**的Markdown文本，包含*斜体*和`代码`。'
    },
    {
      name: '标题测试',
      content: '# 一级标题\n## 二级标题\n### 三级标题\n#### 四级标题'
    },
    {
      name: '列表测试',
      content: '## 购物清单\n- 苹果\n- 香蕉\n- 橙子\n\n## 待办事项\n1. 写代码\n2. 测试功能\n3. 修复bug'
    },
    {
      name: '代码块测试',
      content: '```javascript\nfunction hello() {\n  console.log("Hello, World!");\n}\n\nhello();\n```'
    },
    {
      name: '引用和链接',
      content: '> 这是一个重要的引用\n\n访问我们的[官网](https://example.com)了解更多信息。'
    }
  ]

  return (
    <ProtectedPage>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Markdown 渲染器测试</h1>
          <p className="text-gray-600">测试修复后的 MarkdownRenderer 组件功能</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 输入区域 */}
          <Card>
            <CardHeader>
              <CardTitle>Markdown 输入</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={markdownContent}
                onChange={(e) => setMarkdownContent(e.target.value)}
                placeholder="在此输入 Markdown 内容..."
                className="min-h-[400px] font-mono text-sm"
              />
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">快速测试样本：</p>
                <div className="flex flex-wrap gap-2">
                  {testSamples.map((sample, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => setMarkdownContent(sample.content)}
                    >
                      {sample.name}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 渲染结果 */}
          <Card>
            <CardHeader>
              <CardTitle>渲染结果</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-4 min-h-[400px] bg-white">
                <MarkdownRenderer 
                  content={markdownContent}
                  className="max-w-none"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 功能测试区域 */}
        <Card>
          <CardHeader>
            <CardTitle>功能测试结果</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="border rounded p-3">
                  <h4 className="font-medium mb-2">基本格式</h4>
                  <MarkdownRenderer content="**粗体** *斜体* `代码`" />
                </div>
                
                <div className="border rounded p-3">
                  <h4 className="font-medium mb-2">列表</h4>
                  <MarkdownRenderer content="- 项目 1\n- 项目 2\n- 项目 3" />
                </div>
                
                <div className="border rounded p-3">
                  <h4 className="font-medium mb-2">引用</h4>
                  <MarkdownRenderer content="> 这是一个引用示例" />
                </div>
                
                <div className="border rounded p-3">
                  <h4 className="font-medium mb-2">标题</h4>
                  <MarkdownRenderer content="# 标题 1\n## 标题 2" />
                </div>
                
                <div className="border rounded p-3">
                  <h4 className="font-medium mb-2">链接</h4>
                  <MarkdownRenderer content="[GitHub](https://github.com)" />
                </div>
                
                <div className="border rounded p-3">
                  <h4 className="font-medium mb-2">代码块</h4>
                  <MarkdownRenderer content="```js\nconsole.log('Hello');\n```" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedPage>
  )
}

export default MarkdownTestPage
