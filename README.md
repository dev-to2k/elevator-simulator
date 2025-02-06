# Mô phỏng Thang máy

## Giới thiệu

**Mô phỏng Thang máy** là một dự án **Next.js** được thiết kế để mô phỏng hoạt động của thang máy với giao diện người dùng thời gian thực. Dự án sử dụng **Tailwind CSS** để tạo kiểu dáng và cung cấp các tuyến API cùng hệ thống cập nhật trạng thái dựa trên **WebSocket**.

## Yêu cầu hệ thống

Hãy đảm bảo bạn đã cài đặt các công cụ sau:

- [Node.js](https://nodejs.org/) (phiên bản 14 trở lên)
- npm (được tích hợp sẵn với Node.js) hoặc [Yarn](https://yarnpkg.com/)

## Cài đặt

1. Clone repository:

   ```sh
   git clone <repository-url>
   cd elevator-simulator
   ```

2. Cài đặt các thư viện phụ thuộc:
   ```sh
   npm install
   ```
   hoặc nếu sử dụng Yarn:
   ```sh
   yarn install
   ```

## Phát triển

Để chạy dự án trong **chế độ phát triển** với tính năng tải lại tự động:

```sh
npm run dev
```

Truy cập [http://localhost:3000](http://localhost:3000) trên trình duyệt để xem ứng dụng.

## Kiểm tra API

Dự án bao gồm một tuyến API mẫu trong `src/pages/api/hello.ts` để thử nghiệm.

## Xây dựng và triển khai

Để biên dịch dự án cho môi trường sản xuất, chạy lệnh sau:

```sh
npm run build
```

Sau đó, khởi động máy chủ sản xuất với:

```sh
npm run start
```

## Kiểm tra mã nguồn

Để chạy ESLint và kiểm tra lỗi trong mã nguồn:

```sh
npm run lint
```

## Cấu trúc dự án

```
elevator-simulator/
├── src/
│   ├── pages/                   # Chứa các trang Next.js, bao gồm các tuyến API
│   ├── components/
│   │   └── ElevatorSystem.tsx    # Chứa logic mô phỏng thang máy chính
│   ├── styles/                   # Chứa các kiểu CSS toàn cục sử dụng Tailwind CSS
├── postcss.config.mjs             # Cấu hình PostCSS với Tailwind CSS
├── tailwind.config.ts             # Tệp cấu hình Tailwind CSS
├── next.config.ts                 # Tệp cấu hình Next.js
└── README.md                      # Tài liệu hướng dẫn dự án
```

## Thông tin bổ sung

- Dự án sử dụng **WebSocket** để cập nhật trạng thái trực tiếp, kết nối đến `http://localhost:5000`.
- Bạn có thể chỉnh sửa `next.config.ts` để tùy chỉnh cấu hình Next.js.

---

Chúc bạn lập trình vui vẻ! 🚀
