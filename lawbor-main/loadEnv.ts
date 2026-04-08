/**
 * 必须在其他项目模块之前加载：ESM 会先执行完所有 import 依赖，
 * 若 dotenv 写在 server.ts 顶层且晚于 VoiceCallService，则 llmService 构造时 env 仍为空。
 */
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true });
