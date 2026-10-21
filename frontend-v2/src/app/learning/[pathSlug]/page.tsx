"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  BookOpen,
  Award,
  Zap,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Lock,
  ChevronDown,
  ChevronUp,
  FileText,
  HelpCircle,
  Code2,
  Check,
  Star,
  Trophy,
} from "lucide-react";
import { learningAPI } from "@/config/api";
import { Spinner } from "@/components/ui/spinner";

interface PathDetails {
  id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: string;
  estimatedHours: number;
  tags: string[];
  iconUrl?: string;
  isEnrolled: boolean;
  progress: {
    percentage: number;
    completedCourses: number;
    totalCourses: number;
    status: string;
    isCertified: boolean;
  } | null;
  courses: Array<{
    id: string;
    title: string;
    slug: string;
    description: string;
    difficulty: string;
    estimatedMinutes: number;
    isMandatory: boolean;
    order: number;
    isCompleted: boolean;
    progressPercent: number;
    modules: Array<{
      id: string;
      title: string;
      description: string;
      lessonsCount: number;
      lessons: Array<{
        id: string;
        title: string;
        slug: string;
        type: string;
      }>;
    }>;
  }>;
}

export default function LearningPathDetailPage({
  params,
}: {
  params: Promise<{ pathSlug: string }>;
}) {
  const { pathSlug } = use(params);
  const router = useRouter();
  const [path, setPath] = useState<PathDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [claimingCert, setClaimingCert] = useState(false);
  const [expandedCourses, setExpandedCourses] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadPath();
  }, [pathSlug]);

  const loadPath = async () => {
    try {
      setLoading(true);
      const res = await learningAPI.getPathBySlug(pathSlug);
      setPath(res.data);
      // Expand all courses by default
      const initialExpanded: Record<string, boolean> = {};
      (res.data?.courses || []).forEach((c: any) => {
        initialExpanded[c.id] = true;
      });
      setExpandedCourses(initialExpanded);
    } catch (err) {
      console.error("Failed to load path details", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleCourseExpand = (id: string) => {
    setExpandedCourses((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleEnroll = async () => {
    if (!path) return;
    try {
      setEnrolling(true);
      await learningAPI.enroll(path.id);
      await loadPath();
    } catch (err) {
      console.error("Enrollment failed", err);
    } finally {
      setEnrolling(false);
    }
  };

  const handleClaimCertificate = async () => {
    if (!path) return;
    try {
      setClaimingCert(true);
      await learningAPI.issueCertificate(path.id);
      router.push("/learning/me/certificates");
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to claim certificate");
    } finally {
      setClaimingCert(false);
    }
  };

  const getLessonIcon = (type: string) => {
    switch (type) {
      case "quiz":
        return <HelpCircle className="w-3.5 h-3.5 text-amber-400" />;
      case "coding":
      case "debugging":
        return <Code2 className="w-3.5 h-3.5 text-emerald-400" />;
      case "reading":
      default:
        return <FileText className="w-3.5 h-3.5 text-indigo-400" />;
    }
  };

  const getTechIcon = (pathItem: PathDetails) => {
    if (pathItem.iconUrl && pathItem.iconUrl.startsWith("/")) {
      return pathItem.iconUrl;
    }
    const slug = pathItem.slug.toLowerCase();
    if (slug.includes("ai") || slug.includes("prompt")) return "/images/tech/ai-brain.svg";
    if (slug.includes("python")) return "/images/tech/python.svg";
    if (slug.includes("javascript")) return "/images/tech/javascript.svg";
    return "/images/badges/algo-master.svg";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#08080a] flex items-center justify-center">
        <Spinner className="w-8 h-8 text-indigo-500" />
      </div>
    );
  }

  if (!path) {
    return (
      <div className="min-h-screen bg-[#08080a] text-zinc-100 flex flex-col items-center justify-center p-6">
        <h2 className="text-xl font-bold">Path not found</h2>
        <Link
          href="/learning"
          className="mt-4 text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to catalog</span>
        </Link>
      </div>
    );
  }

  const isCompleted = path.progress?.percentage === 100;
  const techIconSrc = getTechIcon(path);

  return (
    <div className="min-h-screen bg-[#08080a] text-zinc-100 pb-24">
      {/* Top Header */}
      <div className="border-b border-zinc-800/80 bg-gradient-to-b from-[#111116] to-[#08080a] pt-8 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <Link
            href="/learning"
            className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>All Learning Paths</span>
          </Link>

          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-3">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 capitalize">
                  {path.difficulty}
                </span>
                <span className="flex items-center gap-1 text-xs text-zinc-400">
                  <Clock className="w-3.5 h-3.5 text-zinc-500" />
                  <span>~{path.estimatedHours} Hours</span>
                </span>
                <span className="flex items-center gap-1 text-xs text-zinc-400">
                  <BookOpen className="w-3.5 h-3.5 text-zinc-500" />
                  <span>{path.courses.length} Courses</span>
                </span>
              </div>

              <div className="flex items-center gap-4 mt-2">
                <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 p-2.5 flex items-center justify-center shadow-lg">
                  <img
                    src={techIconSrc}
                    alt={path.title}
                    className="w-full h-full object-contain"
                  />
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  {path.title}
                </h1>
              </div>

              <p className="mt-4 text-base text-zinc-400 leading-relaxed">
                {path.description}
              </p>

              <div className="flex flex-wrap gap-2 mt-4">
                {path.tags.map((t, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 font-medium"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>

            {/* Action Card */}
            <div className="bg-zinc-900/90 border border-zinc-800 p-6 rounded-2xl w-full md:w-80 shadow-xl backdrop-blur-md">
              {path.isEnrolled ? (
                <div>
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-zinc-400">Roadmap Progress</span>
                    <span className="text-indigo-400 font-extrabold">
                      {path.progress?.percentage || 0}%
                    </span>
                  </div>
                  <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden mb-6">
                    <div
                      className="bg-indigo-500 h-full rounded-full transition-all duration-500 shadow-sm shadow-indigo-500"
                      style={{ width: `${path.progress?.percentage || 0}%` }}
                    />
                  </div>

                  {isCompleted ? (
                    <button
                      onClick={handleClaimCertificate}
                      disabled={claimingCert}
                      className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Trophy className="w-4 h-4 text-amber-300" />
                      <span>{claimingCert ? "Issuing..." : "Claim Certificate"}</span>
                    </button>
                  ) : (
                    <Link
                      href={`/learning/${path.slug}/${path.courses[0]?.slug}`}
                      className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all"
                    >
                      <span>Resume Learning</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-4">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Includes Verifiable Digital Certificate</span>
                  </div>
                  <button
                    onClick={handleEnroll}
                    disabled={enrolling}
                    className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <span>{enrolling ? "Enrolling..." : "Enroll in Learning Path"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Connected Roadmap Timeline Section */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2.5">
              <Zap className="w-6 h-6 text-indigo-400" />
              <span>Learning Roadmap & Milestones</span>
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Follow this step-by-step path to master all concepts and achieve certification.
            </p>
          </div>
          <span className="text-xs text-zinc-400 font-medium px-3 py-1 bg-zinc-900 rounded-lg border border-zinc-800">
            {path.courses.length} Milestones
          </span>
        </div>

        {/* Vertical Timeline Path */}
        <div className="relative pl-6 sm:pl-10 space-y-8 before:absolute before:left-3 sm:before:left-5 before:top-4 before:bottom-4 before:w-0.5 before:bg-gradient-to-b before:from-indigo-500 before:via-zinc-700 before:to-zinc-800">
          {path.courses.map((course, cIdx) => {
            const isExpanded = expandedCourses[course.id];
            const isCourseDone = course.isCompleted;

            return (
              <div key={course.id} className="relative group">
                {/* Node Indicator on Timeline */}
                <div
                  className={`absolute -left-6 sm:-left-10 top-5 w-6 sm:w-10 h-6 sm:h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                    isCourseDone
                      ? "bg-emerald-500 border-emerald-400 text-zinc-950 shadow-md shadow-emerald-500/30"
                      : "bg-[#08080a] border-indigo-500 text-indigo-400 shadow-md shadow-indigo-500/20"
                  }`}
                >
                  {isCourseDone ? (
                    <Check className="w-3.5 sm:w-5 h-3.5 sm:h-5 stroke-[3]" />
                  ) : (
                    <span className="text-xs sm:text-sm font-extrabold">{cIdx + 1}</span>
                  )}
                </div>

                {/* Milestone Course Card */}
                <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 transition-all hover:border-indigo-500/40 hover:bg-zinc-900/90 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800/60">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-bold text-indigo-400">
                          MILESTONE {cIdx + 1}
                        </span>
                        <span className="text-zinc-600">·</span>
                        <span className="text-xs text-zinc-400">
                          ~{course.estimatedMinutes} mins
                        </span>
                        <span className="text-zinc-600">·</span>
                        <span className="text-xs text-zinc-500 capitalize">{course.difficulty}</span>
                      </div>
                      <h3 className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors">
                        {course.title}
                      </h3>
                      <p className="text-sm text-zinc-400 mt-1 leading-relaxed">
                        {course.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {isCourseDone && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Passed</span>
                        </span>
                      )}

                      <Link
                        href={`/learning/${path.slug}/${course.slug}`}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-md shadow-indigo-600/20 transition-all"
                      >
                        Start Course
                      </Link>

                      <button
                        onClick={() => toggleCourseExpand(course.id)}
                        className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                        aria-label="Toggle modules"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Accordion Modules & Lessons */}
                  {isExpanded && (
                    <div className="mt-5 space-y-3.5">
                      {course.modules.map((mod) => (
                        <div
                          key={mod.id}
                          className="bg-zinc-950/60 border border-zinc-800/60 rounded-xl p-4.5"
                        >
                          <div className="flex items-center justify-between text-xs font-bold text-zinc-200 mb-2.5">
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-indigo-500" />
                              <span>{mod.title}</span>
                            </span>
                            <span className="text-zinc-500 font-normal">
                              {mod.lessons.length} lessons
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                            {mod.lessons.map((lesson) => (
                              <div
                                key={lesson.id}
                                className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-zinc-900/60 border border-zinc-800/40 text-xs text-zinc-300"
                              >
                                {getLessonIcon(lesson.type)}
                                <span className="truncate font-medium">{lesson.title}</span>
                                <span className="text-[10px] text-zinc-500 uppercase ml-auto font-semibold">
                                  {lesson.type}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Final Certificate Milestone Node */}
          <div className="relative group">
            <div className="absolute -left-6 sm:-left-10 top-5 w-6 sm:w-10 h-6 sm:h-10 rounded-full flex items-center justify-center border-2 bg-[#08080a] border-amber-400 text-amber-400 shadow-lg shadow-amber-400/20">
              <Trophy className="w-3.5 sm:w-5 h-3.5 sm:h-5" />
            </div>

            <div className="bg-gradient-to-r from-amber-500/10 via-zinc-900/90 to-zinc-900/90 border border-amber-500/30 rounded-2xl p-6 shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    FINAL CREDENTIAL
                  </span>
                  <h3 className="text-xl font-bold text-white mt-1">
                    Verified Digital Certificate of Completion
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl">
                    Upon passing all mandatory course exercises and quizzes with a score of 70%+, your tamper-proof digital credential will be generated with a public verification URL.
                  </p>
                </div>

                {isCompleted ? (
                  <button
                    onClick={handleClaimCertificate}
                    disabled={claimingCert}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20 cursor-pointer"
                  >
                    Claim Certificate
                  </button>
                ) : (
                  <span className="text-xs text-zinc-500 font-semibold px-4 py-2 rounded-xl bg-zinc-800/60 border border-zinc-700/40">
                    Locked until 100%
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
