# Guild Manager Backend

## Overview

Backend Node.js + Express cho Guild Manager. Runtime sử dụng MongoDB Atlas; thư mục `mongodb/import/` chứa bộ dữ liệu ban đầu để tạo các collection.

Luồng kiến trúc:

```text
Route → Controller → Service → MongoDB Repository → MongoDB Atlas
```

Route, Controller và Service giữ API contract ổn định; MongoDB Repository chịu trách nhiệm persistence và transaction.

## Node.js

Khuyến nghị Node.js **20+**.

## Installation

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Production/local start:

```bash
npm start
```

Reset sample data:

```bash
npm run seed
```

## Environment Variables

`.env.example`:

```env
PORT=3001
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
MONGODB_URI="mongodb+srv://DB_USER:DB_PASSWORD@cluster.example.mongodb.net"
MONGODB_DB=guild_manager_app
AUTH_USERNAME=admin
AUTH_PASSWORD=replace-with-a-strong-password
AUTH_SECRET=replace-with-a-long-random-secret
```

Khi server khởi động lần đầu, backend tự tạo collection `users` và tài khoản quản trị từ `AUTH_USERNAME` / `AUTH_PASSWORD`. Mật khẩu được băm bằng `scrypt` kèm salt riêng; MongoDB không lưu mật khẩu dạng chữ thường. Những lần khởi động sau không ghi đè tài khoản đã tồn tại.

`src/server.js` luôn lấy port từ `process.env.PORT` thông qua config. Render sẽ tự cung cấp `PORT`.

## Data Structure

### Faction

```json
{ "id": "toai-mong", "name": "Toái Mộng", "color": "#4adede" }
```

### Member

```json
{
  "id": "m01",
  "name": "TomKaka",
  "factionId": "huyet-ha",
  "roleId": "r_lead",
  "note": "Leader chính của cụm DEF.",
  "partyId": "p11",
  "position": 1,
  "ptNote": "LEAD",
  "ptNoteColor": "red"
}
```

`partyId + position` là vị trí đội hình. Một PT có position `1..6` và tối đa 6 member.

### Party

```json
{
  "id": "p11",
  "legionId": "l1",
  "name": "PT1",
  "note": "",
  "order": 1
}
```

## Seed Data

Dữ liệu JSON trong `src/data/` chỉ còn dùng làm seed/reset mẫu. Runtime đọc và ghi MongoDB.

```text
src/data/factions.json
src/data/members.json
src/data/parties.json
src/data/legions.json
src/data/roles.json
src/data/global-notes.json
```

Seed gốc nằm trong `src/data/seed/`.

MongoDB Atlas giữ dữ liệu độc lập với filesystem của Render nên dữ liệu không mất khi Web Service restart hoặc redeploy.

## API Endpoints

Health:

```http
GET /api/health
```

Members:

```http
GET    /api/members
GET    /api/members/:id
POST   /api/members
PUT    /api/members/:id
DELETE /api/members/:id
```

Factions:

```http
GET /api/factions
```

Parties:

```http
GET    /api/parties
GET    /api/parties/:id
POST   /api/parties
PUT    /api/parties/:id
DELETE /api/parties/:id
```

Formation operations:

```http
POST   /api/parties/assign-member
PATCH  /api/parties/move-member
PATCH  /api/parties/swap-members
PATCH  /api/parties/member/:memberId/note
DELETE /api/parties/member/:memberId
```

Frontend support:

```http
GET  /api/snapshot
GET  /api/roles
POST /api/roles
PUT  /api/roles/:id
DELETE /api/roles/:id
PUT  /api/global-notes
POST /api/formations/save
POST /api/demo/reset
```

## MOVE / REORDER

```http
PATCH /api/parties/move-member
```

```json
{
  "memberId": "m01",
  "targetPartyId": "p12",
  "targetPosition": 3
}
```

- Target position trống → MOVE.
- Cùng PT → REORDER.
- Target PT đã 6/6 và target trống → reject.
- Target position có member → service thực hiện SWAP.

## SWAP

```http
PATCH /api/parties/swap-members
```

```json
{
  "memberAId": "m01",
  "memberBId": "m19"
}
```

Cả hai member đổi `partyId + position` trong **một JSON mutation**. PT Note vẫn đi theo member. PT 6/6 vẫn SWAP được.

## Error Handling

API luôn trả JSON, ví dụ:

```json
{
  "success": false,
  "code": "PARTY_FULL",
  "message": "PT đã đủ 6 thành viên."
}
```

Có 404 handler và global error handler; không trả HTML error page.

## Render Deployment

1. Push project lên GitHub.
2. Trên Render chọn **New → Web Service**.
3. Chọn repository.
4. **Root Directory:** `backend`
5. **Build Command:** `npm install`
6. **Start Command:** `npm start`
7. Environment Variables:
   - `FRONTEND_URL=https://frontend-cua-ban...`
   - `NODE_ENV=production`
   - `PORT` có thể để Render tự cấp.
8. Health Check Path có thể dùng `/api/health`.

## MongoDB Runtime

- `src/database/mongodb.js` quản lý connection pool, ping và indexes.
- `src/repositories/mongoRepository.js` cung cấp `read`, `write`, `mutate` tương thích tầng service.
- Mutation thành viên dùng MongoDB transaction để MOVE/SWAP được ghi atomic.
- `globalNotes` lưu trong document `{ id: "global-notes", notes: [] }`.
- Server chỉ bắt đầu listen sau khi kết nối MongoDB thành công.


## Render sleep / spin down

Backend không có cron hoặc keep-alive ping. Với Render Free, service có thể sleep khi không có request. Frontend xử lý UX bằng `GET /api/health`, retry GET request và trạng thái kết nối/thử lại. Backend chỉ cần giữ endpoint health nhẹ và trả JSON.

## Sample roster

`src/data/members.json` và `src/data/seed/members.json` chứa roster 74 thành viên đã nhập cho project hiện tại. Chỉ lưu các field Guild Manager sử dụng.


## MongoDB import-ready data

Roster/faction/role từ file dữ liệu mới đã được đồng bộ vào runtime + seed. Ngoài ra `mongodb/import/` chứa toàn bộ collection cần để upload vào MongoDB.

```bash
npm run mongo:data:validate
```

Import tự động:

- Windows: `mongodb/mongoimport-all.ps1`
- macOS/Linux/Git Bash: `mongodb/mongoimport-all.sh`

Xem `mongodb/README.md` để biết biến `MONGODB_URI`, `MONGODB_DB`, quan hệ collection và lưu ý `--drop`.
# van-xa-chi-coc-api
