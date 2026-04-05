import { useCallback, useRef, useState } from 'react'

export interface UseSpeechDictationOptions {
  onCommit?: (text: string) => void
  onResult?: (text: string) => void
  onError?: (code: string) => void
  silenceMs?: number
  lang?: string
}

export interface SpeechDictationResult {
  /** 是否支持语音识别 */
  supported: boolean
  /** 是否正在聆听 */
  listening: boolean
  /** 当前识别到的文字（实时） */
  liveLine: string
  /** 提交识别结果并停止聆听 */
  commitAndStop: () => void
  /** 取消本次识别 */
  cancel: () => void
  /** 开始聆听 */
  start: () => void
}

export function useSpeechDictation(options: UseSpeechDictationOptions): SpeechDictationResult {
  const {
    onCommit,
    onResult,
    onError,
    silenceMs = 1500,
    lang = 'zh-CN',
  } = options

  const [listening, setListening] = useState(false)
  const [liveLine, setLiveLine] = useState('')
  const recognizerRef = useRef<SpeechRecognition | null>(null)
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const supported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

  const cleanup = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
    if (recognizerRef.current) {
      recognizerRef.current.abort()
      recognizerRef.current = null
    }
  }, [])

  const start = useCallback(() => {
    if (!supported) {
      onError?.('not-supported')
      return
    }

    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognizer = new SpeechRecognitionAPI()
    recognizerRef.current = recognizer

    recognizer.lang = lang
    recognizer.interimResults = true
    recognizer.continuous = true

    recognizer.onstart = () => {
      setListening(true)
      setLiveLine('')
    }

    recognizer.onresult = (event: SpeechRecognitionEvent) => {
      const results = event.results
      const lastResult = results[results.length - 1]
      const text = lastResult[0].transcript.trim()

      setLiveLine(text)
      onResult?.(text)

      // 如果检测到静音（长度为0且已识别），重置计时器
      if (text.length > 0) {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
        silenceTimerRef.current = setTimeout(() => {
          if (text.length > 0 && lastResult.isFinal) {
            onCommit?.(text)
            cleanup()
            setListening(false)
          }
        }, silenceMs)
      }
    }

    recognizer.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error)
      // 不处理 "no-speech" 错误，因为它意味着用户停止了说话
      if (event.error !== 'no-speech') {
        onError?.(event.error)
      }
      cleanup()
      setListening(false)
    }

    recognizer.onend = () => {
      setListening(false)
      cleanup()
    }

    try {
      recognizer.start()
    } catch (e) {
      console.error('Failed to start speech recognition:', e)
      onError?.('start-failed')
    }
  }, [supported, lang, silenceMs, onCommit, onResult, onError, cleanup])

  const commitAndStop = useCallback(() => {
    if (recognizerRef.current && liveLine.length > 0) {
      onCommit?.(liveLine)
    }
    cleanup()
    setListening(false)
  }, [liveLine, onCommit, cleanup])

  const cancel = useCallback(() => {
    cleanup()
    setListening(false)
    setLiveLine('')
  }, [cleanup])

  return {
    supported,
    listening,
    liveLine,
    start,
    commitAndStop,
    cancel,
  }
}