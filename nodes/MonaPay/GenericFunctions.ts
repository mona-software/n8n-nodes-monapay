import type { IDataObject, IExecuteFunctions, IHttpRequestMethods, IHttpRequestOptions } from 'n8n-workflow';

type Envelope = {
  success?: boolean;
  message?: string;
  detail?: string | unknown[];
  data?: unknown;
};

function messageFrom(response: Envelope, fallback: string): string {
  if (typeof response.message === 'string' && response.message) return response.message;
  if (typeof response.detail === 'string' && response.detail) return response.detail;
  if (Array.isArray(response.detail)) return JSON.stringify(response.detail);
  return fallback;
}

export async function monaPayRequest(
  this: IExecuteFunctions,
  method: IHttpRequestMethods,
  path: string,
  body?: IDataObject,
  qs?: IDataObject,
): Promise<unknown> {
  const credentials = await this.getCredentials('monaPayApi');
  const baseUrl = String(credentials.baseUrl || 'https://api.monapay.vn').replace(/\/+$/, '');
  const login = await this.helpers.httpRequest({
    method: 'POST',
    url: `${baseUrl}/api/v1/client/login`,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: {
      username: String(credentials.username),
      password: String(credentials.password),
    },
    json: true,
  }) as Envelope;

  if (login.success === false) throw new Error(messageFrom(login, 'Đăng nhập MONA Pay thất bại.'));
  const loginData = login.data as IDataObject | undefined;
  const accessToken = String(loginData?.access_token || '');
  if (!accessToken) throw new Error('Response đăng nhập MONA Pay không có access_token.');

  const headers: Record<string, string> = {
    Accept: 'application/json',
    Authorization: `Bearer ${accessToken}`,
  };
  if (method !== 'GET') {
    const clientSecret = String(credentials.clientSecret || '');
    if (!clientSecret) throw new Error('Thao tác ghi cần Client Secret trong credential MONA Pay API.');
    headers['X-Client-Secret'] = clientSecret;
    headers['Content-Type'] = 'application/json';
  }

  const options: IHttpRequestOptions = {
    method,
    url: `${baseUrl}${path}`,
    headers,
    json: true,
    ...(body === undefined ? {} : { body }),
    ...(qs === undefined ? {} : { qs }),
  };
  const response = await this.helpers.httpRequest(options) as Envelope;
  if (response.success === false) throw new Error(messageFrom(response, `MONA Pay API lỗi ở ${path}.`));
  return response.data;
}
