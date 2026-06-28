import useInView from '../hooks/useInView'

export default function AnimatedSection({ children, animation = 'fadeInUp', delay = '0s', duration = '0.6s', className = '', style = {}, ...props }) {
  const [ref, isVisible] = useInView({ triggerOnce: true, threshold: 0.1 })

  return (
    <div ref={ref}
      className={`animate-${animation}${isVisible ? ' visible' : ''} ${className}`}
      style={{ transitionDelay: delay, transitionDuration: duration, ...style }}
      {...props}>
      {children}
    </div>
  )
}
