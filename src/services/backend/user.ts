'use client';
export function userLevelString2Priority(id: string) {
  const levelList = global.SystemConfig.user.level;
  const map = new Map(levelList.map((item) => [item.id, item.priority]));
  return map.get(id) ?? 0;
}

export function userLevelPriority2String(priority: number) {
  const levelList = global.SystemConfig.user.level;
  const map = new Map(levelList.map((item) => [item.priority, item.id]));
  return map.get(priority) ?? '';
}
