"use client";

import { usePathname, useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";

import { authAPI } from "@/config/api";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AdminLogo } from "@/components/admin/AdminLogo";
import { Spinner } from "@/components/ui/spinner";
import { ChevronDown, UserCog, SlidersHorizontal, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, updateUserLocal, logout } = useAuth();
  const [isVerifying, setIsVerifying] = useState(true);

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      if (loading) return;

      const token = typeof window !== "undefined" ? localStorage.getItem("codeskill_token") : null;

      if (isLoginPage) {
        if (user && user.isAdmin) {
          router.replace("/admin/dashboard");
        } else if (token) {
          try {
            const res = await authAPI.getMe();
            const freshUser = res.data?.user;
            if (freshUser && freshUser.isAdmin) {
              updateUserLocal(freshUser);
              router.replace("/admin/dashboard");
              return;
            }
          } catch (_) {
            // invalid token
          }
          setIsVerifying(false);
        } else {
          setIsVerifying(false);
        }
        return;
      }

      if (user && user.isAdmin) {
        if (isMounted) setIsVerifying(false);
        return;
      }

      if (token) {
        try {
          const res = await authAPI.getMe();
          const freshUser = res.data?.user;
          if (
            freshUser &&
            (freshUser.isAdmin ||
              ["admin", "super_admin", "assessment_admin"].includes(freshUser.role))
          ) {
            updateUserLocal(freshUser);
            if (isMounted) setIsVerifying(false);
            return;
          } else {
            router.replace("/dashboard");
            return;
          }
        } catch (err) {
          router.replace("/admin/login");
          return;
        }
      }


      router.replace("/admin/login");
    }

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [user, loading, router, isLoginPage, updateUserLocal]);

  const handleLogout = () => {
    logout();
    router.push("/admin/login");
  };

  const userName = user?.name || "Md Shadab Azam Ansari";
  const userInitial = userName.charAt(0).toUpperCase() || "M";
  const userEmail = user?.email || "admin@cumail.in";
  const userRole = user?.role ? (user.role === "admin" ? "Admin" : user.role) : "Admin";

  if (loading || isVerifying) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Spinner className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Standardized Admin Header with CodeSkill Branding & Theme Toggle */}
        <header className="bg-card/90 backdrop-blur-md border-b border-border h-20 flex items-center justify-between px-6 sticky top-0 z-10 shrink-0 shadow-xs">
          <div className="flex items-center gap-4">
            <AdminLogo variant="icon" size="md" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl md:text-2xl font-black tracking-tight text-foreground leading-none">
                  Code<span className="text-rose-600 dark:text-rose-500">Skill</span>
                </span>
                <span className="px-2 py-0.5 text-xs font-bold uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25 rounded-md leading-none shadow-xs">
                  Admin Console
                </span>
              </div>
              <p className="text-xs font-semibold text-muted-foreground tracking-wide mt-1">
                Chandigarh University <span className="hidden lg:inline">• Department of Skill Development & Lab</span>
              </p>
            </div>
            <div className="hidden xl:flex items-center gap-1.5 ml-4 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-md">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">System Live</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />

            <div className="pl-2 border-l border-border">
              <DropdownMenu>
                <DropdownMenuTrigger
                  openOnHover
                  delay={100}
                  closeDelay={150}
                  className="flex items-center gap-3 p-1.5 sm:px-2.5 rounded-xl border border-transparent hover:border-border hover:bg-muted/60 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 group select-none text-left"
                >
                  <div className="w-8 h-8 bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 shadow-xs ring-1 ring-amber-500/10">
                    {userInitial}
                  </div>
                  <div className="hidden sm:block">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-semibold text-foreground leading-none">
                        {userName}
                      </p>
                      <span className="text-[10px] font-bold text-muted-foreground">
                        ({userRole})
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground font-medium mt-1">
                      Examination Controller
                    </p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-transform duration-200 group-data-[popup-open]:rotate-180 ml-0.5 shrink-0" />
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  sideOffset={8}
                  className="w-64 bg-card/95 backdrop-blur-md border border-border rounded-xl shadow-xl p-1.5 z-50 text-foreground"
                >
                  {/* User Header Section: Show user full name, role, and email address */}
                  <div className="px-3 py-2.5 mb-1 bg-muted/40 rounded-lg border border-border/50">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-sm shrink-0">
                        {userInitial}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-foreground truncate">
                          {userName}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {userEmail}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded">
                            {userRole}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-medium truncate">
                            Examination Controller
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      onClick={() => router.push("/admin/settings")}
                      className="cursor-pointer gap-2.5 px-3 py-2 text-xs font-medium rounded-lg hover:bg-muted focus:bg-muted text-foreground transition-colors"
                    >
                      <UserCog className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span>Profile Settings</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => router.push("/admin/settings")}
                      className="cursor-pointer gap-2.5 px-3 py-2 text-xs font-medium rounded-lg hover:bg-muted focus:bg-muted text-foreground transition-colors"
                    >
                      <SlidersHorizontal className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span>Account Preferences</span>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>

                  <DropdownMenuSeparator className="my-1 bg-border/80" />

                  <DropdownMenuItem
                    variant="destructive"
                    onClick={handleLogout}
                    className="cursor-pointer gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 focus:bg-rose-500/10 focus:text-rose-600 transition-colors"
                  >
                    <LogOut className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                    <span>Log Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto relative">
          {children}
        </main>
      </div>
    </div>
  );
}
