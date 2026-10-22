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
  Clock,
  Timer,
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
  timeSpentSeconds?: number;
  requiredTimeSeconds?: number;
  moduleId?: string;
  module?: {
    id: string;
    title: string;
    requiredTimeMinutes?: number;
    requiredTimeSeconds?: number;
  };
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
    requiredTimeMinutes?: number;
    requiredTimeSeconds?: number;
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

  // Stopwatch & Minimum Time Spent Tracker
  const [timeSpent, setTimeSpent] = useState<number>(0);
  const [requiredTime, setRequiredTime] = useState<number>(120);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);
  const [celebrationGlow, setCelebrationGlow] = useState<boolean>(false);

  // Active stopwatch counting
  useEffect(() => {
    if (!isTimerRunning) return;
    const interval = setInterval(() => {
      setTimeSpent((prev) => {
        const next = prev + 1;
        if (next === requiredTime && requiredTime > 0) {
          setCelebrationGlow(true);
          setTimeout(() => setCelebrationGlow(false), 4000);
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning, requiredTime]);

  // Periodic persistence of time spent (every 15 seconds)
  useEffect(() => {
    if (!activeLessonId || timeSpent <= 0) return;
    if (timeSpent % 15 === 0) {
      learningAPI.trackTimeSpent(activeLessonId, timeSpent).catch(() => {});
    }
  }, [timeSpent, activeLessonId]);

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
      setSelectedAnswers({});
      const res = await learningAPI.getLesson(id);
      const lessonData = res.data?.data || res.data;
      setLesson(lessonData);

      // Initialize live stopwatch tracking
      const initialTime = lessonData?.timeSpentSeconds || 0;
      const targetTime =
        lessonData?.module?.requiredTimeSeconds ||
        lessonData?.requiredTimeSeconds ||
        120;
      setTimeSpent(initialTime);
      setRequiredTime(targetTime);
      setIsTimerRunning(true);

      const codingEx = lessonData?.exercises?.find(
        (e: any) => e.type === "coding" || e.type === "debugging",
      );
      if (codingEx?.starterCode?.[language]) {
        setCode(codingEx.starterCode[language]);
      } else if (codingEx?.starterCode?.java && !codingEx?.starterCode?.[language]) {
        setLanguage("java");
        setCode(codingEx.starterCode.java);
      } else if (codingEx?.starterCode?.python && !codingEx?.starterCode?.[language]) {
        setLanguage("python");
        setCode(codingEx.starterCode.python);
      } else if (codingEx?.starterCode?.javascript) {
        setLanguage("javascript");
        setCode(codingEx.starterCode.javascript);
      } else if (codingEx?.starterCode) {
        const availableLang = Object.keys(codingEx.starterCode)[0];
        if (availableLang) {
          setLanguage(availableLang);
          setCode(codingEx.starterCode[availableLang]);
        } else {
          setCode("// Write your solution below\n");
        }
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

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const hasMetTimeRequirement = timeSpent >= requiredTime;
  const remainingSeconds = Math.max(0, requiredTime - timeSpent);
  const progressPercent = Math.min(
    100,
    Math.round((timeSpent / (requiredTime || 1)) * 100)
  );

  const handleCompleteAndNext = async () => {
    if (!lesson) return;
    if (!hasMetTimeRequirement && requiredTime > 0) {
      setPopupModal({
        isOpen: true,
        title: "Module Study Time Requirement",
        message: `Admin has set a required minimum study time of ${Math.ceil(
          requiredTime / 60
        )} minute(s) on this module to ensure you master the concepts before progressing. You have ${remainingSeconds} second(s) remaining.`,
        type: "warning",
      });
      return;
    }
    try {
      setCompleting(true);
      await learningAPI.completeLesson(lesson.id, timeSpent);
      if (course) {
        setCourse({
          ...course,
          modules: course.modules.map((m) => ({
            ...m,
            lessons: m.lessons.map((l) =>
              l.id === lesson.id ? { ...l, isCompleted: true } : l
            ),
          })),
        });
      }
      setXpCelebration(25);
      setTimeout(() => setXpCelebration(null), 3000);

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

          <div className="flex items-center gap-2">
            {/* Live Stopwatch Tracker Badge */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all ${
                hasMetTimeRequirement
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                  : "bg-muted/60 border-border text-foreground"
              }`}
              title={
                hasMetTimeRequirement
                  ? "Required study time satisfied"
                  : `Study time remaining: ${remainingSeconds}s`
              }
            >
              <Timer
                className={`w-3.5 h-3.5 ${
                  hasMetTimeRequirement ? "text-emerald-500" : "text-amber-500 animate-pulse"
                }`}
              />
              <span>{formatTime(timeSpent)}</span>
              <span className="text-muted-foreground font-normal text-[10px]">
                / {formatTime(requiredTime)}
              </span>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (currentLessonIndex > 0) {
                  setActiveLessonId(allLessons[currentLessonIndex - 1].id);
                }
              }}
              disabled={currentLessonIndex <= 0}
              className="h-8 px-2.5 text-xs font-medium border-border text-foreground hover:bg-muted gap-1 cursor-pointer"
              title="Previous Lesson"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Prev</span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (currentLessonIndex < allLessons.length - 1) {
                  setActiveLessonId(allLessons[currentLessonIndex + 1].id);
                }
              }}
              disabled={currentLessonIndex >= allLessons.length - 1}
              className="h-8 px-2.5 text-xs font-medium border-border text-foreground hover:bg-muted gap-1 cursor-pointer"
              title="Next Lesson"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>

            <Button
              size="sm"
              onClick={handleCompleteAndNext}
              disabled={completing}
              className={`h-8 px-3.5 text-xs font-semibold shadow-xs gap-1.5 cursor-pointer transition-all ${
                hasMetTimeRequirement
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-amber-600 hover:bg-amber-700 text-white"
              }`}
            >
              {completing ? (
                <span>Saving...</span>
              ) : !hasMetTimeRequirement ? (
                <>
                  <Clock className="w-3.5 h-3.5 animate-pulse" />
                  <span>{remainingSeconds}s left</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>
                    {currentLessonIndex < allLessons.length - 1
                      ? "Complete & Next"
                      : "Finish Course"}
                  </span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Studio Workspace Content */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          {/* Left Navigation Sidebar with Connecting Step Lines */}
          <aside className="md:col-span-4 lg:col-span-3 bg-card border border-border rounded-xl p-4 shadow-xs sticky top-28 space-y-5">
            <div className="flex items-center justify-between px-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Course Curriculum
              </span>
              <span className="text-[10px] font-semibold text-primary px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                {allLessons.filter((l) => l.isCompleted).length} / {allLessons.length} Done
              </span>
            </div>

            <div className="space-y-6">
              {course.modules.map((mod) => (
                <div key={mod.id} className="space-y-2">
                  <div className="px-2 py-1 text-xs font-bold text-foreground flex items-center justify-between border-b border-border/40 pb-1.5">
                    <span className="truncate">{mod.title}</span>
                    <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-500" />
                      <span>{mod.requiredTimeMinutes || 2}m</span>
                    </span>
                  </div>

                  {/* Connected Step Nodes with Connecting Vertical Lines */}
                  <div className="relative pl-3 space-y-1">
                    {mod.lessons.map((l, lIdx) => {
                      const isActive = l.id === activeLessonId;
                      const isLast = lIdx === mod.lessons.length - 1;

                      return (
                        <div key={l.id} className="relative flex items-start group">
                          {/* Vertical Connecting Line */}
                          {!isLast && (
                            <div
                              className={`absolute left-[11px] top-6 bottom-[-8px] w-0.5 transition-all duration-300 ${
                                l.isCompleted
                                  ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]"
                                  : "bg-border"
                              }`}
                            />
                          )}

                          <button
                            onClick={() => setActiveLessonId(l.id)}
                            className={`w-full text-left pl-7 pr-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-all duration-200 cursor-pointer ${
                              isActive
                                ? "bg-primary/10 text-primary font-bold shadow-xs translate-x-1"
                                : l.isCompleted
                                ? "text-foreground hover:bg-muted/60"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            }`}
                          >
                            {/* Step Indicator Node */}
                            <div
                              className={`absolute left-0 top-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all z-10 ${
                                l.isCompleted
                                  ? "bg-emerald-500 text-white shadow-xs scale-105"
                                  : isActive
                                  ? "bg-primary text-primary-foreground ring-4 ring-primary/25 shadow-xs scale-110 animate-pulse"
                                  : "bg-card border border-border text-muted-foreground group-hover:border-foreground/40"
                              }`}
                            >
                              {l.isCompleted ? (
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              ) : (
                                <span>{lIdx + 1}</span>
                              )}
                            </div>

                            <span className="truncate flex-1 pr-2">{l.title}</span>

                            <span className="text-[10px] uppercase font-semibold text-muted-foreground/60">
                              {l.type === "quiz" ? "MCQ" : l.type === "coding" ? "Code" : "Read"}
                            </span>
                          </button>
                        </div>
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
                {/* Interactive Module Stopwatch & Requirement Bar */}
                <div
                  className={`relative overflow-hidden rounded-xl border p-4 transition-all duration-300 shadow-xs ${
                    hasMetTimeRequirement
                      ? "bg-gradient-to-r from-emerald-500/10 via-card to-emerald-500/5 border-emerald-500/30"
                      : "bg-gradient-to-r from-muted/50 via-card to-muted/30 border-border"
                  }`}
                >
                  {celebrationGlow && (
                    <div className="absolute inset-0 bg-emerald-500/20 animate-pulse pointer-events-none" />
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                          hasMetTimeRequirement
                            ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30 scale-105"
                            : "bg-primary/10 text-primary border border-primary/20"
                        }`}
                      >
                        <Timer
                          className={`w-5 h-5 ${
                            isTimerRunning && !hasMetTimeRequirement ? "animate-pulse" : ""
                          }`}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                            Module Study Stopwatch
                          </h4>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              hasMetTimeRequirement
                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                                : "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 animate-pulse"
                            }`}
                          >
                            {hasMetTimeRequirement
                              ? "✓ Required Time Completed"
                              : `⏱️ ${remainingSeconds}s Remaining`}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {hasMetTimeRequirement
                            ? "Engagement criteria satisfied! You can now complete this step and continue."
                            : `Admin requires minimum ${Math.ceil(
                                requiredTime / 60
                              )} min of active reading & practice.`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-lg font-mono font-black text-foreground">
                          {formatTime(timeSpent)}
                        </div>
                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                          Time Spent
                        </span>
                      </div>

                      <div className="w-28 sm:w-36 flex flex-col gap-1">
                        <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden border border-border">
                          <div
                            className={`h-full transition-all duration-500 rounded-full ${
                              hasMetTimeRequirement ? "bg-emerald-500" : "bg-primary"
                            }`}
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground text-right font-medium">
                          {progressPercent}% Met
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

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
                            {/* Quiz Progress & Question Quick-Jump Stepper */}
                            <div className="bg-muted/40 border border-border rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-foreground">
                                  {ex.quizConfig.questions.length} Practice MCQs
                                </span>
                                <span className="text-[11px] text-muted-foreground">
                                  · {Object.keys(selectedAnswers).length} of {ex.quizConfig.questions.length} answered
                                </span>
                              </div>

                              {/* Question Quick Jump Pills */}
                              <div className="flex flex-wrap items-center gap-1.5">
                                {ex.quizConfig.questions.map((q, qIdx) => {
                                  const isAnswered = selectedAnswers[q.id] !== undefined;
                                  const qResult = quizResults?.results?.find(
                                    (r: any) => r.questionId === q.id,
                                  );
                                  return (
                                    <button
                                      key={q.id}
                                      type="button"
                                      onClick={() => {
                                        const el = document.getElementById(`quiz-q-${q.id}`);
                                        el?.scrollIntoView({ behavior: "smooth", block: "center" });
                                      }}
                                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                                        qResult
                                          ? qResult.isCorrect
                                            ? "bg-emerald-500 text-white shadow-xs"
                                            : "bg-destructive text-destructive-foreground shadow-xs"
                                          : isAnswered
                                          ? "bg-primary text-primary-foreground shadow-xs"
                                          : "bg-card border border-border text-muted-foreground hover:border-foreground/30"
                                      }`}
                                      title={`Jump to Question ${qIdx + 1}`}
                                    >
                                      {qIdx + 1}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {ex.quizConfig.questions.map((q, qIdx) => (
                              <div
                                key={q.id}
                                id={`quiz-q-${q.id}`}
                                className="p-5 rounded-xl border border-border bg-card/60 space-y-3.5 shadow-xs"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-[11px] font-bold uppercase tracking-wider text-primary px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
                                    Question {qIdx + 1} of {ex.quizConfig?.questions?.length || 0}
                                  </span>
                                  {selectedAnswers[q.id] !== undefined && (
                                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                      ✓ Option Selected
                                    </span>
                                  )}
                                </div>
                                <p className="text-base font-bold text-foreground leading-snug">
                                  {q.question}
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
                                onChange={(e) => {
                                  const newLang = e.target.value;
                                  setLanguage(newLang);
                                  if (ex.starterCode?.[newLang]) {
                                    setCode(ex.starterCode[newLang]);
                                  }
                                }}
                                className="h-9 bg-card text-foreground text-xs font-semibold rounded-lg px-3 border border-border shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
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
                <div className="pt-8 border-t border-border flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (currentLessonIndex > 0) {
                          setActiveLessonId(allLessons[currentLessonIndex - 1].id);
                        }
                      }}
                      disabled={currentLessonIndex <= 0}
                      className="gap-1.5 border-border text-foreground hover:bg-muted font-medium text-xs h-9 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Previous Lesson</span>
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => {
                        if (currentLessonIndex < allLessons.length - 1) {
                          setActiveLessonId(allLessons[currentLessonIndex + 1].id);
                        }
                      }}
                      disabled={currentLessonIndex >= allLessons.length - 1}
                      className="gap-1.5 border-border text-foreground hover:bg-muted font-medium text-xs h-9 cursor-pointer"
                    >
                      <span>Next Lesson</span>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>

                  <Button
                    onClick={handleCompleteAndNext}
                    disabled={completing}
                    className={`gap-2 font-semibold text-xs h-9 px-5 shadow-xs cursor-pointer transition-all ${
                      hasMetTimeRequirement
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20"
                        : "bg-amber-600 hover:bg-amber-700 text-white"
                    }`}
                  >
                    {completing ? (
                      <>
                        <Spinner className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : !hasMetTimeRequirement ? (
                      <>
                        <Clock className="w-4 h-4 animate-pulse" />
                        <span>Spend {formatTime(remainingSeconds)} more</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-white" />
                        <span>
                          {currentLessonIndex < allLessons.length - 1
                            ? "Complete & Next Lesson"
                            : "Finish Course"}
                        </span>
                      </>
                    )}
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
