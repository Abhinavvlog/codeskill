"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff, Mail, Lock, AlertCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { useGoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/context/AuthContext";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Identifier is required" })
    .transform((val) => val.trim()),
  password: z.string().min(1, { message: "Password is required" }),
  rememberMe: z.boolean().default(false).optional(),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export interface LoginFormProps {
  defaultEmail?: string;
  onSubmit: (data: LoginFormValues) => Promise<void> | void;
  loading?: boolean;
  error?: string | null;
  disabled?: boolean;
  className?: string;
  showSocial?: boolean;
}

export function LoginForm({
  defaultEmail = "",
  onSubmit,
  loading = false,
  error = null,
  disabled = false,
  className,
  showSocial = true,
}: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { googleLogin } = useAuth();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: defaultEmail,
      password: "",
      rememberMe: false,
    },
  });

  const handleSubmit = async (data: LoginFormValues) => {
    form.clearErrors("root");
    try {
      await onSubmit(data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Invalid credentials. Please try again.";
      form.setError("root", {
        type: "manual",
        message: errorMessage,
      });
    }
  };

  const handleGoogleAuth = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true);
      form.clearErrors("root");
      try {
        await googleLogin(tokenResponse.access_token);
        window.location.href = "/dashboard";
      } catch (err: any) {
        form.setError("root", {
          type: "manual",
          message: err.message || "Google login failed. Please try again.",
        });
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: () => {
      form.setError("root", { type: "manual", message: "Google login was cancelled or failed." });
    },
  });

  const isSubmitting = loading || form.formState.isSubmitting || googleLoading;
  const isDisabled = disabled || isSubmitting;
  const rootError = error || form.formState.errors.root?.message;

  return (
    <div className={cn("w-full space-y-6", className)}>
      {rootError && (
        <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg flex items-start gap-2.5 text-red-600 dark:text-red-400 text-sm animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{rootError}</span>
        </div>
      )}

      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {/* Email/UID Field */}
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            Email or UID
          </label>
          <div className="relative group">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              id="email"
              type="text"
              placeholder="name@example.com or UID"
              className={cn(
                "w-full h-11 px-4 pl-10 rounded-xl border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all sm:text-sm",
                form.formState.errors.email ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "border-input"
              )}
              {...form.register("email")}
              disabled={isDisabled}
              aria-invalid={!!form.formState.errors.email}
              aria-describedby={form.formState.errors.email ? "email-error" : undefined}
            />
          </div>
          {form.formState.errors.email && (
            <p id="email-error" className="text-xs text-red-500 font-medium animate-in fade-in">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
              tabIndex={-1}
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative group">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••••••"
              className={cn(
                "w-full h-11 px-4 pl-10 pr-10 rounded-xl border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all sm:text-sm",
                form.formState.errors.password ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "border-input"
              )}
              {...form.register("password")}
              disabled={isDisabled}
              aria-invalid={!!form.formState.errors.password}
              aria-describedby={form.formState.errors.password ? "password-error" : undefined}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isDisabled}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground focus:outline-none focus:text-primary transition-colors rounded-md"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          {form.formState.errors.password && (
            <p id="password-error" className="text-xs text-red-500 font-medium animate-in fade-in">
              {form.formState.errors.password.message}
            </p>
          )}
        </div>

        {/* Remember Me */}
        <div className="flex items-center space-x-2 pt-1 pb-2">
          <div className="flex items-center">
            <input
              id="rememberMe"
              type="checkbox"
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/20 transition-colors cursor-pointer"
              {...form.register("rememberMe")}
              disabled={isDisabled}
            />
          </div>
          <label
            htmlFor="rememberMe"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-muted-foreground cursor-pointer select-none"
          >
            Keep me signed in
          </label>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          className="w-full h-11 rounded-xl font-bold shadow-xs text-sm bg-[#7F1D1D] hover:bg-[#450A0A] text-white transition-all cursor-pointer"
          disabled={isDisabled}
        >
          {isSubmitting ? (
            <>
              <Spinner className="w-4 h-4 mr-2 text-white animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              Sign In <ArrowRight className="w-4 h-4 ml-2 text-[#FACC15]" />
            </>
          )}
        </Button>
      </form>

      {/* Social Login Options */}
      {showSocial && (
        <div className="space-y-4 pt-1">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[#E5E7EB] dark:border-[#334155]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-[#151E30] px-2 text-[#64748B] dark:text-[#94A3B8] font-semibold tracking-wider text-[11px]">
                Or continue with
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            type="button"
            disabled={isDisabled}
            onClick={() => handleGoogleAuth()}
            className="w-full h-11 rounded-xl bg-white dark:bg-[#1E293B] hover:bg-gray-50 dark:hover:bg-[#1E293B]/80 border-[#E5E7EB] dark:border-[#334155] shadow-xs text-[#111827] dark:text-[#F8FAFC] font-medium transition-all cursor-pointer"
          >
            {googleLoading ? (
              <Spinner className="w-4 h-4 mr-2" />
            ) : (
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            Sign in with Google
          </Button>
        </div>
      )}

      <p className="text-center text-xs text-[#64748B] dark:text-[#94A3B8] mt-4">
        Official credentials provided by your institution.
      </p>
    </div>
  );
}
