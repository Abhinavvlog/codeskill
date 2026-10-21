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

  useEffect(() => {
    loadPath();
  }, [pathSlug]);

  const loadPath = async () => {
    try {
      setLoading(true);
      const res = await learningAPI.getPathBySlug(pathSlug);
      setPath(res.data);
    } catch (err) {
      console.error("Failed to load path details", err);
    } finally {
      setLoading(false);
    }
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
                  <Clock className="w-3.5 h-3.5" />
                  <span>{path.estimatedHours} Hours</span>
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                {path.title}
              </h1>

              <p className="mt-3 text-base text-zinc-400 leading-relaxed">
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
                    <span className="text-zinc-400">Path Completion</span>
                    <span className="text-indigo-400">
                      {path.progress?.percentage || 0}%
                    </span>
                  </div>
                  <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden mb-6">
                    <div
                      className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${path.progress?.percentage || 0}%` }}
                    />
                  </div>

                  {isCompleted ? (
                    <button
                      onClick={handleClaimCertificate}
                      disabled={claimingCert}
                      className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Award className="w-4 h-4" />
                      <span>{claimingCert ? "Issuing..." : "Claim Certificate"}</span>
                    </button>
                  ) : (
                    <Link
                      href={`/learning/${path.slug}/${path.courses[0]?.slug}`}
                      className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all"
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
                    className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
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

      {/* Curriculum Syllabus Tree */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <span>Curriculum Syllabus</span>
          </h2>
          <span className="text-xs text-zinc-400">
            {path.courses.length} Courses · All Practice-Based
          </span>
        </div>

        <div className="space-y-6">
          {path.courses.map((course, cIdx) => (
            <div
              key={course.id}
              className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 transition-all hover:border-zinc-700/80"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800/60">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-bold text-indigo-400">
                      COURSE {cIdx + 1}
                    </span>
                    <span className="text-zinc-600">·</span>
                    <span className="text-xs text-zinc-400">
                      ~{course.estimatedMinutes} mins
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white">{course.title}</h3>
                  <p className="text-sm text-zinc-400 mt-1">{course.description}</p>
                </div>

                <div className="flex items-center gap-3">
                  {course.isCompleted && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Completed</span>
                    </span>
                  )}
                  <Link
                    href={`/learning/${path.slug}/${course.slug}`}
                    className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition-colors"
                  >
                    View Course
                  </Link>
                </div>
              </div>

              {/* Modules list */}
              <div className="mt-4 space-y-3">
                {course.modules.map((mod, mIdx) => (
                  <div
                    key={mod.id}
                    className="bg-zinc-950/40 border border-zinc-800/40 rounded-xl p-4"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold text-zinc-300 mb-2">
                      <span>{mod.title}</span>
                      <span className="text-zinc-500 font-normal">
                        {mod.lessons.length} lessons
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                      {mod.lessons.map((lesson) => (
                        <div
                          key={lesson.id}
                          className="flex items-center gap-2 text-xs text-zinc-400 py-1"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/60" />
                          <span className="truncate">{lesson.title}</span>
                          <span className="text-[10px] text-zinc-600 uppercase ml-auto">
                            {lesson.type}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
