import React, { useEffect, useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { addIssue } from "@/lib/demoData";
import { toast } from "@/hooks/use-toast";
import VoiceRecorder from "@/components/VoiceRecorder";

function simulateAIAnalysis(fileDataUrl: string | null) {
  // returns simulated classification result
  const types = [
    { type: "Pothole", dept: "Roads Department" },
    { type: "Streetlight", dept: "Electrical Department" },
    { type: "Garbage", dept: "Sanitation Department" },
  ];
  const pick = types[Math.floor(Math.random() * types.length)];
  const confidence = Math.floor(70 + Math.random() * 29);
  const severity = confidence > 85 ? "High" : confidence > 78 ? "Medium" : "Low";
  const size = (Math.random() * 3 + 0.5).toFixed(1) + " sq m";
  const cost = pick.type === "Pothole" ? "₹15,000-₹25,000" : pick.type === "Streetlight" ? "₹5,000-₹12,000" : "₹1,500-₹5,000";
  return {
    ...pick,
    confidence,
    severity: severity as "Low" | "Medium" | "High",
    size,
    costEstimate: cost,
  };
}

export default function Report() {
  const auth = useAuth();
  const { user } = auth;
  const navigate = useNavigate();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const fallbackAddress = "Government ITI, NH 6, National Highway 6, Ramanand Nagar, Jalgaon";
  const [address, setAddress] = useState<string>(fallbackAddress);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [description, setDescription] = useState<string>('');
  const [voiceData, setVoiceData] = useState<any>(null);

  // try to get real current location on mount; fallback to dummy if unavailable
  useEffect(() => {
    let handled = false;
    // Government ITI, NH 6, Ramanand Nagar, Jalgaon approx coords
    const fallbackLat = 21.0045;
    const fallbackLng = 75.5661;
    const fallbackAddress = "Government ITI, NH 6, National Highway 6, Ramanand Nagar, Jalgaon";
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setLat(pos.coords.latitude);
            setLng(pos.coords.longitude);
            // keep fallbackAddress visible for consistency
            handled = true;
          },
          () => {
            if (!handled) {
              setLat(fallbackLat); setLng(fallbackLng); setAddress(fallbackAddress);
            }
          },
          { enableHighAccuracy: true, timeout: 5000 }
        );
        // fallback in case callbacks don't fire
        setTimeout(() => {
          if (!handled) { setLat(fallbackLat); setLng(fallbackLng); setAddress(fallbackAddress); }
        }, 6000);
      } else {
        setLat(fallbackLat); setLng(fallbackLng); setAddress(fallbackAddress);
      }
    } catch (e) {
      setLat(fallbackLat); setLng(fallbackLng); setAddress(fallbackAddress);
    }
  }, []);

  const onFile = (f: File | null) => {
    setFile(f);
    if (!f) {
      setPreview(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
  };

  const detectLocation = async () => {
    // kept for compatibility but not used in UI
    if (!navigator.geolocation) {
      toast({ title: "Geolocation", description: "Geolocation not supported in this browser." });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setAddress("Detected location");
      },
      (err) => {
        toast({ title: "Location error", description: "Unable to detect location: " + err.message });
      },
      { enableHighAccuracy: true, timeout: 5000 },
    );
  };

  const analyze = async () => {
    setProcessing(true);
    setResult(null);
    // simulate steps with small delays
    await new Promise((r) => setTimeout(r, 700));
    await new Promise((r) => setTimeout(r, 700));
    const res = simulateAIAnalysis(preview);
    setResult(res);
    setProcessing(false);
  };

  function haversine(lat1:number, lon1:number, lat2:number, lon2:number){
    const toRad = (v:number)=> v * Math.PI/180;
    const R = 6371; // km
    const dLat = toRad(lat2-lat1);
    const dLon = toRad(lon2-lon1);
    const a = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)*Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  const contractors = [
    { name: "RoadFix Contractors", dept: "Roads Department", lat: 28.5, lng: 77.07 },
    { name: "BrightLights", dept: "Electrical Department", lat: 28.49, lng: 77.08 },
    { name: "CleanCity", dept: "Sanitation Department", lat: 28.48, lng: 77.06 },
  ];

  const submitReport = async () => {
    const spinner = toast({ title: "Submitting report", description: "Sending to responsible department..." });
    const id = "#" + Math.floor(100 + Math.random() * 900).toString();

    // compute priority score (1-10)
    const severityWeight = result.severity === "High" ? 0.6 : result.severity === "Medium" ? 0.35 : 0.15;
    const confidenceFactor = result.confidence / 100; // 0-1
    let distanceFactor = 0.5;
    if (lat && lng) {
      // find nearest contractor for department
      const sameDept = contractors.filter((c) => c.dept === result.dept);
      if (sameDept.length) {
        let nearest = sameDept[0];
        let minD = 1e9;
        sameDept.forEach((c) => {
          const d = haversine(lat, lng, c.lat, c.lng);
          if (d < minD) {
            minD = d;
            nearest = c;
          }
        });
        distanceFactor = Math.max(0.2, Math.min(1, 1 / (1 + minD / 5)));
      }
    }
    const rawScore = severityWeight * 0.7 + confidenceFactor * 0.25 + distanceFactor * 0.05;
    const priorityScore = Math.round(Math.min(10, Math.max(1, rawScore * 10))); // 1-10

    // pick contractor
    const deptContractors = contractors.filter((c) => c.dept === result.dept);
    const assigned = deptContractors.length ? deptContractors[0] : contractors[0];

    const issue = {
      id,
      type: result.type,
      confidence: result.confidence,
      severity: result.severity,
      size: result.size,
      costEstimate: result.costEstimate,
      department: result.dept,
      lat: lat || undefined,
      lng: lng || undefined,
      address: address || undefined,
      description: description || undefined,
      reporterName: user?.name || "Anonymous",
      reporterPhone: (user as any)?.phone || undefined,
      reporterId: user?.id || undefined,
      status: "Pending",
      createdAt: Date.now(),
      photo: preview || undefined,
      voice: voiceData?.audioDataUrl || undefined,
      voiceTranscript: voiceData?.transcript || undefined,
      tx: Math.random().toString(36).slice(2, 10),
      assignedTo: assigned.name,
      contractor: assigned.name,
      priorityScore,
    };

    // optimistic UI: immediately add
    addIssue(issue as any);
    try { window.dispatchEvent(new CustomEvent('civicai_notification', { detail: { type: 'submitted', issueId: id, message: `Report ${id} submitted and assigned to ${assigned.name}`, department: issue.department, reporterId: issue.reporterId, targetRole: 'municipal', targetDepartment: issue.department } })); } catch(e) {}

    // reward civic coins to the reporter if available
    try{
      if (auth && typeof auth.addCoins === 'function') {
        // base reward
        let reward = 15;
        // bonus by confidence
        if (result.confidence >= 90) reward += 5;
        else if (result.confidence >= 80) reward += 2;
        auth.addCoins(reward, 'Report submitted', id);
      }
    } catch(e) {
      // ignore
    }

    setTimeout(() => {
      spinner.update({ title: "Submitted", description: `Report ${id} sent to ${issue.department} (Assigned: ${issue.assignedTo})` });
      spinner.dismiss();
    }, 800);

    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container p-4">
        <Card>
          <CardHeader>
            <CardTitle>Report Civic Issue</CardTitle>
            <CardDescription>Step 1: Upload a photo and let AI analyze it</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Photo</label>
              <div className="mt-2 flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => onFile(e.target.files ? e.target.files[0] : null)}
                />
                {preview && <img src={preview} alt="preview" className="h-20 w-20 rounded object-cover" />}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Location</label>
              <div className="mt-2 flex items-center gap-2">
                <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address (auto-detected or enter manually)" />
              </div>
              {lat && lng && (
                <div className="mt-2 text-xs text-muted-foreground">Lat: {lat.toFixed(4)}, Lng: {lng.toFixed(4)}</div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">Short description</label>
              <textarea value={description} onChange={(e)=>setDescription(e.target.value)} className="mt-2 w-full rounded-md border px-3 py-2 text-sm" placeholder="Add a short description (optional)" />
            </div>

            <VoiceRecorder setVoiceData={(d:any)=>{ setVoiceData(d); }} />

            <div className="flex items-center gap-2">
              <Button onClick={analyze} disabled={!preview || processing}>
                {processing ? "Analyzing..." : "Analyze (AI)"}
              </Button>
              <Button variant="ghost" onClick={() => { setFile(null); setPreview(null); setResult(null); }}>
                Reset
              </Button>
            </div>

            {result && (
              <div className="space-y-2">
                <h4 className="text-lg font-semibold">🎯 AI Analysis Complete</h4>
                <div className="rounded-lg border p-3">
                  <div className="font-medium">{result.type} detected</div>
                  <div className="text-sm text-muted-foreground">Confidence: {result.confidence}%</div>
                  <div className="text-sm text-muted-foreground">Severity: {result.severity}</div>
                  <div className="text-sm text-muted-foreground">Size: {result.size}</div>
                  <div className="text-sm text-muted-foreground">Repair Cost: {result.costEstimate}</div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="font-medium">Routing</div>
                  <div className="text-sm text-muted-foreground">→ {result.dept}</div>
                </div>
                <div className="flex gap-3">
                  <Button onClick={submitReport}>🚀 Submit Report</Button>
                  <Button variant="outline" onClick={() => setResult(null)}>Edit Details</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
