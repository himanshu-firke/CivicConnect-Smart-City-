import React, { useEffect, useMemo, useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { loadWorkers, saveWorkers, Worker } from "@/lib/workers";

const DEPT_OPTIONS = [
  "Roads Department",
  "Electrical Department",
  "Sanitation Department",
  "Municipal",
];

export default function MunicipalWorkersPage() {
  const auth = useAuth();
  const [workers, setWorkers] = useState<Worker[]>([]);

  const [department, setDepartment] = useState<string>("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    try {
      setWorkers(loadWorkers());
    } catch (e) {
      setWorkers([]);
    }
  }, []);

  const filtered = useMemo(() => {
    return workers.filter((w) => !department || w.department === department);
  }, [workers, department]);

  function addWorker() {
    const n = name.trim();
    const p = phone.trim();
    if (!n || !p || !department) return;
    const id = `w_${Date.now().toString(36)}`;
    const next: Worker = { id, name: n, phone: p, department, available };
    const all = [...workers, next];
    saveWorkers(all);
    setWorkers(all);
    setName("");
    setPhone("");
    setAvailable(true);
  }

  function removeWorker(id: string) {
    const all = workers.filter((w) => w.id !== id);
    saveWorkers(all);
    setWorkers(all);
  }

  if (!auth.user || auth.user.role !== "admin" || auth.user.department !== "Municipal") {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="container p-4">
          <Card>
            <CardHeader>
              <CardTitle>Municipal Workers</CardTitle>
              <CardDescription>Restricted area — Municipal admin only.</CardDescription>
            </CardHeader>
            <CardContent>You do not have access to this page.</CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Municipal</h1>
            <div className="text-sm text-muted-foreground">Manage departmental staff and field workers</div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={department || undefined} onValueChange={setDepartment}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Filter by Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Departments</SelectItem>
                {DEPT_OPTIONS.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => setWorkers(loadWorkers())}>Reload</Button>
          </div>
        </div>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>Departmental staff and field workers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-4 mb-4">
              <div>
                <div className="text-xs text-muted-foreground">Department</div>
                <Select value={department || undefined} onValueChange={setDepartment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPT_OPTIONS.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Name</div>
                <Input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Full name" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Phone</div>
                <Input value={phone} onChange={(e)=>setPhone(e.target.value)} placeholder="+91-9876543210" />
              </div>
              <div className="flex items-end gap-3">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={available} onChange={(e)=>setAvailable(e.target.checked)} />
                  Available
                </label>
                <Button className="ml-auto" onClick={addWorker}>Add</Button>
              </div>
            </div>

            <div className="grid gap-2">
              {filtered.length === 0 && (
                <div className="text-sm text-muted-foreground">No workers found.</div>
              )}
              {filtered.map((w) => (
                <div key={w.id} className="flex items-center justify-between rounded border p-2">
                  <div>
                    <div className="font-medium">{w.name}</div>
                    <div className="text-xs text-muted-foreground">{w.department} • {w.phone} • {w.available ? "Available" : "Working"}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={()=>removeWorker(w.id)}>Remove</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
