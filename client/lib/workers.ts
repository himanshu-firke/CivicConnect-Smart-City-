export type Worker = {
  id: string;
  name: string;
  phone: string;
  department: string;
  available: boolean; // true = free, false = working
};

const KEY = "civicai_workers";

const seed: Worker[] = [
  { id: "w1", name: "Aman Worker", phone: "+91-9000000001", department: "Roads Department", available: true },
  { id: "w2", name: "Suresh Electric", phone: "+91-9000000002", department: "Electrical Department", available: true },
  { id: "w3", name: "Neha Clean", phone: "+91-9000000003", department: "Sanitation Department", available: true },
  { id: "w4", name: "Ravi Fixer", phone: "+91-9000000004", department: "Roads Department", available: false },
  { id: "w5", name: "Priya Light", phone: "+91-9000000005", department: "Electrical Department", available: false },
  { id: "w6", name: "Vikram Swift", phone: "+91-9000000006", department: "Roads Department", available: true },
  { id: "w7", name: "Anita Cleanse", phone: "+91-9000000007", department: "Sanitation Department", available: true },
  { id: "w8", name: "Rohan Bolt", phone: "+91-9000000008", department: "Electrical Department", available: true },
  { id: "w9", name: "Sunita Sweep", phone: "+91-9000000009", department: "Sanitation Department", available: false },
  { id: "w10", name: "Karan Patch", phone: "+91-9000000010", department: "Roads Department", available: true },
  { id: "w11", name: "Deepak Sharma", phone: "+91-9810012345", department: "Roads Department", available: true },
  { id: "w12", name: "Meera Joshi", phone: "+91-9810023456", department: "Sanitation Department", available: true },
  { id: "w13", name: "Vikash Kumar", phone: "+91-9810034567", department: "Electrical Department", available: true },
  { id: "w14", name: "Sunil Verma", phone: "+91-9810045678", department: "Roads Department", available: false },
  { id: "w15", name: "Anjali Rao", phone: "+91-9810056789", department: "Sanitation Department", available: true },
  { id: "w16", name: "Ritu Patel", phone: "+91-9810067890", department: "Electrical Department", available: true },
];

export function loadWorkers(): Worker[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      localStorage.setItem(KEY, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw) as Worker[];
  } catch (e) {
    return seed;
  }
}

export function saveWorkers(ws: Worker[]) {
  localStorage.setItem(KEY, JSON.stringify(ws));
}

export function getAvailableWorkersForDept(dept: string): Worker[] {
  return loadWorkers().filter((w) => w.department === dept && w.available);
}

export function setWorkerAvailability(id: string, available: boolean) {
  const ws = loadWorkers().map((w) => (w.id === id ? { ...w, available } : w));
  saveWorkers(ws);
}
