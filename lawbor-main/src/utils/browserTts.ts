export interface SpeakOptions {
  lang?: string
  rate?: number
  pitch?: number
  volume?: number
  voice?: SpeechSynthesisVoice
  onStart?: () => void
  onEnd?: () => void
  onError?: (e: Error) => void
}

/** 检查浏览器是否支持 TTS */
export function isBrowserTtsSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

/** 获取可用的中文语音 */
export function getChineseVoice(): SpeechSynthesisVoice | null {
  if (!isBrowserTtsSupported()) return null

  const voices = window.speechSynthesis.getVoices()
  // 优先找中文语音
  const chineseVoice = voices.find(v =>
    v.lang.includes('zh-CN') || v.lang.includes('zh_CN') || v.name.includes('Chinese')
  )
  return chineseVoice ?? voices[0] ?? null
}

/** 使用浏览器 TTS 朗读文本 */
export function speakWithBrowser(text: string, options: SpeakOptions = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!isBrowserTtsSupported()) {
      reject(new Error('Browser TTS not supported'))
      return
    }

    // 停止当前正在播放的
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)

    utterance.lang = options.lang ?? 'zh-CN'
    utterance.rate = options.rate ?? 1
    utterance.pitch = options.pitch ?? 1
    utterance.volume = options.volume ?? 1
    utterance.voice = options.voice ?? getChineseVoice()

    utterance.onstart = () => {
      options.onStart?.()
    }

    utterance.onend = () => {
      options.onEnd?.()
      resolve()
    }

    utterance.onerror = (event) => {
      const error = new Error(`Speech synthesis error: ${event.error}`)
      options.onError?.(error)
      reject(error)
    }

    window.speechSynthesis.speak(utterance)
  })
}

/** 取消浏览器 TTS 播放 */
export function cancelBrowserSpeech(): void {
  if (isBrowserTtsSupported()) {
    window.speechSynthesis.cancel()
  }
}

/** 暂停浏览器 TTS */
export function pauseBrowserSpeech(): void {
  if (isBrowserTtsSupported()) {
    window.speechSynthesis.pause()
  }
}

/** 恢复浏览器 TTS */
export function resumeBrowserSpeech(): void {
  if (isBrowserTtsSupported()) {
    window.speechSynthesis.resume()
  }
}