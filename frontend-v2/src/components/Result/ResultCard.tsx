"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize2, Minimize2, X } from 'lucide-react';

import ResultToolbar, { ResultToolbarProps } from './ResultToolbar';
import ResultHeader from './ResultHeader';
import TestCaseSidebar, { TestCase } from './TestCaseSidebar';
import OutputPanel from './OutputPanel';
import SubmissionSummary from './SubmissionSummary';
import { StatusType } from './StatusBadge';
import { cn } from '@/lib/utils';

export interface ResultCardProps extends ResultToolbarProps {
  status?: StatusType;
  testCases?: TestCase[];
  input?: string;
  expectedOutput?: string;
  actualOutput?: string;
  compilerMessage?: string;
  executionTime?: number;
  memory?: number;
  onClose?: () => void;
  isOpen?: boolean;
}

export default function ResultCard({
  status,
  testCases = [],
  input = '',
  expectedOutput = '',
  actualOutput = '',
  compilerMessage,
  executionTime,
  memory,
  onClose,
  isOpen = true,
  selectedLanguage = 'JavaScript',
  ...toolbarProps
}: ResultCardProps) {
  const [selectedTestCaseId, setSelectedTestCaseId] = useState<string | undefined>(
    testCases.length > 0 ? testCases[0].id : undefined
  );
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!isOpen) return null;

  const passedCount = testCases.filter(tc => tc.passed).length;
  const totalCount = testCases.length;

  return (
    <AnimatePresence>
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3, type: "spring", bounce: 0.2 }}
        className={cn(
          "flex flex-col bg-background border border-border shadow-2xl overflow-hidden font-sans",
          isFullscreen 
            ? "fixed inset-4 z-50 rounded-xl" 
            : "w-full rounded-xl mt-4"
        )}
      >
        {/* Top actions overlay (Close / Fullscreen) */}
        <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded-md transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <ResultToolbar 
          selectedLanguage={selectedLanguage}
          {...toolbarProps} 
        />

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-[400px]">
          {/* Left Panel: Test Cases */}
          {testCases.length > 0 && (
            <TestCaseSidebar
              testCases={testCases}
              selectedId={selectedTestCaseId}
              onSelect={setSelectedTestCaseId}
            />
          )}

          {/* Right Panel: Output and Header */}
          <div className="flex-1 flex flex-col bg-background relative overflow-hidden">
            <div className="flex-1 overflow-y-auto">
              {status && (
                <div className="px-4 md:px-6 pt-4">
                  <ResultHeader 
                    status={status} 
                    passedCount={passedCount} 
                    totalCount={totalCount} 
                  />
                </div>
              )}
              
              <OutputPanel
                input={input}
                expectedOutput={expectedOutput}
                actualOutput={actualOutput}
                compilerMessage={compilerMessage}
                executionTime={executionTime}
                memory={memory}
              />
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        {status && ['success', 'wrong_answer', 'time_limit'].includes(status) && (
          <SubmissionSummary
            passedCount={passedCount}
            totalCount={totalCount}
            runtimePercentile={status === 'success' ? 82 : undefined}
            memoryPercentile={status === 'success' ? 91 : undefined}
            language={selectedLanguage}
          />
        )}

      </motion.div>
    </AnimatePresence>
  );
}
