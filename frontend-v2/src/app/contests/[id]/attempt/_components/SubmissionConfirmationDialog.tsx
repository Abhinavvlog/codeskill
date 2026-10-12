"use client";

import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SubmissionConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  fullName: string;
  username: string;
  contestName: string;
  warnings: number;
  elapsedSeconds?: number;
}

export function SubmissionConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  fullName,
  username,
  contestName,
  warnings,
  elapsedSeconds = 0,
}: SubmissionConfirmationDialogProps) {
  if (!isOpen) return null;

  const now = new Date();
  const submitTime = now.toLocaleString('en-US', { 
    day: '2-digit', month: 'short', year: 'numeric', 
    hour: '2-digit', minute: '2-digit', hour12: true 
  });

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-md w-full shadow-2xl relative">
        <div className="flex flex-col items-center space-y-4">
          <div className="p-4 rounded-full bg-primary/20 text-primary">
            <CheckCircle2 size={32} />
          </div>
          
          <h2 className="text-xl font-bold text-white">
            Confirm Submission
          </h2>
          
          <div className="bg-zinc-950 p-4 rounded-lg w-full mt-2 border border-zinc-800 space-y-2 text-sm text-zinc-400">
            <div className="flex justify-between">
              <span>Candidate:</span>
              <span className="text-white font-medium">{fullName} (@{username})</span>
            </div>
            <div className="flex justify-between">
              <span>Contest:</span>
              <span className="text-white font-medium">{contestName}</span>
            </div>
            <div className="flex justify-between">
              <span>Time Used:</span>
              <span className="text-white font-medium">{Math.floor(elapsedSeconds / 3600).toString().padStart(2, "0")}:{Math.floor(elapsedSeconds / 60 % 60).toString().padStart(2, "0")}:{(elapsedSeconds % 60).toString().padStart(2, "0")}</span>
            </div>
            <div className="flex justify-between">
              <span>Warnings Logged:</span>
              <span className={warnings > 0 ? "text-amber-500 font-medium" : "text-emerald-500 font-medium"}>
                {warnings}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Submission Time:</span>
              <span className="text-white font-medium">{submitTime}</span>
            </div>
          </div>

          <p className="text-sm text-zinc-300 text-center bg-zinc-800/50 p-3 rounded border border-zinc-700">
            You are submitting this assessment as <strong className="text-white">{fullName} (@{username})</strong>. 
            Once submitted, no further changes will be allowed.
          </p>

          <div className="flex w-full space-x-3 mt-4">
            <Button variant="outline" className="w-1/2" onClick={onClose}>
              Cancel
            </Button>
            <Button className="w-1/2 bg-primary hover:bg-primary/90 text-black" onClick={onConfirm}>
              Submit Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
