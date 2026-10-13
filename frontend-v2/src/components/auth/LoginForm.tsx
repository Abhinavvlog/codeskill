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
          className="w-full h-11 rounded-xl font-semibold shadow-sm text-sm"
          disabled={isDisabled}
        >
          {isSubmitting ? (
            <>
              <Spinner className="w-4 h-4 mr-2" />
              Signing in...
            </>
          ) : (
            <>
              Sign In <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </form>

      {/* Social Login Options */}
      {showSocial && (
        <div className="space-y-6 pt-2">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground font-semibold tracking-wider">
                Or continue with
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              type="button"
              disabled={isDisabled}
              onClick={() => handleGoogleAuth()}
              className="h-11 rounded-xl bg-background hover:bg-muted/50 border-border shadow-sm text-foreground font-medium transition-all hover:border-primary/50 hover:shadow-md"
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
              Google
            </Button>

            <Button
              variant="outline"
              type="button"
              disabled={isDisabled}
              onClick={() => {
                form.setError("root", { type: "manual", message: "GitHub login is currently disabled for this environment." });
              }}
              className="h-11 rounded-xl bg-background hover:bg-muted/50 border-border shadow-sm text-foreground font-medium transition-all hover:border-primary/50 hover:shadow-md"
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              GitHub
            </Button>
          </div>
        </div>
      )}

      <p className="text-center text-sm text-muted-foreground mt-6">
        Accounts are created by your institution administrator.
      </p>
    </div>
  );
}
