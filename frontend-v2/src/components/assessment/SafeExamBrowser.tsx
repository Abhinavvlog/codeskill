/Users/home/.rvm/scripts/rvm:29: operation not permitted: ps
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
  onFullscreenEntered?: () => void | Promise<void>;
  isEnabled?: boolean;
  requireFullscreen?: boolean;
  detectTabSwitch?: boolean;
  blockCopyPaste?: boolean;
  monitorViolations?: boolean;
  autoSubmitOnViolation?: boolean;
}

export default function SafeExamBrowser({
  children,
  maxWarnings = 3,
  onTerminate,
  onViolation,
  onFullscreenEntered,
  isEnabled = true,
  requireFullscreen = true,
  detectTabSwitch = true,
  blockCopyPaste = true,
  monitorViolations = true,
  autoSubmitOnViolation = true,
}: SafeExamBrowserProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [warnings, setWarnings] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const warningCountRef = useRef(0);
  const callbacksRef = useRef({ onViolation, onTerminate, onFullscreenEntered, maxWarnings, autoSubmitOnViolation });
  callbacksRef.current = { onViolation, onTerminate, onFullscreenEntered, maxWarnings, autoSubmitOnViolation };

  useEffect(() => {
    if (isEnabled && (!requireFullscreen || isFullscreen)) {
      void callbacksRef.current.onFullscreenEntered?.();
    }
  }, [isEnabled, requireFullscreen, isFullscreen]);

  useEffect(() => {
    if (!isEnabled) return;
    let away = false;
    const warnAway = (type: string, message: string) => {
      if (!monitorViolations || away) return;
      away = true;
      handleWarning(type, message);
    };
    const checkReturned = () => {
      if (!document.hidden && document.hasFocus()) away = false;
    };

    // A route transition can preserve document fullscreen while this component
    // mounts with fresh local state. Sync immediately so the exam is not gated.
    const checkFullscreen = () => {
      const fullscreen = Boolean(document.fullscreenElement);
      setIsFullscreen(fullscreen);
      if (requireFullscreen && !fullscreen) {
        warnAway('fullscreen_exit', 'Exiting fullscreen is not allowed during the exam.');
      }
    };

    // Fullscreen event listener
    document.addEventListener('fullscreenchange', checkFullscreen);
    setIsFullscreen(Boolean(document.fullscreenElement));
    
    // Visibility change (tab switching)
    const handleVisibilityChange = () => {
      if (detectTabSwitch && document.hidden) {
        warnAway('tab_switch', 'Tab, desktop, or window switching is not allowed during the exam.');
      } else checkReturned();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    const handleBlur = () => {
      if (detectTabSwitch) warnAway('tab_switch', 'The assessment lost focus. Switching apps, windows, or desktops is not allowed.');
    };
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', checkReturned);
    // Some desktop transitions omit visibilitychange. Check focus as a fallback.
    const focusCheck = window.setInterval(() => {
      if (document.hidden || !document.hasFocus()) handleBlur();
      else checkReturned();
    }, 500);

    // Prevent Context Menu (Right Click)
    const handleContextMenu = (e: MouseEvent) => {
      if (blockCopyPaste) {
        e.preventDefault();
        toast.error('Right-click is disabled during the assessment.');
      }
    };
    document.addEventListener('contextmenu', handleContextMenu);

    // Prevent specific keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      // Prevent Copy (Ctrl/Cmd + C)
      if (blockCopyPaste && cmdOrCtrl && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        toast.error('Copying is disabled.');
      }
      // Prevent Paste (Ctrl/Cmd + V)
      if (blockCopyPaste && cmdOrCtrl && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        toast.error('Pasting is disabled.');
      }
      // Prevent Developer Tools (F12, Ctrl+Shift+I, Cmd+Option+I)
      if (blockCopyPaste && (
        e.key === 'F12' ||
        (cmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 'i') ||
        (cmdOrCtrl && e.altKey && e.key.toLowerCase() === 'i')
      )) {
        e.preventDefault();
        toast.error('Developer tools are disabled.');
      }
      // Prevent Print (Ctrl/Cmd + P)
      if (blockCopyPaste && cmdOrCtrl && e.key.toLowerCase() === 'p') {
        e.preventDefault();
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    // We don't want to show a warning on initial mount if they are just arriving,
    // but the fullscreenchange will handle actual exits.

    return () => {
      document.removeEventListener('fullscreenchange', checkFullscreen);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', checkReturned);
      window.clearInterval(focusCheck);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isEnabled, requireFullscreen, detectTabSwitch, blockCopyPaste, monitorViolations]);

  const handleWarning = (type: string, message: string) => {
    const callbacks = callbacksRef.current;
    if (warningCountRef.current >= callbacks.maxWarnings) return;
    callbacks.onViolation?.(type, message);
    const nextCount = ++warningCountRef.current;
    setWarnings(nextCount);
    if (nextCount >= callbacks.maxWarnings) {
      if (callbacks.autoSubmitOnViolation) {
        toast.error('Maximum warnings exceeded. Exam terminated.');
        callbacks.onTerminate?.();
      } else {
        toast.error(`Warning limit reached: ${message}`);
      }
    } else {
      toast.error(`Warning ${nextCount}/${callbacks.maxWarnings}: ${message}`);
    }
  };

  const requestFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }

      // Keep the gate state in sync even when fullscreen was entered before
      // this page mounted (for example, from the assessment briefing).
      setIsFullscreen(Boolean(document.fullscreenElement));
      if (document.fullscreenElement) await callbacksRef.current.onFullscreenEntered?.();
    } catch (err) {
      console.error("Error attempting to enable fullscreen:", err);
      setIsFullscreen(Boolean(document.fullscreenElement));
      toast.error("Failed to enter fullscreen. Please try again.");
    }
  };

  if (!isEnabled) {
    return <>{children}</>;
  }

  return (
    <div ref={containerRef} className="relative w-full h-screen overflow-hidden bg-background">
      {/* The actual content */}
      <div className={`w-full h-full overflow-hidden transition-opacity duration-300 ${requireFullscreen && !isFullscreen ? 'opacity-0 pointer-events-none blur-sm' : 'opacity-100'}`}>
        {children}
      </div>

      {/* Fullscreen Overlay */}
      <AnimatePresence>
        {requireFullscreen && !isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[9999] bg-background/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center"
          >
            <ShieldAlert className="w-20 h-20 text-red-500 mb-6" />
            <h1 className="text-3xl font-bold text-foreground mb-4">Secure Exam Environment</h1>
            <p className="text-muted-foreground text-lg max-w-lg mb-8">
              Enter fullscreen to begin your assessment. {monitorViolations ? 'Leaving fullscreen during the test will be recorded.' : 'The timer starts after you enter fullscreen.'}
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
