"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Mail,
  Send,
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Filter,
  Users,
  Search,
} from "lucide-react";
import { adminStudentsAPI } from "@/config/api";
import { Spinner } from "@/components/ui/spinner";

interface EmailJob {
  _id: string;
  studentId: string;
  uid: string;
  name: string;
  email: string;
  status: "pending" | "queued" | "sent" | "failed" | "retrying";
  retryCount: number;
  sentAt?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export default function CredentialsPage() {
  const [jobs, setJobs] = useState<EmailJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingAll, setIsSendingAll] = useState(false);
  const [isRetryingFailed, setIsRetryingFailed] = useState(false);
  const [sendingSingleId, setSendingSingleId] = useState<string | null>(null);

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    queued: 0,
    sent: 0,
    failed: 0,
    retrying: 0,
  });

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchEmailStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminStudentsAPI.getEmailStatus({
        page,
        limit: 20,
        status: statusFilter,
      });

      setJobs(res.data?.jobs || []);
      setStats(
        res.data?.stats || {
          total: 0,
          pending: 0,
          queued: 0,
          sent: 0,
          failed: 0,
          retrying: 0,
        },
      );
      setTotalPages(res.data?.pagination?.totalPages || 1);
    } catch (err: any) {
      console.error("Failed to load email status", err);
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchEmailStatus();
    // Auto refresh every 8 seconds if there are queued or retrying jobs
    const timer = setInterval(() => {
      if (stats.queued > 0 || stats.retrying > 0) {
        fetchEmailStatus();
      }
    }, 8000);
    return () => clearInterval(timer);
  }, [fetchEmailStatus, stats.queued, stats.retrying]);

  const handleSendAll = async () => {
    if (
      !confirm(
        `Are you sure you want to dispatch credentials to all ${stats.pending} pending students?`,
      )
    ) {
      return;
    }

    setIsSendingAll(true);
    try {
      const res = await adminStudentsAPI.sendCredentials();
      alert(res.data?.message || "Emails queued successfully!");
      fetchEmailStatus();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to enqueue emails.");
    } finally {
      setIsSendingAll(false);
    }
  };

  const handleRetryFailed = async () => {
    setIsRetryingFailed(true);
    try {
      const res = await adminStudentsAPI.retryFailedCredentials();
      alert(res.data?.message || "Failed emails re-enqueued!");
      fetchEmailStatus();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to retry emails.");
    } finally {
      setIsRetryingFailed(false);
    }
  };

  const handleSendSingle = async (job: EmailJob) => {
    const studentTargetId = job.studentId || (job as any).student_id || job._id;
    if (!studentTargetId || studentTargetId === "undefined") {
      alert("Unable to find a valid student ID for this email job.");
      return;
    }
    setSendingSingleId(job._id);
    try {
      await adminStudentsAPI.sendSingleCredential(studentTargetId);
      fetchEmailStatus();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to send credential email.");
    } finally {
      setSendingSingleId(null);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Candidate Credential Dispatch
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
              BullMQ Queue
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor, enqueue, and retry automated delivery of examination credentials.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchEmailStatus()}
            className="p-2.5 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Refresh Status"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>

          {stats.failed > 0 && (
            <button
              onClick={handleRetryFailed}
              disabled={isRetryingFailed}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-red-300 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 text-red-600 text-xs font-bold hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              {isRetryingFailed ? (
                <Spinner className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RotateCcw className="w-3.5 h-3.5" />
              )}
              Retry Failed ({stats.failed})
            </button>
          )}

          <button
            onClick={handleSendAll}
            disabled={isSendingAll || stats.pending === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-50"
          >
            {isSendingAll ? (
              <Spinner className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            Send All Pending ({stats.pending})
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="text-xs text-muted-foreground font-medium">Pending</div>
          <div className="text-xl font-bold text-amber-600 mt-0.5">
            {stats.pending.toLocaleString()}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="text-xs text-muted-foreground font-medium">Queued</div>
          <div className="text-xl font-bold text-primary mt-0.5">
            {stats.queued.toLocaleString()}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="text-xs text-muted-foreground font-medium">Delivered</div>
          <div className="text-xl font-bold text-emerald-600 mt-0.5">
            {stats.sent.toLocaleString()}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="text-xs text-muted-foreground font-medium">Failed</div>
          <div className="text-xl font-bold text-red-600 mt-0.5">
            {stats.failed.toLocaleString()}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border col-span-2 sm:col-span-1">
          <div className="text-xs text-muted-foreground font-medium">Total Jobs</div>
          <div className="text-xl font-bold text-foreground mt-0.5">
            {stats.total.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1.5 border-b border-border pb-2 text-xs font-semibold">
        {[
          { id: "all", label: "All Jobs" },
          { id: "pending", label: "Pending" },
          { id: "queued", label: "In Queue" },
          { id: "sent", label: "Delivered" },
          { id: "failed", label: "Failed" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setStatusFilter(tab.id);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              statusFilter === tab.id
                ? "bg-amber-500 text-white shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Jobs Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <Spinner className="w-8 h-8 animate-spin text-amber-500" />
            <p className="text-sm">Fetching queue dispatch records...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="p-16 text-center text-muted-foreground">
            <Mail className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <div className="text-base font-semibold text-foreground">
              No credential jobs found
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Import students from spreadsheet or trigger individual resets to populate queue.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground uppercase font-semibold">
                  <th className="py-3 px-4">UID</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Retries</th>
                  <th className="py-3 px-4">Sent At / Error</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {jobs.map((job) => (
                  <tr key={job._id} className="hover:bg-muted/30 transition-colors">
                    {/* UID */}
                    <td className="py-3 px-4 font-mono font-bold text-amber-600 dark:text-amber-400">
                      {job.uid}
                    </td>

                    {/* Student Name & Email */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-foreground">{job.name}</div>
                      <div className="text-muted-foreground">{job.email}</div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      {job.status === "sent" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" /> Delivered
                        </span>
                      )}
                      {job.status === "queued" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold bg-primary/10 text-primary border border-primary/20">
                          <Clock className="w-3 h-3 animate-spin" /> Queued
                        </span>
                      )}
                      {job.status === "pending" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                          <Clock className="w-3 h-3" /> Pending
                        </span>
                      )}
                      {job.status === "failed" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold bg-red-500/10 text-red-600 border border-red-500/20">
                          <XCircle className="w-3 h-3" /> Failed
                        </span>
                      )}
                      {job.status === "retrying" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold bg-purple-500/10 text-purple-600 border border-purple-500/20">
                          <RotateCcw className="w-3 h-3 animate-spin" /> Retrying
                        </span>
                      )}
                    </td>

                    {/* Retries */}
                    <td className="py-3 px-4 font-mono text-muted-foreground">
                      {job.retryCount || 0}
                    </td>

                    {/* Sent At / Error Message */}
                    <td className="py-3 px-4 max-w-xs">
                      {job.sentAt ? (
                        <span className="text-muted-foreground">
                          {new Date(job.sentAt).toLocaleString()}
                        </span>
                      ) : job.error ? (
                        <span className="text-red-500 truncate block" title={job.error}>
                          {job.error}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleSendSingle(job)}
                        disabled={sendingSingleId === job._id}
                        className="px-2.5 py-1 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                        title="Dispatch / Re-send Credential Email"
                      >
                        {sendingSingleId === job._id ? (
                          <Spinner className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="p-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <div>Showing {jobs.length} jobs</div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-border disabled:opacity-40 hover:bg-muted"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-foreground">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-border disabled:opacity-40 hover:bg-muted"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
