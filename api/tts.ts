/**
 * 腾讯云语音合成 API 路由
 * 文档: https://cloud.tencent.com/document/product/1073/37995
 */

import express from 'express';
import tencentcloud from 'tencentcloud-sdk-nodejs-tts';

const router = express.Router();

/**
 * 生成 SessionId（腾讯云要求）
 */
function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

// 腾讯云 TTS 客户端
const TtsClient = tencentcloud.tts.v20190823.Client;

// 创建客户端实例
function createTtsClient() {
  const secretId = process.env.TENCENT_SECRET_ID;
  const secretKey = process.env.TENCENT_SECRET_KEY;

  if (!secretId || !secretKey) {
    throw new Error('腾讯云密钥未配置，请在 .env.local 中设置 TENCENT_SECRET_ID 和 TENCENT_SECRET_KEY');
  }

  return new TtsClient({
    credential: {
      secretId,
      secretKey,
    },
    region: 'ap-shanghai', // 华东地区（上海）
    profile: {
      httpProfile: {
        endpoint: 'tts.tencentcloudapi.com',
      },
    },
  });
}

/**
 * 可用音色列表
 * 文档: https://cloud.tencent.com/document/product/1073/92621
 */
export const AVAILABLE_VOICES = [
  // 中文男声
  { voiceId: '101004', name: '智诚', gender: 'male', description: '情感男声', recommended: true },
  { voiceId: '101005', name: '智强', gender: 'male', description: '情感男声' },
  { voiceId: '101006', name: '智贤', gender: 'male', description: '情感男声' },
  { voiceId: '101007', name: '智瑜', gender: 'male', description: '情感男声' },
  { voiceId: '101011', name: '智聪', gender: 'male', description: '标准男声' },
  { voiceId: '101013', name: '智云', gender: 'male', description: '标准男声' },
  { voiceId: '101017', name: '智强（新闻）', gender: 'male', description: '新闻播音男声' },
  
  // 中文女声
  { voiceId: '101001', name: '智瑜', gender: 'female', description: '情感女声', recommended: true },
  { voiceId: '101002', name: '智娜', gender: 'female', description: '情感女声' },
  { voiceId: '101003', name: '智琪', gender: 'female', description: '情感女声' },
  { voiceId: '101008', name: '智美', gender: 'female', description: '情感女声' },
  { voiceId: '101009', name: '智婷', gender: 'female', description: '标准女声' },
  { voiceId: '101010', name: '智彤', gender: 'female', description: '标准女声' },
  { voiceId: '101012', name: '智燕', gender: 'female', description: '标准女声' },
  { voiceId: '101016', name: '智瑜（新闻）', gender: 'female', description: '新闻播音女声' },
  
  // 粤语
  { voiceId: '101019', name: '智鸿', gender: 'male', description: '粤语男声' },
  { voiceId: '101020', name: '智霞', gender: 'female', description: '粤语女声' },
];

/**
 * GET /api/tts/voices
 * 获取可用音色列表
 */
router.get('/voices', (req, res) => {
  res.json({
    success: true,
    data: AVAILABLE_VOICES,
  });
});

/**
 * POST /api/tts/synthesize
 * 合成语音
 * 
 * Body: {
 *   text: string;       // 要合成的文本（最多 150 字）
 *   voiceId?: string;   // 音色 ID（默认：101004 智诚）
 *   speed?: number;     // 语速（0.5-2.0，默认 1.0）
 *   volume?: number;    // 音量（0-10，默认 5）
 * }
 */
router.post('/synthesize', express.json(), async (req, res) => {
  try {
    const { text, voiceId = '101004', speed = 1.0, volume = 5 } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: '请提供要合成的文本',
      });
    }

    // 检查文本长度
    if (text.length > 150) {
      return res.status(400).json({
        success: false,
        message: '文本长度不能超过 150 字',
      });
    }

    const client = createTtsClient();

    const params = {
      Text: text,
      VoiceType: parseInt(voiceId),
      Speed: speed,
      Volume: volume,
      Codec: 'mp3',
      SampleRate: 16000,
      SessionId: generateSessionId(), // ✅ 必需参数
    };

    console.log('[TTS] 合成请求:', { text: text.substring(0, 50), voiceId, speed, volume });

    const response = await client.TextToVoice(params);

    console.log('[TTS] 合成成功，音频长度:', response.Audio?.length);

    res.json({
      success: true,
      data: {
        audio: response.Audio, // Base64 编码的音频数据
        requestId: response.RequestId,
        sessionId: response.SessionId,
      },
    });
  } catch (error: any) {
    console.error('[TTS] 合成失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '语音合成失败',
      code: error.code,
    });
  }
});

/**
 * POST /api/tts/synthesize-long
 * 合成长文本语音（超过 150 字）
 * 
 * Body: {
 *   text: string;       // 要合成的文本（最多 1000 字）
 *   voiceId?: string;   // 音色 ID
 *   speed?: number;     // 语速
 *   volume?: number;    // 音量
 * }
 */
router.post('/synthesize-long', express.json(), async (req, res) => {
  try {
    const { text, voiceId = '101004', speed = 1.0, volume = 5 } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: '请提供要合成的文本',
      });
    }

    // 检查文本长度
    if (text.length > 1000) {
      return res.status(400).json({
        success: false,
        message: '文本长度不能超过 1000 字',
      });
    }

    const client = createTtsClient();

    const params = {
      Text: text,
      VoiceType: parseInt(voiceId),
      Speed: speed,
      Volume: volume,
      Codec: 'mp3',
      SampleRate: 16000,
      ModelType: 1, // 使用长文本模型
      SessionId: generateSessionId(), // ✅ 必需参数
    };

    console.log('[TTS] 长文本合成请求:', { text: text.substring(0, 50), voiceId, speed, volume });

    const response = await client.TextToVoice(params);

    console.log('[TTS] 长文本合成成功，音频长度:', response.Audio?.length);

    res.json({
      success: true,
      data: {
        audio: response.Audio,
        requestId: response.RequestId,
        sessionId: response.SessionId,
      },
    });
  } catch (error: any) {
    console.error('[TTS] 长文本合成失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '语音合成失败',
      code: error.code,
    });
  }
});

export default router;
