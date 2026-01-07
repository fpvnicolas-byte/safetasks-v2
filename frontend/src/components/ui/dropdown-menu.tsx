"use client"

import * as React from "react"

// Simplified dropdown menu without external dependencies
interface DropdownMenuProps {
  children: React.ReactNode
}

interface DropdownMenuTriggerProps {
  children: React.ReactNode
  asChild?: boolean
}

interface DropdownMenuContentProps {
  children: React.ReactNode
  align?: 'start' | 'center' | 'end'
  className?: string
}

interface DropdownMenuItemProps {
  children: React.ReactNode
  onClick?: (e: React.MouseEvent) => void
  className?: string
}

const DropdownMenuContext = React.createContext<{
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}>({ isOpen: false, setIsOpen: () => {} })

const DropdownMenu: React.FC<DropdownMenuProps> = ({ children }) => {
  const [isOpen, setIsOpen] = React.useState(false)

  React.useEffect(() => {
    const handleClickOutside = () => setIsOpen(false)
    if (isOpen) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [isOpen])

  return (
    <DropdownMenuContext.Provider value={{ isOpen, setIsOpen }}>
      <div className="relative">
        {children}
      </div>
    </DropdownMenuContext.Provider>
  )
}

const DropdownMenuTrigger: React.FC<DropdownMenuTriggerProps> = ({ children, asChild }) => {
  const { setIsOpen } = React.useContext(DropdownMenuContext)

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsOpen(true)
  }

  if (asChild) {
    return (
      <div onClick={handleClick} style={{ display: 'inline-block' }}>
        {children}
      </div>
    )
  }

  return (
    <div onClick={handleClick}>
      {children}
    </div>
  )
}

const DropdownMenuContent: React.FC<DropdownMenuContentProps> = ({
  children,
  align = 'end',
  className = ''
}) => {
  const { isOpen } = React.useContext(DropdownMenuContext)

  if (!isOpen) return null

  const alignClass = align === 'start' ? 'left-0' :
                    align === 'center' ? 'left-1/2 transform -translate-x-1/2' :
                    'right-0'

  return (
    <div
      className={`absolute z-50 mt-1 min-w-[8rem] overflow-hidden rounded-md border bg-slate-900 p-1 shadow-lg ${alignClass} ${className}`}
      style={{ zIndex: 9999 }}
    >
      {children}
    </div>
  )
}

const DropdownMenuItem: React.FC<DropdownMenuItemProps> = ({
  children,
  onClick,
  className = ''
}) => {
  const { setIsOpen } = React.useContext(DropdownMenuContext)

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsOpen(false)
    onClick?.(e)
  }

  return (
    <div
      className={`relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-slate-800 hover:text-slate-100 ${className}`}
      onClick={handleClick}
    >
      {children}
    </div>
  )
}

// Stub exports for compatibility
const DropdownMenuCheckboxItem = DropdownMenuItem
const DropdownMenuRadioItem = DropdownMenuItem
const DropdownMenuLabel = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={`px-2 py-1.5 text-sm font-semibold ${className}`}>{children}</div>
)
const DropdownMenuSeparator = ({ className = '' }: { className?: string }) => (
  <div className={`-mx-1 my-1 h-px bg-slate-700 ${className}`} />
)
const DropdownMenuShortcut = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <span className={`ml-auto text-xs tracking-widest opacity-60 ${className}`}>{children}</span>
)

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
}
