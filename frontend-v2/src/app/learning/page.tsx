"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Compass,
  Search,
  Filter,
  BookOpen,
  Award,
  Zap,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  Trophy,
  Layers,
  GraduationCap,
} from "lucide-react";
import { learningAPI } from "@/config/api";
import { Spinner } from "@/components/ui/spinner";

interface LearningPathItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedHours: number;
  tags: string[];
  courseCount: number;
  isEnrolled: boolean;
  progressPercent: number;
  completedCourses: number;
}

export default function LearningPathsCatalogPage() {
  const [paths, setPaths] = useState<LearningPathItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("all");

  useEffect(() => {
    fetchPaths();
  }, [difficulty]);

  const fetchPaths = async () => {
    try {
      setLoading(true);
      const res = await learningAPI.getPaths({
        search: search || undefined,
        difficulty: difficulty === "all" ? undefined : difficulty,
      });
      setPaths(res.data || []);
    } catch (err) {
      console.error("Failed to load learning paths", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPaths();
  };

  const difficultyColors: Record<string, string> = {
    beginner: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    intermediate: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    advanced: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  };

  return (
    <div className="min-h-screen bg-[#08080a] text-zinc-100 selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Hero Banner */}
      <div className="relative border-b border-zinc-800/80 bg-gradient-to-b from-[#101015] to-[#08080a] pt-12 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Hands-on Mastery · No Video Fatigue</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
                Learning Paths & Certification
              </h1>
              <p className="mt-3 text-base sm:text-lg text-zinc-400 max-w-2xl">
                Structured interactive curricula, hands-on coding exercises, knowledge quizzes, and verifiable digital certificates.
              </p>
            </div>

            {/* Quick Links to Achievements & Certs */}
            <div className="flex items-center gap-3">
              <Link
                href="/learning/me/achievements"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-sm font-medium text-zinc-200 transition-all hover:bg-zinc-800"
              >
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Achievements & XP</span>
              </Link>
              <Link
                href="/learning/me/certificates"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all"
              >
                <Award className="w-4 h-4" />
                <span>My Certificates</span>
              </Link>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 bg-zinc-900/80 p-2.5 rounded-2xl border border-zinc-800 backdrop-blur-md">
            <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search learning paths (e.g., JavaScript, DSA, SQL)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-transparent text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none"
              />
            </form>

            <div className="flex items-center gap-2 w-full sm:w-auto border-t sm:border-t-0 sm:border-l border-zinc-800 pt-2 sm:pt-0 sm:pl-3">
              <Filter className="w-4 h-4 text-zinc-400 ml-1" />
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="bg-zinc-800 text-zinc-300 text-xs font-medium rounded-lg px-3 py-2 border border-zinc-700/60 focus:outline-none cursor-pointer"
              >
                <option value="all">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Path Cards Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Spinner className="w-8 h-8 text-indigo-500 mb-3" />
            <p className="text-zinc-400 text-sm">Loading learning catalog...</p>
          </div>
        ) : paths.length === 0 ? (
          <div className="text-center py-20 bg-zinc-900/40 rounded-3xl border border-zinc-800 p-8">
            <BookOpen className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-zinc-300">No learning paths found</h3>
            <p className="text-zinc-500 text-sm mt-1 max-w-sm mx-auto">
              Try adjusting your search query or difficulty filters to discover available tracks.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paths.map((path) => (
              <div
                key={path.id}
                className="group relative flex flex-col justify-between rounded-2xl bg-zinc-900/60 border border-zinc-800/80 p-6 hover:border-zinc-700/80 hover:bg-zinc-900 transition-all duration-200 shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                        difficultyColors[path.difficulty] || difficultyColors.beginner
                      } capitalize`}
                    >
                      {path.difficulty}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>~{path.estimatedHours} hrs</span>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">
                    {path.title}
                  </h3>

                  <p className="mt-2 text-sm text-zinc-400 line-clamp-3">
                    {path.description}
                  </p>

                  {/* Tags */}
                  {path.tags && path.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-4">
                      {path.tags.slice(0, 3).map((tag, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-zinc-800 text-[11px] font-medium text-zinc-400"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-5 border-t border-zinc-800/60">
                  {/* Progress Bar if enrolled */}
                  {path.isEnrolled ? (
                    <div className="mb-4">
                      <div className="flex justify-between text-xs font-semibold mb-1.5">
                        <span className="text-zinc-400">Progress</span>
                        <span className="text-indigo-400">{path.progressPercent}%</span>
                      </div>
                      <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${path.progressPercent}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-zinc-400 mb-4">
                      <Layers className="w-4 h-4 text-zinc-500" />
                      <span>{path.courseCount} interactive courses</span>
                    </div>
                  )}

                  <Link
                    href={`/learning/${path.slug}`}
                    className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      path.isEnrolled
                        ? "bg-indigo-600 hover:bg-indigo-500 text-white"
                        : "bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
                    }`}
                  >
                    <span>{path.isEnrolled ? "Continue Learning" : "Explore Path"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
