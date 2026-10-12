"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminLogo } from "./AdminLogo";
import Image from "next/image";
import { 
  LayoutDashboard, 
  Home,
  Code2, 
  Users, 
  Trophy, 
  Building2, 
  GraduationCap, 
  Settings,
  ShieldCheck,
  LogOut,
  ExternalLink,
  ClipboardList,
  BookOpen,
  BarChart3,
  Terminal,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import gsap from "gsap";

const navItems = [
  { name: "Home", href: "/", icon: Home },
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  {
    name: "Students",
    href: "/admin/students",
    icon: GraduationCap,
    subItems: [
      { name: "All Students", href: "/admin/students" },
      { name: "Import Students", href: "/admin/students/import" },
      { name: "Credentials", href: "/admin/students/credentials" },
    ],
  },
  {
    name: "Question Bank",
    href: "/admin/questions",
    icon: Code2,
    subItems: [
      { name: "All Questions", href: "/admin/questions" },
      { name: "Create Question", href: "/admin/questions/create" },
      { name: "Bulk Import", href: "/admin/questions/import" },
      { name: "Pending Review", href: "/admin/questions/pending" },
      { name: "Topics", href: "/admin/questions/topics" },
    ],
  },
  {
    name: "Assessments",
    href: "/admin/assessments",
    icon: ClipboardList,
    subItems: [
      { name: "All Assessments", href: "/admin/assessments" },
      { name: "Create Assessment", href: "/admin/assessments/create" },
    ],
  },
  {
    name: "Practice Problems",
    href: "/admin/problems",
    icon: Code2,
    subItems: [
      { name: "All Problems", href: "/admin/problems" },
      { name: "Create Problem", href: "/admin/problems/create" },
    ],
  },
  { name: "Results & Scores", href: "/admin/candidates", icon: BarChart3 },
  { name: "Contests", href: "/admin/contests", icon: Trophy },
  { name: "Companies", href: "/admin/companies", icon: Building2 },
  { name: "Universities", href: "/admin/universities", icon: BookOpen },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/admin/login");
  };

  return (
    <div className="w-64 bg-white text-[#1F2937] flex flex-col h-full border-r border-[#E5E7EB] relative z-20 font-sans shadow-xs">
      <div className="h-20 flex items-center px-4 border-b border-[#E5E7EB] bg-[#FFFBF5]/60 shrink-0">
        <Link href="/admin/dashboard" className="flex items-center gap-3 group select-none">
          <AdminLogo variant="icon" size="md" />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-black tracking-tight text-[#1F2937] leading-none">
                Code<span className="text-[#7F1D1D]">Skill</span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-[#7F1D1D]/10 text-[#7F1D1D] border border-[#7F1D1D]/20 px-1.5 py-0.5 rounded leading-none shadow-xs">
                Admin
              </span>
            </div>
            <p className="text-[11px] font-semibold text-[#64748B] tracking-wide mt-1.5 truncate">
              Chandigarh University
            </p>
          </div>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-3">
        <nav className="space-y-0.5">
          {navItems.map((item) => {
            const isCategoryActive = pathname === item.href || (item.href !== "/" && Boolean(pathname?.startsWith(item.href)));
            const Icon = item.icon;
            
            return (
              <div key={item.name} className="space-y-0.5">
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                    isCategoryActive 
                      ? "bg-[#7F1D1D]/10 text-[#7F1D1D] border border-[#7F1D1D]/20 shadow-xs" 
                      : "hover:bg-[#FFFBF5] hover:text-[#7F1D1D] text-[#64748B] border border-transparent"
                  }`}
                  onMouseEnter={(e) => {
                    const icon = e.currentTarget.querySelector("svg");
                    if (icon) gsap.to(icon, { x: 3, duration: 0.2 });
                  }}
                  onMouseLeave={(e) => {
                    const icon = e.currentTarget.querySelector("svg");
                    if (icon) gsap.to(icon, { x: 0, duration: 0.2 });
                  }}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isCategoryActive ? "text-[#7F1D1D]" : "text-[#64748B]"}`} />
                  {item.name}
                </Link>

                {item.subItems && isCategoryActive && (
                  <div className="pl-8 pr-2 pb-1 space-y-0.5 mt-0.5">
                    {item.subItems.map((sub) => {
                      const isSubActive = pathname === sub.href;
                      return (
                        <Link
                          key={sub.name}
                          href={sub.href}
                          className={`block px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                            isSubActive
                              ? "bg-[#7F1D1D]/15 text-[#7F1D1D] font-bold"
                              : "text-[#64748B] hover:text-[#7F1D1D] hover:bg-[#FFFBF5]"
                          }`}
                          onMouseEnter={(e) => gsap.to(e.currentTarget, { x: 2, duration: 0.2 })}
                          onMouseLeave={(e) => gsap.to(e.currentTarget, { x: 0, duration: 0.2 })}
                        >
                          {sub.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="mt-6 mb-2 px-3 text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
          Portals
        </div>
        <nav className="space-y-0.5">
          <Link
            href="/company"
            target="_blank"
            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold hover:bg-[#FFFBF5] hover:text-[#7F1D1D] transition-colors group text-[#64748B]"
          >
            <div className="flex items-center gap-3">
              <Building2 className="w-4 h-4 group-hover:text-[#7F1D1D]" />
              Company Portal
            </div>
            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
          <Link
            href="/campus"
            target="_blank"
            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold hover:bg-emerald-50 hover:text-emerald-700 transition-colors group text-[#64748B]"
          >
            <div className="flex items-center gap-3">
              <GraduationCap className="w-4 h-4 group-hover:text-emerald-700" />
              Campus Portal
            </div>
            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        </nav>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-[#E5E7EB]">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-xl text-xs font-bold text-[#64748B] hover:bg-red-50 hover:text-red-700 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Log out
        </button>
      </div>
    </div>
  );
}
