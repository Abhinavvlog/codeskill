"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Maximize, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface SafeExamBrowserProps {
  children: React.ReactNode;
  maxWarnings?: number;
  onTerminate?: () => void;
  onViolation?: (type: string, message: string) => void;
  isEnabled?: boolean;
}

export default function SafeExamBrowser({
  children,
  maxWarnings = 3,
  onTerminate,
  onViolation,
  isEnabled = true,
}: SafeExamBrowserProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [warnings, setWarnings] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isEnabled) return;

    // Check initial fullscreen state
    const checkFullscreen = () => {
      setIsFullscreen(!!document.fullscreenElement);
      if (!document.fullscreenElement) {
        handleWarning('Exiting fullscreen is not allowed during the exam.');
      }
    };

    // Fullscreen event listener
    document.addEventListener('fullscreenchange', checkFullscreen);
    
    // Visibility change (tab switching)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleWarning('Tab switching or minimizing the window is strictly prohibited.');
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Prevent Context Menu (Right Click)
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      toast.error('Right-click is disabled during the assessment.');
    };
    document.addEventListener('contextmenu', handleContextMenu);

    // Prevent specific keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      // Prevent Copy (Ctrl/Cmd + C)
      if (cmdOrCtrl && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        toast.error('Copying is disabled.');
      }
      // Prevent Paste (Ctrl/Cmd + V)
      if (cmdOrCtrl && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        toast.error('Pasting is disabled.');
      }
      // Prevent Developer Tools (F12, Ctrl+Shift+I, Cmd+Option+I)
      if (
        e.key === 'F12' ||
        (cmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 'i') ||
        (cmdOrCtrl && e.altKey && e.key.toLowerCase() === 'i')
      ) {
        e.preventDefault();
        toast.error('Developer tools are disabled.');
      }
      // Prevent Print (Ctrl/Cmd + P)
      if (cmdOrCtrl && e.key.toLowerCase() === 'p') {
        e.preventDefault();
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    // We don't want to show a warning on initial mount if they are just arriving,
    // but the fullscreenchange will handle actual exits.

    return () => {
      document.removeEventListener('fullscreenchange', checkFullscreen);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isEnabled]);

  const handleWarning = (message: string) => {
    if (onViolation) {
      onViolation("browser_violation", message);
    }
    setWarnings((prev) => {
      const nextCount = prev + 1;
      if (nextCount >= maxWarnings) {
        // Terminate exam
        toast.error('Maximum warnings exceeded. Exam terminated.');
        if (onTerminate) onTerminate();
      } else {
        toast.error(`Warning ${nextCount}/${maxWarnings}: ${message}`);
      }
      return nextCount;
    });
  };

  const requestFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      }
    } catch (err) {
      console.error("Error attempting to enable fullscreen:", err);
      toast.error("Failed to enter fullscreen. Please try again.");
    }
  };

  if (!isEnabled) {
    return <>{children}</>;
  }

  return (
    <div ref={containerRef} className="relative w-full h-screen overflow-hidden bg-background">
      {/* The actual content */}
      <div className={`w-full h-full transition-opacity duration-300 ${!isFullscreen ? 'opacity-0 pointer-events-none blur-sm' : 'opacity-100'}`}>
        {children}
      </div>

      {/* Fullscreen Overlay */}
      <AnimatePresence>
        {!isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[9999] bg-background/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center"
          >
            <ShieldAlert className="w-20 h-20 text-red-500 mb-6" />
            <h1 className="text-3xl font-bold text-foreground mb-4">Secure Exam Environment</h1>
            <p className="text-muted-foreground text-lg max-w-lg mb-8">
              This assessment requires a secure, fullscreen environment. Any attempt to switch tabs, minimize the window, or exit fullscreen will be recorded as a violation.
            </p>
            
            {warnings > 0 && (
              <div className="flex items-center gap-2 text-yellow-500 bg-yellow-500/10 px-4 py-2 rounded-lg mb-8 border border-yellow-500/20">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-medium">You have {warnings} out of {maxWarnings} warnings.</span>
              </div>
            )}

            <button
              onClick={requestFullscreen}
              className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-4 rounded-xl font-semibold text-lg transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/25"
            >
              <Maximize className="w-5 h-5" />
              Enter Fullscreen to Continue
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
