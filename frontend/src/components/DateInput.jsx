import { useRef } from 'react'

export default function DateInput({ value, onChange, placeholder = 'YYYY-MM-DD', className = 'form-input', style = {} }) {
  const hiddenRef = useRef(null)
  return (
    <span style={{ position: 'relative', display: 'inline-flex', ...style }}>
      <input type="text" className={className}
        value={value || ''}
        placeholder={placeholder}
        onFocus={() => hiddenRef.current?.showPicker?.()}
        onClick={() => hiddenRef.current?.showPicker?.()}
        onChange={e => {
          if (e.target.value.length >= 4 && e.target.value.includes('-')) {
            onChange(e.target.value)
          }
        }}
        style={{ cursor: 'pointer', caretColor: 'transparent', direction: 'rtl', textAlign: 'right', ...(style || {}) }} />
      <input type="date" ref={hiddenRef}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        style={{ position: 'absolute', inset: 0, opacity: 0, pointerEvents: 'none', width: '100%', height: '100%' }} />
    </span>
  )
}
