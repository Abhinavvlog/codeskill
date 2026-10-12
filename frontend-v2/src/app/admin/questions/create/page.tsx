"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { adminProblemsAPI, adminQuestionsAPI } from "@/config/api";
import { useQuestionStore } from "./_store/useQuestionStore";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Settings,
  FileText,
  Code2,
  Database,
  BarChart3,
  Rocket,
  LayoutTemplate,
  Shield,
  Search,
  Cpu,
  AlertTriangle,
  ArrowRightLeft,
  Lightbulb,
  BookOpen,
  Sparkles,
  CheckCircle2,
  ListChecks,
} from "lucide-react";
import { motion } from "framer-motion";
import { ToastProvider, useToast } from "./_components/Toast";
import { formatConstraints } from "@/lib/utils";
import ProgressBar from "./_components/ProgressBar";

import BasicInfo from "./_components/BasicInfo";
import ProgrammingLanguages from "./_components/ProgrammingLanguages";
import ExecutionSettings from "./_components/ExecutionSettings";
import ProblemStatement from "./_components/ProblemStatement";
import Constraints from "./_components/Constraints";
import InputOutputFormat from "./_components/InputOutputFormat";
import SampleTestCases from "./_components/SampleTestCases";
import StarterCode from "./_components/StarterCode";
import ReferenceSolution from "./_components/ReferenceSolution";
import TestCases from "./_components/TestCases";
import CustomChecker from "./_components/CustomChecker";
import SolutionExplanation from "./_components/SolutionExplanation";
import AIAssistance from "./_components/AIAssistance";
import SEOSection from "./_components/SEOSection";
import AnalyticsSection from "./_components/AnalyticsSection";
import PublishingSection from "./_components/PublishingSection";
import MCQEditor from "./_components/MCQEditor";
import CodeOutputEditor from "./_components/CodeOutputEditor";
import { Spinner } from "@/components/ui/spinner";

// Main Create Question Page
export default function CreateQuestionContent() {
  return (
    <ToastProvider>
      <UnifiedQuestionForm />
    </ToastProvider>
  );
}

function UnifiedQuestionForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const store = useQuestionStore();
  const { lastSaved, markSaved, getProgress, activeSection, setActiveSection } = store;
  const questionType = store.metadata.questionType;

  // Dynamically compute nav items based on questionType
  const navItems = useMemo(() => {
    const baseItems = [{ id: "basic-info", label: "Basic Info", icon: Settings }];
    
    if (["MCQ", "MULTIPLE_CHOICE", "TRUE_FALSE"].includes(questionType)) {
      baseItems.push({ id: "mcq-options", label: "Options", icon: ListChecks });
      baseItems.push({ id: "solution-explanation", label: "Explanation", icon: BookOpen });
    } else if (questionType === "CODE_OUTPUT") {
      baseItems.push({ id: "code-output", label: "Code Snippet", icon: Code2 });
      baseItems.push({ id: "solution-explanation", label: "Explanation", icon: BookOpen });
    } else { // DSA
      baseItems.push(
        { id: "languages", label: "Languages", icon: Code2 },
        { id: "execution-settings", label: "Execution", icon: Cpu },
        { id: "statement", label: "Statement", icon: FileText },
        { id: "constraints", label: "Constraints", icon: AlertTriangle },
        { id: "io-format", label: "I/O Format", icon: ArrowRightLeft },
        { id: "sample-test-cases", label: "Sample Cases", icon: Lightbulb },
        { id: "starter-code", label: "Starter Code", icon: LayoutTemplate },
        { id: "reference-solution", label: "Reference", icon: Shield },
        { id: "test-cases", label: "Test Cases", icon: Database },
        { id: "solution-explanation", label: "Editorial", icon: BookOpen },
      );
    }
    
    baseItems.push(
      { id: "publishing", label: "Publishing", icon: Rocket }
    );
    
    return baseItems;
  }, [questionType]);

  useEffect(() => {
    const interval = setInterval(() => markSaved(), 60000);
    return () => clearInterval(interval);
  }, [markSaved]);

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    const root = form.closest("main");
    // Reset a selection that disappeared after changing the question type.
    if (!navItems.some(({ id }) => id === useQuestionStore.getState().activeSection)) {
      setActiveSection("basic-info");
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { root, rootMargin: "-100px 0px -50% 0px", threshold: 0 }
    );
    navItems.forEach(({ id }) => {
      const el = form.querySelector<HTMLElement>(`[id="${id}"]`);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [setActiveSection, navItems]);

  const scrollToSection = (id: string) => {
    const el = formRef.current?.querySelector<HTMLElement>(`[id="${id}"]`);
    if (el) {
      setActiveSection(id);
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleValidate = () => {
    if (!store.metadata.title.trim() || !store.metadata.slug.trim()) {
      addToast("error", "Validation Failed", "Question Title and URL Slug are required.");
      scrollToSection("basic-info");
      return false;
    }

    if (questionType === "DSA" && store.languages.supported.length === 0) {
      addToast("error", "Validation Failed", "Please select at least one programming language.");
      scrollToSection("languages");
      return false;
    }
    
    if (["MCQ", "MULTIPLE_CHOICE"].includes(questionType)) {
      if (!store.mcqOptions.some(o => o.isCorrect)) {
        addToast("error", "Validation Failed", "Select at least one correct option.");
        scrollToSection("mcq-options");
        return false;
      }
    }

    if (questionType === "TRUE_FALSE") {
      const isTrue = !!store.mcqOptions[0]?.isCorrect;
      const isFalse = !!store.mcqOptions[1]?.isCorrect;
      if (!isTrue && !isFalse) {
        addToast("error", "Validation Failed", "Please select either True or False as the correct answer.");
        scrollToSection("mcq-options");
        return false;
      }
    }
    
    if (questionType === "CODE_OUTPUT" && !store.codeOutput.expectedOutput.trim()) {
       addToast("error", "Validation Failed", "Expected Output is required.");
       scrollToSection("code-output");
       return false;
    }

    return true;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!handleValidate()) return;
    setLoading(true);
    try {
      const visibility = store.metadata.visibility;
      const status = visibility === "Published" ? "active" : "draft";

      let payload: any = {
        question: store.metadata.title, // Map title to question for legacy compatibility
        topic: store.metadata.categories[0] || "General",
        categories: store.metadata.categories,
        difficulty: store.metadata.difficulty.toLowerCase(),
        marks: store.metadata.points,
        negativeMarks: 0,
        status,
        tags: store.metadata.tags,
        explanation: store.solutionExplanation.content,
        questionType: questionType,
      };

      if (questionType === "TRUE_FALSE") {
        const isFalse = !!store.mcqOptions[1]?.isCorrect;
        payload.options = [
          { text: "True", isCorrect: !isFalse, explanation: store.mcqOptions[0]?.explanation || "" },
          { text: "False", isCorrect: isFalse, explanation: store.mcqOptions[1]?.explanation || "" },
        ];
        payload.correctAnswer = isFalse ? 1 : 0;
        payload.correctAnswers = [isFalse ? 1 : 0];
      } else if (["MCQ", "MULTIPLE_CHOICE"].includes(questionType)) {
        payload.options = store.mcqOptions.map(opt => ({
          text: opt.text,
          isCorrect: opt.isCorrect,
          explanation: opt.explanation,
        }));
        const correctIdx = store.mcqOptions.findIndex(o => o.isCorrect);
        payload.correctAnswer = correctIdx >= 0 ? correctIdx : 0;
        payload.correctAnswers = store.mcqOptions.map((o, idx) => o.isCorrect ? idx : -1).filter(idx => idx >= 0);
      } else if (questionType === "CODE_OUTPUT") {
        payload.language = store.codeOutput.language;
        payload.codeSnippet = store.codeOutput.code;
        payload.expectedOutput = store.codeOutput.expectedOutput;
      } else if (questionType === "DSA" || !["MCQ", "MULTIPLE_CHOICE", "TRUE_FALSE", "CODE_OUTPUT"].includes(questionType)) {
        payload.problemStatement = store.statement.description;
        payload.constraints = formatConstraints(store.statement.constraints);
        payload.inputFormat = store.statement.inputFormat;
        payload.outputFormat = store.statement.outputFormat;
        payload.examples = store.sampleExamples;
        payload.starterCode = store.starterCode;
        payload.referenceSolutions = store.referenceSolution;
        payload.testCases = store.testCases;
        payload.timeLimit = store.execution.timeLimit;
        payload.memoryLimit = store.execution.memoryLimit;
        payload.supportedLanguages = store.languages.supported;
      }

      await adminQuestionsAPI.create(payload);
      addToast("success", "Question Created", "Successfully added to the question bank.");
      setTimeout(() => router.push("/admin/questions"), 1000);
    } catch (err: any) {
      addToast("error", "Failed", err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const progress = getProgress();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/admin/questions"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Question Bank
            </Link>
            <span className="text-border text-sm">/</span>
            <h1 className="text-sm font-semibold text-foreground truncate">Create Unified Question</h1>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden md:block w-32">
              <ProgressBar value={progress} />
            </div>
            {lastSaved && (
              <span className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Saved{" "}
                {new Date(lastSaved).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Page Body */}
      <div className="max-w-[1600px] mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Sidebar nav */}
          <aside className="hidden lg:block w-56 flex-shrink-0 sticky top-24">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 px-2">
              Sections
            </p>
            <nav className="space-y-0.5">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => scrollToSection(item.id)}
                  aria-current={activeSection === item.id ? "location" : undefined}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-lg transition-all text-left ${
                    activeSection === item.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <item.icon
                    className={`w-4 h-4 shrink-0 ${
                      activeSection === item.id ? "text-primary" : "text-muted-foreground"
                    }`}
                  />
                  {item.label}
                </button>
              ))}
            </nav>
          </aside>

          {/* Main form */}
          <div className="flex-1 w-full min-w-0 pb-32">
            <form ref={formRef} id="question-form" onSubmit={handleSubmit} className="space-y-8 max-w-4xl [&>div[id]]:scroll-mt-[100px]">
              <BasicInfo />
              
              {["MCQ", "MULTIPLE_CHOICE", "TRUE_FALSE"].includes(questionType) && (
                <>
                  <MCQEditor />
                  <SolutionExplanation />
                </>
              )}

              {questionType === "CODE_OUTPUT" && (
                <>
                  <CodeOutputEditor />
                  <SolutionExplanation />
                </>
              )}

              {questionType === "DSA" && (
                <>
                  <ProgrammingLanguages />
                  <ExecutionSettings />
                  <ProblemStatement />
                  <Constraints />
                  <InputOutputFormat />
                  <SampleTestCases />
                  <StarterCode />
                  <ReferenceSolution />
                  <TestCases />
                  <SolutionExplanation />
                </>
              )}

              <PublishingSection />
            </form>
          </div>
        </div>
      </div>

      {/* Sticky action bar */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.1 }}
        className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border px-6 py-3 shadow-2xl z-50"
      >
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push("/admin/questions")}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => {
                markSaved();
                addToast("info", "Draft Saved", "Progress saved locally.");
              }}
              className="px-4 py-2 text-xs font-semibold text-foreground bg-muted border border-border rounded-lg hover:bg-muted/70 transition-colors whitespace-nowrap"
            >
              Save Draft
            </button>
            
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all disabled:opacity-50 whitespace-nowrap"
            >
              {loading ? <Spinner className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              Publish to Question Bank
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
