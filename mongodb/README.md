# MongoDB Import Data

Thư mục này chứa **data đã chuẩn hóa để import vào MongoDB** mà không thay đổi runtime backend JSON hiện tại.

## Collections

| Collection | File | Số document |
|---|---|---:|
| `factions` | `import/factions.json` | 7 |
| `roles` | `import/roles.json` | 16 |
| `members` | `import/members.json` | 74 |
| `legions` | `import/legions.json` | 4 |
| `parties` | `import/parties.json` | 14 |
| `globalNotes` | `import/globalNotes.json` | 0 |

Data member dùng đúng schema project hiện tại:

```json
{
  "id": "member-001",
  "name": "Will",
  "factionId": "toai-mong",
  "roleId": "r_docnha_duong_chu",
  "note": "",
  "partyId": null,
  "position": null,
  "ptNote": "",
  "ptNoteColor": "purple"
}
```

Không đưa các field game không dùng vào MongoDB như **Cấp, Lực chiến, Ngày vào bang, Online/Offline**.

## Kiểm tra data trước khi import

Từ thư mục `backend`:

```bash
npm run mongo:data:validate
```

Script kiểm tra:
- ID không trùng.
- `factionId` và `roleId` tồn tại.
- `partyId` hợp lệ nếu member đã có PT.
- `position` nằm trong `1..6`.
- Không trùng position trong cùng PT.
- Toái Mộng luôn `#4adede`.

## Import bằng mongoimport

Cần cài MongoDB Database Tools để có lệnh `mongoimport`.

### Windows PowerShell

```powershell
$env:MONGODB_URI="mongodb+srv://USER:PASSWORD@CLUSTER/..."
$env:MONGODB_DB="guild_manager"
.\mongodb\mongoimport-all.ps1
```

### macOS / Linux / Git Bash

```bash
export MONGODB_URI='mongodb+srv://USER:PASSWORD@CLUSTER/...'
export MONGODB_DB='guild_manager'
bash ./mongodb/mongoimport-all.sh
```

Các script dùng `--drop`, nghĩa là collection cũ sẽ được thay bằng data trong thư mục `import/`. Nếu database đang có dữ liệu production cần giữ, **không chạy script này trực tiếp**; hãy backup hoặc import thủ công theo chiến lược merge của bạn.

## Quan hệ dữ liệu

- `members.factionId` → `factions.id`
- `members.roleId` → `roles.id`
- `members.partyId` → `parties.id` (nullable)
- `parties.legionId` → `legions.id`

Project dùng field `id` dạng string làm application ID. MongoDB vẫn có thể tự tạo `_id`; không cần đổi các ID hiện tại sang ObjectId để frontend hoạt động.

## Trạng thái roster hiện tại

74 member trong file nguồn đều chưa có dữ liệu PT từ ảnh, vì vậy `partyId` và `position` đang là `null`. Leader có thể xếp PT sau bằng UI; khi backend chuyển sang MongoDB thực tế thì MOVE/SWAP sẽ cập nhật các field này.
