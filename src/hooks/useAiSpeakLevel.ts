import { useEffect, useState } from 'react'

/**
 * 演示用“AI 在说话”的音量包络（0~1）。接入 OpenAI TTS 播放后，可改为对 `HTMLAudioElement` 做 `createMediaAnalyser`。
 */
export function useAiSpeakLevel(active: boolean) {
  const [level, setLevel] = useState(0)

  useEffect(() => {
    if (!active) {
      setLevel(0)
      return
    }

    let id = 0
    const tick = (now: number) => {
      const t = now / 1000
      const syllable = Math.pow(Math.sin(t * 14 + Math.sin(t * 2.2) * 3), 2)
      const breathe = 0.55 + 0.45 * syllable
      const burst = Math.random() < 0.08 ? 1 : 0.9
      setLevel(Math.min(1, breathe * burst))
      id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [active])

  return level
}
