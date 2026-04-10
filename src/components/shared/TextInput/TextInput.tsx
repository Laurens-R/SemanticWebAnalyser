import React from 'react'
import './TextInput.scss'

interface TextInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string
  error?: string
  hint?: string
  prefix?: React.ReactNode
  suffix?: React.ReactNode
}

export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  (
    {
      label,
      error,
      hint,
      prefix,
      suffix,
      className = '',
      id,
      ...rest
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).slice(2, 7)}`

    return (
      <div className={`text-input ${error ? 'text-input--error' : ''} ${className}`}>
        {label && (
          <label className="text-input__label" htmlFor={inputId}>
            {label}
          </label>
        )}
        <div className="text-input__wrapper">
          {prefix && <span className="text-input__prefix">{prefix}</span>}
          <input ref={ref} id={inputId} className="text-input__field" {...rest} />
          {suffix && <span className="text-input__suffix">{suffix}</span>}
        </div>
        {error && <span className="text-input__error">{error}</span>}
        {hint && !error && <span className="text-input__hint">{hint}</span>}
      </div>
    )
  }
)

TextInput.displayName = 'TextInput'
