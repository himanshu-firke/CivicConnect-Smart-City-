export type Notification = {
  id: string;
  message: string;
  createdAt: number;
  read?: boolean;
  type?: string; // e.g. 'submitted','assigned','resolved'
  issueId?: string;
  department?: string;
  targetRole?: string; // e.g. 'municipal','admin'
  targetDepartment?: string;
  targetUserId?: string;
  reporterId?: string;
};

const KEY = "civicai_notifications";

export function loadNotifications(): Notification[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Notification[];
  } catch (e) {
    return [];
  }
}

export function saveNotifications(n: Notification[]) {
  try { localStorage.setItem(KEY, JSON.stringify(n)); } catch (e) {}
}

export function addNotification(payload: Partial<Notification> | string) {
  const data = typeof payload === 'string' ? { message: payload } : payload || {};
  const n: Notification = {
    id: Math.random().toString(36).slice(2, 9),
    message: data.message || 'Notification',
    createdAt: Date.now(),
    read: false,
    type: data.type,
    issueId: data.issueId,
    department: data.department,
    targetRole: data.targetRole,
    targetDepartment: data.targetDepartment,
    targetUserId: data.targetUserId,
    reporterId: data.reporterId,
  };

  const list = loadNotifications();
  list.unshift(n);
  if (list.length > 200) list.splice(200);
  saveNotifications(list);
  try { window.dispatchEvent(new CustomEvent('civicai_notification_added', { detail: n })); } catch (e) {}
  return n;
}
