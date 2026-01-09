import React from 'react';
import {
  RefreshCw,
  Trash2,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from 'lucide-react';
import type { MediaAlign } from './useMediaBlock';

interface MediaToolbarProps {
  align?: MediaAlign;
  onAlignChange?: (align: MediaAlign) => void;
  onReplace?: () => void;
  onDelete?: () => void;
  showAlignControls?: boolean;
}

export const MediaToolbar: React.FC<MediaToolbarProps> = ({
  align = 'center',
  onAlignChange,
  onReplace,
  onDelete,
  showAlignControls = true,
}) => {
  return (
    <div className="media-toolbar">
      {onReplace && (
        <button className="media-toolbar-btn" onClick={onReplace} title="替换">
          <RefreshCw size={14} />
          <span>替换</span>
        </button>
      )}

      {onDelete && (
        <button
          className="media-toolbar-btn media-toolbar-btn-danger"
          onClick={onDelete}
          title="删除"
        >
          <Trash2 size={14} />
          <span>删除</span>
        </button>
      )}

      {showAlignControls && onAlignChange && (
        <>
          <div className="media-toolbar-divider" />
          <button
            className={`media-toolbar-btn ${align === 'left' ? 'active' : ''}`}
            onClick={() => onAlignChange('left')}
            title="左对齐"
          >
            <AlignLeft size={14} />
          </button>
          <button
            className={`media-toolbar-btn ${align === 'center' ? 'active' : ''}`}
            onClick={() => onAlignChange('center')}
            title="居中"
          >
            <AlignCenter size={14} />
          </button>
          <button
            className={`media-toolbar-btn ${align === 'right' ? 'active' : ''}`}
            onClick={() => onAlignChange('right')}
            title="右对齐"
          >
            <AlignRight size={14} />
          </button>
        </>
      )}
    </div>
  );
};
