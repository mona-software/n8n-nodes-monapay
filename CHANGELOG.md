# Changelog

## 0.1.0 — 2026-08-29

- Thêm action node tạo QR, tra giao dịch và list webhook.
- Thêm trigger xác thực timestamp + HMAC-SHA256 trên raw body.
- Thêm credential MONA Pay API.
- Trước khi lên npm: build bằng `tsc` ra `dist/` (công cụ `n8n-node-dev` cũ không đóng gói được), dùng `'main'` thay `NodeConnectionType.Main` để chạy được cả n8n đời cũ lẫn mới, thêm file LICENSE.
