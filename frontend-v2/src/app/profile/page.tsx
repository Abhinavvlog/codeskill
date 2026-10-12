"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  User as UserIcon, 
  Settings, 
  BookOpen, 
  Trophy, 
  Code2, 
  Target,
  CheckCircle2,
  Building2,
  GraduationCap,
  Upload
} from "lucide-react";
import { useForm } from "react-hook-form";
import { authAPI } from "@/config/api";
import { Spinner } from "@/components/ui/spinner";

type ProfileFormValues = {
  name: string;
  username: string;
  bio: string;
  institution: string;
  role: string;
  preferredLanguage: string;
};

export default function ProfilePage() {
  const { user, loading, updateProfile } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProfileFormValues>();

  useEffect(() => {
    setMounted(true);
    if (!loading && !user) {
      router.push("/login");
    } else if (user) {
      reset({
        name: user.name || "",
        username: user.username || "",
        bio: user.bio || "",
        institution: user.profile?.institution || "",
        role: user.profile?.role || "student",
        preferredLanguage: user.profile?.preferredLanguage || "python"
      });
    }
  }, [user, loading, router, reset]);

  if (!mounted || loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background min-h-screen">
        <Spinner className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) return null;

  const onSubmit = async (data: ProfileFormValues) => {
    setIsSaving(true);
    setSuccessMessage("");
    setErrorMessage("");
    try {
      await updateProfile({
        name: data.name,
        username: data.username,
        bio: data.bio,
        profile: {
          institution: data.institution,
          role: data.role,
          preferredLanguage: data.preferredLanguage
        }
      });
      setSuccessMessage("Profile updated successfully.");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("Image must be less than 5MB");
      return;
    }

    setIsUploading(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      
      await authAPI.uploadAvatar(formData);
      setSuccessMessage("Profile picture updated successfully!");
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.message || "Failed to upload image.");
    } finally {
      setIsUploading(false);
    }
  };

  const stats = [
    { label: "Total Solved", value: user.stats?.totalSolved || 0, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Current Streak", value: `${user.stats?.currentStreak || 0} days`, icon: Trophy, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Total Submissions", value: user.stats?.totalSubmissions || 0, icon: Target, color: "text-primary", bg: "bg-primary/10" },
  ];

  return (
    <div className="flex-1 bg-background text-foreground font-sans min-h-screen">
      <div className="max-w-5xl mx-auto w-full px-6 py-8 mt-16 md:mt-24">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">Profile Settings</h1>
            <p className="text-muted-foreground">Manage your account details and preferences.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: User Card & Stats */}
          <div className="space-y-6">
            
            {/* User Identification Card */}
            <div className="bg-card rounded-xl border border-border p-6 text-center shadow-sm">
              <div className="w-24 h-24 rounded-full bg-muted border border-border mx-auto mb-4 flex items-center justify-center overflow-hidden relative group cursor-pointer">
                {isUploading ? (
                  <Spinner className="w-8 h-8 animate-spin text-emerald-500" />
                ) : user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-10 h-10 text-muted-foreground" />
                )}
                
                <label className="absolute inset-0 bg-background/60 backdrop-blur-sm flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Upload className="w-5 h-5 text-foreground mb-1" />
                  <span className="text-foreground text-xs font-medium">Change</span>
                  <input 
                    type="file" 
                    accept="image/png, image/jpeg, image/jpg, image/gif" 
                    className="hidden" 
                    onChange={handleAvatarUpload}
                    disabled={isUploading}
                  />
                </label>
              </div>
              <h2 className="text-xl font-semibold mb-1">{user.name}</h2>
              <p className="text-muted-foreground text-sm mb-4">{user.email}</p>
              
              <div className="inline-flex items-center justify-center px-3 py-1 rounded-md bg-muted text-muted-foreground text-xs font-medium uppercase tracking-wider">
                {user.profile?.role || "Student"}
              </div>
            </div>

            {/* Stats Summary */}
            <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">Your Progress</h3>
              <div className="space-y-4">
                {stats.map((stat, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-md flex items-center justify-center ${stat.bg} ${stat.color}`}>
                        <stat.icon className="w-4 h-4" />
                      </div>
                      <span className="text-muted-foreground font-medium text-sm">{stat.label}</span>
                    </div>
                    <span className="font-semibold">{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Edit Form */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
              <div className="p-6 border-b border-border bg-muted/30">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Settings className="w-5 h-5 text-muted-foreground" /> General Information
                </h3>
              </div>
              
              <div className="p-6">
                
                {successMessage && (
                  <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-md flex items-center gap-2 text-sm font-medium">
                    <CheckCircle2 className="w-4 h-4" /> {successMessage}
                  </div>
                )}
                
                {errorMessage && (
                  <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-md flex items-center gap-2 text-sm font-medium">
                    <span className="w-4 h-4 flex items-center justify-center bg-destructive text-destructive-foreground rounded-full text-xs font-bold">!</span> 
                    {errorMessage}
                  </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Full Name</label>
                    <input
                      type="text"
                      {...register("name", { required: "Name is required" })}
                      className="w-full h-10 bg-transparent border border-border rounded-md px-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-all text-sm"
                      placeholder="e.g. Jane Doe"
                    />
                    {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Username</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                      <input
                        type="text"
                        {...register("username", { 
                          required: "Username is required",
                          pattern: {
                            value: /^[a-z0-9_]+$/,
                            message: "Only lowercase letters, numbers, and underscores are allowed"
                          }
                        })}
                        className="w-full h-10 bg-transparent border border-border rounded-md pl-8 pr-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-all text-sm"
                        placeholder="e.g. jane_doe"
                      />
                    </div>
                    {errors.username && <p className="text-xs text-destructive">{errors.username.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Bio</label>
                    <textarea
                      {...register("bio")}
                      rows={4}
                      className="w-full bg-transparent border border-border rounded-md p-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-all text-sm resize-none"
                      placeholder="Tell us a little about yourself..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-muted-foreground" /> Institution / Company
                      </label>
                      <input
                        type="text"
                        {...register("institution")}
                        className="w-full h-10 bg-transparent border border-border rounded-md px-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-all text-sm"
                        placeholder="e.g. Stanford University"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-muted-foreground" /> Primary Role
                      </label>
                      <select
                        {...register("role")}
                        className="w-full h-10 bg-transparent border border-border rounded-md px-3 text-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-all text-sm appearance-none cursor-pointer"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right .5rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em`, paddingRight: `2.5rem` }}
                      >
                        <option value="student">Student</option>
                        <option value="professional">Professional Developer</option>
                        <option value="educator">Educator</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Code2 className="w-4 h-4 text-muted-foreground" /> Preferred Language
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {["python", "cpp", "java", "javascript"].map((lang) => (
                        <label key={lang} className="relative">
                          <input type="radio" value={lang} {...register("preferredLanguage")} className="peer sr-only" />
                          <div className="h-10 flex items-center justify-center rounded-md border border-border bg-transparent cursor-pointer peer-checked:border-ring peer-checked:bg-foreground peer-checked:text-background hover:bg-muted transition-all">
                            <span className="text-sm font-medium capitalize">{lang === "cpp" ? "C++" : lang}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-border flex justify-end">
                    <button
                      disabled={isSaving}
                      type="submit"
                      className="h-10 px-6 rounded-md bg-foreground hover:opacity-90 text-background font-medium text-sm transition-opacity flex items-center justify-center disabled:opacity-70 shadow-sm"
                    >
                      {isSaving ? (
                        <>
                          <Spinner className="w-4 h-4 animate-spin mr-2" />
                          Saving...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </button>
                  </div>
                </form>

              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
