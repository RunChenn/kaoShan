/**
 * AI 智慧路由 composable
 *
 * 三種輸入自動對應後端模型：
 *   chat()         → POST /ai/chat          → Gemini
 *   hikingRecord() → POST /ai/hiking-record  → Gemini
 *   voice()        → POST /ai/voice          → Google STT → Gemini
 */

import { api } from 'src/boot/axios'

export interface AiRouterResponse {
  input_type: string
  model_used: string
  transcribed_text?: string
  reply: string
}

export function useAiRouter() {
  /** 文字聊天 → Gemini */
  async function chat(message: string): Promise<AiRouterResponse> {
    const form = new FormData()
    form.append('message', message)
    const { data } = await api.post<AiRouterResponse>('/ai/chat', form)
    return data
  }

  /** 爬山紀錄文字分析 → Gemini */
  async function hikingRecord(content: string): Promise<AiRouterResponse> {
    const form = new FormData()
    form.append('content', content)
    const { data } = await api.post<AiRouterResponse>('/ai/hiking-record', form)
    return data
  }

  /** 語音 blob → Google STT 轉文字 → Gemini */
  async function voice(
    audioBlob: Blob,
    filename = 'audio.webm',
  ): Promise<AiRouterResponse> {
    const form = new FormData()
    form.append('audio', audioBlob, filename)
    const { data } = await api.post<AiRouterResponse>('/ai/voice', form, {
      timeout: 30000, // Google STT 可能需要較長時間
    })
    return data
  }

  return { chat, hikingRecord, voice }
}
