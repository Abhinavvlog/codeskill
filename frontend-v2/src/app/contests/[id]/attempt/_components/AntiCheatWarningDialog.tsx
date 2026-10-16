"use client";

import { useState } from "react";
import { isDocumentFullscreen } from "@/lib/fullscreen";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AntiCheatWarningDialogProps {
  isOpen: boolean;
  onClose: () => void;
  warnings: number;
  warningLimit: number;
  lastViolation: string | null;
  requestFullscreen: () => Promise<void>;
  requireFullscreen?: boolean;
  isFullscreen: boolean;
}

export function AntiCheatWarningDialog({
  isOpen,
  onClose,
  warnings,
  warningLimit,
  lastViolation,
  requestFullscreen,
  isFullscreen,
  requireFullscreen = true,
}: AntiCheatWarningDialogProps) {
  const [error, setError] = useState("");
  const [restoring, setRestoring] = useState(false);
  if (!isOpen) return null;

  const warningsLeft = warningLimit - warnings;
  const isCritical = warningsLeft <= 1;

  const getViolationMessage = (violation: string | null) => {
    switch (violation) {
      case "Fullscreen_Exit":
        return "You exited fullscreen mode. Please remain in fullscreen until you submit the contest.";
      case "TabSwitch_WindowBlur":
      case "TabSwitch_VisibilityHidden":
        return "You switched tabs or lost focus on the contest window. Switching to other applications is strictly prohibited.";
      case "Clipboard_Copy":
      case "Clipboard_Cut":
        return "Copying text is disabled during this contest.";
      case "Clipboard_Paste":
        return "Pasting external code is not allowed.";
      case "Keyboard_DevTools":
      case "DevTools_Resized":
      case "DevTools_DebuggerPaused":
        return "Opening Developer Tools is strictly prohibited.";
      case "Mouse_ContextMenu":
        return "Right-clicking is disabled.";
      case "NetworkDisconnect":
        return "Your network disconnected. We have paused logging until you reconnected.";
      default:
        return "An unauthorized action was detected.";
    }
  };

  const handleAcknowledge = async () => {
    if (restoring) return;
    setRestoring(true);
    setError("");
    try {
      if (requireFullscreen && !isDocumentFullscreen()) await requestFullscreen();
      if (requireFullscreen && !isDocumentFullscreen()) throw new Error("Return to fullscreen before continuing the contest.");
      onClose();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Fullscreen could not be restored. Please try again.");
    } finally { setRestoring(false); }
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="Contest security warning" className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-md w-full shadow-2xl relative overflow-hidden">
        {isCritical && (
          <div className="absolute top-0 left-0 w-full h-1 bg-red-500 animate-pulse" />
        )}
        
        <div className="flex flex-col items-center text-center space-y-4">
          <div className={`p-4 rounded-full ${isCritical ? 'bg-red-500/20 text-red-500' : 'bg-amber-500/20 text-amber-500'}`}>
            <AlertTriangle size={32} />
          </div>
          
          <h2 className="text-xl font-bold text-white">
            Anti-Cheat Violation Detected
          </h2>
          
          <p className="text-zinc-400">
            {getViolationMessage(lastViolation)}
          </p>

          <div className="bg-zinc-950 p-4 rounded-lg w-full mt-2 border border-zinc-800">
            <p className="text-sm text-zinc-400">Warnings remaining:</p>
            <p className={`text-2xl font-bold ${isCritical ? 'text-red-500' : 'text-white'}`}>
              {warningsLeft} / {warningLimit}
            </p>
          </div>

          <p className="text-xs text-zinc-500">
            Your session will be automatically submitted if you exceed the warning limit.
          </p>

          {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
          <Button disabled={restoring}
            onClick={handleAcknowledge} 
            className={`w-full mt-4 ${isCritical ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:bg-primary/90'}`}
          >
            {restoring ? "Restoring fullscreen…" : "I Understand, Return to Contest"}
          </Button>
        </div>
      </div>
    </div>
  );
}
