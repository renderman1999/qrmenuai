export interface TelegramSendResult {
  ok: boolean
  description?: string
  result?: any
}

export async function sendTelegramMessage(chatId: string, text: string, overrideToken?: string): Promise<TelegramSendResult> {
  const token = overrideToken || process.env.TELEGRAM_BOT_TOKEN
  if (!token) {
    return { ok: false, description: 'Missing TELEGRAM_BOT_TOKEN env' }
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text })
    })

    const data = await res.json()
    if (!res.ok || data.ok !== true) {
      return { ok: false, description: data?.description || `HTTP ${res.status}` }
    }
    return { ok: true, result: data.result }
  } catch (e: any) {
    return { ok: false, description: e?.message || 'Unknown error' }
  }
}


