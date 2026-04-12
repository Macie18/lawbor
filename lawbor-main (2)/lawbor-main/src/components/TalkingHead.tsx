import { useMemo } from 'react'

type Props = {
  src: string
  /** 0 HR 冰冷 ↔ 100 伪善 / 0 律师理性 ↔ 100 共情 */
  temperature: number
  /** 0~1 说话能量：驱动嘴部局部开合与高亮，不再拉伸整张下颌 */
  speakLevel: number
  /** 略微压暗（用户说话时 AI 在听） */
  listeningDim: boolean
  className?: string
}

export function TalkingHead({ src, temperature, speakLevel, listeningDim, className }: Props) {
  const browLiftPx = useMemo(() => ((temperature - 50) / 50) * -3.2, [temperature])
  /** 口型垂直开合：叠层椭圆，避免 scaleY 撕裂脸型 */
  const mouthOpen = useMemo(() => 0.35 + speakLevel * 0.65, [speakLevel])
  const mouthWide = useMemo(() => 8 + speakLevel * 10, [speakLevel])

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        borderRadius: 16,
        overflow: 'hidden',
        background: '#0a0b10',
        boxShadow: 'inset 0 0 120px rgba(0,0,0,0.45)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: listeningDim ? 0.78 : 1,
          transition: 'opacity 0.25s ease',
        }}
      >
        <img
          src={src}
          alt=""
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: `translateY(${browLiftPx}px) scale(${1 + speakLevel * 0.006})`,
            transition: 'transform 0.35s ease-out',
            filter: listeningDim ? 'brightness(0.82) saturate(0.95)' : 'none',
          }}
          draggable={false}
        />

        {/* 嘴部：深色椭圆 + 边缘高光，随 speakLevel 改变高度与透明度 */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '62%',
            transform: 'translateX(-50%)',
            width: `${mouthWide}%`,
            height: `${4 + mouthOpen * 5}%`,
            maxHeight: '14%',
            borderRadius: '50%',
            pointerEvents: 'none',
            background: `radial-gradient(ellipse at 50% 40%, rgba(25,12,18,${0.45 + speakLevel * 0.35}) 0%, rgba(8,4,6,${0.65 + speakLevel * 0.25}) 72%, rgba(0,0,0,0) 100%)`,
            boxShadow: `0 ${2 + speakLevel * 4}px ${12 + speakLevel * 18}px rgba(0,0,0,${0.35 + speakLevel * 0.25}), inset 0 -2px 6px rgba(255,200,200,${0.08 + speakLevel * 0.12})`,
            opacity: 0.2 + speakLevel * 0.75,
            transition: 'height 55ms linear, width 55ms linear, opacity 55ms linear',
          }}
        />
        {/* 下唇高光条：增强「在说话」可读性 */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: `calc(62% + ${mouthOpen * 1.8}%)`,
            transform: 'translateX(-50%)',
            width: `${mouthWide * 0.85}%`,
            height: `${0.6 + speakLevel * 1.1}%`,
            borderRadius: 999,
            pointerEvents: 'none',
            background: `linear-gradient(90deg, transparent, rgba(255,230,230,${0.15 + speakLevel * 0.35}), transparent)`,
            opacity: speakLevel,
            transition: 'opacity 45ms linear, top 45ms linear',
          }}
        />
      </div>
    </div>
  )
}