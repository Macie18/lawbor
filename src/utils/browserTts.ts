export type VoiceGenderPreference = 'male' | 'female' | 'any'

export interface SpeakOptions {
  lang?: string
  rate?: number
  pitch?: number
  volume?: number
  voice?: SpeechSynthesisVoice
  /** 优先选用的性别音色（依赖系统语音名称启发式；默认 any） */
  voiceGender?: VoiceGenderPreference
  onStart?: () => void
  onEnd?: () => void
  onError?: (e: Error) => void
}

let voicesCache: SpeechSynthesisVoice[] | null = null

function invalidateVoicesCache(): void {
  voicesCache = null
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.addEventListener('voiceschanged', invalidateVoicesCache)
}

/** 检查浏览器是否支持 TTS */
export function isBrowserTtsSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

/** 等待系统语音列表就绪（首次调用时常为空，需 voiceschanged） */
export function ensureVoicesLoaded(): Promise<SpeechSynthesisVoice[]> {
  if (!isBrowserTtsSupported()) {
    return Promise.resolve([])
  }

  if (voicesCache && voicesCache.length > 0) {
    return Promise.resolve(voicesCache)
  }

  const synth = window.speechSynthesis
  const existing = synth.getVoices()
  if (existing.length > 0) {
    voicesCache = existing
    return Promise.resolve(existing)
  }

  return new Promise((resolve) => {
    let settled = false
    const done = () => {
      if (settled) return
      settled = true
      const v = synth.getVoices()
      voicesCache = v.length ? v : null
      resolve(v)
    }

    const onVoices = () => {
      if (synth.getVoices().length > 0) {
        synth.removeEventListener('voiceschanged', onVoices)
        done()
      }
    }

    synth.addEventListener('voiceschanged', onVoices)
    synth.getVoices()

    window.setTimeout(() => {
      synth.removeEventListener('voiceschanged', onVoices)
      done()
    }, 2500)
  })
}

/** 根据名称/URI 推断「更像真人」的神经/在线自然音（Edge/Chrome 常见命名） */
function scoreVoiceNaturalness(label: string): number {
  const n = label.toLowerCase()
  let s = 0
  if (n.includes('neural')) s += 55
  if (n.includes('natural')) s += 50
  if (n.includes('online')) s += 28
  if (n.includes('premium')) s += 40
  if (n.includes('enhanced')) s += 35
  if (n.includes('wavenet') || n.includes('studio')) s += 32
  // 微软中文神经音色常见名
  if (/xiaoxiao|yunxi|xiaoyi|yunjian|xiaochen|xiaohan|xiaomeng|xiaorui|xiaoshuang|xiaoxuan|xiaoyou|yunfeng|yunyang/i.test(n)) {
    s += 22
  }
  // macOS Siri 高质量语音（Eddy/Grandpa/Reed/Rocko 等）
  if (/grandpa|eddy|reed|rocko|奶奶|grandma|flo|sandy|shelley/i.test(n)) {
    s += 45
  }
  // Google 语音也比较自然
  if (n.includes('google')) s += 25
  if (n.includes('compact') || n.includes('legacy') || n.includes('robotic')) s -= 35
  return s
}

/** 中文常见「晓」系多为女声；云扬/云野/云枫/云健等偏稳重男声 */
const ZH_FEMALE_NAME_HINT =
  /xiaoxiao|xiaoyi|xiaohan|xiaomeng|xiaorui|xiaoshuang|xiaoxuan|xiaoyan|xiaochen|xiaomo|xiaoyou|晓|女|婷婷|奶奶|grandma|flo|sandy|shelley/i
const ZH_MALE_STEADY_HINT =
  /yunyang|yunye|yunfeng|yunjian|kangkang|yunxi|云扬|云野|云枫|云健|云希|男|grandpa|eddy|reed|rocko/i

/** 英文常见系统语音名启发式 */
const EN_FEMALE_HINT =
  /zira|jenny|aria|susan|linda|hazel|sonia|michelle|female|女/i
const EN_MALE_HINT =
  /mark|david|guy|christopher|james|ryan|george|richard|thomas|brian|jason|tony|male|男/i

/**
 * 在「稳重男声 / 女声」偏好下调整得分（与 scoreVoiceNaturalness 叠加）
 */
function scoreVoiceGenderPreference(
  label: string,
  pref: VoiceGenderPreference,
  primaryLang: string,
): number {
  if (pref === 'any') return 0
  const n = label.toLowerCase()

  if (primaryLang === 'zh') {
    if (pref === 'male') {
      let s = 0
      if (/yunyang|yunye|yunfeng|yunjian/i.test(n)) s += 52
      else if (/yunxi|kangkang/i.test(n)) s += 34
      // macOS Siri 男声（Grandpa/Eddy/Reed/Rocko）
      else if (/grandpa|eddy|reed|rocko/i.test(n)) s += 48
      else if (ZH_MALE_STEADY_HINT.test(label)) s += 28
      if (ZH_FEMALE_NAME_HINT.test(label)) s -= 70
      return s
    }
    if (pref === 'female') {
      let s = 0
      if (ZH_FEMALE_NAME_HINT.test(label)) s += 45
      if (ZH_MALE_STEADY_HINT.test(label)) s -= 55
      return s
    }
  }

  if (primaryLang === 'en') {
    if (pref === 'male') {
      let s = 0
      if (/microsoft\s+mark|microsoft\s+david|microsoft\s+guy|microsoft\s+christopher/i.test(n)) s += 48
      else if (EN_MALE_HINT.test(label)) s += 32
      if (EN_FEMALE_HINT.test(label)) s -= 65
      return s
    }
    if (pref === 'female') {
      let s = 0
      if (EN_FEMALE_HINT.test(label)) s += 40
      if (EN_MALE_HINT.test(label)) s -= 50
      return s
    }
  }

  return 0
}

function totalVoiceScore(
  label: string,
  genderPref: VoiceGenderPreference,
  primaryLang: string,
): number {
  return scoreVoiceNaturalness(label) + scoreVoiceGenderPreference(label, genderPref, primaryLang)
}

/**
 * 为给定 BCP-47 lang 选取听感最自然的语音（优先神经/Natural/Online；可按 voiceGender 偏男/女）
 */
export function pickNaturalVoice(
  lang: string | undefined,
  voices: SpeechSynthesisVoice[],
  genderPref: VoiceGenderPreference = 'any',
): SpeechSynthesisVoice | null {
  if (!voices.length) return null

  const raw = (lang || 'zh-CN').toLowerCase().replace('_', '-')
  const primary = raw.startsWith('zh') ? 'zh' : raw.startsWith('en') ? 'en' : raw.split('-')[0] || 'en'

  const candidates = voices.filter((v) => {
    const vl = v.lang.toLowerCase().replace('_', '-')
    if (primary === 'zh') return vl.startsWith('zh')
    if (primary === 'en') return vl.startsWith('en')
    return vl.startsWith(primary)
  })

  const pool = candidates.length > 0 ? candidates : voices

  const sorted = [...pool].sort((a, b) => {
    const la = `${a.name} ${a.voiceURI || ''}`
    const lb = `${b.name} ${b.voiceURI || ''}`
    const diff = totalVoiceScore(lb, genderPref, primary) - totalVoiceScore(la, genderPref, primary)
    if (diff !== 0) return diff
    if (a.default && !b.default) return -1
    if (!a.default && b.default) return 1
    return 0
  })

  return sorted[0] ?? null
}

/** @deprecated 使用 pickNaturalVoice + ensureVoicesLoaded */
export function getChineseVoice(): SpeechSynthesisVoice | null {
  if (!isBrowserTtsSupported()) return null
  return pickNaturalVoice('zh-CN', window.speechSynthesis.getVoices(), 'any')
}

/** 使用浏览器 TTS 朗读文本（自动优选神经/自然音色，略降语速） */
export function speakWithBrowser(text: string, options: SpeakOptions = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!isBrowserTtsSupported()) {
      reject(new Error('Browser TTS not supported'))
      return
    }

    const synth = window.speechSynthesis
    synth.cancel()

    const lang = options.lang ?? 'zh-CN'
    const genderPref = options.voiceGender ?? 'any'
    const startSpeak = (voice: SpeechSynthesisVoice | null) => {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = lang
      // 略慢于 1.0 通常更少「赶词」机械感；稳重男声略压低 pitch
      utterance.rate = options.rate ?? 0.93
      utterance.pitch =
        options.pitch ?? (genderPref === 'male' ? 0.96 : genderPref === 'female' ? 1.02 : 1)
      utterance.volume = options.volume ?? 1
      if (options.voice) {
        utterance.voice = options.voice
      } else if (voice) {
        utterance.voice = voice
      }

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

      synth.speak(utterance)
    }

    if (options.voice) {
      startSpeak(null)
      return
    }

    void ensureVoicesLoaded()
      .then((voices) => startSpeak(pickNaturalVoice(lang, voices, genderPref)))
      .catch(() =>
        startSpeak(pickNaturalVoice(lang, window.speechSynthesis.getVoices(), genderPref)),
      )
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