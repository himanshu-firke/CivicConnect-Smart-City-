import SiteHeader from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Bell, Camera, MapPin, Trophy, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { loadIssues } from "@/lib/demoData";
import { useNavigate } from "react-router-dom";
import AIChat from "@/components/AIChat";

export default function Dashboard() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [issues, setIssues] = useState<any[]>([]);

  useEffect(() => {
    const data = loadIssues();
    setIssues(data);

    // init leaflet map
    const L = (window as any).L;
    if (L) {
      setTimeout(()=>{
        try{
          const mapEl = document.getElementById('map');
          if (!mapEl) return;
          const map = L.map(mapEl as HTMLElement).setView([28.497, 77.07], 13);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
          }).addTo(map);

          const current = loadIssues();
          current.forEach((it:any)=>{
            if (it.lat && it.lng) {
              const m = L.marker([it.lat, it.lng]).addTo(map);
              m.bindPopup(`<strong>${it.type}</strong><br/>${it.address || ''}<br/>Status: ${it.status}`);
            }
          });

          // add five nearby demo markers cluster
          const base:[number,number] = [28.497, 77.07];
          const offsets = [
            [0.003, 0.002],
            [-0.0025, 0.0015],
            [0.0018, -0.0022],
            [-0.0012, -0.0015],
            [0.0022, -0.0008],
          ];
          offsets.forEach(([dx,dy], idx)=>{
            const m = L.marker([base[0]+dx, base[1]+dy]).addTo(map);
            m.bindPopup(`<strong>Nearby issue ${idx+1}</strong><br/>Auto marker`);
          });
        }catch(e){/* ignore */}
      }, 500);
    }
  }, []);

  const user = auth.user;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container space-y-6 py-6 px-4">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              {user?.id ? (
                <AvatarImage src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=300&auto=format&fit=crop" alt={user?.name || "User"} />
              ) : (
                <AvatarFallback>U</AvatarFallback>
              )}
            </Avatar>
            <div>
              <div className="text-sm text-muted-foreground">Hello,</div>
              <div className="text-lg font-semibold">{user?.name ?? "Guest"}!</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-secondary text-secondary-foreground">{user?.civicCoins ?? 0} 🪙</Badge>
          </div>
        </div>

        {/* Main action */}
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-6 text-center md:flex-row md:justify-between md:text-left">
            <div>
              <div className="text-xl font-bold">📸 Report Issue</div>
              <div className="text-sm text-muted-foreground">AI will analyze and route automatically</div>
            </div>
            <div className="flex w-full flex-col gap-2 md:flex-row md:items-center md:gap-4">
              <Button onClick={() => navigate('/report')} className="w-full md:w-auto md:px-6 md:h-12">
                <Camera className="mr-2 h-5 w-5" /> Take Picture
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats row - horizontally scrollable on mobile */}
        <div className="-mx-4 overflow-x-auto pb-2 md:mx-0">
          <div className="inline-flex gap-3 px-4 md:grid md:grid-cols-3 md:gap-4">
            <StatCard title="AI classified" value="1,250+" hint="issues this month" icon={<Zap className="h-4 w-4" />} />
            <StatCard title="Average resolution" value="2.3 days" hint="this month" icon={<Trophy className="h-4 w-4" />} />
            <StatCard title="Your accuracy" value="94%" hint="last 30 days" icon={<Camera className="h-4 w-4" />} />
          </div>
        </div>

        {/* Map and activity */}
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" /> Nearby Issues</CardTitle>
              <CardDescription>Interactive map with colored markers</CardDescription>
            </CardHeader>
            <CardContent>
              <div id="map" className="relative h-56 overflow-hidden rounded-lg border bg-gradient-to-br from-slate-100 to-slate-200 md:h-80" />
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Your Activity</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-3 text-center sm:grid-cols-3">
                <ActivityStat label="Reported" value="12" />
                <ActivityStat label="Resolved" value="3" />
                <ActivityStat label="Streak" value="5d" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Your Reports</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {issues.filter(i=> (i.reporterPhone === user?.phone || i.reporterName === user?.name) && i.status !== 'Resolved').map((r)=> (
                  <div key={r.id} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{r.type} - {r.address ?? 'Unknown'}</div>
                      <div className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleString()}</div>
                      {r.assignedTo && (
                        <div className="text-xs text-muted-foreground">Assigned: {r.assignedTo} {r.assignedContact ? `(${r.assignedContact})` : ''}</div>
                      )}
                    </div>
                    <div>
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${r.status==='Resolved' ? 'bg-primary text-primary-foreground' : r.status==='Assigned' ? 'bg-amber-600 text-white' : 'bg-muted text-muted-foreground'}`}>
                        {r.status}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Trending Issues</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {issues.slice(0,5).map((t) => (
                  <div key={t.id} className="flex items-center gap-3">
                    <img src={t.photo || "https://images.unsplash.com/photo-1506792006437-256b665541e8?q=80&w=400&auto=format&fit=crop"} alt={t.type} className="h-12 w-16 flex-none rounded object-cover" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{t.type} - {t.address ?? "Unknown"}</div>
                      <div className="text-xs text-muted-foreground truncate">{new Date(t.createdAt).toLocaleString()} · {t.confidence}% AI</div>
                    </div>
                    <Badge variant="secondary" className="shrink-0">{t.severity}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <AIChat />
    </div>
  );
}

function StatCard({ title, value, hint, icon }: { title: string; value: string; hint: string; icon: React.ReactNode }) {
  return (
    <div className="min-w-[220px] md:min-w-0">
      <Card>
        <CardContent className="flex items-center justify-between p-4 md:p-6">
          <div>
            <div className="text-sm text-muted-foreground">{title}</div>
            <div className="text-xl font-bold">{value}</div>
            <div className="text-xs text-muted-foreground">{hint}</div>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
            {icon}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Marker({ color, top, left, label }: { color: string; top: string; left: string; label: string }) {
  return (
    <div className="absolute" style={{ top, left }}>
      <div className={`h-3 w-3 rounded-full ring-2 ring-white ${color}`} title={label} />
    </div>
  );
}

function Legend({ color, text }: { color: string; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`h-2.5 w-2.5 rounded-full ${color}`} />
      <span className="text-xs">{text}</span>
    </div>
  );
}

function ActivityStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-3">
      <div className="text-lg font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

const trending = [
  {
    id: 1,
    title: "Pothole - Sector 15",
    meta: "2 mins ago · 89% AI confidence",
    badge: "High",
    img: "https://images.unsplash.com/photo-1506792006437-256b665541e8?q=80&w=400&auto=format&fit=crop",
  },
  {
    id: 2,
    title: "Streetlight outage",
    meta: "10 mins ago · 92% AI confidence",
    badge: "Medium",
    img: "https://images.unsplash.com/photo-1509395176047-4a66953fd231?q=80&w=400&auto=format&fit=crop",
  },
  {
    id: 3,
    title: "Overflowing garbage bin",
    meta: "25 mins ago · 85% AI confidence",
    badge: "Low",
    img: "https://images.unsplash.com/photo-1591247378418-9e2f1d7637ad?q=80&w=400&auto=format&fit=crop",
  },
];
