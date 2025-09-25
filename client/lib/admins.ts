import { Issue } from "./demoData";

export type DepartmentAdmin = {
  id: string;
  department: string;
  name: string;
  email: string;
  location: string;
  // Optional additional metadata for management UIs
  phone?: string;
  role?: string; // e.g. Manager | Inspector
  active?: boolean; // defaults to true
};

export const DEPARTMENT_ADMINS: DepartmentAdmin[] = [
  {
    id: "roads-1",
    department: "Roads Department",
    name: "Roads Admin",
    email: "admin@roads.gov.in",
    location: "Sector 15",
    phone: "+91-9000000001",
    role: "Manager",
    active: true,
  },
  {
    id: "electrical-1",
    department: "Electrical Department",
    name: "Electrical Admin",
    email: "admin@electrical.gov.in",
    location: "Sector 14",
    phone: "+91-9000000002",
    role: "Manager",
    active: true,
  },
  {
    id: "sanitation-1",
    department: "Sanitation Department",
    name: "Sanitation Admin",
    email: "admin@sanitation.gov.in",
    location: "Sector 16",
    phone: "+91-9000000003",
    role: "Inspector",
    active: true,
  },
];

export type AdminWithStats = DepartmentAdmin & {
  activeIssues: number;
  resolvedIssues: number;
};

export function computeAdminStats(issues: Issue[], admins: DepartmentAdmin[]): AdminWithStats[] {
  const result: AdminWithStats[] = admins.map((a) => {
    const deptIssues = issues.filter((i) => i.department === a.department);
    const activeIssues = deptIssues.filter((i) => i.status !== "Resolved").length;
    const resolvedIssues = deptIssues.filter((i) => i.status === "Resolved").length;
    return { ...a, activeIssues, resolvedIssues };
  });
  return result;
}

export function uniqueDepartments(admins: DepartmentAdmin[]): string[] {
  return Array.from(new Set(admins.map((a) => a.department)));
}

export function uniqueLocations(admins: DepartmentAdmin[]): string[] {
  return Array.from(new Set(admins.map((a) => a.location)));
}

// Persistent storage helpers (localStorage)
const ADMINS_KEY = "civicai_department_admins";

export function loadDepartmentAdmins(): DepartmentAdmin[] {
  try {
    const raw = localStorage.getItem(ADMINS_KEY);
    if (!raw) {
      localStorage.setItem(ADMINS_KEY, JSON.stringify(DEPARTMENT_ADMINS));
      return DEPARTMENT_ADMINS;
    }
    const parsed = JSON.parse(raw) as DepartmentAdmin[];
    // Ensure defaults for optional fields
    return parsed.map((a) => ({ ...a, active: a.active ?? true }));
  } catch (e) {
    return DEPARTMENT_ADMINS;
  }
}

export function saveDepartmentAdmins(admins: DepartmentAdmin[]) {
  localStorage.setItem(ADMINS_KEY, JSON.stringify(admins));
}

export function addDepartmentAdmin(admin: Omit<DepartmentAdmin, "id"> & { id?: string }): DepartmentAdmin[] {
  const id = admin.id ?? `adm_${Date.now().toString(36)}`;
  const next: DepartmentAdmin = { active: true, ...admin, id } as DepartmentAdmin;
  const all = [...loadDepartmentAdmins(), next];
  saveDepartmentAdmins(all);
  return all;
}

export function removeDepartmentAdmin(id: string): DepartmentAdmin[] {
  const all = loadDepartmentAdmins().filter((a) => a.id !== id);
  saveDepartmentAdmins(all);
  return all;
}

export function setDepartmentAdminActive(id: string, active: boolean): DepartmentAdmin[] {
  const all = loadDepartmentAdmins().map((a) => (a.id === id ? { ...a, active } : a));
  saveDepartmentAdmins(all);
  return all;
}
