"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminLogo } from "./AdminLogo";
import Image from "next/image";
import { 
  LayoutDashboard, 
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
    <div className="w-64 bg-sidebar text-sidebar-foreground flex flex-col h-full border-r border-sidebar-border relative z-20">
      <div className="h-16 flex items-center px-4 border-b border-border gap-3 bg-card">
        <AdminLogo variant="sidebar" src="/logo-dark.svg" alt="CodeSkill" />
        <div className="min-w-0">
          <p className="text-sm font-bold text-foreground truncate leading-tight">CodeSkill Admin</p>
          <p className="text-[10px] text-muted-foreground font-semibold tracking-wide uppercase">Chandigarh University</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-3">
        <nav className="space-y-0.5">
          {navItems.map((item) => {
            const isCategoryActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            
            return (
              <div key={item.name} className="space-y-0.5">
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    isCategoryActive 
                      ? "bg-primary/10 text-primary border border-primary/20" 
                      : "hover:bg-muted/40 hover:text-foreground border border-transparent"
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
                  <Icon className={`w-4 h-4 shrink-0 ${isCategoryActive ? "text-primary" : "text-muted-foreground"}`} />
                  {item.name}
                </Link>

                {item.subItems && isCategoryActive && (
                  <div className="pl-8 pr-2 pb-1 space-y-0.5">
                    {item.subItems.map((sub) => {
                      const isSubActive = pathname === sub.href;
                      return (
                        <Link
                          key={sub.name}
                          href={sub.href}
                          className={`block px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                            isSubActive
                              ? "bg-primary/15 text-primary font-bold"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
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

        <div className="mt-6 mb-2 px-3 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">
          Portals
        </div>
        <nav className="space-y-0.5">
          <Link
            href="/company"
            target="_blank"
            className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium hover:bg-primary/10 hover:text-primary transition-colors group text-muted-foreground"
          >
            <div className="flex items-center gap-3">
              <Building2 className="w-4 h-4 group-hover:text-primary" />
              Company Portal
            </div>
            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
          <Link
            href="/campus"
            target="_blank"
            className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium hover:bg-emerald-500/10 hover:text-emerald-500 transition-colors group text-muted-foreground"
          >
            <div className="flex items-center gap-3">
              <GraduationCap className="w-4 h-4 group-hover:text-emerald-500" />
              Campus Portal
            </div>
            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        </nav>
      </div>

      {/* Footer with university name */}
      <div className="p-4 border-t border-border space-y-4">
        <div className="flex items-center gap-3 bg-muted/40 p-2.5 rounded-lg border border-border">
          <AdminLogo className="w-12 h-12 md:w-16 md:h-16" alt="Chandigarh University" />
          <div>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold">Developed for</p>
            <p className="text-xs font-bold text-foreground leading-tight">Chandigarh University</p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-xs font-semibold text-muted-foreground hover:bg-muted/40 hover:text-rose-500 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Log out
        </button>
      </div>
    </div>
  );
}
