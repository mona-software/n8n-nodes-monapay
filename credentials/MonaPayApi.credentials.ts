import type { ICredentialType, INodeProperties } from 'n8n-workflow';

export class MonaPayApi implements ICredentialType {
  name = 'monaPayApi';

  displayName = 'MONA Pay API';

  documentationUrl = 'https://monapay.vn/docs/api/dang-nhap';

  properties: INodeProperties[] = [
    {
      displayName: 'Username',
      name: 'username',
      type: 'string',
      default: '',
      required: true,
    },
    {
      displayName: 'Password',
      name: 'password',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      required: true,
    },
    {
      displayName: 'Client Secret',
      name: 'clientSecret',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      description: 'Bắt buộc với thao tác ghi như tạo QR. Sinh trong dashboard/API client keys.',
    },
    {
      displayName: 'Webhook Secret',
      name: 'webhookSecret',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      description: 'Secret HMAC_SHA256 của webhook; khác với Client Secret.',
    },
    {
      displayName: 'Base URL',
      name: 'baseUrl',
      type: 'string',
      default: 'https://api.monapay.vn',
      required: true,
    },
  ];
}
