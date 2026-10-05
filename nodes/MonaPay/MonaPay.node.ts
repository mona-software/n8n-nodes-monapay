import type {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { monaPayRequest } from './GenericFunctions';

export class MonaPay implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'MONA Pay',
    name: 'monaPay',
    icon: 'fa:wallet',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"]}}',
    description: 'Tạo VietQR và tra dữ liệu MONA Pay',
    defaults: { name: 'MONA Pay' },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [{ name: 'monaPayApi', required: true }],
    properties: [
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        options: [
          { name: 'Tạo QR', value: 'createQr', action: 'Tạo Viet QR' },
          { name: 'Tra giao dịch', value: 'listTransactions', action: 'Tra giao dịch' },
          { name: 'Danh sách webhook', value: 'listWebhooks', action: 'Lấy danh sách webhook' },
        ],
        default: 'createQr',
      },
      {
        displayName: 'Owner Number',
        name: 'ownerNumber',
        type: 'string',
        required: true,
        default: '',
        description: 'Số tài khoản ACB nhận tiền',
        displayOptions: { show: { operation: ['createQr'] } },
      },
      {
        displayName: 'Owner Type',
        name: 'ownerType',
        type: 'options',
        options: [
          { name: 'Cá nhân', value: 'PER' },
          { name: 'Tổ chức', value: 'ORG' },
        ],
        default: 'ORG',
        displayOptions: { show: { operation: ['createQr'] } },
      },
      {
        displayName: 'Merchant ID',
        name: 'merchantId',
        type: 'string',
        required: true,
        default: '',
        displayOptions: { show: { operation: ['createQr'] } },
      },
      {
        displayName: 'Terminal ID',
        name: 'terminalId',
        type: 'string',
        required: true,
        default: '',
        displayOptions: { show: { operation: ['createQr'] } },
      },
      {
        displayName: 'Order ID',
        name: 'orderId',
        type: 'string',
        required: true,
        default: '',
        displayOptions: { show: { operation: ['createQr'] } },
      },
      {
        displayName: 'Virtual Account Prefix',
        name: 'virtualAccountPrefix',
        type: 'string',
        required: true,
        default: '',
        typeOptions: { maxLength: 10 },
        displayOptions: { show: { operation: ['createQr'] } },
      },
      {
        displayName: 'Beneficiary Name',
        name: 'beneficiaryName',
        type: 'string',
        required: true,
        default: '',
        displayOptions: { show: { operation: ['createQr'] } },
      },
      {
        displayName: 'Amount',
        name: 'amount',
        type: 'number',
        required: true,
        default: 10000,
        typeOptions: { minValue: 1, maxValue: 1000000000, numberPrecision: 0 },
        displayOptions: { show: { operation: ['createQr'] } },
      },
      {
        displayName: 'Description',
        name: 'description',
        type: 'string',
        default: '',
        typeOptions: { maxLength: 255 },
        displayOptions: { show: { operation: ['createQr'] } },
      },
      {
        displayName: 'Virtual Account Number',
        name: 'virtualAccountNumber',
        type: 'string',
        required: true,
        default: '',
        displayOptions: { show: { operation: ['listTransactions'] } },
      },
      {
        displayName: 'Page',
        name: 'page',
        type: 'number',
        default: 1,
        typeOptions: { minValue: 1, numberPrecision: 0 },
        displayOptions: { show: { operation: ['listTransactions'] } },
      },
      {
        displayName: 'Limit',
        name: 'limit',
        type: 'number',
        default: 100,
        typeOptions: { minValue: 1, maxValue: 100, numberPrecision: 0 },
        displayOptions: { show: { operation: ['listTransactions'] } },
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const output: INodeExecutionData[] = [];

    for (let itemIndex = 0; itemIndex < items.length; itemIndex += 1) {
      try {
        const operation = this.getNodeParameter('operation', itemIndex) as string;
        let data: unknown;

        if (operation === 'createQr') {
          const description = this.getNodeParameter('description', itemIndex, '') as string;
          data = await monaPayRequest.call(this, 'POST', '/api/v1/acb/qr-payment/generate', {
            ownerNumber: this.getNodeParameter('ownerNumber', itemIndex) as string,
            ownerType: this.getNodeParameter('ownerType', itemIndex) as string,
            merchantId: this.getNodeParameter('merchantId', itemIndex) as string,
            terminalId: this.getNodeParameter('terminalId', itemIndex) as string,
            orderId: this.getNodeParameter('orderId', itemIndex) as string,
            virtualAccountPrefix: this.getNodeParameter('virtualAccountPrefix', itemIndex) as string,
            beneficiaryName: this.getNodeParameter('beneficiaryName', itemIndex) as string,
            amount: this.getNodeParameter('amount', itemIndex) as number,
            ...(description ? { description } : {}),
          });
        } else if (operation === 'listTransactions') {
          data = await monaPayRequest.call(
            this,
            'GET',
            '/api/v1/acb/virtual-account/transactions',
            undefined,
            {
              virtual_account_number: this.getNodeParameter('virtualAccountNumber', itemIndex) as string,
              page: this.getNodeParameter('page', itemIndex) as number,
              limit: this.getNodeParameter('limit', itemIndex) as number,
            },
          );
        } else if (operation === 'listWebhooks') {
          data = await monaPayRequest.call(this, 'GET', '/api/v1/client-webhooks');
        } else {
          throw new NodeOperationError(this.getNode(), `Operation không được hỗ trợ: ${operation}`, { itemIndex });
        }

        const resultItems = this.helpers.returnJsonArray(data as IDataObject | IDataObject[]);
        output.push(...resultItems.map((item) => ({ ...item, pairedItem: { item: itemIndex } })));
      } catch (error) {
        if (!this.continueOnFail()) throw error;
        const message = error instanceof Error ? error.message : String(error);
        output.push({ json: { error: message }, pairedItem: { item: itemIndex } });
      }
    }

    return [output];
  }
}
