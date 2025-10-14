interface StreamChunk {
  object: string;
  choices: {
    index: number;
    delta: {
      content?: string;
    };
  }[];
}

const API_URL = 'http://192.168.0.82:8000/v1/chat/completions';

export class AIService {
  // 提取HTML代码
  private static extractHTMLCode(content: string): string {
    // 方式1: 匹配 ```html 代码块
    const codeBlockMatch = content.match(/```html\s*([\s\S]*?)```/);
    if (codeBlockMatch && codeBlockMatch[1]) {
      return codeBlockMatch[1].trim();
    }

    // 方式2: 如果内容以 <!DOCTYPE 或 <html 开头，说明是完整的HTML
    const trimmed = content.trim();
    if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html')) {
      return trimmed;
    }

    // 方式3: 未完成的代码块（用于流式渲染）
    const incompleteMatch = content.match(/```html\s*([\s\S]*?)$/);
    if (incompleteMatch && incompleteMatch[1]) {
      const code = incompleteMatch[1].trim();
      if (code.length > 0) {
        return code;
      }
    }

    // 默认返回原内容
    return content;
  }

  static async generateMultipleResponses(
    userMessage: string,
    count: number = 20,
    onProgress?: (index: number, content: string, htmlCode: string) => void,
  ): Promise<Array<{ content: string; htmlCode: string }>> {
    const controller = new AbortController();

    // 构建 contents 数组：将用户问题重复 count 次
    const contents = Array.from(
      { length: count },
      () => `User: ${userMessage}\n\nAssistant:`,
    );

    // 存储每个 index 的累积内容
    const contentBuffers: string[] = Array.from({ length: count }, () => '');
    const results: Array<{ content: string; htmlCode: string }> = [];

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: contents,
          max_tokens: 4096,
          temperature: 1,
          stream: true,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(
          `HTTP ${response.status} ${response.statusText} ${text}`,
        );
      }

      if (!response.body) {
        throw new Error('ReadableStream 不可用');
      }

      const reader: ReadableStreamDefaultReader<Uint8Array> =
        response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let partial = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        partial += chunk;

        // 逐行解析 SSE
        const lines = partial.split('\n');
        partial = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;

          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;

          try {
            const json: StreamChunk = JSON.parse(data);
            if (json.choices && json.choices.length > 0) {
              for (const choice of json.choices) {
                const index = choice.index;
                const delta = choice.delta?.content ?? '';

                if (delta && index >= 0 && index < count) {
                  contentBuffers[index] += delta;
                  const htmlCode = this.extractHTMLCode(contentBuffers[index]);

                  if (onProgress) {
                    onProgress(index, contentBuffers[index], htmlCode);
                  }
                }
              }
            }
          } catch (err) {
            console.warn('Failed to parse JSON:', err);
          }
        }
      }

      // 构建最终结果
      for (let i = 0; i < count; i++) {
        const content = contentBuffers[i] || '';
        const htmlCode = this.extractHTMLCode(content);
        results.push({ content, htmlCode });
      }

      return results;
    } catch (err: unknown) {
      console.error('生成失败:', err);
      throw err;
    }
  }
}
