import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface InterviewerFaceProps {
  volume: number;
  isThinking: boolean;
  expression: 'neutral' | 'happy' | 'serious' | 'surprised' | 'thinking';
  className?: string;
}

export default function InterviewerFace({ volume, isThinking, expression, className }: InterviewerFaceProps) {
  // Normalize volume for mouth opening (0-100)
  const mouthScale = Math.min(1, volume / 50);
  
  const getEyebrowPath = (side: 'left' | 'right') => {
    switch (expression) {
      case 'happy':
        return side === 'left' ? "M 30 45 Q 40 35 50 45" : "M 70 45 Q 80 35 90 45";
      case 'serious':
        return side === 'left' ? "M 30 45 Q 40 48 50 45" : "M 70 45 Q 80 48 90 45";
      case 'surprised':
        return side === 'left' ? "M 30 40 Q 40 30 50 40" : "M 70 40 Q 80 30 90 40";
      case 'thinking':
        return side === 'left' ? "M 30 42 Q 40 45 50 48" : "M 70 45 Q 80 42 90 45";
      default:
        return side === 'left' ? "M 30 42 Q 40 40 50 42" : "M 70 42 Q 80 40 90 42";
    }
  };

  const getEyePath = (side: 'left' | 'right') => {
    if (isThinking) return "M 0 0 L 10 0"; // Closed eyes when thinking
    switch (expression) {
      case 'happy':
        return "M 0 0 Q 5 -5 10 0";
      case 'serious':
        return "M 0 0 L 10 0";
      default:
        return "M 0 0 Q 5 5 10 0";
    }
  };

  return (
    <div className={cn("relative flex items-center justify-center bg-slate-900 overflow-hidden", className)}>
      {/* Background Glow */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500 blur-[120px]" />
        <div className="absolute left-1/4 top-1/4 h-[300px] w-[300px] rounded-full bg-violet-500 blur-[100px]" />
      </div>

      <svg viewBox="0 0 120 160" className="z-10 h-full w-full max-w-[400px]">
        {/* Face Shape */}
        <motion.path
          d="M 20 40 Q 20 20 60 20 Q 100 20 100 40 L 100 100 Q 100 140 60 140 Q 20 140 20 100 Z"
          fill="#1e293b"
          stroke="#334155"
          strokeWidth="2"
          animate={{
            scale: 1 + volume / 1000,
          }}
        />

        {/* Eyebrows */}
        <motion.path
          d={getEyebrowPath('left')}
          stroke="#64748b"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          animate={{ d: getEyebrowPath('left') }}
        />
        <motion.path
          d={getEyebrowPath('right')}
          stroke="#64748b"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          animate={{ d: getEyebrowPath('right') }}
        />

        {/* Eyes */}
        <g transform="translate(35, 60)">
          <motion.path
            d={getEyePath('left')}
            stroke="white"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            animate={{ d: getEyePath('left') }}
          />
          {!isThinking && (
            <motion.circle
              cx="5" cy="5" r="2"
              fill="#3b82f6"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
          )}
        </g>
        <g transform="translate(75, 60)">
          <motion.path
            d={getEyePath('right')}
            stroke="white"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            animate={{ d: getEyePath('right') }}
          />
          {!isThinking && (
            <motion.circle
              cx="5" cy="5" r="2"
              fill="#3b82f6"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
            />
          )}
        </g>

        {/* Mouth */}
        <motion.g transform="translate(60, 110)">
          <motion.path
            d={expression === 'happy' ? "M -15 0 Q 0 10 15 0" : "M -15 0 Q 0 0 15 0"}
            stroke="white"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          {/* Speaking Mouth */}
          <motion.ellipse
            cx="0" cy="5"
            rx={10 + volume / 10}
            ry={mouthScale * 15}
            fill="#ef4444"
            opacity={0.8}
            animate={{
              ry: mouthScale * 15,
              rx: 10 + volume / 10
            }}
          />
        </motion.g>

        {/* Blush for happy expression */}
        {expression === 'happy' && (
          <>
            <circle cx="30" cy="85" r="5" fill="#f43f5e" opacity="0.2" />
            <circle cx="90" cy="85" r="5" fill="#f43f5e" opacity="0.2" />
          </>
        )}
      </svg>

      {/* Thinking Particles */}
      {isThinking && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative h-64 w-64">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute h-2 w-2 rounded-full bg-blue-400"
                animate={{
                  x: [0, Math.cos(i * 60 * Math.PI / 180) * 100],
                  y: [0, Math.sin(i * 60 * Math.PI / 180) * 100],
                  opacity: [1, 0],
                  scale: [1, 0.5]
                }}
                transition={{
                  repeat: Infinity,
                  duration: 1.5,
                  delay: i * 0.2
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
