# n8n nodes cho MONA Pay

Community package gồm:

- `MONA Pay`: tạo VietQR, tra giao dịch theo VA, lấy danh sách webhook.
- `MONA Pay Trigger`: nhận JSON webhook và chỉ phát event khi HMAC-SHA256 trên raw body hợp lệ, timestamp lệch không quá 300 giây.
- Credential `MONA Pay API`: username, password, client secret, webhook secret và base URL.

> **Dùng cho quy mô nhỏ/test; quy mô lớn tụi em khuyên viết lớp nối riêng (xem connectors/) vì automation no-code chập chờn, 1 node lỗi là mất đơn**.

Luôn chạy thêm job đối soát qua API giao dịch. Trong hệ thống đích, đặt unique constraint trên `transaction_code` và chỉ chốt đơn sau khi khớp mã đơn lẫn số tiền.

## Phát triển local

Scaffold không kèm dependency đã cài. Trên máy phát triển có mạng/package cache phù hợp:

```bash
cd devtools/n8n-nodes-monapay
npm install
npm run build
```

Link `dist/` vào instance n8n test theo hướng dẫn community nodes của phiên bản n8n đang dùng. Cấu hình credential:

1. Username/password dùng để lấy Bearer token.
2. Client Secret dùng cho `Tạo QR`; GET giao dịch/webhook không cần secret này.
3. Webhook Secret phải đúng `secret_key` của cấu hình webhook `HMAC_SHA256`; không dùng Client Secret thay thế.

Trigger cố ý không ký lại từ object JSON đã parse. Runtime n8n/reverse proxy phải giữ `request.rawBody`; nếu thiếu, node trả HTTP 400 để tránh xác thực sai âm thầm. Endpoint thành công trả HTTP 200, đủ điều kiện ACK của MONA Pay.

## Publish

Mon cần test trên một instance n8n tương thích, kiểm `dist`, đăng nhập npm organization chính thức rồi publish `n8n-nodes-monapay`. Chưa publish package từ scaffold này.

Tài liệu: https://monapay.vn/docs · llms: https://monapay.vn/llms.txt · Hotline 1900 636 648 · info@themona.global
