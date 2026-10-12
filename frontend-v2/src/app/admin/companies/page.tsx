"use client";

import { useEffect, useState } from "react";
import { adminCompaniesAPI } from "@/config/api";
import { Search, Building2, BadgeCheck, Trash2, ShieldAlert } from "lucide-react";
import Link from "next/link";

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchCompanies();
  }, [search]); // Normally debounce this

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const res = await adminCompaniesAPI.getAll(search);
      setCompanies(res.data.companies);
    } catch (err) {
      console.error("Failed to fetch companies", err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to toggle verification for ${name}?`)) {
      try {
        await adminCompaniesAPI.toggleVerify(id);
        fetchCompanies();
      } catch (err: any) {
        alert(err.response?.data?.message || "Failed to verify company");
      }
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`CRITICAL WARNING: Are you sure you want to permanently delete ${name}? This action cannot be undone.`)) {
      try {
        await adminCompaniesAPI.delete(id);
        fetchCompanies();
      } catch (err: any) {
        alert(err.response?.data?.message || "Failed to delete company");
      }
    }
  };

  return (
    <div className="p-8 font-sans max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Registered Companies</h1>
          <p className="text-muted-foreground text-sm mt-1">View, verify, and manage all organizations using the platform.</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-border flex items-center justify-between gap-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search companies by name or industry..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground transition-all"
            />
          </div>
          <div className="text-sm text-muted-foreground font-medium">
            {companies.length} {companies.length === 1 ? 'company' : 'companies'}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-muted-foreground">
            <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border">
              <tr>
                <th className="px-6 py-3">Company Details</th>
                <th className="px-6 py-3">Industry</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Registered On</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">Loading companies...</td>
                </tr>
              ) : companies.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
                        <Building2 className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <p className="text-foreground font-medium">No companies found</p>
                      <p className="text-xs text-muted-foreground/70">There are no organizations matching your search.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                companies.map((company) => (
                  <tr key={company._id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg border border-border bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                          {company.logo ? (
                            <img src={company.logo} alt={company.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="font-bold text-lg text-muted-foreground">{company.name.charAt(0)}</span>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-foreground flex items-center gap-1.5">
                            <Link href={`/${company.username}`} target="_blank" className="hover:text-primary hover:underline transition-colors">
                              {company.name}
                            </Link>
                            {company.isVerified && <BadgeCheck className="w-4 h-4 text-primary" />}
                          </div>
                          <div className="text-xs text-muted-foreground font-mono mt-0.5">@{company.username}</div>
                          <div className="text-[10px] text-muted-foreground/70 mt-1 uppercase tracking-wider">
                            Owner: {company.createdBy?.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-foreground">
                      {company.industry || <span className="text-muted-foreground italic">Not specified</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        company.isVerified ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-muted text-muted-foreground border border-border'
                      }`}>
                        {company.isVerified ? "Verified" : "Unverified"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {new Date(company.createdAt).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleVerify(company._id, company.name)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1 ${
                            company.isVerified 
                              ? "bg-muted text-muted-foreground hover:bg-amber-500/10 hover:text-amber-500" 
                              : "bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground"
                          }`}
                          title={company.isVerified ? "Revoke Verification" : "Verify Company"}
                        >
                          {company.isVerified ? "Revoke" : "Verify"}
                        </button>
                        
                        <button 
                          onClick={() => handleDelete(company._id, company.name)}
                          className="p-1.5 bg-muted text-muted-foreground hover:bg-red-500/10 hover:text-red-500 rounded-md transition-colors"
                          title="Delete Company"
                        >
                          <Trash2 className="w-4 h-4" />
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
    </div>
  );
}
