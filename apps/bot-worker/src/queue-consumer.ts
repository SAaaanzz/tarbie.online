import type { BotEnv } from './env.js';
import { sendTelegramMessage } from './telegram.js';
import { sendWhatsAppMessage } from './whatsapp.js';
import { renderTemplate, generateId, nowISO, structuredLog } from '@tarbie/shared';
import type { QueueMessage, NotificationEventType, Lang } from '@tarbie/shared';

const MAX_ATTEMPTS = 3;
const RATE_LIMIT_KEY = 'rl:bot:msg_count';
const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW = 1;

async function checkRateLimit(env: BotEnv): Promise<boolean> {
  const current = await env.KV.get(RATE_LIMIT_KEY);
  const count = current ? parseInt(current, 10) : 0;
  if (count >= RATE_LIMIT_MAX) {
    return false;
  }
  await env.KV.put(RATE_LIMIT_KEY, String(count + 1), { expirationTtl: RATE_LIMIT_WINDOW });
  return true;
}

async function getTemplate(
  env: BotEnv,
  schoolId: string,
  eventType: NotificationEventType,
  lang: Lang
): Promise<string | null> {
  const row = await env.DB.prepare(
    'SELECT template_text FROM notification_templates WHERE school_id = ? AND event_type = ? AND lang = ?'
  ).bind(schoolId, eventType, lang).first<{ template_text: string }>();

  if (row) return row.template_text;

  const defaultRow = await env.DB.prepare(
    "SELECT template_text FROM notification_templates WHERE school_id = '__default__' AND event_type = ? AND lang = ?"
  ).bind(eventType, lang).first<{ template_text: string }>();

  return defaultRow?.template_text ?? null;
}

async function logNotification(
  env: BotEnv,
  userId: string,
  sessionId: string,
  channel: 'telegram' | 'whatsapp',
  messageText: string,
  status: 'sent' | 'failed' | 'dead_letter',
  errorMsg: string | null
): Promise<void> {
  const id = generateId();
  await env.DB.prepare(
    `INSERT INTO notifications_log (id, user_id, session_id, channel, message_text, sent_at, status, error_msg)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, userId, sessionId, channel, messageText, nowISO(), status, errorMsg).run();
}

async function processMessage(env: BotEnv, msg: QueueMessage): Promise<void> {
  const { event_type, session_id, user_ids, template_vars, attempt } = msg;

  for (const userId of user_ids) {
    const user = await env.DB.prepare(
      'SELECT id, telegram_chat_id, whatsapp_number, lang, school_id FROM users WHERE id = ?'
    ).bind(userId).first<{
      id: string; telegram_chat_id: string | null;
      whatsapp_number: string | null; lang: string; school_id: string;
    }>();

    if (!user) {
      structuredLog('warn', 'User not found for notification', { user_id: userId });
      continue;
    }

    const lang = user.lang as Lang;
    const template = await getTemplate(env, user.school_id, event_type, lang);
    if (!template) {
      structuredLog('warn', 'No template found', { event_type, lang, school_id: user.school_id });
      continue;
    }

    const messageText = renderTemplate(template, template_vars);

    const canSend = await checkRateLimit(env);
    if (!canSend) {
      structuredLog('warn', 'Rate limited, will retry', { user_id: userId });
      throw new Error('RATE_LIMITED');
    }

    let sent = false;

    if (user.telegram_chat_id) {
      try {
        const result = await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, user.telegram_chat_id, messageText);
        if (result.ok) {
          await logNotification(env, userId, session_id, 'telegram', messageText, 'sent', null);
          sent = true;
        } else {
          await logNotification(env, userId, session_id, 'telegram', messageText, 'failed', result.description ?? 'Unknown error');
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        await logNotification(env, userId, session_id, 'telegram', messageText, 'failed', errorMsg);
      }
    }

    if (!sent && user.whatsapp_number) {
      try {
        const result = await sendWhatsAppMessage(env, user.whatsapp_number, messageText);
        if (result.messages && result.messages.length > 0) {
          await logNotification(env, userId, session_id, 'whatsapp', messageText, 'sent', null);
          sent = true;
        } else {
          const errMsg = result.error?.message ?? 'Unknown error';
          await logNotification(env, userId, session_id, 'whatsapp', messageText, 'failed', errMsg);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        await logNotification(env, userId, session_id, 'whatsapp', messageText, 'failed', errorMsg);
      }
    }

    if (!sent && !user.telegram_chat_id && !user.whatsapp_number) {
      await logNotification(env, userId, session_id, 'telegram', messageText, 'failed', 'No contact channel configured');
    }
  }
}

export async function handleQueue(
  batch: MessageBatch<QueueMessage>,
  env: BotEnv
): Promise<void> {
  for (const message of batch.messages) {
    const msg = message.body;

    try {
      await processMessage(env, msg);
      message.ack();
      structuredLog('info', 'Queue message processed', {
        event_type: msg.event_type,
        session_id: msg.session_id,
        user_count: msg.user_ids.length,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      structuredLog('error', 'Queue message failed', {
        event_type: msg.event_type,
        attempt: msg.attempt,
        error: errorMsg,
      });

      if (msg.attempt < MAX_ATTEMPTS - 1) {
        const delay = Math.pow(2, msg.attempt) * 1000;
        structuredLog('info', 'Retrying message', { attempt: msg.attempt + 1, delay_ms: delay });
        message.retry({ delaySeconds: delay / 1000 });
      } else {
        structuredLog('error', 'Dead letter: max attempts reached', {
          event_type: msg.event_type,
          session_id: msg.session_id,
        });

        for (const userId of msg.user_ids) {
          await logNotification(env, userId, msg.session_id, 'telegram', '', 'dead_letter', `Max attempts (${MAX_ATTEMPTS}) reached: ${errorMsg}`);
        }
        message.ack();
      }
    }
  }
}
