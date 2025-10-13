interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

const API_URL = 'https://api.siliconflow.cn/v1/chat/completions';
const API_KEY = 'sk-akaemjzequsiwfzyfpijamrnsuvvfeicsbtsqnzqshfvxexv';

export class AIService {
  private static async callAPI(messages: Message[]): Promise<string> {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-ai/DeepSeek-V3',
        messages,
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data: ChatCompletionResponse = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  // 生成多个不同的答案
  static async generateMultipleResponses(
    userMessage: string,
    count: number = 20,
    onProgress?: (index: number, content: string, htmlCode: string) => void,
  ): Promise<Array<{ content: string; htmlCode: string }>> {
    const systemPrompt: Message = {
      role: 'system',
      content: `你是一个专业的前端开发助手。你的任务是帮助用户创建网页内容。

重要规则：
1. 你只需要生成 <body> 标签内的 HTML 内容
2. 不要包含 <!DOCTYPE>、<html>、<head>、<body> 等标签
3. 代码必须包含在 \`\`\`html 和 \`\`\` 标记之间
4. 使用 Tailwind CSS 类名进行样式设计（已自动引入）
5. 可以使用 lucide-react 图标（通过 unpkg CDN 已自动引入）
6. 确保代码美观、响应式、可用
7. 简短地解释你创建了什么，然后提供代码
8. 每次都要创建完全不同的设计风格和布局

示例回复格式：
我为你创建了一个登录表单，包含邮箱和密码输入框。

\`\`\`html
<div class="min-h-screen flex items-center justify-center bg-gray-100">
  <div class="bg-white p-8 rounded-lg shadow-md w-96">
    <h2 class="text-2xl font-bold mb-6">Login</h2>
    <input type="email" placeholder="Email" class="w-full p-2 border rounded mb-4">
    <input type="password" placeholder="Password" class="w-full p-2 border rounded mb-4">
    <button class="w-full bg-blue-600 text-white p-2 rounded">Login</button>
  </div>
</div>
\`\`\``,
    };

    // 并发生成多个响应
    const promises = Array.from({ length: count }, async (_, index) => {
      const messages: Message[] = [
        systemPrompt,
        {
          role: 'user',
          content: `${userMessage}\n\n请创建一个独特的设计方案（方案 ${index + 1}/${count}）。使用不同的颜色、布局和风格。`,
        },
      ];

      try {
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'deepseek-ai/DeepSeek-V3',
            messages,
            temperature: 0.9, // 更高的温度以获得更多样化的结果
            max_tokens: 4096,
          }),
        });

        if (!response.ok) {
          throw new Error(`API request failed: ${response.statusText}`);
        }

        const data: ChatCompletionResponse = await response.json();
        const content = data.choices[0]?.message?.content || '';
        const extractedHTML = this.extractHTMLCode(content);
        const htmlCode = extractedHTML ? this.wrapHTML(extractedHTML) : '';

        const result = { content, htmlCode };

        if (onProgress) {
          onProgress(index, content, htmlCode);
        }

        return result;
      } catch (error) {
        console.error(`生成第 ${index + 1} 个响应失败:`, error);
        return {
          content: `生成失败: ${error}`,
          htmlCode: this.wrapHTML(
            '<div class="min-h-screen flex items-center justify-center"><p class="text-red-500">生成失败</p></div>',
          ),
        };
      }
    });

    const allResults = await Promise.all(promises);
    return allResults;
  }

  static async chat(
    userMessage: string,
    conversationHistory: Message[] = [],
  ): Promise<string> {
    const systemPrompt: Message = {
      role: 'system',
      content: `你是一个专业的前端开发助手。你的任务是帮助用户创建网页内容。

重要规则：
1. 你只需要生成 <body> 标签内的 HTML 内容
2. 不要包含 <!DOCTYPE>、<html>、<head>、<body> 等标签
3. 代码必须包含在 \`\`\`html 和 \`\`\` 标记之间
4. 使用 Tailwind CSS 类名进行样式设计（已自动引入）
5. 可以使用 lucide-react 图标（通过 unpkg CDN 已自动引入）
6. 确保代码美观、响应式、可用
7. 简短地解释你创建了什么，然后提供代码

示例回复格式：
我为你创建了一个登录表单，包含邮箱和密码输入框。

\`\`\`html
<div class="min-h-screen flex items-center justify-center bg-gray-100">
  <div class="bg-white p-8 rounded-lg shadow-md w-96">
    <h2 class="text-2xl font-bold mb-6">Login</h2>
    <input type="email" placeholder="Email" class="w-full p-2 border rounded mb-4">
    <input type="password" placeholder="Password" class="w-full p-2 border rounded mb-4">
    <button class="w-full bg-blue-600 text-white p-2 rounded">Login</button>
  </div>
</div>
\`\`\``,
    };

    const messages: Message[] = [
      systemPrompt,
      ...conversationHistory,
      { role: 'user', content: userMessage },
    ];

    return await this.callAPI(messages);
  }

  static async streamChat(
    userMessage: string,
    conversationHistory: Message[] = [],
    onChunk: (chunk: string) => void,
  ): Promise<void> {
    const systemPrompt: Message = {
      role: 'system',
      content: `你是一个专业的前端开发助手。你的任务是帮助用户创建网页内容。

重要规则：
1. 你只需要生成 <body> 标签内的 HTML 内容
2. 不要包含 <!DOCTYPE>、<html>、<head>、<body> 等标签
3. 代码必须包含在 \`\`\`html 和 \`\`\` 标记之间
4. 使用 Tailwind CSS 类名进行样式设计（已自动引入）
5. 可以使用 lucide-react 图标（通过 unpkg CDN 已自动引入）
6. 确保代码美观、响应式、可用
7. 简短地解释你创建了什么，然后提供代码

示例回复格式：
我为你创建了一个登录表单，包含邮箱和密码输入框。

\`\`\`html
<div class="min-h-screen flex items-center justify-center bg-gray-100">
  <div class="bg-white p-8 rounded-lg shadow-md w-96">
    <h2 class="text-2xl font-bold mb-6">Login</h2>
    <input type="email" placeholder="Email" class="w-full p-2 border rounded mb-4">
    <input type="password" placeholder="Password" class="w-full p-2 border rounded mb-4">
    <button class="w-full bg-blue-600 text-white p-2 rounded">Login</button>
  </div>
</div>
\`\`\``,
    };

    const messages: Message[] = [
      systemPrompt,
      ...conversationHistory,
      { role: 'user', content: userMessage },
    ];

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-ai/DeepSeek-V3',
        messages,
        temperature: 0.7,
        max_tokens: 4096,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('Failed to get response reader');
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              onChunk(content);
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    }
  }

  static extractHTMLCode(content: string): string | null {
    // 优先匹配完整的代码块
    const completeMatch = content.match(/```html\n([\s\S]*?)\n```/);
    if (completeMatch && completeMatch[1]) {
      return completeMatch[1].trim();
    }

    // 如果没有完整代码块，尝试匹配未完成的代码块（实时渲染）
    const incompleteMatch = content.match(/```html\n?([\s\S]*?)$/);
    if (incompleteMatch && incompleteMatch[1]) {
      const code = incompleteMatch[1].trim();
      // 更宽松的条件：只要有基本的 HTML 标签就渲染
      if (code.length > 5 && code.includes('<')) {
        // 自动闭合未完成的标签，使 HTML 更健壮
        return this.autoCloseHTML(code);
      }
    }

    return null;
  }

  // 自动闭合未完成的 HTML 标签，使实时预览更流畅
  private static autoCloseHTML(html: string): string {
    // 这是一个简单的实现，处理常见的未闭合标签
    // 对于实时流式渲染，浏览器通常会自动处理未闭合的标签
    // 但我们可以做一些基本的处理来提高稳定性

    // 移除可能的不完整的最后一个标签（如果它是开始标签但没有闭合）
    const lines = html.split('\n');
    let result = html;

    // 如果最后一行是不完整的标签，暂时移除它
    if (lines.length > 0) {
      const lastLine = lines[lines.length - 1];
      // 检查最后一行是否是不完整的开始标签（如 "<div cla" ）
      if (lastLine.match(/<[a-zA-Z][^>]*$/) && !lastLine.includes('>')) {
        // 移除最后一个不完整的行
        result = lines.slice(0, -1).join('\n');
      }
    }

    return result;
  }

  static wrapHTML(bodyContent: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Generated Page</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
</head>
<body>
${bodyContent}
<script>
  // 初始化 lucide 图标
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
</script>
</body>
</html>`;
  }
}
