/**
 * 腾讯云语音合成服务
 * 前端调用接口
 */

export interface TtsVoice {
  voiceId: string;
  name: string;
  gender: 'male' | 'female';
  description: string;
  recommended?: boolean;
}

export interface SynthesizeOptions {
  text: string;
  voiceId?: string;
  speed?: number;
  volume?: number;
}

export interface SynthesizeResult {
  audio: string; // Base64 编码的音频数据
  requestId: string;
  sessionId: string;
}

/**
 * 获取可用音色列表
 */
export async function getAvailableVoices(): Promise<TtsVoice[]> {
  const response = await fetch('/api/tts/voices');
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.message || '获取音色列表失败');
  }
  
  return data.data;
}

/**
 * 合成语音（短文本，最多 150 字）
 */
export async function synthesizeSpeech(options: SynthesizeOptions): Promise<SynthesizeResult> {
  const response = await fetch('/api/tts/synthesize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(options),
  });
  
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.message || '语音合成失败');
  }
  
  return data.data;
}

/**
 * 合成长文本语音（最多 1000 字）
 */
export async function synthesizeLongSpeech(options: SynthesizeOptions): Promise<SynthesizeResult> {
  const response = await fetch('/api/tts/synthesize-long', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(options),
  });
  
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.message || '语音合成失败');
  }
  
  return data.data;
}

/**
 * 播放合成的音频
 * @param audioBase64 Base64 编码的音频数据
 * @param onEnd 播放结束回调
 */
export function playAudio(audioBase64: string, onEnd?: () => void): HTMLAudioElement {
  // 创建音频 Blob
  const binaryString = atob(audioBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: 'audio/mp3' });
  const url = URL.createObjectURL(blob);
  
  // 创建音频元素
  const audio = new Audio(url);
  
  audio.onended = () => {
    URL.revokeObjectURL(url);
    onEnd?.();
  };
  
  audio.onerror = () => {
    URL.revokeObjectURL(url);
    console.error('[TTS] 音频播放失败');
  };
  
  audio.play().catch(error => {
    console.error('[TTS] 播放失败:', error);
    URL.revokeObjectURL(url);
  });
  
  return audio;
}

/**
 * 取消音频播放
 */
let currentAudio: HTMLAudioElement | null = null;

export function cancelCurrentAudio(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
}

/**
 * 使用腾讯云 TTS 朗读文本
 * 自动选择短文本或长文本合成
 */
export async function speakWithTencentTts(
  text: string,
  options: {
    voiceId?: string;
    speed?: number;
    volume?: number;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (error: Error) => void;
  } = {}
): Promise<void> {
  try {
    // 取消之前的播放
    cancelCurrentAudio();
    
    // 选择合成方式
    const synthesizer = text.length > 150 ? synthesizeLongSpeech : synthesizeSpeech;
    
    // 合成语音
    const result = await synthesizer({
      text,
      voiceId: options.voiceId || '101004', // 默认：智诚
      speed: options.speed || 1.0,
      volume: options.volume || 5,
    });
    
    // 播放音频
    options.onStart?.();
    
    currentAudio = playAudio(result.audio, () => {
      currentAudio = null;
      options.onEnd?.();
    });
    
  } catch (error) {
    console.error('[TTS] 合成失败:', error);
    options.onError?.(error instanceof Error ? error : new Error('未知错误'));
  }
}
