"use client";

import { useState, useEffect } from "react";
import Vapi from "@vapi-ai/web";
import { useRouter } from "next/navigation";
import { Mic, Square, AudioLines, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils"; // Assuming you have a cn utility, or use simple string concat

// Initialize Vapi outside the component
const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY!);

interface VoiceLoggerProps {
  userId: string;
}

export default function VoiceExpenseLogger({ userId }: VoiceLoggerProps) {
  const [status, setStatus] = useState<"idle" | "connecting" | "listening" | "speaking">("idle");
  const [caption, setCaption] = useState("Tap to log expense");
  const router = useRouter();

  useEffect(() => {
    // 1. Connection Started
    vapi.on("call-start", () => {
      setStatus("listening");
      setCaption("Listening...");
    });

    // 2. Connection Ended
    vapi.on("call-end", () => {
      setStatus("idle");
      setCaption("Tap to log expense");
    });

    // 3. User Starts Speaking (Listening Mode)
    vapi.on("speech-start", () => {
      setStatus("listening");
      setCaption("I'm listening...");
    });

    // 4. AI Starts Speaking (Processing/Replying Mode)
    vapi.on("speech-end", () => {
      setStatus("speaking"); 
      setCaption("Processing...");
    });

    // 5. Data Refresh Trigger
    vapi.on("message", (msg) => {
        if(msg.type === "transcript" && msg.transcriptType === "final") {
            const text = msg.transcript.toLowerCase();
            if (text.includes("done") || text.includes("logged") || text.includes("success")) {
                console.log("Transaction confirmed. Refreshing dashboard...");
                router.refresh(); 
            }
        }
    });

    vapi.on("error", (e) => {
        console.error(e);
        setStatus("idle");
        setCaption("Connection error. Try again.");
    });

    return () => {
        vapi.removeAllListeners();
    };
  }, [router]);

  const toggleCall = async () => {
    if (status !== "idle") {
      vapi.stop();
    } else {
      setStatus("connecting");
      setCaption("Connecting secure line...");
      try {
        await vapi.start("4f06d54a-39a9-400f-8cb6-ba0a0c71f69f", {
            metadata: { userId: userId }
        });
      } catch (err) {
        console.error("Failed to start call", err);
        setStatus("idle");
        setCaption("Failed to connect");
      }
    }
  };

  return (
    <div className="relative w-full overflow-hidden rounded-xl border bg-gradient-to-b from-slate-900 to-slate-950 p-6 shadow-lg shadow-blue-900/10">
      
      {/* Background Decor */}
      <div className="absolute top-0 right-0 p-3 opacity-20">
        <Sparkles className="h-12 w-12 text-blue-400" />
      </div>

      <div className="flex flex-col items-center gap-5">
        
        {/* The Animated Button */}
        <div className="relative">
          {/* Ripple Effect (Only when listening) */}
          {status === "listening" && (
            <div className="absolute -inset-4 rounded-full bg-red-500/20 animate-ping" />
          )}
          
          {/* Glow Effect (Only when speaking) */}
          {status === "speaking" && (
            <div className="absolute -inset-4 rounded-full bg-green-500/20 blur-xl animate-pulse" />
          )}

          <button
            onClick={toggleCall}
            disabled={status === "connecting"}
            className={cn(
              "relative flex h-20 w-20 items-center justify-center rounded-full border-4 transition-all duration-300 shadow-2xl hover:scale-105 active:scale-95",
              status === "idle" && "border-slate-700 bg-slate-800 hover:border-blue-500/50 hover:bg-slate-700",
              status === "connecting" && "border-slate-700 bg-slate-800 cursor-not-allowed",
              status === "listening" && "border-red-500/50 bg-red-500 text-white shadow-red-500/50",
              status === "speaking" && "border-green-500/50 bg-green-600 text-white shadow-green-500/50"
            )}
          >
            {status === "idle" && <Mic className="h-8 w-8 text-blue-400" />}
            {status === "connecting" && <Loader2 className="h-8 w-8 text-slate-400 animate-spin" />}
            {status === "listening" && <Square className="h-6 w-6 fill-current" />}
            {status === "speaking" && <AudioLines className="h-8 w-8 animate-pulse" />}
          </button>
        </div>

        {/* Text Status */}
        <div className="text-center space-y-1">
          <p className="font-medium text-slate-200 tracking-wide text-lg">
             {status === "idle" ? "AI Voice Agent" : status === "speaking" ? "AI is Processing" : "Listening..."}
          </p>
          <p className="text-sm text-slate-400 font-mono h-5">
            {caption}
          </p>
        </div>

      </div>
    </div>
  );
}