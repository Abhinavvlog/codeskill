"use client";

import { useState, useEffect, use } from "react";
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
} from "lucide-react";
import Editor from "@monaco-editor/react";
import { learningAPI } from "@/config/api";
import { Spinner } from "@/components/ui/spinner";

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

export default function CourseWorkspacePage({
  params,
}: {
  params: Promise<{ pathSlug: string; courseSlug: string }>;
}) {
  const { pathSlug, courseSlug } = use(params);
  const router = useRouter();

  const [course, setCourse] = useState<CourseSidebarData | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lessonLoading, setLessonLoading] = useState(false);
  const [completing, setCompleting] = useState(false);

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
      // Fetch path to resolve course ID
      const pathRes = await learningAPI.getPathBySlug(pathSlug);
      const pathData = pathRes.data?.data || pathRes.data;
      const foundCourse = (pathData?.courses || []).find(
        (c: any) => c.slug === courseSlug,
      );
      if (!foundCourse) return;

      const courseRes = await learningAPI.getCourse(foundCourse.id);
      const courseData = courseRes.data?.data || courseRes.data;
      setCourse(courseData);

      // Select first lesson by default
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

      // Set starter code if coding exercise present
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
      setQuizResults(res.data.feedback);
      if (res.data.xpAwarded > 0) {
        setXpCelebration(res.data.xpAwarded);
      }
      if (res.data.passed) {
        // Refresh lesson completion status
        loadLesson(activeLessonId!);
        loadCourse();
      }
    } catch (err) {
      console.error("Quiz submission error", err);
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
      setExecutionFeedback(res.data.feedback);
      if (res.data.xpAwarded > 0) {
        setXpCelebration(res.data.xpAwarded);
      }
      if (res.data.passed) {
        loadLesson(activeLessonId!);
        loadCourse();
      }
    } catch (err) {
      console.error("Code submission error", err);
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
      alert(err.response?.data?.message || "Please complete practice exercises first");
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#08080a] flex items-center justify-center">
        <Spinner className="w-8 h-8 text-indigo-500" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-[#08080a] text-zinc-100 flex flex-col items-center justify-center p-6">
        <h2 className="text-xl font-bold">Course not found</h2>
        <Link
          href={`/learning/${pathSlug}`}
          className="mt-4 text-indigo-400 hover:text-indigo-300"
        >
          Back to Path Overview
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans">
      {/* ── Left Sidebar Curriculum Navigation ──────────────────────────────── */}
      <div className="w-80 flex-shrink-0 border-r border-border bg-card flex flex-col">
        {/* Course Header */}
        <div className="p-4 border-b border-border">
          <Link
            href={`/learning/${pathSlug}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Path Overview</span>
          </Link>
          <h2 className="text-sm font-bold text-foreground truncate">{course.title}</h2>
        </div>

        {/* Modules & Lessons Tree */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {course.modules.map((mod, mIdx) => (
            <div key={mod.id}>
              <div className="px-2 py-1 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                {mod.title}
              </div>
              <div className="mt-1 space-y-0.5">
                {mod.lessons.map((l) => {
                  const isActive = l.id === activeLessonId;
                  return (
                    <button
                      key={l.id}
                      onClick={() => setActiveLessonId(l.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2.5 transition-all cursor-pointer ${
                        isActive
                          ? "bg-primary/10 text-primary border border-primary/20 font-semibold"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      {l.isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                      ) : (
                        <div
                          className={`w-4 h-4 rounded-full border flex-shrink-0 ${
                            isActive
                              ? "border-primary bg-primary/20"
                              : "border-border"
                          }`}
                        />
                      )}
                      <span className="truncate flex-1">{l.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main Lesson & Practice Content Area ────────────────────────────── */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto bg-background">
        {lessonLoading || !lesson ? (
          <div className="flex-1 flex items-center justify-center">
            <Spinner className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : (
          <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full p-6 sm:p-10">
            {/* XP Celebration Banner */}
            {xpCelebration && (
              <div className="mb-6 p-4 rounded-xl bg-primary/10 border border-primary/30 flex items-center gap-3 animate-bounce">
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="text-sm font-bold text-primary">
                  +{xpCelebration} XP Earned for Verified Progress!
                </span>
              </div>
            )}

            {/* Lesson Title & Objectives */}
            <div className="pb-6 border-b border-border">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground uppercase border border-border">
                  Lesson · {lesson.type}
                </span>
                {lesson.isCompleted && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Completed</span>
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {lesson.title}
              </h1>

              {lesson.learningObjectives && lesson.learningObjectives.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {lesson.learningObjectives.map((obj, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-md bg-muted text-xs text-muted-foreground font-medium border border-border"
                    >
                      🎯 {obj}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Reading Content Markdown / Text (NO VIDEO) */}
            <div className="py-8 prose prose-zinc dark:prose-invert max-w-none text-foreground text-sm leading-relaxed space-y-4">
              <div className="whitespace-pre-wrap font-sans">
                {lesson.content}
              </div>
            </div>

            {/* ── Interactive Practice & Exercises Section ──────────────────── */}
            {lesson.exercises && lesson.exercises.length > 0 && (
              <div className="mt-8 pt-8 border-t border-border">
                <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-primary" />
                  <span>Practice Exercise</span>
                </h2>

                {lesson.exercises.map((ex) => (
                  <div
                    key={ex.id}
                    className="bg-card border border-border rounded-xl p-6 mb-6 shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base font-bold text-foreground">{ex.title}</h3>
                      <span className="text-xs font-semibold text-primary">
                        {ex.marks} XP
                      </span>
                    </div>

                    {/* Quiz Type Exercise */}
                    {ex.type === "quiz" && ex.quizConfig?.questions && (
                      <div className="space-y-6">
                        {ex.quizConfig.questions.map((q, qIdx) => (
                          <div key={q.id} className="space-y-3">
                            <p className="text-sm font-semibold text-zinc-200">
                              {qIdx + 1}. {q.question}
                            </p>
                            <div className="space-y-2">
                              {q.options.map((opt, optIdx) => {
                                const isSelected = selectedAnswers[q.id] === optIdx;
                                const qResult = quizResults?.results?.find(
                                  (r: any) => r.questionId === q.id,
                                );
                                let optionClasses =
                                  "bg-zinc-950/40 border-zinc-800 text-zinc-300 hover:border-zinc-700";

                                if (qResult) {
                                  if (optIdx === qResult.correctAnswer) {
                                    optionClasses =
                                      "bg-emerald-500/20 border-emerald-500 text-emerald-200 font-semibold";
                                  } else if (isSelected && !qResult.isCorrect) {
                                    optionClasses =
                                      "bg-rose-500/20 border-rose-500 text-rose-200 font-semibold";
                                  }
                                } else if (isSelected) {
                                  optionClasses =
                                    "bg-indigo-600/20 border-indigo-500 text-indigo-200";
                                }

                                return (
                                  <button
                                    key={optIdx}
                                    onClick={() =>
                                      setSelectedAnswers({
                                        ...selectedAnswers,
                                        [q.id]: optIdx,
                                      })
                                    }
                                    className={`w-full text-left px-4 py-3 rounded-xl text-xs font-medium border transition-all cursor-pointer ${optionClasses}`}
                                  >
                                    <span className="mr-2 font-mono text-zinc-500">
                                      {String.fromCharCode(65 + optIdx)}.
                                    </span>
                                    <span>{opt}</span>
                                  </button>
                                );
                              })}
                            </div>

                            {/* Detailed Explanation Box */}
                            {quizResults?.results?.find((r: any) => r.questionId === q.id) && (
                              <div
                                className={`mt-3 p-3.5 rounded-xl border text-xs leading-relaxed ${
                                  quizResults.results.find((r: any) => r.questionId === q.id)
                                    ?.isCorrect
                                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                                    : "bg-amber-500/10 border-amber-500/30 text-amber-200"
                                }`}
                              >
                                <div className="flex items-center gap-1.5 font-bold mb-1">
                                  <Lightbulb className="w-3.5 h-3.5" />
                                  <span>
                                    {quizResults.results.find(
                                      (r: any) => r.questionId === q.id,
                                    )?.isCorrect
                                      ? "Correct Concept Verified"
                                      : "Explanation & In-Depth Review"}
                                  </span>
                                </div>
                                <p className="text-zinc-300 text-xs">
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

                        {/* Quiz Feedback */}
                        {quizResults && (
                          <div
                            className={`p-4 rounded-xl border text-xs ${
                              quizResults.passed
                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                                : "bg-rose-500/10 border-rose-500/30 text-rose-300"
                            }`}
                          >
                            <div className="font-bold mb-1">
                              {quizResults.passed
                                ? "✓ Quiz Passed!"
                                : "✗ Needs Review"}
                            </div>
                            <div>
                              Score: {quizResults.score}% (Required:{" "}
                              {quizResults.passThreshold}%)
                            </div>
                          </div>
                        )}

                        <button
                          onClick={() => handleQuizSubmit(ex.id)}
                          disabled={submittingExercise}
                          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all cursor-pointer"
                        >
                          {submittingExercise ? "Evaluating..." : "Check Answers"}
                        </button>
                      </div>
                    )}

                    {/* Coding / Debugging Type Exercise */}
                    {(ex.type === "coding" || ex.type === "debugging") && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="bg-zinc-800 text-zinc-300 text-xs rounded-lg px-3 py-1.5 border border-zinc-700 focus:outline-none"
                          >
                            <option value="javascript">JavaScript</option>
                            <option value="python">Python 3</option>
                            <option value="cpp">C++</option>
                            <option value="java">Java</option>
                          </select>

                          {ex.hints && ex.hints.length > 0 && (
                            <span className="text-xs text-amber-400 flex items-center gap-1">
                              <Lightbulb className="w-3.5 h-3.5" />
                              <span>Hint: {ex.hints[0]}</span>
                            </span>
                          )}
                        </div>

                        {/* Monaco Editor Container */}
                        <div className="border border-zinc-800 rounded-xl overflow-hidden h-72">
                          <Editor
                            height="100%"
                            language={language === "cpp" ? "cpp" : language}
                            theme="vs-dark"
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

                        {/* Feedback / Test Results */}
                        {executionFeedback && (
                          <div
                            className={`p-4 rounded-xl border text-xs font-mono ${
                              executionFeedback.passed
                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                                : "bg-rose-500/10 border-rose-500/30 text-rose-300"
                            }`}
                          >
                            <div className="font-bold mb-1">
                              {executionFeedback.passed
                                ? "✓ All Test Cases Passed"
                                : "✗ Some Test Cases Failed"}
                            </div>
                            <div>
                              Passed {executionFeedback.passedCount} of{" "}
                              {executionFeedback.totalCount} tests
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleCodeSubmit(ex.id)}
                            disabled={submittingExercise}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all cursor-pointer"
                          >
                            <Play className="w-3.5 h-3.5" />
                            <span>
                              {submittingExercise
                                ? "Executing Sandbox..."
                                : "Run & Submit Code"}
                            </span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Bottom Complete & Next Button */}
            <div className="mt-auto pt-10 pb-6 flex items-center justify-between border-t border-zinc-800">
              <span className="text-xs text-zinc-500">
                {lesson.nextLessonId ? "Next: Upcoming Lesson" : "Course Milestone"}
              </span>

              <button
                onClick={handleCompleteAndNext}
                disabled={completing}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <span>
                  {completing
                    ? "Saving..."
                    : lesson.nextLessonId
                    ? "Complete & Next Lesson"
                    : "Finish Course"}
                </span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
