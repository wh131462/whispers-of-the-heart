import { useState, useCallback } from 'react';
import type { Base64State, InputMode, Direction, FileInfo } from '../types';

const initialState: Base64State = {
  mode: 'text',
  direction: 'encode',
  input: '',
  output: '',
  error: null,
  fileName: null,
  fileType: null,
  fileSize: null,
};

export function useBase64() {
  const [state, setState] = useState<Base64State>(initialState);
  const [copied, setCopied] = useState(false);

  // 设置输入模式
  const setMode = useCallback((mode: InputMode) => {
    setState(prev => ({
      ...initialState,
      mode,
      direction: prev.direction,
    }));
  }, []);

  // 设置编码/解码方向
  const setDirection = useCallback((direction: Direction) => {
    setState(prev => ({
      ...prev,
      direction,
      output: '',
      error: null,
    }));
  }, []);

  // 文本输入
  const setInput = useCallback((input: string) => {
    setState(prev => ({
      ...prev,
      input,
      output: '',
      error: null,
    }));
  }, []);

  // 执行编码
  const encode = useCallback(() => {
    if (!state.input.trim()) return;

    try {
      // 使用 TextEncoder 处理 UTF-8
      const encoder = new TextEncoder();
      const bytes = encoder.encode(state.input);
      const binary = Array.from(bytes)
        .map(b => String.fromCharCode(b))
        .join('');
      const result = btoa(binary);

      setState(prev => ({
        ...prev,
        output: result,
        error: null,
      }));
    } catch (e) {
      setState(prev => ({
        ...prev,
        output: '',
        error: (e as Error).message || '编码失败',
      }));
    }
  }, [state.input]);

  // 执行解码
  const decode = useCallback(() => {
    if (!state.input.trim()) return;

    try {
      // 清理输入（移除空白字符）
      const cleanInput = state.input.replace(/\s/g, '');

      // 验证 Base64 格式
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleanInput)) {
        throw new Error('无效的 Base64 格式');
      }

      const binary = atob(cleanInput);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }

      // 使用 TextDecoder 处理 UTF-8
      const decoder = new TextDecoder('utf-8');
      const result = decoder.decode(bytes);

      setState(prev => ({
        ...prev,
        output: result,
        error: null,
      }));
    } catch (e) {
      setState(prev => ({
        ...prev,
        output: '',
        error: (e as Error).message || '解码失败',
      }));
    }
  }, [state.input]);

  // 处理
  const process = useCallback(() => {
    if (state.direction === 'encode') {
      encode();
    } else {
      decode();
    }
  }, [state.direction, encode, decode]);

  // 处理文件上传
  const handleFileUpload = useCallback(
    (file: File) => {
      const reader = new FileReader();

      reader.onload = () => {
        const result = reader.result as string;

        if (state.direction === 'encode') {
          // 从 data URL 中提取 base64 部分
          const base64 = result.split(',')[1];
          setState(prev => ({
            ...prev,
            input: result,
            output: base64,
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            error: null,
          }));
        } else {
          // 解码模式：读取文件内容作为 base64 输入
          const text = result.split(',')[1] || result;
          setState(prev => ({
            ...prev,
            input: text,
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            error: null,
          }));
        }
      };

      reader.onerror = () => {
        setState(prev => ({
          ...prev,
          error: '文件读取失败',
        }));
      };

      reader.readAsDataURL(file);
    },
    [state.direction]
  );

  // 复制到剪贴板
  const copyToClipboard = useCallback(async () => {
    const textToCopy = state.output || state.input;
    if (!textToCopy) return;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 复制失败时静默处理
    }
  }, [state.output, state.input]);

  // 下载结果
  const downloadResult = useCallback(() => {
    if (!state.output) return;

    let blob: Blob;
    let filename: string;

    if (state.direction === 'encode') {
      // 编码结果：下载为 .txt
      blob = new Blob([state.output], { type: 'text/plain' });
      filename = state.fileName
        ? `${state.fileName}.base64.txt`
        : 'encoded.base64.txt';
    } else {
      // 解码结果：下载为原始格式
      blob = new Blob([state.output], { type: 'text/plain' });
      filename = 'decoded.txt';
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [state.output, state.direction, state.fileName]);

  // 清空
  const clear = useCallback(() => {
    setState(prev => ({
      ...initialState,
      mode: prev.mode,
      direction: prev.direction,
    }));
  }, []);

  // 交换输入输出
  const swap = useCallback(() => {
    if (!state.output) return;

    setState(prev => ({
      ...prev,
      input: prev.output,
      output: '',
      direction: prev.direction === 'encode' ? 'decode' : 'encode',
    }));
  }, [state.output]);

  // 获取文件信息
  const fileInfo: FileInfo | null =
    state.fileName && state.fileType && state.fileSize
      ? {
          name: state.fileName,
          type: state.fileType,
          size: state.fileSize,
          data: state.output || '',
        }
      : null;

  return {
    state,
    copied,
    fileInfo,
    setMode,
    setDirection,
    setInput,
    process,
    handleFileUpload,
    copyToClipboard,
    downloadResult,
    clear,
    swap,
  };
}
