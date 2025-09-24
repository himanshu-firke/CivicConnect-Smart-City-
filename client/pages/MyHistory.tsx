import React, { useEffect, useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { loadIssues } from "@/lib/demoData";
import { useAuth } from "@/context/AuthContext";

export default function MyHistory() {
  const auth = useAuth();
  const [resolved, setResolved] = useState<any[]>([]);

  useEffect(() => {
    const all = loadIssues();
    if (!auth.user) return;
    const me = auth.user;
    setResolved(all.filter((i:any)=>i.status === 'Resolved' && (i.reporterPhone === me.phone || i.reporterName === me.name)));

    const onUpdate = () => {
      const latest = loadIssues();
      setResolved(latest.filter((i:any)=>i.status === 'Resolved' && (i.reporterPhone === me.phone || i.reporterName === me.name)));
    };
    window.addEventListener('civicai_issues_updated', onUpdate as EventListener);
    return () => window.removeEventListener('civicai_issues_updated', onUpdate as EventListener);
  }, [auth.user]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container p-4">
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-2xl font-semibold">Your Resolved Reports</h2>
            <div className="text-sm text-muted-foreground">All issues you reported that were resolved</div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>History</CardTitle>
              <CardDescription>Your resolved reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Resolved At</TableHead>
                      <TableHead>Assigned</TableHead>
                      <TableHead>Image</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resolved.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>{r.id}</TableCell>
                        <TableCell>{r.type}</TableCell>
                        <TableCell>{r.address ?? '—'}</TableCell>
                        <TableCell>{r.resolvedAt ? new Date(r.resolvedAt).toLocaleString() : new Date(r.createdAt).toLocaleString()}</TableCell>
                        <TableCell>{r.assignedTo ?? '—'}{r.assignedContact ? ` (${r.assignedContact})` : ''}</TableCell>
                        <TableCell>{r.photo ? <img src={r.photo} alt={r.type} className="h-14 w-20 object-cover rounded" /> : '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
