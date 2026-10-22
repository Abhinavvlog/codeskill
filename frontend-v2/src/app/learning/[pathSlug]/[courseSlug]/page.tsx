"use client";

import { useState, useEffect, use, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  BookOpen,
  Check,
  ChevronRight,
  Code2,
  Sparkles,
  HelpCircle,
  Play,
  RotateCcw,
  Zap,
  Lightbulb,
  Award,
  AlertCircle,
  FileText,
  Copy,
  ChevronLeft,
  X,
} from "lucide-react";
import Editor from "@monaco-editor/react";
import { learningAPI } from "@/config/api";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/context/ThemeContext";

interface LessonData {
  id: string;
  title: string;
  slug: string;
  content: string;
  learningObjectives: string[];
  order: number;
  type: "reading" | "quiz" | "coding" | "debugging";
  isCompleted: boolean;
  completedAt?: string;
  nextLessonId?: string | null;
  exercises: Array<{
    id: string;
    title: string;
    type: "coding" | "quiz" | "debugging";
    starterCode?: Record<string, string>;
    hints: string[];
    marks: number;
    quizConfig?: {
      questions: Array<{
        id: string;
        question: string;
        options: string[];
      }>;
    };
  }>;
}

interface CourseSidebarData {
  id: string;
  title: string;
  slug: string;
  modules: Array<{
    id: string;
    title: string;
    lessons: Array<{
      id: string;
      title: string;
      slug: string;
      type: string;
      isCompleted: boolean;
    }>;
  }>;
}

// Professional Markdown Content Renderer with high-contrast Light & Dark typography
function RichContentRenderer({ content }: { content: string }) {
  const renderedSections = useMemo(() => {
    if (!content) return [];
    const lines = content.split("\n");
    const sections: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeLanguage = "";
    let codeLines: string[] = [];
    let tableLines: string[] = [];

    const flushTable = (key: string) => {
      if (tableLines.length === 0) return;
      const rows = tableLines.map((l) =>
        l
          .split("|")
          .map((c) => c.trim())
          .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
      );
      if (rows.length >= 2) {
        const headers = rows[0];
        const dataRows = rows.slice(2);
        sections.push(
          <div
            key={key}
            className="my-5 overflow-x-auto border border-border rounded-xl bg-card shadow-xs"
          >
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead className="bg-muted/70 border-b border-border">
                <tr>
                  {headers.map((h, hIdx) => (
                    <th
                      key={hIdx}
                      className="px-4 py-3 font-bold text-foreground"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {dataRows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-muted/40 transition-colors">
                    {row.map((cell, cIdx) => (
                      <td
                        key={cIdx}
                        className="px-4 py-3 text-foreground font-mono text-xs"
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      tableLines = [];
    };

    lines.forEach((line, idx) => {
      // Code block start / end
      if (line.trim().startsWith("```")) {
        if (inCodeBlock) {
          const codeSnippet = codeLines.join("\n");
          sections.push(
            <div
              key={`code-${idx}`}
              className="my-5 rounded-xl border border-border bg-muted/60 p-4 font-mono text-xs overflow-x-auto text-foreground shadow-xs relative group"
            >
              {codeLanguage && (
                <span className="absolute top-2.5 right-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider bg-background/80 px-2 py-0.5 rounded border border-border">
                  {codeLanguage}
                </span>
              )}
              <pre className="text-foreground">
                <code>{codeSnippet}</code>
              </pre>
            </div>
          );
          codeLines = [];
          codeLanguage = "";
          inCodeBlock = false;
        } else {
          flushTable(`table-before-code-${idx}`);
          inCodeBlock = true;
          codeLanguage = line.trim().replace(/^```/, "").trim();
        }
        return;
      }

      if (inCodeBlock) {
        codeLines.push(line);
        return;
      }

      // Table line
      if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
        tableLines.push(line.trim());
        return;
      } else {
        flushTable(`table-${idx}`);
      }

      // Headers
      if (line.startsWith("### ")) {
        sections.push(
          <h3
            key={`h3-${idx}`}
            className="text-lg sm:text-xl font-bold tracking-tight text-foreground mt-7 mb-3"
          >
            {line.replace(/^### /, "")}
          </h3>
        );
      } else if (line.startsWith("#### ")) {
        sections.push(
          <h4
            key={`h4-${idx}`}
            className="text-base font-semibold text-foreground mt-5 mb-2"
          >
            {line.replace(/^#### /, "")}
          </h4>
        );
      } else if (line.startsWith("> ")) {
        // Blockquote callout
        sections.push(
          <div
            key={`quote-${idx}`}
            className="my-4 border-l-4 border-primary bg-primary/5 p-4 rounded-r-xl text-xs sm:text-sm text-foreground flex items-start gap-3 shadow-xs"
          >
            <Lightbulb className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <div className="leading-relaxed font-medium">
              {line.replace(/^> /, "").replace(/\*\*(.*?)\*\*/g, "$1")}
            </div>
          </div>
        );
      } else if (line.trim().startsWith("- ")) {
        // Bullet list item
        sections.push(
          <div
            key={`li-${idx}`}
            className="flex items-start gap-2.5 my-1.5 text-xs sm:text-sm text-foreground"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
            <span className="leading-relaxed">
              {line.trim().replace(/^- /, "")}
            </span>
          </div>
        );
      } else if (line.trim().length > 0) {
        sections.push(
          <p
            key={`p-${idx}`}
            className="my-2.5 text-xs sm:text-sm text-foreground leading-relaxed font-normal"
          >
            {line}
          </p>
        );
      }
    });

    flushTable("table-end");
    return sections;
  }, [content]);

  return <div className="space-y-1">{renderedSections}</div>;
}

export default function CourseWorkspacePage({
  params,
}: {
  params: Promise<{ pathSlug: string; courseSlug: string }>;
}) {
  const { pathSlug, courseSlug } = use(params);
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [course, setCourse] = useState<CourseSidebarData | null>(null);
  const [pathTitle, setPathTitle] = useState<string>("");
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lessonLoading, setLessonLoading] = useState(false);
  const [completing, setCompleting] = useState(false);

  // Modal Dialog popup state (Replaces ancient window.alert())
  const [popupModal, setPopupModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type?: "warning" | "success" | "info";
  } | null>(null);

  // Exercise & Quiz states
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [quizResults, setQuizResults] = useState<any>(null);
  const [code, setCode] = useState<string>("");
  const [language, setLanguage] = useState<string>("javascript");
  const [executionFeedback, setExecutionFeedback] = useState<any>(null);
  const [submittingExercise, setSubmittingExercise] = useState(false);
  const [xpCelebration, setXpCelebration] = useState<number | null>(null);

  useEffect(() => {
    loadCourse();
  }, [pathSlug, courseSlug]);

  useEffect(() => {
    if (activeLessonId) {
      loadLesson(activeLessonId);
    }
  }, [activeLessonId]);

  const loadCourse = async () => {
    try {
      setLoading(true);
      const pathRes = await learningAPI.getPathBySlug(pathSlug);
      const pathData = pathRes.data?.data || pathRes.data;
      setPathTitle(pathData?.title || "Learning Path");

      const foundCourse = (pathData?.courses || []).find(
        (c: any) => c.slug === courseSlug,
      );
      if (!foundCourse) return;

      const courseRes = await learningAPI.getCourse(foundCourse.id);
      const courseData = courseRes.data?.data || courseRes.data;
      setCourse(courseData);

      const firstLesson = courseData?.modules?.[0]?.lessons?.[0];
      if (firstLesson) {
        setActiveLessonId(firstLesson.id);
      }
    } catch (err) {
      console.error("Failed to load course workspace", err);
    } finally {
      setLoading(false);
    }
  };

  const loadLesson = async (id: string) => {
    try {
      setLessonLoading(true);
      setQuizResults(null);
      setExecutionFeedback(null);
      setXpCelebration(null);
      const res = await learningAPI.getLesson(id);
      const lessonData = res.data?.data || res.data;
      setLesson(lessonData);

      const codingEx = lessonData?.exercises?.find(
        (e: any) => e.type === "coding" || e.type === "debugging",
      );
      if (codingEx?.starterCode?.[language]) {
        setCode(codingEx.starterCode[language]);
      } else if (codingEx?.starterCode?.javascript) {
        setCode(codingEx.starterCode.javascript);
      } else {
        setCode("// Write your solution below\n");
      }
    } catch (err) {
      console.error("Failed to load lesson content", err);
    } finally {
      setLessonLoading(false);
    }
  };

  const handleQuizSubmit = async (exerciseId: string) => {
    try {
      setSubmittingExercise(true);
      const res = await learningAPI.submitExercise(exerciseId, {
        answers: selectedAnswers,
      });
      const submissionData = res.data?.data || res.data;
      setQuizResults(submissionData?.feedback || submissionData);
      if (submissionData?.xpAwarded > 0) {
        setXpCelebration(submissionData.xpAwarded);
      }
      if (submissionData?.passed) {
        loadLesson(activeLessonId!);
        loadCourse();
      }
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message ||
        "Quiz evaluation failed. Please make sure you selected an option.";
      setPopupModal({
        isOpen: true,
        title: "Submission Notice",
        message: Array.isArray(errorMsg) ? errorMsg.join(", ") : errorMsg,
        type: "warning",
      });
    } finally {
      setSubmittingExercise(false);
    }
  };

  const handleCodeSubmit = async (exerciseId: string) => {
    try {
      setSubmittingExercise(true);
      const res = await learningAPI.submitExercise(exerciseId, {
        code,
        language,
      });
      const submissionData = res.data?.data || res.data;
      setExecutionFeedback(submissionData?.feedback || submissionData);
      if (submissionData?.xpAwarded > 0) {
        setXpCelebration(submissionData.xpAwarded);
      }
      if (submissionData?.passed) {
        loadLesson(activeLessonId!);
        loadCourse();
      }
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message ||
        "Code execution failed. Please check your syntax and run again.";
      setPopupModal({
        isOpen: true,
        title: "Execution Error",
        message: Array.isArray(errorMsg) ? errorMsg.join(", ") : errorMsg,
        type: "warning",
      });
    } finally {
      setSubmittingExercise(false);
    }
  };

  const handleCompleteAndNext = async () => {
    if (!lesson) return;
    try {
      setCompleting(true);
      await learningAPI.completeLesson(lesson.id);
      if (lesson.nextLessonId) {
        setActiveLessonId(lesson.nextLessonId);
      } else {
        router.push(`/learning/${pathSlug}`);
      }
    } catch (err: any) {
      // Instead of jarring browser alert(), open a polished modal dialog window!
      const errorMsg =
        err.response?.data?.message ||
        "Please complete and pass all required practice exercises in this lesson before proceeding.";
      setPopupModal({
        isOpen: true,
        title: "Practice Exercise Required",
        message: errorMsg,
        type: "warning",
      });
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center pt-24 font-sans text-foreground">
        <Spinner className="w-8 h-8 text-primary animate-spin mb-3" />
        <p className="text-sm text-muted-foreground">Loading course workspace...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center pt-24 p-6 font-sans">
        <h2 className="text-xl font-bold">Course not found</h2>
        <Link
          href={`/learning/${pathSlug}`}
          className="mt-4 text-primary hover:underline inline-flex items-center gap-1.5 text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Path Overview</span>
        </Link>
      </div>
    );
  }

  const allLessons = course.modules.flatMap((m) => m.lessons);
  const currentLessonIndex = allLessons.findIndex((l) => l.id === activeLessonId);

  return (
    <div className="min-h-screen bg-background text-foreground pt-24 pb-16 px-4 sm:px-6 lg:px-8 flex flex-col font-sans">
      
      {/* ── Standard Studio Card Layout ───────────────────────────────────────── */}
      <div className="max-w-[1600px] mx-auto w-full flex-1 flex flex-col space-y-6">
        
        {/* Sub-Header Bar (Clear from floating Navbar) */}
        <div className="bg-card border border-border rounded-xl px-5 py-3.5 shadow-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 truncate">
            <Link
              href={`/learning/${pathSlug}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Path Syllabus</span>
            </Link>
            <span className="text-border">|</span>
            <div className="truncate">
              <span className="text-xs text-muted-foreground hidden md:inline">
                {pathTitle} /{" "}
              </span>
              <span className="text-sm font-bold text-foreground truncate">
                {course.title}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Lesson {currentLessonIndex + 1} of {allLessons.length}
            </span>

            <Button
              size="sm"
              onClick={handleCompleteAndNext}
              disabled={completing}
              className="h-8 px-4 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs gap-1.5"
            >
              <span>{completing ? "Saving..." : lesson?.nextLessonId ? "Next Lesson" : "Finish Course"}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Studio Workspace Content */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          {/* Left Navigation Sidebar */}
          <aside className="md:col-span-4 lg:col-span-3 bg-card border border-border rounded-xl p-4 shadow-xs sticky top-28 space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-2">
              Course Modules
            </div>

            <div className="space-y-4">
              {course.modules.map((mod) => (
                <div key={mod.id}>
                  <div className="px-2 py-1 text-xs font-bold text-foreground flex items-center justify-between">
                    <span className="truncate">{mod.title}</span>
                    <span className="text-[10px] text-muted-foreground font-normal">
                      {mod.lessons.length}
                    </span>
                  </div>

                  <div className="mt-1.5 space-y-1">
                    {mod.lessons.map((l, lIdx) => {
                      const isActive = l.id === activeLessonId;
                      return (
                        <button
                          key={l.id}
                          onClick={() => setActiveLessonId(l.id)}
                          className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-medium flex items-center gap-2.5 transition-all cursor-pointer ${
                            isActive
                              ? "bg-primary/10 text-primary border border-primary/20 font-semibold shadow-xs"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent"
                          }`}
                        >
                          {l.isCompleted ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                          ) : (
                            <div
                              className={`w-4 h-4 rounded-full border flex items-center justify-center text-[9px] flex-shrink-0 ${
                                isActive
                                  ? "border-primary bg-primary/20 text-primary font-bold"
                                  : "border-border text-muted-foreground"
                              }`}
                            >
                              {lIdx + 1}
                            </div>
                          )}
                          <span className="truncate flex-1">{l.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </aside>

          {/* Right Main Lesson Canvas */}
          <main className="md:col-span-8 lg:col-span-9 bg-card border border-border rounded-xl p-6 sm:p-10 shadow-xs space-y-8">
            {lessonLoading || !lesson ? (
              <div className="py-24 flex items-center justify-center">
                <Spinner className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : (
              <div className="space-y-8">
                {/* XP Celebration Banner */}
                {xpCelebration && (
                  <div className="p-4 rounded-xl bg-primary/10 border border-primary/30 flex items-center gap-3 animate-bounce shadow-xs">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <span className="text-sm font-bold text-primary">
                      +{xpCelebration} XP Earned for Verified Progress!
                    </span>
                  </div>
                )}

                {/* Lesson Header */}
                <div className="pb-6 border-b border-border">
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20 uppercase tracking-wide">
                      {lesson.type} Lesson
                    </span>
                    {lesson.isCompleted && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Completed</span>
                      </span>
                    )}
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                    {lesson.title}
                  </h1>

                  {lesson.learningObjectives && lesson.learningObjectives.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {lesson.learningObjectives.map((obj, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-md bg-muted text-xs text-foreground font-medium border border-border"
                        >
                          🎯 {obj}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Rich Lesson Body */}
                <div className="py-2">
                  <RichContentRenderer content={lesson.content} />
                </div>

                {/* Practice Exercises / Quizzes */}
                {lesson.exercises && lesson.exercises.length > 0 && (
                  <div className="pt-8 border-t border-border space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                        <Code2 className="w-5 h-5 text-primary" />
                        <span>Hands-on Knowledge Check</span>
                      </h2>
                      <span className="text-xs text-muted-foreground font-medium">
                        Immediate concept verification
                      </span>
                    </div>

                    {lesson.exercises.map((ex) => (
                      <div
                        key={ex.id}
                        className="bg-muted/20 border border-border rounded-xl p-6 shadow-xs space-y-6"
                      >
                        <div className="flex items-center justify-between pb-4 border-b border-border">
                          <h3 className="text-base font-bold text-foreground">{ex.title}</h3>
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                            +{ex.marks} XP
                          </span>
                        </div>

                        {/* Quiz Runner */}
                        {ex.type === "quiz" && ex.quizConfig?.questions && (
                          <div className="space-y-6">
                            {ex.quizConfig.questions.map((q, qIdx) => (
                              <div key={q.id} className="space-y-3">
                                <p className="text-base font-bold text-foreground leading-snug">
                                  {qIdx + 1}. {q.question}
                                </p>
                                
                                <div className="space-y-2.5">
                                  {q.options.map((opt, optIdx) => {
                                    const isSelected = selectedAnswers[q.id] === optIdx;
                                    const qResult = quizResults?.results?.find(
                                      (r: any) => r.questionId === q.id,
                                    );

                                    let containerStyle =
                                      "border-slate-200 dark:border-border bg-white dark:bg-card text-slate-900 dark:text-foreground hover:bg-slate-50 dark:hover:bg-muted/60 hover:border-primary/50 shadow-xs";
                                    let letterBadgeStyle =
                                      "bg-slate-100 dark:bg-muted text-slate-800 dark:text-foreground border border-slate-300 dark:border-border";

                                    if (qResult) {
                                      if (optIdx === qResult.correctAnswer) {
                                        containerStyle =
                                          "border-emerald-500 bg-emerald-500/15 text-emerald-950 dark:text-emerald-100 font-bold ring-2 ring-emerald-500/40 shadow-sm";
                                        letterBadgeStyle = "bg-emerald-600 text-white font-bold";
                                      } else if (isSelected && !qResult.isCorrect) {
                                        containerStyle =
                                          "border-rose-500 bg-rose-500/15 text-rose-950 dark:text-rose-100 font-bold ring-2 ring-rose-500/40 shadow-sm";
                                        letterBadgeStyle =
                                          "bg-rose-600 text-white font-bold";
                                      }
                                    } else if (isSelected) {
                                      containerStyle =
                                        "border-primary bg-primary/10 text-slate-950 dark:text-foreground font-bold ring-2 ring-primary/40 shadow-sm";
                                      letterBadgeStyle =
                                        "bg-primary text-primary-foreground font-bold";
                                    }

                                    return (
                                      <button
                                        key={optIdx}
                                        type="button"
                                        onClick={() =>
                                          setSelectedAnswers({
                                            ...selectedAnswers,
                                            [q.id]: optIdx,
                                          })
                                        }
                                        className={`w-full text-left px-4 py-3.5 rounded-xl text-sm font-semibold border-2 transition-all duration-150 cursor-pointer flex items-center justify-between ${containerStyle}`}
                                      >
                                        <div className="flex items-center gap-3">
                                          <span
                                            className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 transition-colors ${letterBadgeStyle}`}
                                          >
                                            {qResult && optIdx === qResult.correctAnswer
                                              ? "✓"
                                              : qResult && isSelected && !qResult.isCorrect
                                              ? "✗"
                                              : String.fromCharCode(65 + optIdx)}
                                          </span>
                                          <span className="leading-snug">{opt}</span>
                                        </div>
                                        {isSelected && !qResult && (
                                          <span className="w-2.5 h-2.5 rounded-full bg-primary flex-shrink-0 animate-pulse" />
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>

                                {/* Question Explanation Callout */}
                                {quizResults?.results?.find((r: any) => r.questionId === q.id) && (
                                  <div
                                    className={`mt-3 p-4 rounded-xl border text-xs leading-relaxed ${
                                      quizResults.results.find((r: any) => r.questionId === q.id)
                                        ?.isCorrect
                                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
                                        : "bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200"
                                    }`}
                                  >
                                    <div className="flex items-center gap-1.5 font-bold mb-1">
                                      <Lightbulb className="w-4 h-4 text-amber-500" />
                                      <span>
                                        {quizResults.results.find(
                                          (r: any) => r.questionId === q.id,
                                        )?.isCorrect
                                          ? "Correct Concept Verified"
                                          : "Explanation & In-Depth Review"}
                                      </span>
                                    </div>
                                    <p className="mt-1 text-foreground text-xs leading-relaxed font-medium">
                                      {
                                        quizResults.results.find(
                                          (r: any) => r.questionId === q.id,
                                        )?.explanation
                                      }
                                    </p>
                                  </div>
                                )}
                              </div>
                            ))}

                            {/* Quiz Outcome Banner */}
                            {quizResults && (
                              <div
                                className={`p-4 rounded-xl border text-xs ${
                                  quizResults.passed
                                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
                                    : "bg-destructive/10 border-destructive/30 text-destructive"
                                }`}
                              >
                                <div className="font-bold mb-1">
                                  {quizResults.passed
                                    ? "✓ Quiz Passed Successfully!"
                                    : "✗ Review Incorrect Answers Above"}
                                </div>
                                <div>
                                  Score: {quizResults.score}% (Required:{" "}
                                  {quizResults.passThreshold}%)
                                </div>
                              </div>
                            )}

                            <Button
                              onClick={() => handleQuizSubmit(ex.id)}
                              disabled={submittingExercise}
                              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs h-9 px-5 shadow-xs cursor-pointer"
                            >
                              {submittingExercise ? "Evaluating..." : "Check Answers"}
                            </Button>
                          </div>
                        )}

                        {/* Coding Exercise Runner */}
                        {(ex.type === "coding" || ex.type === "debugging") && (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between gap-3">
                              <select
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                className="h-9 bg-card text-foreground text-xs font-medium rounded-md px-3 border border-border shadow-xs focus:outline-none"
                              >
                                <option value="javascript">JavaScript (Node.js)</option>
                                <option value="python">Python 3</option>
                                <option value="cpp">C++ 20</option>
                                <option value="java">Java 21</option>
                              </select>

                              {ex.hints && ex.hints.length > 0 && (
                                <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 font-medium">
                                  <Lightbulb className="w-3.5 h-3.5" />
                                  <span>Hint: {ex.hints[0]}</span>
                                </span>
                              )}
                            </div>

                            {/* Monaco Editor Container adapting to theme */}
                            <div className="border border-border rounded-xl overflow-hidden h-72 shadow-inner">
                              <Editor
                                height="100%"
                                language={language === "cpp" ? "cpp" : language}
                                theme={isDark ? "vs-dark" : "light"}
                                value={code}
                                onChange={(val) => setCode(val || "")}
                                options={{
                                  minimap: { enabled: false },
                                  fontSize: 13,
                                  scrollBeyondLastLine: false,
                                  automaticLayout: true,
                                }}
                              />
                            </div>

                            {/* Test Feedback */}
                            {executionFeedback && (
                              <div
                                className={`p-4 rounded-xl border text-xs font-mono ${
                                  executionFeedback.passed
                                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                                    : "bg-destructive/10 border-destructive/30 text-destructive"
                                }`}
                              >
                                <div className="font-bold mb-1">
                                  {executionFeedback.passed
                                    ? "✓ All Test Cases Passed!"
                                    : "✗ Test Case Failures Detected"}
                                </div>
                                <div>
                                  Passed {executionFeedback.passedCount} of{" "}
                                  {executionFeedback.totalCount} test suites
                                </div>
                              </div>
                            )}

                            <Button
                              onClick={() => handleCodeSubmit(ex.id)}
                              disabled={submittingExercise}
                              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs shadow-xs gap-1.5"
                            >
                              <Play className="w-3.5 h-3.5" />
                              <span>
                                {submittingExercise
                                  ? "Executing in Sandbox..."
                                  : "Run & Submit Code"}
                              </span>
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Bottom Navigation */}
                <div className="pt-8 border-t border-border flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (currentLessonIndex > 0) {
                        setActiveLessonId(allLessons[currentLessonIndex - 1].id);
                      }
                    }}
                    disabled={currentLessonIndex <= 0}
                    className="gap-1.5 border-border text-foreground hover:bg-muted font-medium text-xs h-9"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </Button>

                  <Button
                    onClick={handleCompleteAndNext}
                    disabled={completing}
                    className="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs h-9 shadow-xs"
                  >
                    <span>{completing ? "Saving..." : lesson.nextLessonId ? "Complete & Next" : "Complete Path"}</span>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* ── Interactive Modal Popup Window (Standard Replacement for window.alert) ── */}
      {popupModal?.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <button
                onClick={() => setPopupModal(null)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h3 className="text-lg font-bold text-foreground">
                {popupModal.title}
              </h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                {popupModal.message}
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                onClick={() => setPopupModal(null)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs px-5 h-9"
              >
                Got it, Continue Practice
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
