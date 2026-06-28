import { useState, useEffect } from 'react'
import useInView from '../hooks/useInView'

export default function CountUp({ end, suffix = '', duration = 2000, decimals = 0 }) {
  const [ref, isVisible] = useInView({ triggerOnce: true, threshold: 0.3 })
  const [val, setVal] = useState(0)

  useEffect(() => {
    if (!isVisible) return
    let startTime
    const step = (now) => {
      if (!startTime) startTime = now
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setVal(eased * end)
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [isVisible, end, duration])

  return <span ref={ref}>{val.toFixed(decimals)}{suffix}</span>
}
