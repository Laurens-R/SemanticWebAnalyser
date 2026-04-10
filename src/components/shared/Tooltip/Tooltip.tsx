import React from 'react'
import './Tooltip.scss'

interface TooltipProps {
  content: string
  children: React.ReactElement
  position?: 'top' | 'bottom' | 'left' | 'right'
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
}) => {
  return (
    <span className="tooltip-wrapper" data-tooltip={content} data-tooltip-pos={position}>
      {children}
    </span>
  )
}
