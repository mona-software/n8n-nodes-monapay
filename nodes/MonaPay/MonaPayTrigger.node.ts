import { createHmac, timingSafeEqual } from 'node:crypto';
import type {
  IDataObject,
  INodeType,
  INodeTypeDescription,
  IWebhookFunctions,
  IWebhookResponseData,
} from 'n8n-workflow';

type RequestWithRawBody = {
  rawBody?: Buffer | Uint8Array | string;
  body?: Buffer | Uint8Array | string;
};

function rawBodyFrom(request: RequestWithRawBody): Buffer | undefined {
  const value = request.rawBody ?? request.body;
  if (typeof value === 'string') return Buffer.from(value, 'utf8');
  if (value instanceof Uint8Array) return Buffer.from(value.buffer, value.byteOffset, value.byteLength);
  return undefined;
}

function signatureIsValid(rawBody: Buffer, timestamp: string, signature: string, secret: string): boolean {
  if (!/^\d+$/.test(timestamp)) return false;
  const timestampNumber = Number(timestamp);
  if (!Number.isSafeInteger(timestampNumber)) return false;
  if (Math.abs(Math.floor(Date.now() / 1000) - timestampNumber) > 300) return false;

  const expected = createHmac('sha256', secret)
    .update(Buffer.from(`${timestamp}.`, 'utf8'))
    .update(rawBody)
    .digest();
  const match = /^sha256=([0-9a-fA-F]{64})$/.exec(signature);
  const supplied = match ? Buffer.from(match[1], 'hex') : Buffer.alloc(expected.length);
  return timingSafeEqual(expected, supplied) && Boolean(match);
}

export class MonaPayTrigger implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'MONA Pay Trigger',
    name: 'monaPayTrigger',
    icon: 'fa:wallet',
    group: ['trigger'],
    version: 1,
    description: 'Nhận và xác thực webhook giao dịch MONA Pay',
    defaults: { name: 'MONA Pay Trigger' },
    inputs: [],
    outputs: ['main'],
    credentials: [{ name: 'monaPayApi', required: true }],
    webhooks: [
      {
        name: 'default',
        httpMethod: 'POST',
        responseMode: 'onReceived',
        path: 'monapay',
      },
    ],
    properties: [
      {
        displayName: 'Webhook phải dùng auth type HMAC_SHA256. Node từ chối request nếu n8n không cung cấp raw body nguyên bản.',
        name: 'notice',
        type: 'notice',
        default: '',
      },
    ],
  };

  async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
    const credentials = await this.getCredentials('monaPayApi');
    const secret = String(credentials.webhookSecret || '');
    const request = this.getRequestObject() as RequestWithRawBody;
    const response = this.getResponseObject();
    const headers = this.getHeaderData();
    const timestamp = String(headers['x-mona-timestamp'] || headers['X-Mona-Timestamp'] || '');
    const signature = String(headers['x-mona-signature'] || headers['X-Mona-Signature'] || '');
    const rawBody = rawBodyFrom(request);

    if (!secret) {
      response.status(500).json({ ok: false, reason: 'webhook_secret_not_configured' });
      return { noWebhookResponse: true };
    }
    if (!rawBody) {
      response.status(400).json({ ok: false, reason: 'raw_body_required' });
      return { noWebhookResponse: true };
    }
    if (!signatureIsValid(rawBody, timestamp, signature, secret)) {
      response.status(401).json({ ok: false, reason: 'invalid_signature_or_timestamp' });
      return { noWebhookResponse: true };
    }

    let payload: IDataObject;
    try {
      payload = JSON.parse(rawBody.toString('utf8')) as IDataObject;
    } catch {
      response.status(400).json({ ok: false, reason: 'invalid_json' });
      return { noWebhookResponse: true };
    }

    response.status(200).json({ ok: true });
    return {
      noWebhookResponse: true,
      workflowData: [this.helpers.returnJsonArray([payload])],
    };
  }
}
