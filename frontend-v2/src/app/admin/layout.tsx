"use client";

import { usePathname, useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";

import { authAPI } from "@/config/api";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BrandLogo } from "@/components/BrandLogo";
import { Spinner } from "@/components/ui/spinner";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, updateUserLocal } = useAuth();
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
        <header className="bg-card border-b border-border h-16 flex items-center justify-between px-6 sticky top-0 z-10 shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <BrandLogo className="w-12 h-12 md:w-16 md:h-16" src="/logo-dark.svg" alt="CodeSkill" />
            <div>
              <p className="text-sm font-bold text-foreground leading-tight">CodeSkill Admin</p>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Chandigarh University</p>
            </div>
            <div className="hidden md:flex items-center gap-1.5 ml-3 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">System Live</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />

            <div className="flex items-center gap-2.5 pl-2 border-l border-border">
              <div className="w-8 h-8 bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-md flex items-center justify-center font-bold text-xs">
                {user?.name?.charAt(0) || "A"}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-foreground">{user?.name || "Administrator"}</p>
                <p className="text-[10px] text-muted-foreground font-medium">Examination Controller</p>
              </div>
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
