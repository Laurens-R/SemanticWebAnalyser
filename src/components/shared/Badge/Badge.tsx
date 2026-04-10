import React from 'react'
import './Badge.scss'

interface BadgeProps {
  label: string
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'default' }) => {
  return <span className={`badge badge--${variant}`}>{label}</span>
}
