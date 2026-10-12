"use client";

import { useEffect, useState } from "react";
import { adminContestsAPI } from "@/config/api";
import Link from "next/link";
import { Plus, Search, Edit2, Trash2, Eye, Calendar, Clock } from "lucide-react";

export default function ContestsAdminPage() {
  const [contests, setContests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [updatedSlug, setUpdatedSlug] = useState<string | null>(null);

  const [createdSlug, setCreatedSlug] = useState<string | null>(null);

  useEffect(() => {
    setCreatedSlug(new URLSearchParams(window.location.search).get("created"));
    setUpdatedSlug(new URLSearchParams(window.location.search).get("updated"));
    fetchContests();
  }, []);

  const fetchContests = async () => {
    try {
      const res = await adminContestsAPI.getAll();
      setContests(res.data.contests || []);
    } catch (err) {
      console.error("Failed to fetch contests", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this contest?")) {
      try {
        await adminContestsAPI.delete(id);
        fetchContests();
      } catch (err) {
        console.error("Failed to delete contest", err);
      }
    }
  };

  const getStatus = (startTime: string, endTime: string) => {
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (now < start) return { label: "Upcoming", color: "bg-blue-100 text-blue-700" };
    if (now >= start && now <= end) return { label: "Active", color: "bg-green-100 text-green-700" };
    return { label: "Ended", color: "bg-muted text-gray-700" };
  };

  const filteredContests = contests.filter((c) => 
    c.title.toLowerCase().includes(search.toLowerCase()) || 
    c.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 font-sans max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contest Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Schedule and manage coding competitions and assessments.</p>
        </div>
        <Link 
          href="/admin/contests/create" 
          className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-lg shadow-red-500/20 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Contest
        </Link>
      </div>

      {(createdSlug || updatedSlug) && (
        <div className="mb-6 p-4 rounded-xl border border-green-500/30 bg-green-500/10 text-sm text-green-700 dark:text-green-400 flex flex-wrap items-center justify-between gap-3">
          <span>Contest {updatedSlug ? "updated" : "created"} successfully.</span>
          <span className="font-mono">
            {typeof window !== "undefined" ? window.location.origin : ""}/contests/{updatedSlug || createdSlug}
          </span>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-border flex items-center justify-between gap-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search contests by title or slug..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-foreground transition-all"
            />
          </div>
          <div className="text-sm text-muted-foreground font-medium">
            {filteredContests.length} {filteredContests.length === 1 ? 'contest' : 'contests'}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-muted-foreground">
            <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border">
              <tr>
                <th className="px-6 py-3">Contest Details</th>
                <th className="px-6 py-3">Schedule</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Access</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">Loading contests...</td>
                </tr>
              ) : filteredContests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
                        <Search className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <p className="text-foreground font-medium">No contests found</p>
                      <p className="text-muted-foreground text-sm mt-1">Try adjusting your search or create a new contest.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredContests.map((contest) => {
                  const status = getStatus(contest.startTime, contest.endTime);
                  return (
                    <tr key={contest._id} className="hover:bg-muted/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-medium text-foreground">{contest.title}</div>
                        <div className="text-xs text-muted-foreground font-mono mt-0.5">{contest.slug}</div>
                        <div className="text-xs text-red-500 mt-1 font-medium">{contest.problems?.length || 0} problems</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(contest.startTime).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(contest.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(contest.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          status.label === 'Upcoming' ? 'bg-primary/10 text-primary' :
                          status.label === 'Active' ? 'bg-green-500/10 text-green-500' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {contest.isPrivate ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-500">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Private
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-500">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Public
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                          <Link href={`/contests/${contest.slug}`} target="_blank" className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors" title="View Contest">
                            <Eye className="w-4 h-4" />
                          </Link>
                          {(contest._id || contest.id) ? <Link href={`/admin/contests/${encodeURIComponent(contest._id || contest.id)}/edit`} className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors" title="Edit Contest" aria-label={`Edit ${contest.title}`}>
                            <Edit2 className="w-4 h-4" />
                          </Link> : <button type="button" disabled title="Contest ID is missing" aria-label="Edit unavailable" className="p-1.5 text-muted-foreground opacity-50"><Edit2 className="w-4 h-4" /></button>}
                          <button onClick={() => handleDelete(contest._id)} className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors" title="Delete Contest">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
