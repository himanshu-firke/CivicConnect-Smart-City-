import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/context/AuthContext";

export default function Index() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("citizen");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (auth.user?.role === "citizen") navigate("/dashboard");
    if (auth.user?.role === "admin") navigate("/admin");
  }, [auth.user]);

  function reset() {
    setEmail("");
    setPassword("");
    setError(null);
  }

  function signInCitizen() {
    const isCitizen = email.toLowerCase() === "citizen@example.com";
    const ok = auth.login(email, password);
    if (!ok || !isCitizen) {
      setError("Invalid citizen credentials");
      return;
    }
    navigate("/dashboard");
  }

  function signInAdmin() {
    const e = email.toLowerCase();
    const allowed = ["admin@roads.gov.in", "admin@electrical.gov.in", "admin@sanitation.gov.in", "admin@municipal.gov.in"];
    const ok = auth.login(email, password);
    if (!ok || !allowed.includes(e)) {
      setError("Invalid admin credentials");
      return;
    }
    navigate("/admin");
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Civic Issue Reporting</CardTitle>
            <CardDescription className="text-center">Access the civic issue reporting and management system</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={tab} onValueChange={(v)=>{ setTab(v); reset(); }} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="citizen">Citizens Login</TabsTrigger>
                <TabsTrigger value="admin">Admin</TabsTrigger>
              </TabsList>

              <TabsContent value="citizen">
                <div className="mt-3 space-y-3">
                  <label className="text-sm font-medium">Email Address</label>
                  <Input type="email" placeholder="citizen@example.com" value={email} onChange={(e)=>setEmail(e.target.value)} />
                  <label className="text-sm font-medium">Password</label>
                  <Input type="password" placeholder="password123" value={password} onChange={(e)=>setPassword(e.target.value)} />
                  {error && <Alert><AlertDescription>{error}</AlertDescription></Alert>}
                  <Button className="w-full" onClick={signInCitizen}>Citizen Sign In</Button>
                  <div className="rounded-md border p-2 text-xs text-muted-foreground">Credentials: citizen@example.com / password123</div>
                </div>
              </TabsContent>

              <TabsContent value="admin">
                <div className="mt-3 space-y-3">
                  <label className="text-sm font-medium">Email Address</label>
                  <Input type="email" placeholder="admin@roads.gov.in" value={email} onChange={(e)=>setEmail(e.target.value)} />
                  <label className="text-sm font-medium">Password</label>
                  <Input type="password" placeholder="password123" value={password} onChange={(e)=>setPassword(e.target.value)} />
                  {error && <Alert><AlertDescription>{error}</AlertDescription></Alert>}
                  <Button className="w-full" onClick={signInAdmin}>Admin Sign In</Button>
                  <div className="rounded-md border p-2 text-xs text-muted-foreground">
                    Credentials:
                    <div>admin@roads.gov.in</div>
                    <div>admin@electrical.gov.in</div>
                    <div>admin@sanitation.gov.in</div>
                    <div>admin@municipal.gov.in</div>
                    <div>Password: password123</div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
