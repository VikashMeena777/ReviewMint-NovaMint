// ============================================
// ReviewMint — WhatsApp Cloud API Client
// Adapted from AssistMint's battle-tested client
// ============================================

const WHATSAPP_API_URL = 'https://graph.facebook.com/v26.0';

export function sanitizeWhatsAppNumber(phone: string): string {
  let clean = phone.trim().replace(/\D/g, '');
  if (clean.length === 10) {
    clean = '91' + clean; // Default to India prefix
  }
  return clean;
}

// ─── Exponential Backoff Retry ──────────────

interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  retryableStatusCodes?: number[];
}

async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries = 2, baseDelayMs = 200, retryableStatusCodes = [429, 500, 502, 503, 504] } = options;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      const message = lastError.message || '';

      const isRetryable = retryableStatusCodes.some(code => message.includes(`${code}`)) ||
        message.includes('ECONNRESET') ||
        message.includes('ETIMEDOUT') ||
        message.includes('fetch failed');

      if (!isRetryable || attempt === maxRetries) {
        throw lastError;
      }

      const delay = baseDelayMs * Math.pow(2, attempt);
      console.warn(`[WhatsApp] Retry ${attempt + 1}/${maxRetries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

interface SendMessageOptions {
  phoneNumberId: string;
  accessToken: string;
  to: string;
}

// ─── Send Text Message ──────────────────────

export async function sendTextMessage(
  options: SendMessageOptions & { text: string }
): Promise<{ message_id: string }> {
  return withRetry(async () => {
    const { phoneNumberId, accessToken, to, text } = options;
    const response = await fetch(
      `${WHATSAPP_API_URL}/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: sanitizeWhatsAppNumber(to),
          type: 'text',
          text: { preview_url: true, body: text },
        }),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      throw new Error(`WhatsApp API error ${response.status}: ${JSON.stringify(data)}`);
    }
    return { message_id: data.messages?.[0]?.id || '' };
  });
}

// ─── Send Template Message ──────────────────

export async function sendTemplateMessage(
  options: SendMessageOptions & {
    templateName: string;
    languageCode?: string;
    components?: unknown[];
  }
): Promise<{ message_id: string }> {
  return withRetry(async () => {
    const { phoneNumberId, accessToken, to, templateName, languageCode = 'en', components } = options;

    const template: Record<string, unknown> = {
      name: templateName,
      language: { code: languageCode },
    };
    if (components) template.components = components;

    const response = await fetch(
      `${WHATSAPP_API_URL}/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: sanitizeWhatsAppNumber(to),
          type: 'template',
          template,
        }),
      }
    );

    const data = await response.json();
    if (!response.ok) throw new Error(`WhatsApp API error ${response.status}: ${JSON.stringify(data)}`);
    return { message_id: data.messages?.[0]?.id || '' };
  });
}

// ─── Submit Message Template for Approval ───

export async function submitTemplate(
  wabaId: string,
  accessToken: string,
  templateData: {
    name: string;
    language: string;
    category: string;
    components: unknown[];
  }
): Promise<{ id: string; status: string }> {
  const response = await fetch(
    `${WHATSAPP_API_URL}/${wabaId}/message_templates`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(templateData),
    }
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Template submission failed: ${JSON.stringify(data)}`);
  }
  return { id: data.id, status: data.status };
}

// ─── Check Template Status ──────────────────

export async function getTemplateStatus(
  wabaId: string,
  accessToken: string,
  templateName: string
): Promise<{ status: string; id: string } | null> {
  const response = await fetch(
    `${WHATSAPP_API_URL}/${wabaId}/message_templates?name=${templateName}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  const data = await response.json();
  if (!response.ok || !data.data?.length) return null;
  
  const template = data.data[0];
  return { status: template.status, id: template.id };
}

// ─── Submit Review Request Templates ────────

export async function submitReviewTemplates(
  wabaId: string,
  accessToken: string
): Promise<{ en?: { id: string; status: string }; hi?: { id: string; status: string } }> {
  const results: { en?: { id: string; status: string }; hi?: { id: string; status: string } } = {};

  // English template
  try {
    results.en = await submitTemplate(wabaId, accessToken, {
      name: 'reviewmint_review_request_en',
      language: 'en',
      category: 'MARKETING',
      components: [
        {
          type: 'BODY',
          text: 'Hi {{1}}, thank you for visiting {{2}}! 🙏\n\nWe hope you had a great experience. Could you take a moment to leave us a Google review?\n\n👉 {{3}}\n\nThank you!\n- {{2}}',
          example: {
            body_text: [['Priya', 'Dr. Saraswat Dental', 'https://g.page/r/review']],
          },
        },
      ],
    });
  } catch (err) {
    console.error('[WhatsApp] EN template submission failed:', err);
  }

  // Hindi template
  try {
    results.hi = await submitTemplate(wabaId, accessToken, {
      name: 'reviewmint_review_request_hi',
      language: 'hi',
      category: 'MARKETING',
      components: [
        {
          type: 'BODY',
          text: 'नमस्ते {{1}} जी, {{2}} में आने के लिए धन्यवाद! 🙏\n\nक्या आप हमें Google पर एक review दे सकते हैं? इससे हमें बहुत मदद मिलती है।\n\n👉 {{3}}\n\nधन्यवाद!\n- {{2}}',
          example: {
            body_text: [['प्रिया', 'डॉ. सारस्वत डेंटल', 'https://g.page/r/review']],
          },
        },
      ],
    });
  } catch (err) {
    console.error('[WhatsApp] HI template submission failed:', err);
  }

  return results;
}

// ─── Mark Message as Read ───────────────────

export async function markAsRead(
  options: SendMessageOptions & { messageId: string }
): Promise<void> {
  const { phoneNumberId, accessToken, messageId } = options;
  await fetch(`${WHATSAPP_API_URL}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId,
    }),
  });
}
