import React from 'react';

interface ResizeHandleProps {
  side: 'left' | 'right';
  onMouseDown: (e: React.MouseEvent) => void;
  resizing?: boolean;
}

export const ResizeHandle: React.FC<ResizeHandleProps> = ({
  side,
  onMouseDown,
  resizing = false,
}) => {
  return (
    <div
      className={`media-resize-handle media-resize-handle-${side} ${resizing ? 'resizing' : ''}`}
      onMouseDown={onMouseDown}
    />
  );
};
