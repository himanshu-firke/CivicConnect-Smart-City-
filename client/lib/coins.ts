export type CoinTx = {
  id: string;
  userId: string;
  userName?: string;
  amount: number;
  reason: string;
  issueId?: string;
  createdAt: number;
};

const KEY = 'civicai_coins';

export function loadTx(): CoinTx[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CoinTx[];
  } catch (e) {
    return [];
  }
}

export function saveTx(tx: CoinTx[]) {
  localStorage.setItem(KEY, JSON.stringify(tx));
}

export function addTransaction(tx: Omit<CoinTx, 'id' | 'createdAt'>) {
  const current = loadTx();
  const entry: CoinTx = {
    ...tx,
    id: Math.random().toString(36).slice(2,9),
    createdAt: Date.now(),
  };
  current.unshift(entry);
  saveTx(current);
  return entry;
}

export function getLeaderboard(limit = 10) {
  const tx = loadTx();
  const map: Record<string, { userName?: string; total: number }> = {};
  tx.forEach((t) => {
    if (!map[t.userId]) map[t.userId] = { userName: t.userName, total: 0 };
    map[t.userId].total += t.amount;
  });
  const arr = Object.entries(map).map(([userId, v]) => ({ userId, userName: v.userName, total: v.total }));
  arr.sort((a,b)=> b.total - a.total);
  return arr.slice(0, limit);
}
