"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Trophy, 
  Plus, 
  Search, 
  Clock, 
  Award, 
  Users, 
  CheckCircle2, 
  Copy, 
  Check, 
  BarChart3, 
  ExternalLink,
  ShieldAlert,
  Calendar,
  Layers,
  Trash2,
  RefreshCw,
  Settings2,
  X,
  Power,
  Edit3
} from "lucide-react";
import { adminAssessmentsAPI } from "@/config/api";
import { Spinner } from "@/components/ui/spinner";

export default function AdminAssessmentsPage() {
  const [assessments, setAssessments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Timing & Schedule / Edit Modal State
  const [editingAssessment, setEditingAssessment] = useState<any | null>(null);
  const [scheduleData, setScheduleData] = useState({
    title: "",
    description: "",
    allowedAttempts: 1,
    status: "published",
    durationMinutes: 45,
    startTime: "",
    endTime: "",
    enforceFullscreen: true,
    detectTabSwitch: true,
    blockCopyPaste: true,
  });
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);

  const fetchAssessments = async () => {
    setIsLoading(true);
    try {
      const res = await adminAssessmentsAPI.getAll({ search });
      setAssessments(res.data.assessments || []);
    } catch (err) {
      console.error("Failed to load assessments:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessments();
  }, [search]);

  const handleCopyLink = (code: string, id: string) => {
    const url = `${window.location.origin}/assessments/${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "published" ? "draft" : "published";
    try {
      await adminAssessmentsAPI.updateStatus(id, newStatus);
      setAssessments((prev) =>
        prev.map((a) => (a._id === id ? { ...a, status: newStatus } : a))
      );
    } catch (err) {
      alert("Failed to toggle assessment availability status");
    }
  };

  const handleOpenScheduleModal = (test: any) => {
    setEditingAssessment(test);
    setScheduleData({
      title: test.title || "",
      description: test.description || "",
      allowedAttempts: test.allowedAttempts !== undefined ? Number(test.allowedAttempts) : 1,
      status: test.status || "published",
      durationMinutes: test.durationMinutes || 45,
      startTime: test.startTime ? new Date(test.startTime).toISOString().slice(0, 16) : "",
      endTime: test.endTime ? new Date(test.endTime).toISOString().slice(0, 16) : "",
      enforceFullscreen: test.proctoring?.enforceFullscreen !== false,
      detectTabSwitch: test.proctoring?.detectTabSwitch !== false,
      blockCopyPaste: test.proctoring?.blockCopyPaste !== false,
    });
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAssessment) return;
    setIsSavingSchedule(true);
    try {
      await adminAssessmentsAPI.update(editingAssessment._id, {
        title: scheduleData.title,
        description: scheduleData.description,
        allowedAttempts: Number(scheduleData.allowedAttempts),
        status: scheduleData.status,
        durationMinutes: Number(scheduleData.durationMinutes),
        startTime: scheduleData.startTime || undefined,
        endTime: scheduleData.endTime || undefined,
        proctoring: {
          enforceFullscreen: scheduleData.enforceFullscreen,
          detectTabSwitch: scheduleData.detectTabSwitch,
          blockCopyPaste: scheduleData.blockCopyPaste,
        },
      });
      setEditingAssessment(null);
      fetchAssessments();
    } catch (err) {
      alert("Failed to update assessment settings");
    } finally {
      setIsSavingSchedule(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to archive assessment "${title}"?`)) return;
    try {
      await adminAssessmentsAPI.delete(id);
      fetchAssessments();
    } catch (err) {
      alert("Failed to archive assessment");
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-card shrink-0 border border-border p-1 flex items-center justify-center shadow-xs">
              <img
                src="https://images.seeklogo.com/logo-png/43/1/chandigarh-university-cu-logo-png_seeklogo-432515.png"
                alt="Chandigarh University"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/cu-logo.png";
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                  Assessments & Examinations
                </h1>
                <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25">
                  Chandigarh University
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Manage university examinations, availability triggers, scheduled timings, and proctoring policies.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/assessments/create"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold uppercase tracking-wider rounded-lg transition-all shadow-md shadow-primary/20 hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" /> Create Assessment
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assessments by title or test code..."
            className="w-full pl-10 pr-4 py-2 bg-muted/40 border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <button
          onClick={fetchAssessments}
          className="p-2 border border-border hover:bg-muted text-muted-foreground hover:text-foreground rounded-xl text-xs font-medium transition-colors"
          title="Refresh List"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Assessments Grid */}
      {isLoading ? (
        <div className="py-20 text-center text-muted-foreground text-sm">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
          Loading assessments...
        </div>
      ) : assessments.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-2xl p-8 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-foreground">No Assessments Found</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Get started by creating your first standardized university MCQ test from the Question Bank.
          </p>
          <Link
            href="/admin/assessments/create"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl text-sm hover:bg-primary/90 transition-colors shadow-md shadow-primary/20"
          >
            <Plus className="w-4 h-4" /> Create Assessment Now
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {assessments.map((test) => {
            const isLive = test.status === "published";

            return (
              <div
                key={test._id}
                className="bg-card border border-border rounded-2xl p-5 hover:border-primary/40 transition-all flex flex-col justify-between group shadow-sm relative"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-primary/10 text-primary border border-primary/20">
                        {test.code}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                          test.allowedAttempts === 0
                            ? "bg-purple-500/10 text-purple-400 border-purple-500/30"
                            : test.allowedAttempts === 1
                            ? "bg-zinc-500/10 text-zinc-400 border-zinc-500/30"
                            : "bg-primary/10 text-primary border-primary/30"
                        }`}
                      >
                        {test.allowedAttempts === 0
                          ? "Unlimited Attempts"
                          : test.allowedAttempts === 1
                          ? "1 Attempt"
                          : `${test.allowedAttempts} Attempts`}
                      </span>
                    </div>

                    {/* Instant Admin Live Trigger Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(test._id, test.status)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all border ${
                        isLive
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                          : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                      }`}
                      title={isLive ? "Click to disable test (switch to draft)" : "Click to publish test (make available)"}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isLive ? "bg-emerald-400 animate-pulse" : "bg-muted-foreground"}`} />
                      <span>{isLive ? "Live Available" : "Disabled / Draft"}</span>
                    </button>
                  </div>

                  <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    {test.title}
                  </h3>
                  {test.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {test.description}
                    </p>
                  )}

                  {/* Scheduled Window Banner */}
                  {(test.startTime || test.endTime) && (
                    <div className="mt-3 p-2 rounded-lg bg-muted/30 border border-border/50 text-[11px] text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="truncate">
                        {test.startTime ? new Date(test.startTime).toLocaleString([], { dateStyle: "short", timeStyle: "short" }) : "Immediate"}
                        {" → "}
                        {test.endTime ? new Date(test.endTime).toLocaleString([], { dateStyle: "short", timeStyle: "short" }) : "Open"}
                      </span>
                    </div>
                  )}

                  {/* Key Metrics */}
                  <div className="grid grid-cols-3 gap-2 py-4 my-4 border-y border-border/60 text-xs">
                    <div className="space-y-0.5">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3 text-primary" /> Duration
                      </span>
                      <p className="font-bold text-foreground">{test.durationMinutes} mins</p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Award className="w-3 h-3 text-emerald-400" /> Total Marks
                      </span>
                      <p className="font-bold text-foreground">{test.totalMarks} pts</p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Layers className="w-3 h-3 text-primary" /> Questions
                      </span>
                      <p className="font-bold text-foreground">{test.questions?.length || 0} Qs</p>
                    </div>
                  </div>

                  {/* Anti-cheat summary */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                    <div className="flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-primary" />
                      <span>Camera, Voice & Anti-Cheat Enabled</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="pt-2 flex items-center justify-between border-t border-border/40 gap-2">
                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/admin/assessments/${test._id}/results`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold transition-colors border border-border"
                    >
                      <BarChart3 className="w-3.5 h-3.5 text-primary" /> Results
                    </Link>

                    {/* Edit Test Trigger */}
                    <button
                      onClick={() => handleOpenScheduleModal(test)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/30 bg-primary/10 hover:bg-primary/20 text-xs font-bold text-primary transition-colors"
                      title="Edit Assessment Title, Attempts, Duration, and Policy"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Test</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleCopyLink(test.code, test._id)}
                      className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      title="Copy Candidate Link"
                    >
                      {copiedId === test._id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <Link
                      href={`/assessments/${test._id}`}
                      target="_blank"
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      title="Preview Candidate Interface"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>

                    <button
                      onClick={() => handleDelete(test._id, test.title)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Archive Assessment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Assessment Settings & Policy Modal */}
      {editingAssessment && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl p-6 max-w-lg w-full space-y-5 animate-in fade-in zoom-in-95 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Edit Assessment Settings</h3>
                  <p className="text-xs text-muted-foreground font-mono">{editingAssessment.code}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingAssessment(null)}
                className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSchedule} className="space-y-4 text-xs">
              {/* Title */}
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Assessment Title</label>
                <input
                  type="text"
                  value={scheduleData.title}
                  onChange={(e) => setScheduleData({ ...scheduleData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Description / Instructions</label>
                <textarea
                  rows={2}
                  value={scheduleData.description}
                  onChange={(e) => setScheduleData({ ...scheduleData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                  placeholder="Optional brief description or guidelines..."
                />
              </div>

              {/* Attempt Policy */}
              <div className="space-y-1.5 p-3 rounded-2xl bg-primary/5 border border-primary/20">
                <label className="font-bold text-foreground flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-primary">
                    <Award className="w-3.5 h-3.5" /> Attempt Policy
                  </span>
                  <span className="text-[10px] text-muted-foreground font-normal">Re-attempts keep highest score</span>
                </label>
                <select
                  value={scheduleData.allowedAttempts}
                  onChange={(e) => setScheduleData({ ...scheduleData, allowedAttempts: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                >
                  <option value={1}>1 Attempt Allowed (Strict Single Examination)</option>
                  <option value={0}>Multiple / Unlimited Attempts (Keep Highest Score)</option>
                  <option value={2}>2 Attempts Allowed (Keep Highest Score)</option>
                  <option value={3}>3 Attempts Allowed (Keep Highest Score)</option>
                  <option value={5}>5 Attempts Allowed (Keep Highest Score)</option>
                </select>
                <p className="text-[11px] text-muted-foreground">
                  {scheduleData.allowedAttempts === 0
                    ? "Students can re-take this test anytime. Their highest score is recorded."
                    : scheduleData.allowedAttempts === 1
                    ? "Students can only submit once. Once submitted, they cannot retake."
                    : `Students can take up to ${scheduleData.allowedAttempts} attempts. The highest score will be saved.`}
                </p>
              </div>

              {/* Status Trigger */}
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Availability Status</label>
                <select
                  value={scheduleData.status}
                  onChange={(e) => setScheduleData({ ...scheduleData, status: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="published">Available Now (Published / Live)</option>
                  <option value="draft">Disabled / Draft (Students Cannot Enter)</option>
                  <option value="completed">Concluded (Completed)</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              {/* Duration Minutes */}
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Test Duration (Minutes)</label>
                <input
                  type="number"
                  min="1"
                  max="360"
                  value={scheduleData.durationMinutes}
                  onChange={(e) => setScheduleData({ ...scheduleData, durationMinutes: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              {/* Start & End Times */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Start Window (Optional)</label>
                  <input
                    type="datetime-local"
                    value={scheduleData.startTime}
                    onChange={(e) => setScheduleData({ ...scheduleData, startTime: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <span className="text-[10px] text-muted-foreground">Students cannot start before this time.</span>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">End Deadline (Optional)</label>
                  <input
                    type="datetime-local"
                    value={scheduleData.endTime}
                    onChange={(e) => setScheduleData({ ...scheduleData, endTime: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <span className="text-[10px] text-muted-foreground">Submissions close after this time.</span>
                </div>
              </div>

              {/* Anti-cheat toggles */}
              <div className="space-y-2 pt-2 border-t border-border">
                <label className="font-semibold text-foreground block">Proctoring Enforcement</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <label className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border cursor-pointer">
                    <input
                      type="checkbox"
                      checked={scheduleData.enforceFullscreen}
                      onChange={(e) => setScheduleData({ ...scheduleData, enforceFullscreen: e.target.checked })}
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <span>Enforce Fullscreen</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border cursor-pointer">
                    <input
                      type="checkbox"
                      checked={scheduleData.detectTabSwitch}
                      onChange={(e) => setScheduleData({ ...scheduleData, detectTabSwitch: e.target.checked })}
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <span>Detect Tab Switches</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setEditingAssessment(null)}
                  className="px-4 py-2 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingSchedule}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl shadow-md shadow-primary/20 disabled:opacity-50"
                >
                  {isSavingSchedule ? <Spinner className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
