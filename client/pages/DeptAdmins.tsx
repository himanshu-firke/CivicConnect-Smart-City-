import React, { useEffect, useMemo, useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import {
  DepartmentAdmin,
  loadDepartmentAdmins,
  saveDepartmentAdmins,
  addDepartmentAdmin,
  removeDepartmentAdmin,
  setDepartmentAdminActive,
  uniqueDepartments,
} from "@/lib/admins";

const DEPT_OPTIONS = [
  "Roads Department",
  "Electrical Department",
  "Sanitation Department",
  "Municipal",
];

export default function DeptAdminsPage() {
  const auth = useAuth();
  const [admins, setAdmins] = useState<DepartmentAdmin[]>([]);

  const [department, setDepartment] = useState<string>("Municipal");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<string>("Manager");

  useEffect(() => {
    try {
      setAdmins(loadDepartmentAdmins());
    } catch (e) {
      setAdmins([]);
    }
  }, []);

  const deptList = useMemo(() => {
    const u = uniqueDepartments(admins).sort();
    return Array.from(new Set([...DEPT_OPTIONS, ...u]));
  }, [admins]);

  function onAdd() {
    const n = name.trim();
    const em = email.trim();
    if (!n || !em || !department) return;
    const next = addDepartmentAdmin({ department, name: n, email: em, phone, role, location: "-", active: true });
    setAdmins(next);
    setName("");
    setEmail("");
    setPhone("");
    setRole("Manager");
  }

  function onRemove(id: string) {
    setAdmins(removeDepartmentAdmin(id));
  }

  function toggleActive(id: string, current?: boolean) {
    setAdmins(setDepartmentAdminActive(id, !(current ?? true)));
  }

  if (!auth.user || auth.user.role !== "admin" || auth.user.department !== "Municipal") {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="container p-4">
          <Card>
            <CardHeader>
              <CardTitle>Dept Admins</CardTitle>
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
            <div className="text-sm text-muted-foreground">Manage departmental admins and team members</div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select Department" />
              </SelectTrigger>
              <SelectContent>
                {deptList.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => setAdmins(loadDepartmentAdmins())}>Reload</Button>
          </div>
        </div>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Department Admins</CardTitle>
            <CardDescription>Admins, managers, and inspectors for this department</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3 mb-4">
              <Button onClick={onAdd}>Add Admin</Button>
              <div className="grid gap-2 grid-cols-1 sm:grid-cols-4 flex-1">
                <div>
                  <div className="text-xs text-muted-foreground">Name</div>
                  <Input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Full name" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Email</div>
                  <Input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="admin@city.gov.in" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Phone</div>
                  <Input value={phone} onChange={(e)=>setPhone(e.target.value)} placeholder="+91-9876543210" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Role</div>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Manager">Manager</SelectItem>
                      <SelectItem value="Inspector">Inspector</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="rounded-md border overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr className="text-left">
                    <th className="p-2">Department</th>
                    <th className="p-2">Name</th>
                    <th className="p-2">Email</th>
                    <th className="p-2">Phone</th>
                    <th className="p-2">Role</th>
                    <th className="p-2">Active</th>
                    <th className="p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {admins
                    .filter((a) => !department || a.department === department)
                    .map((a) => (
                      <tr key={a.id} className="border-t">
                        <td className="p-2">{a.department}</td>
                        <td className="p-2">{a.name}</td>
                        <td className="p-2">{a.email}</td>
                        <td className="p-2">{a.phone || "-"}</td>
                        <td className="p-2">{a.role || "-"}</td>
                        <td className="p-2">{a.active !== false ? "Yes" : "No"}</td>
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <button className="text-xs text-primary" onClick={() => toggleActive(a.id, a.active)}>
                              {a.active !== false ? "Disable" : "Enable"}
                            </button>
                            <Button size="sm" variant="outline" onClick={() => onRemove(a.id)}>Remove</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
