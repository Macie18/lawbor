import { useEffect, useRef, useState } from 'react'

/**
 * 麦克风 RMS 近似 0~1，用于“用户在说 → AI 画面变暗”
 */
export function useMicLevel(active: boolean) {
  const [level, setLevel] = useState(0)
  const ctxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    if (!active) {
      setLevel(0)
      return
    }

    let cancelled = false

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        const ctx = new AudioContext()
        ctxRef.current = ctx
        const src = ctx.createMediaStreamSource(stream)
        const analyser = ctx.createAnalyser()
        analyser.fftSize = 1024
        analyser.smoothingTimeConstant = 0.85
        src.connect(analyser)
        analyserRef.current = analyser

        const data = new Float32Array(analyser.fftSize)
        const tick = () => {
          if (!analyserRef.current) return
          analyserRef.current.getFloatTimeDomainData(data)
          let sum = 0
          for (let i = 0; i < data.length; i++) sum += data[i] * data[i]
          const rms = Math.sqrt(sum / data.length)
          setLevel(Math.min(1, rms * 6))
          rafRef.current = requestAnimationFrame(tick)
        }
        if (ctx.state === 'suspended') await ctx.resume()
        rafRef.current = requestAnimationFrame(tick)
      } catch {
        setLevel(0)
      }
    }

    void start()
    return () => {
      cancelled = true
      cancelAnimationFrame(rafRef.current)
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
      void ctxRef.current?.close()
      ctxRef.current = null
      analyserRef.current = null
    }
  }, [active])

  return level
}
