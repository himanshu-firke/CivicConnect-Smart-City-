import React, { useEffect, useMemo, useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { loadIssues, saveIssues } from "@/lib/demoData";
import { useNavigate } from "react-router-dom";
import { DEPARTMENT_ADMINS, computeAdminStats, uniqueDepartments, uniqueLocations } from "@/lib/admins";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { loadWorkers, setWorkerAvailability, Worker } from "@/lib/workers";

export default function AdminDashboard() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [issues, setIssues] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const isMunicipal = auth.user?.department === "Municipal";
  const [filterDept, setFilterDept] = useState<string>("all");
  const [filterLoc, setFilterLoc] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"department" | "location">("department");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [filterCriteria, setFilterCriteria] = useState<string>("all");
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [assignIssue, setAssignIssue] = useState<any | null>(null);

  useEffect(() => {
    if (!auth.user || auth.user.role !== "admin") {
      return;
    }
    const data = loadIssues();
    if (isMunicipal) {
      setIssues(data);
    } else {
      const dept = auth.user?.department;
      setIssues(data.filter((i: any) => i.department === dept && i.status !== 'Resolved'));
    }

    const onUpdate = () => {
      const latest = loadIssues();
      if (isMunicipal) setIssues(latest);
      else setIssues(latest.filter((i: any) => i.department === auth.user?.department && i.status !== 'Resolved'));
    };
    window.addEventListener("civicai_issues_updated", onUpdate as EventListener);

    // load workers
    try { setWorkers(loadWorkers()); } catch (e) {}

    if (!isMunicipal) {
      const L = (window as any).L;
      setTimeout(() => {
        try {
          const el = document.getElementById("admin-map");
          if (!el || !L) return;
          const map = L.map(el as HTMLElement).setView([21.0045, 75.5661], 12);
          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "&copy; OpenStreetMap contributors" }).addTo(map);
          const deptIssues = loadIssues().filter((i: any) => i.department === auth.user?.department);
          deptIssues.forEach((it: any) => {
            if (it.lat && it.lng) {
              const m = L.marker([it.lat, it.lng]).addTo(map);
              m.bindPopup(`<strong>${it.type}</strong><br/>${it.address || ''}<br/>Status: ${it.status}`);
            }
          });
          const base: [number, number] = [28.497, 77.07];
          const offsets = [
            [0.003, 0.002],
            [-0.0025, 0.0015],
            [0.0018, -0.0022],
            [-0.0012, -0.0015],
            [0.0022, -0.0008],
          ];
          offsets.forEach(([dx, dy], idx) => {
            const m = L.marker([base[0] + dx, base[1] + dy]).addTo(map);
            m.bindPopup(`<strong>Nearby issue ${idx + 1}</strong>`);
          });
        } catch (e) {}

        try {
          const Chart = (window as any).Chart;
          const ctx = document.getElementById("issue-chart") as HTMLCanvasElement | null;
          if (Chart && ctx) {
            const deptIssues2 = loadIssues().filter((i: any) => i.department === auth.user?.department);
            const counts: Record<string, number> = {};
            deptIssues2.forEach((it: any) => (counts[it.type] = (counts[it.type] || 0) + 1));
            const labels = Object.keys(counts);
            const data = labels.map((l) => counts[l]);
            // eslint-disable-next-line no-new
            new Chart(ctx.getContext("2d"), {
              type: "bar",
              data: { labels, datasets: [{ label: "Issues", data, backgroundColor: ["#ef4444", "#f59e0b", "#10b981"] }] },
              options: { responsive: true },
            });
          }
        } catch (e) {}
      }, 500);
    }

    return () => window.removeEventListener("civicai_issues_updated", onUpdate as EventListener);
  }, [auth.user, isMunicipal]);

  if (!auth.user || auth.user.role !== "admin") {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="container p-4">
          <Card>
            <CardHeader>
              <CardTitle>Admin Portal</CardTitle>
              <CardDescription>Restricted area — please sign in.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => navigate("/")}>Go to Login</Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  function openIssue(issue: any) {
    setSelected(issue);
  }

  function closeIssue() {
    setSelected(null);
  }

  function openAssignModal(issue: any) {
    setAssignIssue(issue);
  }

  function handleAssign(worker: Worker) {
    if (!assignIssue) return;
    const all = loadIssues().map((i:any) => (i.id === assignIssue.id ? { ...i, assignedTo: worker.name, assignedContact: worker.phone, status: 'Assigned' } : i));
    saveIssues(all);
    try { setWorkerAvailability(worker.id, false); } catch (e) {}
    const dept = auth.user?.department;
    setIssues(isMunicipal ? all : all.filter((i:any)=>i.department === dept && i.status !== 'Resolved'));
    try { setWorkers(loadWorkers()); } catch (e) {}
    setAssignIssue(null);
    try { window.dispatchEvent(new CustomEvent('civicai_issues_updated')); } catch(e){}
    try { window.dispatchEvent(new CustomEvent('civicai_notification', { detail: { type: 'assigned', issueId: assignIssue?.id, message: `Issue ${assignIssue?.id} assigned to ${worker.name}`, department: assignIssue?.department } })); } catch(e){}
  }

  function updateStatus(id: string, status: string) {
    const all = loadIssues().map((i:any) => (i.id === id ? { ...i, status, ...(status === 'Resolved' ? { resolvedAt: Date.now() } : {}) } : i));
    saveIssues(all);
    const dept = auth.user?.department;
    setIssues(isMunicipal ? all : all.filter((i:any)=>i.department === dept && i.status !== 'Resolved'));
    // if resolving, free the assigned worker if any
    if (status === 'Resolved') {
      const issue = all.find((i:any)=>i.id === id);
      if (issue && issue.assignedContact) {
        try {
          const ws = loadWorkers();
          const found = ws.find((w)=>w.phone === issue.assignedContact || w.name === issue.assignedTo);
          if (found) {
            setWorkerAvailability(found.id, true);
            try { setWorkers(loadWorkers()); } catch(e) {}
          }
        } catch(e) {}
      }
    }
    try { window.dispatchEvent(new CustomEvent('civicai_notification', { detail: { type: 'resolved', issueId: id, message: `Issue ${id} marked resolved by ${auth.user?.name ?? 'admin'}`, department: auth.user?.department } })); } catch(e){}
    try { window.dispatchEvent(new CustomEvent('civicai_issues_updated')); } catch(e){}
  }

  if (isMunicipal) {
    const adminStats = useMemo(() => computeAdminStats(issues, DEPARTMENT_ADMINS), [issues]);
    const departments = useMemo(() => uniqueDepartments(DEPARTMENT_ADMINS), []);
    const locations = useMemo(() => uniqueLocations(DEPARTMENT_ADMINS), []);

    let filtered = adminStats.filter((a) => (filterDept === "all" || a.department === filterDept) && (filterLoc === "all" || a.location === filterLoc));
    filtered = filtered.sort((a, b) => {
      const f = sortBy === "department" ? a.department.localeCompare(b.department) : a.location.localeCompare(b.location);
      const s = sortBy === "department" ? b.department.localeCompare(a.department) : b.location.localeCompare(a.location);
      return sortDir === "asc" ? f : s;
    });

    const chartData = filtered.map((a) => ({ name: a.department, Active: a.activeIssues, Resolved: a.resolvedIssues }));

    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="container p-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Municipal Admin Dashboard</h2>
                <div className="text-sm text-muted-foreground">Admin: {auth.user?.name} — Overview of all departments</div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => { window.location.reload(); }}>Refresh</Button>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Admin Monitoring</CardTitle>
                <CardDescription>Track all department admins, filter and sort by department or location</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
                  <div>
                    <div className="mb-1 text-xs font-medium">Department</div>
                    <Select value={filterDept} onValueChange={setFilterDept}>
                      <SelectTrigger>
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        {departments.map((d) => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <div className="mb-1 text-xs font-medium">Location</div>
                    <Select value={filterLoc} onValueChange={setFilterLoc}>
                      <SelectTrigger>
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        {locations.map((l) => (
                          <SelectItem key={l} value={l}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <div className="mb-1 text-xs font-medium">Sort by</div>
                    <Select value={sortBy} onValueChange={(v)=>setSortBy(v as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="department">Department</SelectItem>
                        <SelectItem value="location">Location</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <div className="mb-1 text-xs font-medium">Order</div>
                    <Select value={sortDir} onValueChange={(v)=>setSortDir(v as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asc">Ascending</SelectItem>
                        <SelectItem value="desc">Descending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Department</TableHead>
                        <TableHead>Admin Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead className="text-right">Active Issues</TableHead>
                        <TableHead className="text-right">Resolved Issues</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((a) => (
                        <TableRow key={a.id}>
                          <TableCell>{a.department}</TableCell>
                          <TableCell>{a.name}</TableCell>
                          <TableCell>{a.email}</TableCell>
                          <TableCell>{a.location}</TableCell>
                          <TableCell className="text-right">{a.activeIssues}</TableCell>
                          <TableCell className="text-right">{a.resolvedIssues}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Trends & Charts</CardTitle>
                <CardDescription>Recent activity and department distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Sparkline: issues over last 14 days */}
                  {(() => {
                    const days = 14;
                    const now = Date.now();
                    const series: { label: string; value: number }[] = [];
                    for (let i = days - 1; i >= 0; i--) {
                      const start = new Date(now - i * 24 * 60 * 60 * 1000);
                      start.setHours(0, 0, 0, 0);
                      const end = start.getTime() + 24 * 60 * 60 * 1000;
                      const cnt = issues.filter((it: any) => it.createdAt >= start.getTime() && it.createdAt < end).length;
                      series.push({ label: start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), value: cnt });
                    }
                    const max = Math.max(1, ...series.map(s => s.value));
                    const w = 300; const h = 60; const step = w / Math.max(1, series.length - 1);
                    const points = series.map((s, idx) => `${idx * step},${h - Math.round((s.value / max) * (h - 8))}`).join(' ');
                    return (
                      <div className="rounded-lg border p-4">
                        <div className="text-sm text-muted-foreground">Issues (last 14 days)</div>
                        <div className="mt-2 flex items-center gap-3">
                          <svg width={w} height={h} className="block">
                            <polyline fill="none" stroke="#6366F1" strokeWidth={2} points={points} />
                            {series.map((s, idx) => {
                              const x = idx * step; const y = h - Math.round((s.value / max) * (h - 8));
                              return <circle key={s.label} cx={x} cy={y} r={3} fill="#06B6D4" />;
                            })}
                          </svg>
                          <div className="text-xs text-muted-foreground">Total: {series.reduce((s, x) => s + x.value, 0)}</div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Department donut */}
                  {(() => {
                    const totals = chartData.map(d => ({ name: d.name, total: (d.Active || 0) + (d.Resolved || 0) }));
                    const sum = totals.reduce((s, t) => s + t.total, 0) || 1;
                    const colors = ["#F97316", "#06B6D4", "#10B981", "#6366F1", "#EF4444"];
                    let start = 0;
                    return (
                      <div className="rounded-lg border p-4">
                        <div className="text-sm text-muted-foreground">By Department</div>
                        <div className="mt-3 flex items-center gap-4">
                          <div style={{ width: 120, height: 120 }}>
                            <svg viewBox="0 0 32 32" width="120" height="120">
                              {totals.map((t, idx) => {
                                const frac = t.total / sum;
                                const end = start + frac * Math.PI * 2;
                                const large = frac > 0.5 ? 1 : 0;
                                const r = 10;
                                const x1 = 16 + r * Math.cos(start - Math.PI / 2);
                                const y1 = 16 + r * Math.sin(start - Math.PI / 2);
                                const x2 = 16 + r * Math.cos(end - Math.PI / 2);
                                const y2 = 16 + r * Math.sin(end - Math.PI / 2);
                                const d = `M 16 16 L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
                                start = end;
                                return <path key={t.name} d={d} fill={colors[idx % colors.length]} />;
                              })}
                              <circle cx="16" cy="16" r="6" fill="#fff" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            {totals.map((t, idx) => (
                              <div key={t.name} className="flex items-center gap-2">
                                <div className="h-2.5 w-8 rounded" style={{ background: colors[idx % colors.length] }} />
                                <div className="text-sm flex-1">{t.name}</div>
                                <div className="text-sm text-muted-foreground">{t.total}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container p-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">{auth.user?.department}</h2>
              <div className="text-sm text-muted-foreground">Admin: {auth.user?.name}</div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => { window.location.reload(); }}>Refresh</Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Issue Management</CardTitle>
              <CardDescription>Manage reported issues — assign, update status, and view blockchain records.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 w-full">
                  {/* Specialized admin filter: choose criterion then value */}
                  <div className="flex items-center gap-2">
                    <select id="filter-criterion" className="rounded border px-2 py-1 text-sm" value={filterCriteria} onChange={(e)=>{ setFilterCriteria(e.target.value); setIssues(loadIssues().filter((i:any)=>i.department===auth.user?.department && i.status !== 'Resolved')); }}>
                      <option value="all">All</option>
                      <option value="location">Location</option>
                      <option value="priority">Priority</option>
                    </select>
                    {filterCriteria === 'location' && (
                      <input className="rounded border px-2 py-1 text-sm" placeholder="Enter location substring" onChange={(e)=>{
                        const v = e.target.value.trim().toLowerCase();
                        const all = loadIssues().filter((i:any)=>i.department === auth.user?.department && i.status !== 'Resolved');
                        if (!v) setIssues(all); else setIssues(all.filter((i:any)=> (i.address||'').toLowerCase().includes(v) || (i.location||'').toLowerCase().includes(v)));
                      }} />
                    )}
                    {filterCriteria === 'priority' && (
                      <select className="rounded border px-2 py-1 text-sm" onChange={(e)=>{
                        const v = e.target.value;
                        const all = loadIssues().filter((i:any)=>i.department === auth.user?.department && i.status !== 'Resolved');
                        if (v === 'all') setIssues(all); else setIssues(all.filter((i:any)=> String(i.severity).toLowerCase() === v.toLowerCase()));
                      }}>
                        <option value="all">All priorities</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                    )}
                  </div>
                  <div className="ml-2 text-sm text-muted-foreground">Map & analytics</div>
                </div>
              </div>

              <div id="admin-map" className="mb-3 h-56 rounded border" />

              <div className="overflow-auto">
                <table className="w-full table-auto text-sm">
                  <thead>
                    <tr className="text-left">
                      <th className="px-2 py-3">ID</th>
                      <th className="px-2 py-3">Type</th>
                      <th className="px-2 py-3">Location</th>
                      <th className="px-2 py-3">AI Conf.</th>
                      <th className="px-2 py-3">Priority</th>
                      <th className="px-2 py-3">Status</th>
                      <th className="px-2 py-3">Assigned</th>
                      <th className="px-2 py-3">Priority</th>
                      <th className="px-2 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {issues.map((i) => (
                      <tr key={i.id} className="border-t">
                        <td className="px-2 py-3">{i.id}</td>
                        <td className="px-2 py-3">{i.type}</td>
                        <td className="px-2 py-3">{i.address ?? '—'}</td>
                        <td className="px-2 py-3">{i.confidence}%</td>
                        <td className="px-2 py-3">{i.severity}</td>
                        <td className="px-2 py-3">{i.status}</td>
                        <td className="px-2 py-3">{i.assignedTo ?? '—'}</td>
                        <td className="px-2 py-3">{i.priorityScore ?? '—'}</td>
                        <td className="px-2 py-3">
                          <div className="flex gap-2">
                            <button className="text-sm text-primary underline" onClick={() => openIssue(i)}>View</button>
                            <button className="text-sm rounded bg-primary px-2 py-1 text-primary-foreground" onClick={() => openAssignModal(i)}>Assign</button>
                            <button className="text-sm rounded border px-2 py-1" onClick={() => updateStatus(i.id, 'Resolved')}>Mark Resolved</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
              <CardDescription>Issue counts by type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {(() => {
                  const deptIssues = loadIssues().filter((i:any)=>i.department === auth.user?.department);
                  const total = deptIssues.length;
                  const active = deptIssues.filter((d:any)=>d.status !== 'Resolved').length;
                  const resolved = deptIssues.filter((d:any)=>d.status === 'Resolved').length;
                  const pct = total ? Math.round((resolved/total)*100) : 0;
                  const byType: Record<string, number> = {};
                  const bySeverity: Record<string, number> = { High: 0, Medium: 0, Low: 0 };
                  deptIssues.forEach((d:any)=>{
                    byType[d.type] = (byType[d.type]||0)+1;
                    bySeverity[d.severity] = (bySeverity[d.severity]||0)+1;
                  });

                  const typeEntries = Object.entries(byType);
                  const colors = ["#F97316","#06B6D4","#10B981","#6366F1","#EF4444"];

                  return (
                    <>
                      <div className="rounded-lg border p-4">
                        <div className="text-sm text-muted-foreground">Overview</div>
                        <div className="flex items-center gap-4">
                          <div style={{ width: 120, height: 120 }}>
                            <svg viewBox="0 0 32 32" width="120" height="120">
                              {(() => {
                                const sum = typeEntries.reduce((s,[,v])=>s+v,0) || 1;
                                let start = 0;
                                return typeEntries.map(([k,v], idx)=>{
                                  const frac = v / sum;
                                  const end = start + frac * Math.PI * 2;
                                  const large = frac > 0.5 ? 1 : 0;
                                  const r = 10;
                                  const x1 = 16 + r * Math.cos(start - Math.PI/2);
                                  const y1 = 16 + r * Math.sin(start - Math.PI/2);
                                  const x2 = 16 + r * Math.cos(end - Math.PI/2);
                                  const y2 = 16 + r * Math.sin(end - Math.PI/2);
                                  const d = `M 16 16 L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
                                  start = end;
                                  return <path key={k} d={d} fill={colors[idx % colors.length]} />;
                                });
                              })()}
                              <circle cx="16" cy="16" r="6" fill="#fff" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <div className="text-lg font-semibold">{total} issues</div>
                            <div className="text-sm text-muted-foreground">{resolved} resolved — {active} active</div>
                            <div className="mt-3 space-y-2">
                              {typeEntries.map(([k,v], idx)=> (
                                <div key={k} className="flex items-center gap-2">
                                  <div className="h-2.5 w-8 rounded" style={{ background: colors[idx % colors.length] }} />
                                  <div className="text-sm flex-1">{k}</div>
                                  <div className="text-sm text-muted-foreground">{v}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-lg border p-4">
                        <div className="text-sm text-muted-foreground">Severity distribution</div>
                        <div className="mt-3 space-y-2">
                          {(['High','Medium','Low'] as const).map((s,idx)=>{
                            const val = bySeverity[s] || 0;
                            const pct = total ? Math.round((val/total)*100) : 0;
                            const bg = s === 'High' ? 'bg-rose-400' : s === 'Medium' ? 'bg-amber-400' : 'bg-emerald-400';
                            return (
                              <div key={s}>
                                <div className="flex justify-between text-xs text-muted-foreground"><span>{s}</span><span>{val} ({pct}%)</span></div>
                                <div className="mt-1 h-3 w-full rounded bg-muted/40">
                                  <div className={`${bg} h-3 rounded`} style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </CardContent>
          </Card>

          <Dialog open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null); }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Issue Details</DialogTitle>
                <DialogDescription>Details and actions for the selected issue.</DialogDescription>
              </DialogHeader>
              {selected && (
                <div className="grid gap-3">
                  <div className="rounded-lg border p-3">
                    <div className="font-medium">{selected.type} — {selected.address ?? 'Unknown'}</div>
                    <div className="text-xs text-muted-foreground">Reported by: {selected.reporterName}</div>
                    <div className="text-xs text-muted-foreground">AI Confidence: {selected.confidence}%</div>
                    <div className="text-xs text-muted-foreground">Severity: {selected.severity}</div>
                    <div className="text-xs text-muted-foreground">Est. Cost: {selected.costEstimate}</div>
                    {selected.description && <div className="mt-2 text-sm">Description: {selected.description}</div>}
                    {selected.photo && <img src={selected.photo} alt="issue" className="mt-2 max-h-48 w-full object-cover" />}
                    {selected.voice && (
                      <div className="mt-2">
                        <div className="text-xs text-muted-foreground">Voice note:</div>
                        <audio controls src={selected.voice} className="w-full" />
                        {selected.voiceTranscript && <div className="text-xs text-muted-foreground mt-1">Transcript: {selected.voiceTranscript}</div>}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => { openAssignModal(selected); setSelected(null); }}>Assign Worker</Button>
                    <Button variant="outline" onClick={() => { updateStatus(selected.id, 'Resolved'); setSelected(null); }}>Mark Resolved</Button>
                    <Button variant="ghost" onClick={() => setSelected(null)}>Close</Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Assign worker dialog */}
          <Dialog open={!!assignIssue} onOpenChange={(open) => { if (!open) setAssignIssue(null); }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign Worker</DialogTitle>
                <DialogDescription>Select an available worker to assign this task</DialogDescription>
              </DialogHeader>
              {assignIssue && (
                <div className="grid gap-3">
                  <div className="rounded-lg border p-3">
                    <div className="font-medium">{assignIssue.type} — {assignIssue.address ?? 'Unknown'}</div>
                    <div className="text-xs text-muted-foreground">Department: {assignIssue.department}</div>
                    <div className="mt-2">
                      <div className="text-sm font-medium">Available workers</div>
                      <div className="mt-2 grid gap-2">
                        {workers.filter((w)=>w.department===assignIssue.department).length === 0 && <div className="text-sm text-muted-foreground">No workers for this department</div>}
                        {workers.filter((w)=>w.department===assignIssue.department).map((w) => (
                          <div key={w.id} className="flex items-center justify-between rounded border p-2">
                            <div>
                              <div className="font-medium">{w.name}</div>
                              <div className="text-xs text-muted-foreground">{w.phone}</div>
                            </div>
                            <div className="flex gap-2 items-center">
                              <div className={`text-xs ${w.available ? 'text-emerald-600' : 'text-rose-600'}`}>{w.available ? 'Free' : 'Working'}</div>
                              <Button disabled={!w.available} onClick={() => handleAssign(w)}>Assign</Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="ghost" onClick={() => setAssignIssue(null)}>Close</Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

        </div>
      </main>
    </div>
  );
}
