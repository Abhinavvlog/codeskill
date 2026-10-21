"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Trophy,
  Award,
  Zap,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Flame,
  Star,
  CheckCircle2,
} from "lucide-react";
import { learningAPI } from "@/config/api";
import { Spinner } from "@/components/ui/spinner";

interface AchievementsData {
  totalXP: number;
  level: string;
  nextThreshold: number;
  progressToNextLevel: number;
  badgeCount: number;
  badges: Array<{
    id: string;
    code: string;
    name: string;
    description: string;
    iconUrl: string;
    rarity: string;
    category: string;
    awardedAt: string;
  }>;
  recentXPHistory: Array<{
    id: string;
    amount: number;
    eventType: string;
    notes: string;
    createdAt: string;
  }>;
}

export default function AchievementsPage() {
  const [data, setData] = useState<AchievementsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      setLoading(true);
      const res = await learningAPI.getMyAchievements();
      setData(res.data);
    } catch (err) {
      console.error("Failed to load achievements", err);
    } finally {
      setLoading(false);
    }
  };

  const rarityColors: Record<string, string> = {
    common: "border-zinc-700 bg-zinc-800/40 text-zinc-300",
    rare: "border-blue-500/30 bg-blue-500/10 text-blue-300",
    epic: "border-purple-500/30 bg-purple-500/10 text-purple-300",
    legendary: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#08080a] flex items-center justify-center">
        <Spinner className="w-8 h-8 text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08080a] text-zinc-100 pb-20">
      {/* Top Header */}
      <div className="border-b border-zinc-800/80 bg-gradient-to-b from-[#111116] to-[#08080a] pt-10 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <Link
            href="/learning"
            className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Learning Catalog</span>
          </Link>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-3">
                <Trophy className="w-3.5 h-3.5" />
                <span>Verified Skills & Gamification</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Achievements & Skill Level
              </h1>
              <p className="mt-2 text-sm text-zinc-400">
                Track your verifiable XP ledger, skill ranks, and unlocked mastery badges.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/learning/me/certificates"
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
              >
                <Award className="w-4 h-4" />
                <span>My Certificates</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 space-y-10">
        {/* Level & XP Overview Card */}
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-6 sm:p-8 backdrop-blur-md">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Rank / Tier */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-zinc-950 font-black text-2xl shadow-lg shadow-amber-500/20">
                ★
              </div>
              <div>
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Skill Level
                </span>
                <h3 className="text-2xl font-extrabold text-white">
                  {data?.level || "Novice"}
                </h3>
              </div>
            </div>

            {/* Total XP */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                <Zap className="w-8 h-8" />
              </div>
              <div>
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Total Verified XP
                </span>
                <h3 className="text-2xl font-extrabold text-white">
                  {data?.totalXP.toLocaleString() || 0} XP
                </h3>
              </div>
            </div>

            {/* Badges Count */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                <Award className="w-8 h-8" />
              </div>
              <div>
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Unlocked Badges
                </span>
                <h3 className="text-2xl font-extrabold text-white">
                  {data?.badgeCount || 0} Badges
                </h3>
              </div>
            </div>
          </div>

          {/* Progress to next level bar */}
          <div className="mt-8 pt-6 border-t border-zinc-800">
            <div className="flex justify-between text-xs font-bold mb-2">
              <span className="text-zinc-400">
                Progress to Next Level ({data?.nextThreshold.toLocaleString()} XP)
              </span>
              <span className="text-indigo-400">
                {data?.progressToNextLevel || 0}%
              </span>
            </div>
            <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 to-amber-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${data?.progressToNextLevel || 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Badges Showcase Gallery */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-400" />
              <span>Skill Badges Showcase</span>
            </h2>
            <span className="text-xs text-zinc-400">
              {data?.badges.length || 0} unlocked
            </span>
          </div>

          {data?.badges.length === 0 ? (
            <div className="text-center py-12 bg-zinc-900/40 rounded-2xl border border-zinc-800 p-6">
              <Award className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
              <p className="text-sm font-semibold text-zinc-400">No badges earned yet</p>
              <p className="text-xs text-zinc-500 mt-1">
                Complete learning exercises and courses to unlock your first badge!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {data?.badges.map((badge) => (
                <div
                  key={badge.id}
                  className={`p-5 rounded-2xl border flex flex-col justify-between ${
                    rarityColors[badge.rarity] || rarityColors.common
                  }`}
                >
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-zinc-950/60 flex items-center justify-center mb-3">
                      <Sparkles className="w-6 h-6 text-amber-400" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-75">
                      {badge.rarity} · {badge.category}
                    </span>
                    <h4 className="text-sm font-bold text-white mt-1">
                      {badge.name}
                    </h4>
                    <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                      {badge.description}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-zinc-800/40 text-[10px] text-zinc-500 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Unlocked {new Date(badge.awardedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent XP Activity History */}
        {data?.recentXPHistory && data.recentXPHistory.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <span>Recent XP Ledger Entries</span>
            </h2>

            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-800/60">
              {data.recentXPHistory.map((rec) => (
                <div
                  key={rec.id}
                  className="p-4 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-semibold text-zinc-200">
                      {rec.notes || rec.eventType}
                    </div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">
                      {new Date(rec.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                    +{rec.amount} XP
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
