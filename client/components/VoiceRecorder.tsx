import React, { useEffect, useRef, useState } from "react";

export default function VoiceRecorder({ setVoiceData }: { setVoiceData: (data: { audioDataUrl?: string; transcript?: string } | null) => void }) {
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);

  useEffect(()=>{
    // cleanup
    return ()=>{
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  },[audioUrl]);

  async function start() {
    if (!navigator.mediaDevices || !(navigator.mediaDevices.getUserMedia)) {
      try { (await import("@/hooks/use-toast")).toast({ title: 'Recording', description: 'Audio recording not supported in this browser.' }); } catch(e) { console.warn('Recording not supported'); }
      return;
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream);
    mediaRef.current = mr;
    chunksRef.current = [];
    mr.ondataavailable = (e:any)=> { chunksRef.current.push(e.data); };
    mr.onstop = async ()=>{
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      // convert to dataURL
      const reader = new FileReader();
      reader.onload = ()=>{
        const dataUrl = reader.result as string;
        setVoiceData({ audioDataUrl: dataUrl, transcript: transcript || undefined });
      };
      reader.readAsDataURL(blob);
    };

    // speech recognition (best-effort)
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (SpeechRecognition) {
      try {
        const r = new SpeechRecognition();
        r.lang = 'en-US';
        r.interimResults = true;
        r.onresult = (ev:any)=>{
          let str = '';
          for (let i=0;i<ev.results.length;i++) str += ev.results[i][0].transcript;
          setTranscript(str);
        };
        r.start();
        recognitionRef.current = r;
      } catch(e) {
        // ignore
      }
    }

    mr.start();
    setRecording(true);
  }

  function stop() {
    if (mediaRef.current && mediaRef.current.state !== 'inactive') mediaRef.current.stop();
    setRecording(false);
    if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch(e){} }
    setVoiceData({ audioDataUrl: audioUrl || undefined, transcript: transcript || undefined });
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Voice note (optional)</label>
      <div className="flex items-center gap-2">
        <button className={`rounded-md px-3 py-2 ${recording ? 'bg-destructive text-destructive-foreground' : 'bg-primary text-primary-foreground'}`} onClick={()=>{ if(recording) stop(); else start(); }}>
          {recording ? 'Stop' : 'Record'}
        </button>
        {audioUrl && <audio controls src={audioUrl} className="h-10" />}
        {transcript && <div className="text-xs text-muted-foreground">{transcript}</div>}
      </div>
    </div>
  );
}
