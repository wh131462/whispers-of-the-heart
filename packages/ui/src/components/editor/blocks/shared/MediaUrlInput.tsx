import React, { useEffect, useRef } from 'react';

interface MediaUrlInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  placeholder?: string;
}

export const MediaUrlInput: React.FC<MediaUrlInputProps> = ({
  value,
  onChange,
  onSubmit,
  onCancel,
  placeholder = '输入媒体链接...',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSubmit();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="media-url-input" contentEditable={false}>
      <input
        ref={inputRef}
        type="url"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
      />
      <div className="media-url-input-actions">
        <button className="btn-submit" onClick={onSubmit}>
          确定
        </button>
        <button className="btn-cancel" onClick={onCancel}>
          取消
        </button>
      </div>
    </div>
  );
};
