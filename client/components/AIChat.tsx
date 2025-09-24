import React, { useState, useEffect } from "react";
import { loadIssues } from "@/lib/demoData";
import { useAuth } from "@/context/AuthContext";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AIChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ from: "user" | "bot"; text: string }[]>([
    { from: "bot", text: "Hi — I am CivicAI assistant. Ask about your reports, e.g. 'status of #001' or 'my reports'" },
  ]);
  const [showIntro, setShowIntro] = useState(true);
  const auth = useAuth();

  useEffect(()=>{
    // show intro bubble for 3s
    const t = setTimeout(()=> setShowIntro(false), 3000);
    return () => clearTimeout(t);
  },[]);

  function push(msg: { from: "user" | "bot"; text: string }) {
    setMessages((m) => [...m, msg]);
  }

  function handle(query: string) {
    push({ from: "user", text: query });
    const lower = query.toLowerCase();
    const issues = loadIssues();

    // if user mentions an id like #001, respond with status regardless of 'status' keyword
    const idMatch = query.match(/#\w+/);
    if (idMatch) {
      const id = idMatch[0];
      const found = issues.find((i) => i.id === id);
      if (found) {
        push({ from: "bot", text: `Issue ${id} is currently ${found.status} and assigned to ${found.assignedTo || 'team'}. Priority ${found.priorityScore || 'N/A'}.` });
        return;
      } else {
        push({ from: "bot", text: `I couldn't find a report with id ${id}.` });
        return;
      }
    }

    if (lower.includes("status of") || lower.includes("status")) {
      // no id found
      push({ from: "bot", text: "Please include the issue id like '#001' to get the status." });
      return;
    }

    if (lower.includes("my reports") || lower.includes("my issues") || lower.includes("my report")) {
      const my = issues.filter((i) => i.reporterPhone === auth.user?.phone || i.reporterName === auth.user?.name);
      if (my.length === 0) {
        push({ from: "bot", text: "You have no reports in the system." });
      } else {
        push({ from: "bot", text: `You have ${my.length} reports. Latest: ${my[0].type} at ${my[0].address || 'unknown'} (status: ${my[0].status}).` });
      }
      return;
    }

    // fallback
    push({ from: "bot", text: "Sorry, I didn't understand. Ask things like 'status of #001' or 'my reports'." });
  }

  return (
    <div>
      <div className="fixed bottom-20 right-4 z-50">
        <div className="flex items-end flex-col gap-2">
          {open && (
            <div className="w-80 rounded-lg border bg-card p-3 shadow-lg">
              <div className="mb-2 text-sm font-semibold">CivicAI Assistant</div>
              <div className="max-h-48 space-y-2 overflow-auto text-sm">
                {messages.map((m, idx) => (
                  <div key={idx} className={m.from === 'bot' ? 'text-sm text-muted-foreground' : 'text-sm text-primary'}>
                    {m.text}
                  </div>
                ))}
              </div>
              <div className="mt-2 flex gap-2">
                <input className="flex-1 rounded border px-2 py-1 text-sm" value={input} onChange={(e)=>setInput(e.target.value)} placeholder="Ask about your reports" />
                <Button onClick={() => { if (!input) return; handle(input); setInput(''); }}>Send</Button>
              </div>
            </div>
          )}

          {/* intro bubble */}
          {showIntro && (
            <div className="mb-2 animate-fade-in text-xs text-muted-foreground rounded bg-card/90 p-2 shadow">Chat with CivicAI assistant</div>
          )}

          <div className="animate-[pulse_2s_infinite]">
            <Button size="icon" variant="default" onClick={() => setOpen((s)=>!s)} aria-label="chat" className="!h-14 !w-14">
              <MessageCircle className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
