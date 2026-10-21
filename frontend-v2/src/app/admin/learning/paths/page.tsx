"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Compass,
  Plus,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  ExternalLink,
  X,
  Check,
} from "lucide-react";
import { adminLearningAPI } from "@/config/api";
import { Spinner } from "@/components/ui/spinner";

interface PathItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedHours: number;
  status: "draft" | "published" | "archived";
  version: number;
  tags: string[];
  pathCourses?: any[];
}

export default function AdminLearningPathsPage() {
  const [paths, setPaths] = useState<PathItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState<"beginner" | "intermediate" | "advanced">("beginner");
  const [estimatedHours, setEstimatedHours] = useState(10);
  const [tagsInput, setTagsInput] = useState("JavaScript, Web Development");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadPaths();
  }, []);

  const loadPaths = async () => {
    try {
      setLoading(true);
      const res = await adminLearningAPI.getPaths();
      setPaths(res.data || []);
    } catch (err) {
      console.error("Failed to load paths", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePath = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    try {
      setCreating(true);
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      await adminLearningAPI.createPath({
        title,
        description,
        difficulty,
        estimatedHours: Number(estimatedHours),
        tags,
        status: "published",
      });

      setShowCreateModal(false);
      setTitle("");
      setDescription("");
      await loadPaths();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to create learning path");
    } finally {
      setCreating(false);
    }
  };

  const handlePublish = async (id: string) => {
    try {
      setPublishingId(id);
      await adminLearningAPI.publishPath(id);
      await loadPaths();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to publish path");
    } finally {
      setPublishingId(null);
    }
  };

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-8 font-sans text-zinc-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div>
          <Link
            href="/admin/learning"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Admin Studio Overview</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Learning Paths Manager
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Create, publish, and manage structured learning tracks.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Path</span>
        </button>
      </div>

      {/* Path List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner className="w-8 h-8 text-indigo-500" />
        </div>
      ) : paths.length === 0 ? (
        <div className="text-center py-16 bg-zinc-900/40 rounded-3xl border border-zinc-800 p-8">
          <Compass className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-base font-bold text-white">No learning paths yet</h3>
          <p className="text-xs text-zinc-500 mt-1">
            Click &quot;Create New Path&quot; to author your first curriculum track.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paths.map((path) => (
            <div
              key={path.id}
              className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      path.status === "published"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    }`}
                  >
                    {path.status} · v{path.version}
                  </span>

                  <span className="text-xs text-zinc-400 capitalize">
                    {path.difficulty}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white">{path.title}</h3>
                <p className="text-xs text-zinc-400 mt-1.5 line-clamp-3">
                  {path.description || "No description provided."}
                </p>

                <div className="flex items-center gap-2 mt-4 text-xs text-zinc-500">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{path.estimatedHours} hrs</span>
                  <span>·</span>
                  <span>{path.pathCourses?.length || 0} courses</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                <Link
                  href={`/learning/${path.slug}`}
                  target="_blank"
                  className="text-xs text-zinc-400 hover:text-zinc-200 inline-flex items-center gap-1 font-semibold"
                >
                  <span>Student View</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>

                {path.status === "draft" && (
                  <button
                    onClick={() => handlePublish(path.id)}
                    disabled={publishingId === path.id}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer"
                  >
                    {publishingId === path.id ? "Publishing..." : "Publish Path"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121218] border border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <h3 className="text-lg font-bold text-white">Create Learning Path</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-zinc-400 hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePath} className="mt-5 space-y-4 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">
                  Path Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Python for Problem Solving"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Outline the vision and skills gained..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">
                    Difficulty Level
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e: any) => setDifficulty(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-200 focus:outline-none"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">
                    Estimated Duration (Hours)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={estimatedHours}
                    onChange={(e) => setEstimatedHours(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-200 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="Python, Algorithms, Foundations"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-200 focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-zinc-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold cursor-pointer"
                >
                  {creating ? "Creating..." : "Save Path"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
