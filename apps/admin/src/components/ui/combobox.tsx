import * as React from "react"
import { Check, ChevronsUpDown, Plus, X } from "lucide-react"
import { cn } from "../../lib/utils"
import { Button } from "./button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover"
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "./command"

export interface ComboboxOption {
  value: string
  label: string
  color?: string
}

interface ComboboxProps {
  options: ComboboxOption[]
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  allowCreate?: boolean
  onCreateNew?: (value: string) => void
  className?: string
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "选择选项...",
  searchPlaceholder = "搜索选项...",
  emptyText = "未找到选项",
  allowCreate = false,
  onCreateNew,
  className,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")
  const [triggerWidth, setTriggerWidth] = React.useState<number>(0)
  const triggerRef = React.useRef<HTMLButtonElement>(null)

  const selectedOption = options.find((option) => option.value === value)

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchValue.toLowerCase())
  )

  const handleSelect = (selectedValue: string) => {
    if (selectedValue === value) {
      onValueChange?.("")
    } else {
      onValueChange?.(selectedValue)
    }
    setOpen(false)
    setSearchValue("")
  }

  const handleCreateNew = () => {
    if (searchValue.trim() && onCreateNew) {
      onCreateNew(searchValue.trim())
      setOpen(false)
      setSearchValue("")
    }
  }

  React.useEffect(() => {
    if (triggerRef.current) {
      setTriggerWidth(triggerRef.current.offsetWidth)
    }
  }, [open])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between", className)}
        >
          {selectedOption ? (
            <div className="flex items-center space-x-2">
              {selectedOption.color && (
                <div
                  className="w-3 h-3 rounded-full border"
                  style={{ backgroundColor: selectedOption.color }}
                />
              )}
              <span>{selectedOption.label}</span>
            </div>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="p-0" 
        style={{ width: Math.max(triggerWidth, 300) }}
        align="start"
      >
        <Command shouldFilter={false} tabIndex={0} className="outline-none">
          <button autoFocus aria-hidden="true" className="absolute -top-[9999px] left-0 w-0 h-0 opacity-0 pointer-events-none" />
          <CommandInput
            placeholder={searchPlaceholder}
            value={searchValue}
            onValueChange={setSearchValue}
          />
          {filteredOptions.length === 0 && (
            <div className="py-6 text-center text-sm">
              {emptyText}
              {allowCreate && searchValue.trim() && (
                <Button
                  variant="ghost"
                  className="mt-2 w-full justify-start"
                  onClick={handleCreateNew}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  创建 "{searchValue.trim()}"
                </Button>
              )}
            </div>
          )}
          {filteredOptions.length > 0 && (
            <CommandGroup>
              {filteredOptions.map((option) => (
              <CommandItem
                key={option.value}
                value={option.value}
                onSelect={() => handleSelect(option.value)}
                disabled={false}
                className="cursor-pointer"
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === option.value ? "opacity-100" : "opacity-0"
                  )}
                />
                <div className="flex items-center space-x-2">
                  {option.color && (
                    <div
                      className="w-3 h-3 rounded-full border"
                      style={{ backgroundColor: option.color }}
                    />
                  )}
                  <span>{option.label}</span>
                </div>
              </CommandItem>
            ))}
            {allowCreate && searchValue.trim() && !filteredOptions.some(
              option => option.label.toLowerCase() === searchValue.toLowerCase()
            ) && (
              <CommandItem onSelect={() => handleCreateNew()} disabled={false} className="cursor-pointer">
                <Plus className="mr-2 h-4 w-4" />
                创建 "{searchValue.trim()}"
              </CommandItem>
            )}
            </CommandGroup>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  )
}

// 多选版本
interface MultiComboboxProps {
  options: ComboboxOption[]
  values?: string[]
  onValuesChange?: (values: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  allowCreate?: boolean
  onCreateNew?: (value: string) => void
  className?: string
}

export function MultiCombobox({
  options,
  values = [],
  onValuesChange,
  placeholder = "选择选项...",
  searchPlaceholder = "搜索选项...",
  emptyText = "未找到选项",
  allowCreate = false,
  onCreateNew,
  className,
}: MultiComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")
  const [triggerWidth, setTriggerWidth] = React.useState<number>(0)
  const triggerRef = React.useRef<HTMLButtonElement>(null)

  const selectedOptions = options.filter((option) => values.includes(option.value))

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchValue.toLowerCase())
  )

  const handleSelect = (selectedValue: string) => {
    const newValues = values.includes(selectedValue)
      ? values.filter((v) => v !== selectedValue)
      : [...values, selectedValue]
    
    onValuesChange?.(newValues)
    setSearchValue("")
  }

  const handleCreateNew = () => {
    if (searchValue.trim() && onCreateNew) {
      onCreateNew(searchValue.trim())
      setSearchValue("")
    }
  }

  const removeValue = (valueToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const newValues = values.filter((v) => v !== valueToRemove)
    onValuesChange?.(newValues)
  }

  React.useEffect(() => {
    if (triggerRef.current) {
      setTriggerWidth(triggerRef.current.offsetWidth)
    }
  }, [open])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-start h-auto min-h-[40px] p-2", className)}
        >
          <div className="flex flex-wrap items-center gap-1 w-full">
            {selectedOptions.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              selectedOptions.map((option) => (
                <div
                  key={option.value}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-sm"
                >
                  {option.color && (
                    <div
                      className="w-2 h-2 rounded-full border"
                      style={{ backgroundColor: option.color }}
                    />
                  )}
                  <span>{option.label}</span>
                  <button
                    type="button"
                    onClick={(e) => removeValue(option.value, e)}
                    className="ml-1 hover:bg-secondary-foreground/20 rounded-sm p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
            <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="p-0" 
        style={{ width: Math.max(triggerWidth, 300) }}
        align="start"
      >
        <Command shouldFilter={false} tabIndex={0} className="outline-none">
          <button autoFocus aria-hidden="true" className="absolute -top-[9999px] left-0 w-0 h-0 opacity-0 pointer-events-none" />
          <CommandInput
            placeholder={searchPlaceholder}
            value={searchValue}
            onValueChange={setSearchValue}
          />
          {filteredOptions.length === 0 && (
            <div className="py-6 text-center text-sm">
              {emptyText}
              {allowCreate && searchValue.trim() && (
                <Button
                  variant="ghost"
                  className="mt-2 w-full justify-start"
                  onClick={handleCreateNew}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  创建 "{searchValue.trim()}"
                </Button>
              )}
            </div>
          )}
          {filteredOptions.length > 0 && (
            <CommandGroup>
              {filteredOptions.map((option) => (
              <CommandItem
                key={option.value}
                value={option.value}
                onSelect={() => handleSelect(option.value)}
                disabled={false}
                className="cursor-pointer"
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    values.includes(option.value) ? "opacity-100" : "opacity-0"
                  )}
                />
                <div className="flex items-center space-x-2">
                  {option.color && (
                    <div
                      className="w-3 h-3 rounded-full border"
                      style={{ backgroundColor: option.color }}
                    />
                  )}
                  <span>{option.label}</span>
                </div>
              </CommandItem>
            ))}
            {allowCreate && searchValue.trim() && !filteredOptions.some(
              option => option.label.toLowerCase() === searchValue.toLowerCase()
            ) && (
              <CommandItem onSelect={() => handleCreateNew()} disabled={false} className="cursor-pointer">
                <Plus className="mr-2 h-4 w-4" />
                创建 "{searchValue.trim()}"
              </CommandItem>
            )}
            </CommandGroup>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  )
}
