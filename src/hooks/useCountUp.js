import { useEffect, useRef, useState } from 'react'

export function useCountUp(target, formatFn, duration = 650) {
  const [display, setDisplay] = useState(formatFn(0))
  const prevTarget = useRef(0)
  const formatFnRef = useRef(formatFn)
  formatFnRef.current = formatFn

  useEffect(() => {
    if (target === null || target === undefined) { setDisplay('—'); return }
    const start = performance.now()
    const from = prevTarget.current
    let raf
    function tick(now) {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(formatFnRef.current(from + (target - from) * eased))
      if (t < 1) { raf = requestAnimationFrame(tick) }
      else { setDisplay(formatFnRef.current(target)); prevTarget.current = target }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])

  return display
}
