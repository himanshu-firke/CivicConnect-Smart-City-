export type Issue = {
  id: string;
  type: string;
  confidence: number;
  severity: "Low" | "Medium" | "High";
  size?: string;
  costEstimate?: string;
  department: string;
  lat?: number;
  lng?: number;
  address?: string;
  reporterName?: string;
  reporterPhone?: string;
  status?: "Pending" | "In Progress" | "Resolved";
  createdAt: number;
  photo?: string;
  tx?: string;
  assignedTo?: string;
  priorityScore?: number;
  voice?: string;
  voiceTranscript?: string;
};

const KEY = "civicai_issues";

export function loadIssues(): Issue[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return seedDemo();
    return JSON.parse(raw) as Issue[];
  } catch (e) {
    return seedDemo();
  }
}

export function saveIssues(issues: Issue[]) {
  localStorage.setItem(KEY, JSON.stringify(issues));
}

export function addIssue(issue: Issue) {
  const issues = loadIssues();
  issues.unshift(issue);
  saveIssues(issues);
  try {
    window.dispatchEvent(new CustomEvent("civicai_issues_updated", { detail: issue }));
  } catch (e) {}
}

export function subscribeToIssues(fn: () => void) {
  const handler = () => fn();
  window.addEventListener("civicai_issues_updated", handler as EventListener);
  return () => window.removeEventListener("civicai_issues_updated", handler as EventListener);
}

function seedDemo(): Issue[] {
  const now = Date.now();
  const demo: Issue[] = [
    {
      id: "#001",
      type: "Pothole",
      confidence: 89,
      severity: "High",
      size: "2.3 sq m",
      costEstimate: "₹15,000-₹25,000",
      department: "Roads Department",
      lat: 28.497,
      lng: 77.071,
      address: "Main Street, Sector 15",
      reporterName: "Rahul Sharma",
      reporterPhone: "+91-9876543210",
      status: "In Progress",
      createdAt: now - 1000 * 60 * 60 * 5,
      assignedTo: "RoadFix Contractors",
      priorityScore: 9,
      photo: "",
      tx: "abc123def456",
    },
    {
      id: "#002",
      type: "Streetlight",
      confidence: 92,
      severity: "Medium",
      department: "Electrical Department",
      lat: 28.494,
      lng: 77.068,
      address: "Sector 14 Park Road",
      reporterName: "Neha Verma",
      status: "Pending",
      createdAt: now - 1000 * 60 * 60 * 8,
      assignedTo: "BrightLights",
      priorityScore: 7,
      photo: "",
      tx: "def789ghi012",
    },
    {
      id: "#003",
      type: "Garbage",
      confidence: 87,
      severity: "Low",
      department: "Sanitation Department",
      lat: 28.492,
      lng: 77.074,
      address: "Near Community Center, Sec 16",
      reporterName: "Aman Kumar",
      status: "Pending",
      createdAt: now - 1000 * 60 * 60 * 12,
      assignedTo: "CleanCity",
      priorityScore: 6,
      photo: "",
      tx: "jkl345mno678",
    },
    {
      id: "#004",
      type: "Pothole",
      confidence: 81,
      severity: "Medium",
      department: "Roads Department",
      lat: 28.501,
      lng: 77.065,
      address: "Ring Road, Sector 17",
      reporterName: "Sanjay Singh",
      status: "In Progress",
      createdAt: now - 1000 * 60 * 60 * 20,
      assignedTo: "RoadFix Contractors",
      priorityScore: 8,
      photo: "",
      tx: "pqr901stu234",
    },
    {
      id: "#005",
      type: "Streetlight",
      confidence: 85,
      severity: "Low",
      department: "Electrical Department",
      lat: 28.488,
      lng: 77.072,
      address: "Market Lane, Sector 13",
      reporterName: "Priya Shah",
      status: "Resolved",
      createdAt: now - 1000 * 60 * 60 * 30,
      assignedTo: "BrightLights",
      priorityScore: 5,
      photo: "",
      tx: "vwx567yz0123",
    },
    {
      id: "#006",
      type: "Garbage",
      confidence: 90,
      severity: "High",
      department: "Sanitation Department",
      lat: 28.495,
      lng: 77.079,
      address: "School Road, Sector 12",
      reporterName: "Kavita Malhotra",
      status: "Pending",
      createdAt: now - 1000 * 60 * 60 * 40,
      assignedTo: "CleanCity",
      priorityScore: 8,
      photo: "",
      tx: "abc999def888",
    },
  ];
  saveIssues(demo);
  return demo;
}
