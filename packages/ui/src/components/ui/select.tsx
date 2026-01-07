import * as React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

// 简单的图标组件
const ChevronDown = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" {...props}>
    <path
      d="m3.5 6 4 4 4-4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const Check = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" {...props}>
    <path
      d="m11.4669 3.72684c.2679.2681.2679.7019 0 .969l-7.185 7.185c-.2681.2679-.7019.2679-.969 0-.2679-.2681-.2679-.7019 0-.969l7.185-7.185c.2681-.2679.7019-.2679.969 0z"
      fill="currentColor"
    />
    <path
      d="m4.20421 11.1252c.2681.2679.7019.2679.969 0l5.313-5.313c.2679-.2681.2679-.7019 0-.969-.2681-.2679-.7019-.2679-.969 0l-5.313 5.313c-.2679.2681-.2679.7019 0 .969z"
      fill="currentColor"
    />
  </svg>
);

// Select Context
interface SelectContextType {
  value?: string;
  onValueChange?: (value: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disabled?: boolean;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  selectedLabel?: string;
  setSelectedLabel: (label: string) => void;
}

const SelectContext = React.createContext<SelectContextType | null>(null);

const useSelectContext = () => {
  const context = React.useContext(SelectContext);
  if (!context) {
    throw new Error('Select components must be used within a Select');
  }
  return context;
};

// Select Root
interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  children: React.ReactNode;
}

const Select: React.FC<SelectProps> = ({
  value,
  onValueChange,
  disabled,
  children,
}) => {
  const [open, setOpen] = React.useState(false);
  const [selectedLabel, setSelectedLabel] = React.useState('');
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);

  const contextValue: SelectContextType = {
    value,
    onValueChange,
    open,
    onOpenChange: setOpen,
    disabled,
    triggerRef,
    selectedLabel,
    setSelectedLabel,
  };

  return (
    <SelectContext.Provider value={contextValue}>
      <div className="relative inline-block w-full">{children}</div>
    </SelectContext.Provider>
  );
};

// Select Group
const SelectGroup: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div className="space-y-1">{children}</div>;
};

// Select Value
interface SelectValueProps {
  placeholder?: string;
}

const SelectValue: React.FC<SelectValueProps> = ({ placeholder }) => {
  const { selectedLabel, value } = useSelectContext();
  const displayText = selectedLabel || value || placeholder;
  return (
    <span className={cn(!value && 'text-muted-foreground')}>{displayText}</span>
  );
};

// Select Trigger
interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const { open, onOpenChange, disabled, triggerRef } = useSelectContext();

    const handleClick = () => {
      if (!disabled) {
        onOpenChange(!open);
      }
    };

    return (
      <button
        ref={node => {
          triggerRef.current = node;
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
        }}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1',
          className
        )}
        onClick={handleClick}
        disabled={disabled}
        {...props}
      >
        {children}
        <ChevronDown
          className={cn(
            'h-4 w-4 opacity-50 transition-transform',
            open && 'rotate-180'
          )}
        />
      </button>
    );
  }
);
SelectTrigger.displayName = 'SelectTrigger';

// Select Content
interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
  position?: 'popper' | 'item-aligned';
}

const SelectContent: React.FC<SelectContentProps> = ({
  children,
  className,
}) => {
  const { open, onOpenChange, triggerRef } = useSelectContext();
  const [position, setPosition] = React.useState<{
    top: number;
    left: number;
  } | null>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);

  // 计算位置
  const calculatePosition = React.useCallback(() => {
    if (!triggerRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // 使用默认尺寸，避免依赖DOM尺寸
    const contentWidth = 200;
    const contentHeight = 200;

    let top = triggerRect.bottom + 4;
    let left = triggerRect.left;

    // 边界检测
    if (left < 0) left = 8;
    if (left + contentWidth > viewportWidth)
      left = viewportWidth - contentWidth - 8;
    if (top + contentHeight > viewportHeight)
      top = triggerRect.top - contentHeight - 4;
    if (top < 0) top = 8;

    setPosition({ top, left });
  }, []);

  // 点击外部关闭
  React.useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        triggerRef.current &&
        contentRef.current &&
        !triggerRef.current.contains(target) &&
        !contentRef.current.contains(target)
      ) {
        onOpenChange(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onOpenChange(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, onOpenChange]);

  // 监听滚动和resize
  React.useEffect(() => {
    if (!open) return;

    const updatePosition = () => calculatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open, calculatePosition]);

  // 计算初始位置
  React.useEffect(() => {
    if (open) {
      // 立即计算位置，避免跳跃
      calculatePosition();
    } else {
      // 关闭时重置位置
      setPosition(null);
    }
  }, [open, calculatePosition]);

  if (!open || !position) return null;

  return createPortal(
    <div
      ref={contentRef}
      className={cn(
        'fixed z-[10000000] max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-white text-gray-900 shadow-lg',
        'animate-in fade-in-0 zoom-in-95 duration-200',
        className
      )}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        zIndex: 10000000,
      }}
    >
      <div className="p-1">{children}</div>
    </div>,
    document.body
  );
};

// Select Label
interface SelectLabelProps {
  children: React.ReactNode;
  className?: string;
}

const SelectLabel: React.FC<SelectLabelProps> = ({ children, className }) => {
  return (
    <div className={cn('py-1.5 pl-8 pr-2 text-sm font-semibold', className)}>
      {children}
    </div>
  );
};

// Select Item
interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

const SelectItem: React.FC<SelectItemProps> = ({
  value,
  children,
  disabled,
  className,
}) => {
  const {
    value: selectedValue,
    onValueChange,
    onOpenChange,
    setSelectedLabel,
  } = useSelectContext();
  const isSelected = selectedValue === value;

  const handleClick = () => {
    if (!disabled) {
      onValueChange?.(value);
      setSelectedLabel(children as string);
      onOpenChange(false);
    }
  };

  return (
    <div
      className={cn(
        'relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none',
        'hover:bg-accent hover:text-accent-foreground',
        disabled && 'pointer-events-none opacity-50',
        isSelected && 'bg-accent text-accent-foreground',
        className
      )}
      onClick={handleClick}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {isSelected && <Check className="h-4 w-4" />}
      </span>
      {children}
    </div>
  );
};

// Select Separator
interface SelectSeparatorProps {
  className?: string;
}

const SelectSeparator: React.FC<SelectSeparatorProps> = ({ className }) => {
  return <div className={cn('-mx-1 my-1 h-px bg-muted', className)} />;
};

// Scroll buttons (保持兼容性，但实际不使用)
const SelectScrollUpButton: React.FC<{ className?: string }> = () => null;
const SelectScrollDownButton: React.FC<{ className?: string }> = () => null;

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
};
