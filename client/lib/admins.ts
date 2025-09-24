import { Issue } from "./demoData";

export type DepartmentAdmin = {
  id: string;
  department: string;
  name: string;
  email: string;
  location: string;
};

export const DEPARTMENT_ADMINS: DepartmentAdmin[] = [
  {
    id: "roads-1",
    department: "Roads Department",
    name: "Roads Admin",
    email: "admin@roads.gov.in",
    location: "Sector 15",
  },
  {
    id: "electrical-1",
    department: "Electrical Department",
    name: "Electrical Admin",
    email: "admin@electrical.gov.in",
    location: "Sector 14",
  },
  {
    id: "sanitation-1",
    department: "Sanitation Department",
    name: "Sanitation Admin",
    email: "admin@sanitation.gov.in",
    location: "Sector 16",
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
