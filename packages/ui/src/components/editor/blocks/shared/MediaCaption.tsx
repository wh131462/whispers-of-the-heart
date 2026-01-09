import React, { useState, useEffect, useRef } from 'react';

interface MediaCaptionProps {
  value: string;
  onChange: (value: string) => void;
  editable: boolean;
  placeholder?: string;
}

export const MediaCaption: React.FC<MediaCaptionProps> = ({
  value,
  onChange,
  editable,
  placeholder = '添加说明...',
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    if (inputValue !== value) {
      onChange(inputValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      inputRef.current?.blur();
    } else if (e.key === 'Escape') {
      setInputValue(value);
      setIsEditing(false);
    }
  };

  // 非编辑模式且无内容时不显示
  if (!editable && !value) {
    return null;
  }

  // 非编辑模式显示文本
  if (!editable) {
    return (
      <div className="media-caption">
        <p className="media-caption-text">{value}</p>
      </div>
    );
  }

  // 编辑模式 - 正在编辑
  if (isEditing) {
    return (
      <div className="media-caption">
        <input
          ref={inputRef}
          className="media-caption-input"
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
        />
      </div>
    );
  }

  // 编辑模式 - 显示文本（点击可编辑）
  return (
    <div className="media-caption">
      <p
        className={`media-caption-text ${!value ? 'placeholder' : ''}`}
        onClick={() => setIsEditing(true)}
      >
        {value || placeholder}
      </p>
    </div>
  );
};
