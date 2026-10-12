"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { KeyRound, AlertCircle, CheckCircle2, ShieldCheck, Terminal } from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { Spinner } from "@/components/ui/spinner";
import { LoginForm, LoginFormValues } from "@/components/auth/LoginForm";

// Modal specific schemas
const forcePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Temporary password is required."),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters long.")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter.")
      .regex(/[0-9]/, "Must contain at least one number.")
      .regex(/[^a-zA-Z0-9]/, "Must contain at least one special character."),
    confirmPassword: z.string().min(1, "Please confirm your new password."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type ForcePasswordFormValues = z.infer<typeof forcePasswordSchema>;

export default function AppLoginPage() {
  const [loading, setLoading] = useState(false);
  const [showForcePasswordModal, setShowForcePasswordModal] = useState(false);
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);

  const { login, forceChangePassword } = useAuth();
  const router = useRouter();

  const forceForm = useForm<ForcePasswordFormValues>({
    resolver: zodResolver(forcePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const handleLogin = async (data: LoginFormValues) => {
    setLoading(true);
    try {
      const input = data.email.trim();
      const res = await login({ email: input, password: data.password });

      if (res?.user?.forcePasswordChange) {
        forceForm.setValue("currentPassword", data.password);
        setShowForcePasswordModal(true);
      } else if (res?.user?.isAdmin) {
        window.location.href = "/admin/dashboard";
      } else if (res?.user?.isAssessmentStudent) {
        window.location.href = "/assessments";
      } else {
        window.location.href = "/dashboard";
      }
    } finally {
      setLoading(false);
    }
  };

  const onForcePasswordSubmit = async (data: ForcePasswordFormValues) => {
    setLoading(true);
    try {
      await forceChangePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      setPasswordChangeSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update password. Please try again.";
      forceForm.setError("root", {
        type: "manual",
        message: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFBF5] dark:bg-[#080D1B] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 relative selection:bg-[#7F1D1D] selection:text-white">
      {/* Background Subtle Geometry */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(250,204,21,0.08),transparent)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:36px_36px] pointer-events-none" />

      {/* Centered Authentication Card */}
      <div className="relative z-10 w-full max-w-[440px] bg-white dark:bg-[#151E30] border border-[#E5E7EB] dark:border-[#334155] rounded-2xl shadow-xl p-8 sm:p-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-[#7F1D1D] text-white flex items-center justify-center font-bold text-sm shadow-md group-hover:scale-105 transition-transform">
              <Terminal className="w-5 h-5 text-[#FACC15]" />
            </div>
            <div className="text-left leading-none">
              <span className="font-extrabold text-lg tracking-tight text-[#111827] dark:text-[#F8FAFC]">
                Code<span className="text-[#7F1D1D] dark:text-[#FACC15]">Skill</span>
              </span>
              <span className="block text-[10px] text-[#64748B] dark:text-[#94A3B8] font-medium tracking-wide">
                Assessment System
              </span>
            </div>
          </Link>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#111827] dark:text-[#F8FAFC]">
              Log in to your account
            </h1>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1.5">
              Enter your student email or official UID to access practice and assessments.
            </p>
          </div>
        </div>

        {/* Login Form Component */}
        <LoginForm onSubmit={handleLogin} loading={loading} showSocial={true} />

        {/* Security & Support Note */}
        <div className="pt-2 border-t border-[#E5E7EB] dark:border-[#334155]/60 text-center space-y-2">
          <div className="flex items-center justify-center gap-1.5 text-xs text-[#64748B] dark:text-[#94A3B8]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
            <span>Proctored and monitored examination environment</span>
          </div>
          <div>
            <Link
              href="/"
              className="text-xs font-semibold text-[#64748B] hover:text-[#7F1D1D] dark:hover:text-[#FACC15] transition-colors"
            >
              &larr; Return to homepage
            </Link>
          </div>
        </div>
      </div>

      {/* Modal: First-Time Mandatory Password Change */}
      {showForcePasswordModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#151E30] border border-[#E5E7EB] dark:border-[#334155] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center gap-3 border-b border-[#E5E7EB] dark:border-[#334155] pb-3">
              <div className="w-10 h-10 rounded-xl bg-[#7F1D1D]/10 text-[#7F1D1D] dark:bg-[#7F1D1D]/20 dark:text-[#FACC15] flex items-center justify-center shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#111827] dark:text-[#F8FAFC]">
                  Mandatory Password Setup
                </h3>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                  This is your first login. You must set a permanent secure password before proceeding.
                </p>
              </div>
            </div>

            {passwordChangeSuccess ? (
              <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
                <h4 className="text-base font-bold text-emerald-400">
                  Password Updated Successfully!
                </h4>
                <p className="text-xs text-emerald-300">
                  Redirecting to your student assessment dashboard...
                </p>
              </div>
            ) : (
              <form
                onSubmit={forceForm.handleSubmit(onForcePasswordSubmit)}
                className="space-y-4"
              >
                {forceForm.formState.errors.root && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{forceForm.formState.errors.root.message}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#111827] dark:text-[#F8FAFC]">
                    Temporary / Initial Password
                  </label>
                  <input
                    type="password"
                    readOnly
                    className="w-full h-10 px-3 rounded-xl border border-[#E5E7EB] dark:border-[#334155] bg-gray-100 dark:bg-[#1E293B] text-[#64748B] dark:text-[#94A3B8] text-xs font-mono cursor-not-allowed"
                    {...forceForm.register("currentPassword")}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#111827] dark:text-[#F8FAFC]">
                    New Permanent Password
                  </label>
                  <input
                    type="password"
                    placeholder="Min 8 chars, 1 uppercase, 1 number, 1 special char"
                    className="w-full h-10 px-3 rounded-xl border border-[#E5E7EB] dark:border-[#334155] bg-white dark:bg-[#151E30] text-[#111827] dark:text-[#F8FAFC] text-xs focus:ring-2 focus:ring-[#7F1D1D]/20 focus:border-[#7F1D1D] outline-none"
                    {...forceForm.register("newPassword")}
                  />
                  {forceForm.formState.errors.newPassword && (
                    <p className="text-xs text-rose-500">
                      {forceForm.formState.errors.newPassword.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#111827] dark:text-[#F8FAFC]">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    placeholder="Re-enter your new permanent password"
                    className="w-full h-10 px-3 rounded-xl border border-[#E5E7EB] dark:border-[#334155] bg-white dark:bg-[#151E30] text-[#111827] dark:text-[#F8FAFC] text-xs focus:ring-2 focus:ring-[#7F1D1D]/20 focus:border-[#7F1D1D] outline-none"
                    {...forceForm.register("confirmPassword")}
                  />
                  {forceForm.formState.errors.confirmPassword && (
                    <p className="text-xs text-rose-500">
                      {forceForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <div className="p-3 bg-gray-50 dark:bg-[#1E293B]/50 border border-[#E5E7EB] dark:border-[#334155] rounded-xl text-[11px] text-[#64748B] dark:text-[#94A3B8] space-y-1">
                  <span className="font-semibold text-[#111827] dark:text-[#F8FAFC] block">
                    Password Requirements:
                  </span>
                  <p>• At least 8 characters long</p>
                  <p>• At least one uppercase letter (A-Z) and one number (0-9)</p>
                  <p>• At least one special symbol (!@#$%^&*)</p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-[#7F1D1D] hover:bg-[#450A0A] text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-md shadow-[#7F1D1D]/20 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Spinner className="w-4 h-4 animate-spin text-white" /> Saving Password...
                    </>
                  ) : (
                    "Save Password & Enter Dashboard"
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
