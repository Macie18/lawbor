import Lottie, { type LottieRefCurrentProps } from 'lottie-react'
import { motion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '../lib/utils'

type Props = {
  /** 0~1，面试官在播报时 >0：Lottie 加速 + 整体略放大；0 时静止在第一帧 */
  voiceLevel: number
  /** 用户正在说时整体略压暗 */
  listeningDim: boolean
  /** 置于 public 的 Lottie JSON，默认 /siri.json */
  lottieSrc?: string
  className?: string
}

/**
 * Siri 风格：玻璃外圈 + 圆形容器内 Lottie 动效，`voiceLevel` 越大播放越快（波动更密）。
 */
export function InterviewFloatingOrb({
  voiceLevel,
  listeningDim,
  lottieSrc = '/siri.json',
  className,
}: Props) {
  const raw = Math.max(0, Math.min(1, voiceLevel))
  const level = raw < 0.03 ? 0 : raw
  const speaking = level > 0

  const playbackSpeed = speaking ? 0.48 + level * 4.15 : 0

  const lottieRef = useRef<LottieRefCurrentProps>(null)
  const [animationData, setAnimationData] = useState<unknown | null>(null)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch(lottieSrc)
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status))
        return r.json()
      })
      .then((data) => {
        if (!cancelled) setAnimationData(data)
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError(true)
          setAnimationData(null)
        }
      })
    return () => {
      cancelled = true
    }
  }, [lottieSrc])

  const syncPlayback = useCallback(() => {
    const api = lottieRef.current
    if (!api) return
    try {
      if (!speaking) {
        api.pause()
        api.goToAndStop(0, true)
        return
      }
      api.play()
      api.setSpeed(Math.max(0.35, Math.min(4.5, playbackSpeed)))
    } catch {
      /* 实例尚未就绪时忽略 */
    }
  }, [speaking, playbackSpeed])

  useEffect(() => {
    if (!animationData) return
    const t = window.requestAnimationFrame(() => syncPlayback())
    return () => window.cancelAnimationFrame(t)
  }, [animationData, syncPlayback, level])

  const innerGroupScale = speaking ? 1 + level * 0.085 : 1

  return (
    <div
      className={cn('relative flex items-center justify-center', className)}
      style={{ perspective: 900 }}
    >
      <div
        className="pointer-events-none absolute rounded-full bg-gradient-to-br from-blue-500/18 via-cyan-400/12 to-purple-500/18 blur-3xl"
        style={{
          width: 'min(70vw, 21rem)',
          height: 'min(70vw, 21rem)',
          opacity: listeningDim ? 0.4 : 0.58,
        }}
      />

      <div
        className={cn('relative z-10 rounded-full p-[3px] transition-opacity duration-300')}
        style={{
          opacity: listeningDim ? 0.72 : 1,
          background:
            'linear-gradient(155deg, rgba(142,220,255,0.75) 0%, rgba(94,160,255,0.65) 28%, rgba(160,110,255,0.6) 65%, rgba(80,200,255,0.55) 100%)',
          boxShadow:
            '0 0 0 1px rgba(255,255,255,0.4) inset, 0 10px 48px rgba(0,40,100,0.42), 0 0 80px rgba(0,145,255,0.12)',
        }}
      >
        <div
          className={cn(
            'relative overflow-hidden rounded-full',
            'h-[min(58vw,280px)] w-[min(58vw,280px)] sm:h-72 sm:w-72',
          )}
          style={{
            background: 'radial-gradient(circle at 50% 45%, #152030 0%, #060810 55%, #020308 100%)',
            boxShadow: 'inset 0 0 80px rgba(0,0,0,0.65)',
          }}
        >
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{ scale: innerGroupScale }}
            transition={
              speaking
                ? { type: 'spring', stiffness: 280, damping: 28, mass: 0.55 }
                : { duration: 0.2, ease: 'easeOut' }
            }
          >
            {animationData && !loadError ? (
              <Lottie
                lottieRef={lottieRef}
                animationData={animationData}
                loop
                autoplay={false}
                className="pointer-events-none h-[122%] w-[122%] max-w-none shrink-0"
                onDOMLoaded={syncPlayback}
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 px-6 text-center text-xs text-white/40">
                <span>{loadError ? '动效文件加载失败' : '动效加载中…'}</span>
                <span className="text-white/25">请确认 public 目录下有 siri.json</span>
              </div>
            )}
          </motion.div>

          <div
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.48) 0%, rgba(255,255,255,0.1) 15%, transparent 38%)',
              opacity: speaking ? 0.52 + level * 0.12 : 0.45,
              transition: 'opacity 0.2s ease-out',
            }}
          />
          <div
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{
              boxShadow: speaking
                ? `inset 0 0 ${32 + level * 22}px rgba(0,0,0,${0.22 + level * 0.08})`
                : 'inset 0 0 36px rgba(0,0,0,0.25)',
              transition: 'box-shadow 0.22s ease-out',
            }}
          />
          <div
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{
              boxShadow: 'inset 0 -24px 56px rgba(50,150,255,0.1), inset 0 28px 48px rgba(180,90,255,0.07)',
            }}
          />
        </div>
      </div>
    </div>
  )
}
