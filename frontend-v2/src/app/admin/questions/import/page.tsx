"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  ArrowRight,
  RefreshCw,
  Code,
  BookOpen,
  Layers,
  Sparkles,
  Zap,
  Check,
  X,
  FileCode,
} from "lucide-react";
import { adminQuestionsAPI } from "@/config/api";
import { Spinner } from "@/components/ui/spinner";

interface PreviewData {
  summary: {
    totalRows: number;
    validCount: number;
    invalidCount: number;
    duplicateCount: number;
    toInsertCount?: number;
    toUpdateCount?: number;
  };
  validRows: any[];
  errors: { row: number; question?: string; error: string }[];
}

export default function ImportQuestionsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [instantPush, setInstantPush] = useState(true);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [importResult, setImportResult] = useState<{
    totalProcessed: number;
    insertedCount: number;
    updatedCount: number;
    message?: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFileSelect(droppedFile);
  };

  const handleFileSelect = (selectedFile: File) => {
    const ext = selectedFile.name.split(".").pop()?.toLowerCase();
    if (!["csv", "xlsx", "xls"].includes(ext || "")) {
      setErrorMessage("Please upload a valid CSV or Excel spreadsheet (.csv, .xlsx, .xls).");
      return;
    }
    setFile(selectedFile);
    setErrorMessage(null);
    setPreviewData(null);
    setImportResult(null);

    if (instantPush) {
      handleOneAttemptAutoImport(selectedFile);
    } else {
      processPreview(selectedFile);
    }
  };

  const handleOneAttemptAutoImport = async (selectedFile: File) => {
    setIsValidating(true);
    setIsCommitting(true);
    setErrorMessage(null);
    try {
      const res = await adminQuestionsAPI.autoImport(selectedFile);
      const data = res.data;
      setImportResult({
        totalProcessed: data.count || data.validCount || 0,
        insertedCount: data.summary?.insertedCount ?? data.insertedCount ?? 0,
        updatedCount: data.summary?.updatedCount ?? data.updatedCount ?? 0,
        message: data.message,
      });
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message ||
          "Failed to automatically upload and push questions in one attempt. Please check CSV format."
      );
    } finally {
      setIsValidating(false);
      setIsCommitting(false);
    }
  };

  const processPreview = async (selectedFile: File) => {
    setIsValidating(true);
    setErrorMessage(null);
    try {
      const res = await adminQuestionsAPI.importPreview(selectedFile);
      setPreviewData(res.data);
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message ||
          "Failed to parse and validate question spreadsheet. Please check columns format."
      );
    } finally {
      setIsValidating(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!previewData || previewData.validRows.length === 0) return;

    setIsCommitting(true);
    setErrorMessage(null);
    try {
      const res = await adminQuestionsAPI.confirmImport(previewData.validRows);
      const data = res.data;
      setImportResult({
        totalProcessed: data.count || previewData.validRows.length,
        insertedCount: data.insertedCount || previewData.summary.toInsertCount || 0,
        updatedCount: data.updatedCount || previewData.summary.toUpdateCount || 0,
        message: data.message,
      });
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message ||
          "Failed to commit questions into database."
      );
    } finally {
      setIsCommitting(false);
    }
  };

  const handleDownloadSampleTemplate = (type: "mcq" | "coding" = "mcq") => {
    let content: string;
    let filename: string;
    if (type === "coding") {
      content = [
        "title,question,question_type,topic,subtopic,difficulty,marks,negative_marks,constraints,time_limit,memory_limit,starter_code,test_input_1,test_output_1,test_input_2,test_output_2,explanation,language,tags",
        '"Reverse Array","Given an integer array nums, reverse the array in-place.",coding,Algorithms,Arrays,easy,5,0,"1 <= N <= 10^5",2000,256,"def reverse_array(nums):\n    pass","5\n1 2 3 4 5","5 4 3 2 1","3\n10 20 30","30 20 10","Use two pointers to swap elements from both ends.",python,"arrays,two-pointers,dsa"',
        '"Two Sum","Given an array of integers nums and an integer target, return indices of the two numbers that add up to target.",coding,Data Structures,Hash Table,easy,5,0,"2 <= nums.length <= 10^4",2000,256,"def two_sum(nums, target):\n    pass","4\n2 7 11 15\n9","0 1","3\n3 2 4\n6","1 2","Use a hash map for O(n) lookup.",python,"hash-table,arrays,leetcode"',
        '"Valid Parentheses","Given a string containing just (, ), {, }, [, ], determine if the input string is valid.",coding,Data Structures,Stack,easy,5,0,"1 <= s.length <= 10^4",2000,256,"def is_valid(s):\n    pass","()[]{}","true","(]","false","Use a stack to match brackets.",python,"stack,strings"',
      ].join("\n");
      filename = "chandigarh_university_coding_questions_template.csv";
    } else {
      content = [
        "question,question_type,topic,subtopic,difficulty,marks,negative_marks,option_a,option_b,option_c,option_d,correct_answer,explanation,code_snippet,language,tags",
        '"What is the worst-case time complexity of searching for an element in a balanced Binary Search Tree (AVL Tree)?",single_choice,Data Structures,Trees,easy,1,0.25,"O(1)","O(log n)","O(n)","O(n log n)",B,"In a balanced Binary Search Tree like an AVL tree, the height is strictly bounded by O(log n), ensuring worst-case search time of O(log n).",,general,"trees,bst,time-complexity"',
        '"Which of the following sorting algorithms is NOT an in-place sorting algorithm?",single_choice,Algorithms,Sorting,medium,1,0.25,"Quick Sort","Heap Sort","Merge Sort","Insertion Sort",C,"Standard Merge Sort requires O(n) auxiliary space to merge sub-arrays, making it not an in-place sorting algorithm.",,general,"algorithms,sorting,space-complexity"',
        '"Which condition(s) must hold simultaneously for a deadlock to occur in an operating system?",multiple_choice,Operating Systems,Deadlocks,medium,2,0.5,"Mutual Exclusion","Hold and Wait","No Preemption","Circular Wait","A,B,C,D","All four Coffman conditions must hold simultaneously for a deadlock to occur.",,general,"os,deadlock,coffman"',
        '"What capability is an AI tool demonstrating when it turns a short product description into a complete product announcement?",single_choice,AI Foundations & Generative AI,Generative AI,easy,1,0.25,"Database indexing","Generating new content from learned patterns","Sorting existing records","Network monitoring",B,"The AI generates new text based on instructions and learned patterns.",,general,"ai,generative-ai,llm"',
      ].join("\n");
      filename = "chandigarh_university_mcq_scenario_questions_template.csv";
    }
    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(content);
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadErrorReport = () => {
    if (!previewData || previewData.errors.length === 0) return;

    const headers = ["Row", "Question", "Error Details"];
    const rows = previewData.errors.map((err) => [
      err.row,
      `"${(err.question || "").replace(/"/g, '""')}"`,
      `"${err.error.replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `question-import-errors-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6 font-sans">
      {/* Product of Chandigarh University Branding Banner */}
      <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-card border border-red-500/20 shadow-sm flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg overflow-hidden bg-white shrink-0 shadow-sm border border-border p-0.5 flex items-center justify-center">
            <img
              src="/cu-seal.png"
              alt="Chandigarh University"
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/product-of-logo.jpg";
              }}
            />
          </div>
          <div>
            <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <span>This is a product of</span>
              <span className="text-red-500 font-extrabold">Chandigarh University</span>
            </p>
            <p className="text-[10px] text-muted-foreground">
              Institutional Technical Assessment & Algorithmic Question Bank
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <Zap className="w-3 h-3 text-emerald-400" />
            Bulk Upsert Enabled (Update or Insert in 1 Attempt)
          </span>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight text-foreground">
              Bulk Import & Upsert Questions
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
              CSV / XLSX Sheets
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Automatically convert and push algorithmic DSA and MCQ scenario questions in a single attempt. Existing questions will be updated; new questions will be inserted.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleDownloadSampleTemplate("coding")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 text-xs font-bold transition-colors shadow-sm"
          >
            <FileCode className="w-3.5 h-3.5" />
            Coding Questions (.CSV)
          </button>
          <button
            type="button"
            onClick={() => handleDownloadSampleTemplate("mcq")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 text-xs font-bold transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            MCQ Template (.CSV)
          </button>
          <Link
            href="/admin/questions"
            className="px-3.5 py-1.5 rounded-xl border border-border hover:bg-muted text-xs font-semibold transition-colors"
          >
            ← Question Bank
          </Link>
        </div>
      </div>

      {/* Mode Toggle Banner */}
      <div className="p-4 rounded-2xl bg-card border border-border flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${instantPush ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">
              Instant 1-Attempt Upload & Sync
            </p>
            <p className="text-xs text-muted-foreground">
              {instantPush
                ? "Automatic Mode: Selecting a CSV will immediately parse, convert, and push all questions into database in 1 attempt."
                : "Preview Mode: Shows detailed row preview before confirming."}
            </p>
          </div>
        </div>
        <label className="flex items-center gap-2.5 cursor-pointer select-none text-xs font-semibold text-foreground">
          <input
            type="checkbox"
            checked={instantPush}
            onChange={(e) => setInstantPush(e.target.checked)}
            className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary"
          />
          Auto-push in 1 attempt (Recommended)
        </label>
      </div>

      {/* Success View */}
      {importResult && (
        <div className="p-8 rounded-2xl bg-card border border-emerald-500/30 text-center space-y-4 shadow-sm animate-in fade-in">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">
              Questions Processed Successfully!
            </h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
              {importResult.message || `Processed ${importResult.totalProcessed} questions in one attempt.`}
            </p>
          </div>

          <div className="flex items-center justify-center gap-6 py-2">
            <div className="text-center px-4 py-2 rounded-xl bg-muted/40 border border-border">
              <p className="text-xs text-muted-foreground font-medium">Total Processed</p>
              <p className="text-xl font-black text-foreground font-mono">{importResult.totalProcessed}</p>
            </div>
            <div className="text-center px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-xs text-emerald-400 font-medium">Newly Inserted</p>
              <p className="text-xl font-black text-emerald-400 font-mono">+{importResult.insertedCount}</p>
            </div>
            <div className="text-center px-4 py-2 rounded-xl bg-primary/10 border border-primary/20">
              <p className="text-xs text-primary font-medium">Updated Existing</p>
              <p className="text-xl font-black text-primary font-mono">{importResult.updatedCount}</p>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => {
                setFile(null);
                setPreviewData(null);
                setImportResult(null);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border hover:bg-muted text-sm font-semibold transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Upload Another CSV
            </button>
            <Link
              href="/admin/questions"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-md hover:bg-primary/90 transition-colors"
            >
              View Question Bank
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Upload Drop Zone */}
      {!importResult && (
        <div className="space-y-6">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-10 text-center transition-all cursor-pointer bg-card/60 backdrop-blur-sm ${
              isDragging
                ? "border-primary bg-primary/5 scale-[0.99]"
                : "border-border/80 hover:border-primary/50 hover:bg-muted/20"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileSelect(f);
              }}
              className="hidden"
            />

            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto mb-4">
              <UploadCloud className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-bold text-foreground">
              {file ? file.name : "Drop your Questions CSV or Excel File Here"}
            </h3>
            <p className="text-xs text-muted-foreground mt-1.5 max-w-sm mx-auto">
              Supports scenario-based MCQs, AI literacy questions, and algorithmic DSA questions with test cases.
            </p>

            <div className="mt-4 flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground">
              <span className="px-2.5 py-1 rounded-lg bg-muted border border-border">.CSV</span>
              <span className="px-2.5 py-1 rounded-lg bg-muted border border-border">.XLSX</span>
              <span className="px-2.5 py-1 rounded-lg bg-muted border border-border">.XLS</span>
              <span className="text-muted-foreground/60">• Up to 15MB</span>
            </div>

            {(isValidating || isCommitting) && (
              <div className="mt-6 flex flex-col items-center justify-center gap-2">
                <Spinner className="w-7 h-7 text-primary animate-spin" />
                <p className="text-xs font-bold text-primary animate-pulse">
                  {isCommitting
                    ? "Converting & Upserting questions into bank in 1 attempt..."
                    : "Parsing spreadsheet schema..."}
                </p>
              </div>
            )}
          </div>

          {errorMessage && (
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-3 text-sm">
              <XCircle className="w-5 h-5 shrink-0" />
              <p className="flex-1">{errorMessage}</p>
            </div>
          )}

          {/* Preview Results (when not auto-pushed) */}
          {previewData && !importResult && (
            <div className="space-y-6">
              {/* Summary Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-card border border-border">
                  <p className="text-xs text-muted-foreground font-medium">Total Rows</p>
                  <p className="text-2xl font-black text-foreground font-mono mt-1">
                    {previewData.summary.totalRows}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-card border border-emerald-500/20 bg-emerald-500/5">
                  <p className="text-xs text-emerald-400 font-medium">Ready to Insert (New)</p>
                  <p className="text-2xl font-black text-emerald-400 font-mono mt-1">
                    {previewData.summary.toInsertCount ?? previewData.summary.validCount}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-card border border-primary/20 bg-primary/5">
                  <p className="text-xs text-primary font-medium">Ready to Update (Existing)</p>
                  <p className="text-2xl font-black text-primary font-mono mt-1">
                    {previewData.summary.toUpdateCount ?? 0}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-card border border-destructive/20 bg-destructive/5">
                  <p className="text-xs text-destructive font-medium">Invalid Rows</p>
                  <p className="text-2xl font-black text-destructive font-mono mt-1">
                    {previewData.summary.invalidCount}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-4 flex-wrap bg-card border border-border p-4 rounded-2xl">
                <div>
                  <p className="text-sm font-bold text-foreground">
                    {previewData.validRows.length} questions validated & ready to push
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Will update matching questions and insert brand new ones.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {previewData.errors.length > 0 && (
                    <button
                      type="button"
                      onClick={handleDownloadErrorReport}
                      className="px-3.5 py-2 rounded-xl border border-destructive/30 text-destructive text-xs font-semibold hover:bg-destructive/10"
                    >
                      Download Error Report ({previewData.errors.length})
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={isCommitting || previewData.validRows.length === 0}
                    onClick={handleConfirmImport}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-md hover:bg-primary/90 transition-all disabled:opacity-50"
                  >
                    {isCommitting ? (
                      <>
                        <Spinner className="w-4 h-4 animate-spin" />
                        Pushing to Bank…
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Confirm & Push All ({previewData.validRows.length})
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Valid Questions Preview Table */}
              <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                <div className="px-5 py-3 border-b border-border bg-muted/40 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Questions Preview (Showing first 20 rows)
                  </h3>
                  <span className="text-xs text-muted-foreground font-medium">
                    Total: {previewData.validRows.length} valid
                  </span>
                </div>
                <div className="divide-y divide-border max-h-96 overflow-y-auto">
                  {previewData.validRows.slice(0, 20).map((row, idx) => (
                    <div key={idx} className="p-4 hover:bg-muted/20 transition-colors flex items-start gap-3">
                      <span className="text-xs font-mono font-bold text-muted-foreground mt-0.5">
                        #{row.rowNumber}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-foreground">{row.question}</p>
                          {row.isUpdate ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                              UPDATE
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              NEW
                            </span>
                          )}
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-muted text-muted-foreground uppercase">
                            {row.questionType}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1.5 flex-wrap">
                          <span className="font-medium text-foreground">{row.topic}</span>
                          {row.subtopic && <span>· {row.subtopic}</span>}
                          <span>· Level: <span className="capitalize font-semibold text-primary">{row.difficulty}</span></span>
                          <span>· {row.marks} mark{row.marks > 1 ? "s" : ""}</span>
                          {row.testCases?.length > 0 && (
                            <span className="text-primary font-medium">
                              · {row.testCases.length} Test Cases
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
