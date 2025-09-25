import React, { useEffect, useMemo, useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { loadWorkers, saveWorkers, Worker } from "@/lib/workers";

export default function WorkersPage() {
  const auth = useAuth();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [available, setAvailable] = useState(true);

  const department = auth.user?.department ?? "";

  useEffect(() => {
    try {
      setWorkers(loadWorkers());
    } catch (e) {
      setWorkers([]);
    }
  }, []);

  const deptWorkers = useMemo(
    () => workers.filter((w) => w.department === department),
    [workers, department]
  );

  function addWorker() {
    const n = name.trim();
    const p = phone.trim();
    if (!n || !p) return;
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

  if (!auth.user || auth.user.role !== "admin" || department === "Municipal") {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="container p-4">
          <Card>
            <CardHeader>
              <CardTitle>Workers</CardTitle>
              <CardDescription>Restricted area — departmental admins only.</CardDescription>
            </CardHeader>
            <CardContent>
              You do not have access to this page.
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container p-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Workers — {department}</h2>
              <div className="text-sm text-muted-foreground">Manage field workers for your department</div>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Add Worker</CardTitle>
              <CardDescription>Add a new worker to your department</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <div className="text-xs text-muted-foreground">Name</div>
                  <Input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Full name" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Phone</div>
                  <Input value={phone} onChange={(e)=>setPhone(e.target.value)} placeholder="e.g. +91-9876543210" />
                </div>
                <div className="flex items-end gap-3">
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={available} onChange={(e)=>setAvailable(e.target.checked)} />
                    Available
                  </label>
                  <Button onClick={addWorker} className="ml-auto">Add</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Department Workers</CardTitle>
              <CardDescription>Workers listed for {department}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {deptWorkers.length === 0 && (
                  <div className="text-sm text-muted-foreground">No workers yet. Add your first worker above.</div>
                )}
                {deptWorkers.map((w) => (
                  <div key={w.id} className="flex items-center justify-between rounded border p-2">
                    <div>
                      <div className="font-medium">{w.name}</div>
                      <div className="text-xs text-muted-foreground">{w.phone} • {w.available ? "Available" : "Working"}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" onClick={()=>removeWorker(w.id)}>Remove</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
