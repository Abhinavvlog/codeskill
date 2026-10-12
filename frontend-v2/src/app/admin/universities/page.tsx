"use client";

import { useEffect, useState } from "react";
import { adminUniversitiesAPI } from "@/config/api";
import { Spinner } from "@/components/ui/spinner";
import {
  Search,
  GraduationCap,
  BadgeCheck,
  Trash2,
  Plus,
  X,
  Building2,
  Globe,
  Mail,
  MapPin,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

const inputCls =
  "w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all";
const labelCls = "block text-xs font-semibold text-foreground/80 mb-1.5 uppercase tracking-wide";

export default function AdminUniversitiesPage() {
  const [universities, setUniversities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState(false);

  const [form, setForm] = useState({
    name: "",
    domain: "",
    website: "",
    location: "",
    contactEmail: "",
  });

  useEffect(() => {
    fetchUniversities();
  }, [search]);

  const fetchUniversities = async () => {
    try {
      setLoading(true);
      const res = await adminUniversitiesAPI.getAll(search);
      const data = res.data;
      setUniversities(data?.universities || data || []);
    } catch (err) {
      console.error("Failed to fetch universities", err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id: string, name: string) => {
    if (confirm(`Toggle verification for ${name}?`)) {
      try {
        await adminUniversitiesAPI.toggleVerify(id);
        fetchUniversities();
      } catch (err: any) {
        alert(err.response?.data?.message || "Failed");
      }
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (
      confirm(`Permanently delete ${name}? This action cannot be undone.`)
    ) {
      try {
        await adminUniversitiesAPI.delete(id);
        fetchUniversities();
      } catch (err: any) {
        alert(err.response?.data?.message || "Failed to delete");
      }
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setCreateError("University name is required.");
      return;
    }
    setIsCreating(true);
    setCreateError(null);
    try {
      await adminUniversitiesAPI.create(form);
      setCreateSuccess(true);
      setTimeout(() => {
        setShowAddModal(false);
        setCreateSuccess(false);
        setForm({ name: "", domain: "", website: "", location: "", contactEmail: "" });
        fetchUniversities();
      }, 1200);
    } catch (err: any) {
      setCreateError(err.response?.data?.message || "Failed to create university.");
    } finally {
      setIsCreating(false);
    }
  };

  const prefillCU = () => {
    setForm({
      name: "Chandigarh University",
      domain: "cuchd.in",
      website: "https://www.cuchd.in",
      location: "Mohali, Punjab, India",
      contactEmail: "admissions@cuchd.in",
    });
  };

  return (
    <div className="p-6 font-sans max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-md overflow-hidden bg-white shrink-0 border border-slate-200 p-0.5 flex items-center justify-center">
              <img
                src="https://images.seeklogo.com/logo-png/43/1/chandigarh-university-cu-logo-png_seeklogo-432515.png"
                alt="CU"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/cu-logo.png";
                }}
              />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Universities & Campuses</h1>
          </div>
          <p className="text-muted-foreground text-xs">
            Manage academic institutions using the Chandigarh University assessment platform.
          </p>
        </div>
        <button
          onClick={() => { setShowAddModal(true); setCreateError(null); setCreateSuccess(false); }}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-lg transition-colors shadow-xs shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          Add University
        </button>
      </div>

      {/* CU Banner */}
      <div className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-lg shadow-xs">
        <div className="w-12 h-12 rounded-md overflow-hidden bg-white shrink-0 border border-slate-200 p-0.5 flex items-center justify-center">
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
          <p className="font-bold text-slate-900 text-sm">Chandigarh University</p>
          <p className="text-xs text-muted-foreground">Mohali, Punjab — Primary Academic Institution</p>
        </div>
        <span className="ml-auto px-2.5 py-0.5 text-[10px] font-bold rounded bg-red-50 text-primary border border-red-200">
          PRIMARY
        </span>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search universities…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-foreground transition-all"
            />
          </div>
          <span className="text-xs text-muted-foreground font-medium shrink-0">
            {universities.length} institution{universities.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Institution</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Domain</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Location</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Students</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    <Spinner className="w-5 h-5 animate-spin mx-auto mb-2" />
                    Loading universities…
                  </td>
                </tr>
              ) : universities.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    <GraduationCap className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No universities found.</p>
                    <button
                      onClick={() => { setShowAddModal(true); prefillCU(); }}
                      className="mt-3 text-xs text-amber-500 hover:underline"
                    >
                      + Add Chandigarh University
                    </button>
                  </td>
                </tr>
              ) : (
                universities.map((uni) => (
                  <tr key={uni._id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-foreground/5 border border-border flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground text-sm">{uni.name}</p>
                          {uni.website && (
                            <a
                              href={uni.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-muted-foreground hover:text-foreground"
                            >
                              {uni.website}
                            </a>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground font-mono">
                      {uni.domain || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {uni.location || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground font-semibold">
                      {uni.studentCount ?? uni.totalStudents ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      {uni.isVerified ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400">
                          <BadgeCheck className="w-3 h-3" /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleVerify(uni._id, uni.name)}
                          className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-muted hover:bg-muted/70 text-foreground transition-colors"
                        >
                          {uni.isVerified ? "Unverify" : "Verify"}
                        </button>
                        <button
                          onClick={() => handleDelete(uni._id, uni.name)}
                          className="p-1.5 text-muted-foreground hover:text-rose-500 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add University Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h2 className="text-base font-bold text-foreground">Add University</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Register a new institution on the platform</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {/* Quick fill for CU */}
              <button
                type="button"
                onClick={prefillCU}
                className="w-full flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/25 rounded-xl hover:bg-amber-500/15 transition-colors"
              >
                <div className="w-8 h-8 rounded-md overflow-hidden bg-white shrink-0 border border-slate-200 p-0.5 flex items-center justify-center">
                  <img
                    src="https://images.seeklogo.com/logo-png/43/1/chandigarh-university-cu-logo-png_seeklogo-432515.png"
                    alt="CU"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/cu-logo.png";
                    }}
                  />
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-amber-400">Quick fill: Chandigarh University</p>
                  <p className="text-[10px] text-muted-foreground">Mohali, Punjab, India</p>
                </div>
              </button>

              <div>
                <label className={labelCls}>University Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Chandigarh University"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className={inputCls}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Domain</label>
                  <input
                    type="text"
                    placeholder="cuchd.in"
                    value={form.domain}
                    onChange={(e) => setForm((p) => ({ ...p, domain: e.target.value }))}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Location</label>
                  <input
                    type="text"
                    placeholder="Mohali, Punjab"
                    value={form.location}
                    onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>Website</label>
                <input
                  type="url"
                  placeholder="https://www.cuchd.in"
                  value={form.website}
                  onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))}
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Contact Email</label>
                <input
                  type="email"
                  placeholder="admissions@cuchd.in"
                  value={form.contactEmail}
                  onChange={(e) => setForm((p) => ({ ...p, contactEmail: e.target.value }))}
                  className={inputCls}
                />
              </div>

              {createError && (
                <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <p className="text-xs text-rose-400">{createError}</p>
                </div>
              )}

              {createSuccess && (
                <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <p className="text-xs text-emerald-400">University created successfully!</p>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-zinc-950 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
                >
                  {isCreating ? <Spinner className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Add University
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
