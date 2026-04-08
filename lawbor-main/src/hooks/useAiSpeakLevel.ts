import { useEffect, useRef, useState } from 'react'

/**
 * 仅在 active 时输出 0~1 的包络：静音时为 0。
 * 使用「随机时刻刷新目标 + 平滑跟随 + 弱非周期微扰」，避免单一正弦的重复感。
 */
export function useAiSpeakLevel(active: boolean) {
  const [level, setLevel] = useState(0)
  const smoothRef = useRef(0)
  const targetRef = useRef(0.5)
  const nextBumpMsRef = useRef(0)

  useEffect(() => {
    if (!active) {
      smoothRef.current = 0
      targetRef.current = 0.5
      setLevel(0)
      return
    }

    const start = performance.now()
    smoothRef.current = 0
    targetRef.current = 0.38 + Math.random() * 0.45
    nextBumpMsRef.current = start + 80 + Math.random() * 200

    let id = 0
    const tick = (now: number) => {
      if (now >= nextBumpMsRef.current) {
        const spike = Math.random() < 0.4
        targetRef.current = spike
          ? 0.52 + Math.random() * 0.48
          : 0.22 + Math.random() * 0.42
        const gap = (55 + Math.random() * 320) * (spike ? 0.7 : 0.95)
        nextBumpMsRef.current = now + gap
      }

      const t = now / 1000
      const shim =
        0.026 * Math.sin(t * 5.4 + Math.sin(t * 0.55) * 2.6) +
        0.02 * Math.sin(t * 9.2 + 1.15)

      let s = smoothRef.current
      const pull = 0.068 + Math.random() * 0.048
      s += (targetRef.current - s) * pull + shim
      s = Math.max(0, Math.min(1, s))

      smoothRef.current = s
      setLevel(s)
      id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [active])

  return level
}
