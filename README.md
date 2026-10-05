# n8n-nodes-monapay

n8n community nodes for MONA Pay: create VietQR codes, look up transactions and receive verified MONA Pay webhooks inside n8n workflows.

The package contains:

- **MONA Pay** node with three operations: create a VietQR (`Tạo QR`), list transactions of a virtual account (`Tra giao dịch`) and list webhook configs (`Danh sách webhook`).
- **MONA Pay Trigger** node: receives webhook JSON and emits an item only when the HMAC-SHA256 signature over the raw body is valid and the timestamp is within 300 seconds.
- **MONA Pay API** credential.

## Install

The package is not yet on npm. Build it from source and load it into your n8n instance as a custom node:

```bash
git clone https://github.com/mona-software/n8n-nodes-monapay.git
cd n8n-nodes-monapay
npm install
npm run build   # compiles with tsc into dist/
```

Then link or copy the package into your n8n custom nodes directory (for example `~/.n8n/custom`) as described in the n8n documentation for your version, and restart n8n.

## Configuration

Create a **MONA Pay API** credential:

| Field | Required | Meaning |
| --- | --- | --- |
| Username | yes | MONA Pay username, used to obtain the Bearer token |
| Password | yes | MONA Pay password |
| Client Secret | for write actions | Sent as `X-Client-Secret` when creating a QR code; not needed for listing transactions or webhooks |
| Webhook Secret | for the trigger | Must match the `secret_key` of an `HMAC_SHA256` webhook config; this is not the Client Secret |
| Base URL | yes | Defaults to `https://api.monapay.vn` |

## Usage

### MONA Pay node

- **Tạo QR** (create QR): needs Owner Number, Owner Type (`PER` or `ORG`), Merchant ID, Terminal ID, Order ID, Virtual Account Prefix, Beneficiary Name and Amount; Description is optional.
- **Tra giao dịch** (list transactions): needs Virtual Account Number, with Page and Limit.
- **Danh sách webhook** (list webhooks): no parameters.

### MONA Pay Trigger

Point a MONA Pay webhook config that uses auth type `HMAC_SHA256` at the trigger's webhook URL (path `monapay`, method POST).

The trigger never re-signs a parsed JSON object. n8n (and any reverse proxy in front of it) must keep the original raw body; if it is missing the node returns HTTP 400 instead of silently accepting the request. Responses:

| Status | Reason |
| --- | --- |
| 200 | Valid webhook; the payload is passed to the workflow |
| 400 | `raw_body_required` or `invalid_json` |
| 401 | `invalid_signature_or_timestamp` |
| 500 | `webhook_secret_not_configured` |

### Recommendations

- Also run a scheduled reconciliation job against the transactions API, in case a workflow run fails.
- In the target system, put a unique constraint on `transaction_code` and mark an order as paid only after both the order code and the amount match.

## Development

```bash
npm install
npm run build   # one-off build
npm run dev     # tsc --watch
```

Documentation: https://monapay.vn/docs

## License

MIT

**MONA Pay is part of MONA Cloud by The MONA Group.**
