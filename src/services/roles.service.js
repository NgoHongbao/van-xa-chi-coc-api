import { repositories } from '../repositories/index.js';
import { HttpError } from '../utils/httpError.js';
import { createId } from '../utils/id.js';

export const listRoles = () => repositories.roles.read();

export async function createRole(name) {
  const clean = String(name || '').trim();
  if (!clean) throw new HttpError(400, 'Tên chức vụ không được để trống.', 'INVALID_ROLE');
  const role = { id: createId('role'), name: clean, locked: false };
  await repositories.roles.mutate((items) => {
    if (items.some((item) => item.name.toLowerCase() === clean.toLowerCase())) throw new HttpError(409, 'Chức vụ đã tồn tại.', 'ROLE_EXISTS');
    items.push(role);
  });
  return role;
}

export async function updateRole(id, name) {
  const clean = String(name || '').trim();
  if (!clean) throw new HttpError(400, 'Tên chức vụ không được để trống.', 'INVALID_ROLE');
  let updated;
  await repositories.roles.mutate((items) => {
    const role = items.find((item) => item.id === id);
    if (!role) throw new HttpError(404, 'Không tìm thấy chức vụ.', 'ROLE_NOT_FOUND');
    role.name = clean; updated = { ...role };
  });
  return updated;
}

export async function deleteRole(id) {
  let deleted;
  await repositories.roles.mutate((items) => {
    const index = items.findIndex((item) => item.id === id);
    if (index < 0) throw new HttpError(404, 'Không tìm thấy chức vụ.', 'ROLE_NOT_FOUND');
    if (items[index].locked) throw new HttpError(409, 'Không thể xóa chức vụ mặc định.', 'ROLE_LOCKED');
    [deleted] = items.splice(index, 1);
  });
  await repositories.members.mutate((members) => { members.forEach((member) => { if (member.roleId === id) member.roleId = 'r_member'; }); });
}
