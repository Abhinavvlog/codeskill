"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { 
  ShieldCheck, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Mail, 
  Lock,
  ArrowLeft
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import Link from "next/link";
import { AuthUI } from "@/components/ui/auth-ui";
import { OtpInput, type OtpInputHandle, type OtpStatus } from "@/components/ui/otp-input";
import { AdminLogo } from "@/components/admin/AdminLogo";

const adminLoginSchema = z.object({
  email: z.string().min(1, { message: "Please enter your administrator email or ID." }),
  password: z.string().optional(),
  otp: z.string().optional(),
});

type AdminLoginFormValues = z.infer<typeof adminLoginSchema>;

export default function AdminLoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [otpStatus, setOtpStatus] = useState<OtpStatus>("idle");
  const [otpErrorMessage, setOtpErrorMessage] = useState<string>("");
  const otpRef = useRef<OtpInputHandle>(null);
  const { adminLogin, adminLoginVerify } = useAuth();
  const router = useRouter();

  const form = useForm<AdminLoginFormValues>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const onSubmit = async (data: AdminLoginFormValues) => {
    setIsLoading(true);
    form.clearErrors("root");
    setInfoMessage(null);
    setOtpStatus("idle");
    setOtpErrorMessage("");
    try {
      if (!showOTP) {
        const res = await adminLogin({ email: data.email, password: data.password });
        if (res.requireOTP) {
          setShowOTP(true);
          if (res.message) setInfoMessage(res.message);
        } else {
          window.location.href = "/admin/dashboard";
        }
      } else {
        const otpCode = data.otp?.trim() || "";
        if (!otpCode || otpCode.length < 6) {
          setOtpStatus("error");
          setOtpErrorMessage("Please enter all 6 digits of the OTP code.");
          form.setError("otp", { type: "manual", message: "OTP must be 6 digits" });
          return;
        }
        await adminLoginVerify({ email: data.email, otp: otpCode });
        setOtpStatus("success");
        setTimeout(() => {
          window.location.href = "/admin/dashboard";
        }, 500);
      }
    } catch (err: any) {
      const msg = err.message || "Failed to authenticate admin";
      if (showOTP) {
        setOtpStatus("error");
        setOtpErrorMessage(msg);
      } else {
        form.setError("root", { type: "manual", message: msg });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <AuthUI
        signInContent={{
          image: {
            src: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=2070&auto=format&fit=crop",
            alt: "A professional office environment"
          },
          quote: {
            text: "Secure assessment administration for Chandigarh University.",
            author: "CodeSkill Admin"
          }
        }}
      >
        <div className="w-full max-w-md flex flex-col gap-6 mx-auto">
          <div className="flex flex-col items-center text-center">
            {/* Prominent CodeSkill Admin Branding */}
            <div className="flex flex-col items-center text-center gap-3 mb-6">
              <AdminLogo variant="icon" size="lg" />
              <div className="flex flex-col items-center text-center">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl font-black tracking-tight text-foreground leading-none">
                    Code<span className="text-rose-600 dark:text-rose-500">Skill</span>
                  </span>
                  <span className="px-2 py-0.5 text-xs font-bold uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25 rounded-md leading-none shadow-xs">
                    Admin
                  </span>
                </div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-1.5 text-center">
                  Chandigarh University
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 text-[10px] font-bold tracking-widest uppercase mb-3 mx-auto">
              <ShieldCheck className="w-3.5 h-3.5 text-[#F5B800]" />
              {showOTP ? "Two-Factor Verification" : "Secure Examination Console"}
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground mb-1.5 text-center">
              {showOTP ? "Verify Your Identity" : "Administrator Sign In"}
            </h2>
            <p className="text-sm text-muted-foreground text-center">
              {showOTP
                ? `Enter the 6-digit security code sent to ${form.getValues("email") || "your administrator email"}.`
                : "Sign in to access the examination and assessment administration console."}
            </p>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 text-left">
            {form.formState.errors.root && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <p className="text-sm font-medium text-red-800 leading-snug">
                  {form.formState.errors.root.message}
                </p>
              </div>
            )}

            {infoMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-sm font-medium text-emerald-800 leading-snug">
                  {infoMessage}
                </p>
              </div>
            )}

            {!showOTP ? (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Email / Institutional ID</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      placeholder="admin@institution.edu or ADM001"
                      disabled={isLoading}
                      {...form.register("email")}
                      className={`w-full h-[46px] bg-background border ${form.formState.errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-input focus:border-primary focus:ring-primary/20'} rounded-xl pl-10 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-4 transition-all text-sm font-medium disabled:opacity-50`}
                    />
                  </div>
                  {form.formState.errors.email && (
                    <p className="text-xs font-medium text-red-500 ml-1">{form.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2 relative">
                  <label className="text-sm font-semibold text-foreground">Password</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      disabled={isLoading}
                      {...form.register("password")}
                      className={`w-full h-[46px] bg-background border ${form.formState.errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-input focus:border-primary focus:ring-primary/20'} rounded-xl pl-10 pr-11 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-4 transition-all text-sm font-medium tracking-wide disabled:opacity-50`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {form.formState.errors.password && (
                    <p className="text-xs font-medium text-red-500 ml-1">{form.formState.errors.password.message}</p>
                  )}
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-muted/40 border border-border rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-foreground font-medium truncate max-w-[260px]">
                    <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate">{form.getValues("email")}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowOTP(false);
                      setOtpStatus("idle");
                      setOtpErrorMessage("");
                      form.setValue("otp", "");
                    }}
                    className="text-primary hover:underline font-semibold shrink-0"
                  >
                    Change
                  </button>
                </div>

                <div className="flex flex-col items-center justify-center py-2">
                  <OtpInput
                    ref={otpRef}
                    length={6}
                    groupEvery={3}
                    autoFocus={true}
                    disabled={isLoading}
                    status={otpStatus}
                    errorMessage={otpErrorMessage}
                    successMessage="Code verified! Signing in..."
                    hint="Enter the 6-digit one-time code"
                    className="items-center"
                    onChange={(val) => {
                      form.setValue("otp", val);
                      if (otpStatus !== "idle") {
                        setOtpStatus("idle");
                        setOtpErrorMessage("");
                      }
                    }}
                    onComplete={(val) => {
                      form.setValue("otp", val);
                      form.handleSubmit(onSubmit)();
                    }}
                  />
                </div>

                <div className="flex items-center justify-center pt-1">
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={async () => {
                      try {
                        setIsLoading(true);
                        setOtpStatus("idle");
                        setOtpErrorMessage("");
                        const res = await adminLogin({
                          email: form.getValues("email"),
                          password: form.getValues("password"),
                        });
                        setInfoMessage(res.message || "A fresh OTP code has been dispatched to your email.");
                        otpRef.current?.clear();
                      } catch (err: any) {
                        setOtpStatus("error");
                        setOtpErrorMessage(err.message || "Failed to resend OTP");
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                    className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                  >
                    Didn&apos;t receive code? <span className="text-primary underline">Resend OTP</span>
                  </button>
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-[46px] rounded-xl bg-primary hover:bg-primary/90 active:bg-primary/80 text-primary-foreground font-bold text-sm transition-all flex items-center justify-center disabled:opacity-70 shadow-sm disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Spinner className="w-4 h-4 animate-spin text-primary-foreground" />
                    <span>Authenticating...</span>
                  </div>
                ) : (showOTP ? "Verify Login" : "Authenticate as Admin")}
              </button>
            </div>
          </form>
          
          <div className="mt-8 pt-6 border-t border-border flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <ShieldCheck className="w-4 h-4" />
              <p className="text-[11px] font-semibold">
                Authorized faculty and examination controllers only.
              </p>
            </div>
            <Link href="/" className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors">
              Return to Portal Home
            </Link>
          </div>
        </div>
      </AuthUI>
    </>
  );
}
