"use client";

import { motion } from "framer-motion";
import { fadeUp, staggerContainer } from "@/lib/animations";
import {
  Trophy,
  Medal,
  Flame,
  Code2,
  RefreshCw,
  Users,
  Zap,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import { usersAPI } from "@/config/api";
import { Spinner } from "@/components/ui/spinner";

interface LeaderboardUser {
  rank: number;
  _id: string;
  name: string;
  username?: string;
  uid?: string;
  avatar?: string;
  xp: number;
  totalSolved: number;
  currentStreak: number;
  tier: string;
  department?: string;
  batch?: string;
}

const OFFICIAL_CU_SEAL = "/cu-seal.png";
const WIKIMEDIA_CU_SEAL =
  "https://upload.wikimedia.org/wikipedia/commons/b/b0/Chandigarh_University_Seal.png";

const TIER_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  Grandmaster: { color: "text-[#7F1D1D]", bg: "bg-[#7F1D1D]/10", border: "border-[#7F1D1D]/30" },
  Master:      { color: "text-[#854D0E]", bg: "bg-[#FACC15]/20", border: "border-[#FACC15]/50" },
  Expert:      { color: "text-purple-700", bg: "bg-purple-50", border: "border-purple-200" },
  Specialist:  { color: "text-[#7F1D1D]", bg: "bg-[#FFFBF5]", border: "border-[#E5E7EB]" },
  Competent:   { color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  Learner:     { color: "text-cyan-700", bg: "bg-cyan-50", border: "border-cyan-200" },
  Beginner:    { color: "text-[#64748B]", bg: "bg-gray-50", border: "border-[#E5E7EB]" },
};

const PODIUM_CONFIG: Record<number, { height: string; medalColor: string; bgGrad: string; borderColor: string; shadow: string; rankColor: string }> = {
  1: {
    height: "h-64",
    medalColor: "text-[#FACC15]",
    bgGrad: "from-[#FACC15]/20 to-[#FFFBF5]",
    borderColor: "border-[#FACC15]",
    shadow: "shadow-md",
    rankColor: "text-[#854D0E]",
  },
  2: {
    height: "h-52",
    medalColor: "text-slate-400",
    bgGrad: "from-slate-100 to-[#FFFBF5]",
    borderColor: "border-[#E5E7EB]",
    shadow: "shadow-xs",
    rankColor: "text-slate-600",
  },
  3: {
    height: "h-44",
    medalColor: "text-amber-700",
    bgGrad: "from-amber-100/60 to-[#FFFBF5]",
    borderColor: "border-[#E5E7EB]",
    shadow: "shadow-xs",
    rankColor: "text-amber-800",
  },
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function PodiumCard({ user, podiumRank }: { user: LeaderboardUser; podiumRank: 1 | 2 | 3 }) {
  const cfg = PODIUM_CONFIG[podiumRank];
  const tier = TIER_CONFIG[user.tier] ?? TIER_CONFIG.Specialist;

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      transition={{ duration: 0.7, delay: podiumRank * 0.15, ease: "easeOut" }}
      className={`relative flex-1 max-w-[230px] rounded-t-2xl border border-b-0 flex flex-col items-center pt-4 pb-2 ${cfg.height} ${cfg.borderColor} bg-gradient-to-t ${cfg.bgGrad} ${cfg.shadow}`}
    >
      {/* Floating card */}
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3.5 + podiumRank * 0.5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-22 bg-white border border-[#E5E7EB] rounded-2xl p-4 w-48 flex flex-col items-center shadow-sm z-10"
      >
        {/* Avatar / Badge */}
        {user.avatar ? (
          <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full object-cover mb-2 ring-2 ring-[#E5E7EB]" />
        ) : (
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center text-base font-black mb-2 shadow-xs ${
              podiumRank === 1
                ? "bg-gradient-to-br from-[#FACC15] to-[#EAB308] text-amber-950 ring-2 ring-[#FACC15]"
                : podiumRank === 2
                ? "bg-gradient-to-br from-slate-200 to-slate-400 text-slate-800 ring-2 ring-slate-300"
                : "bg-gradient-to-br from-amber-600 to-amber-800 text-white ring-2 ring-amber-700/50"
            }`}
          >
            {getInitials(user.name)}
          </div>
        )}

        <p className="font-bold text-[#1F2937] text-xs sm:text-sm text-center leading-tight">{user.name}</p>
        
        {user.uid && (
          <p className="text-[11px] font-mono font-medium text-[#64748B] mt-0.5 tracking-wider">
            {user.uid}
          </p>
        )}
        
        {user.department && (
          <p className="text-[10px] text-[#64748B] mt-0.5 text-center leading-tight line-clamp-1">
            {user.department}
          </p>
        )}

        <div className="flex items-center gap-1.5 mt-2">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${tier.border} ${tier.bg} ${tier.color}`}>
            {user.tier}
          </span>
        </div>

        <p className="text-sm font-bold text-[#7F1D1D] mt-1.5 font-mono">{user.xp.toLocaleString()} XP</p>
        <p className="text-[10px] text-[#64748B]">{user.totalSolved} solved</p>
      </motion.div>

      {/* Podium base rank indicator */}
      <div className="mt-auto flex flex-col items-center pb-2">
        <span className={`text-2xl font-black ${cfg.rankColor}`}>
          #{podiumRank}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
          {podiumRank === 1 ? "Winner" : podiumRank === 2 ? "Runner-up" : "3rd Place"}
        </span>
      </div>
    </motion.div>
  );
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const res = await usersAPI.getLeaderboard();
        if (isMounted) {
          const list = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
          setLeaderboard(list);
        }
      } catch (err) {
        console.error("Failed to load live leaderboard:", err);
        if (isMounted) {
          setLeaderboard([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchLeaderboard();
    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  // Reorder for podium: [2nd, 1st, 3rd]
  const podiumOrder: (LeaderboardUser | null)[] = [
    top3[1] ?? null,
    top3[0] ?? null,
    top3[2] ?? null,
  ];
  const podiumRanks: (1 | 2 | 3)[] = [2, 1, 3];

  return (
    <div className="flex-1 flex flex-col pt-24 pb-16 px-4 sm:px-6 max-w-5xl mx-auto w-full font-sans text-[#1F2937]">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="w-full space-y-10"
      >
        {/* Header */}
        <motion.div variants={fadeUp} className="text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-white shrink-0 shadow-xs border border-[#E5E7EB] p-1">
              <img
                src={OFFICIAL_CU_SEAL}
                alt="Chandigarh University"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = WIKIMEDIA_CU_SEAL;
                }}
              />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1F2937] flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-[#FACC15] fill-[#FACC15]" />
                  CU Student <span className="text-[#7F1D1D]">Leaderboard</span>
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Live
                </span>
              </div>
              <p className="text-xs text-[#64748B]">
                Chandigarh University — Official Technical Ranking
              </p>
            </div>
          </div>
          <p className="text-[#64748B] max-w-lg mx-auto text-xs sm:text-sm leading-relaxed">
            Student algorithmic problem-solving rankings across Chandigarh University departments.
          </p>
          <div className="mt-3 flex items-center justify-center gap-3">
            <button
              onClick={() => setRefreshKey((k) => k + 1)}
              disabled={loading}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#7F1D1D] transition-colors px-3 py-1.5 rounded-xl border border-[#E5E7EB] bg-white hover:bg-[#FFFBF5] shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#7F1D1D]" : ""}`} />
              {loading ? "Syncing…" : "Refresh Rankings"}
            </button>
          </div>
        </motion.div>

        {/* Loading / Empty State or Real Leaderboard */}
        {loading ? (
          <div className="py-20 text-center text-[#64748B] text-sm font-medium flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-[#7F1D1D]" />
            Loading live leaderboard...
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-14 bg-white border border-[#E5E7EB] rounded-2xl p-8 space-y-3 max-w-lg mx-auto shadow-xs">
            <Trophy className="w-10 h-10 text-[#64748B] mx-auto opacity-40" />
            <h3 className="text-base font-bold text-[#1F2937]">No Leaderboard Standings Yet</h3>
            <p className="text-xs text-[#64748B] max-w-sm mx-auto leading-relaxed">
              Student rankings will appear here as soon as candidates solve coding problems and submit assessments.
            </p>
          </div>
        ) : (
          <>
            {/* Podium Display */}
            {top3.length > 0 && (
              <motion.div
                variants={fadeUp}
                className="flex items-end justify-center gap-3 sm:gap-6 pt-24 pb-2"
              >
                {podiumOrder.map((user, i) =>
                  user ? (
                    <PodiumCard
                      key={user._id}
                      user={user}
                      podiumRank={podiumRanks[i]}
                    />
                  ) : (
                    <div key={i} className="flex-1 max-w-[230px]" />
                  )
                )}
              </motion.div>
            )}

            {/* Quick Stats Grid */}
            <motion.div
              variants={fadeUp}
              className="grid grid-cols-1 sm:grid-cols-3 gap-4"
            >
              <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 text-center shadow-xs">
                <Users className="w-4 h-4 text-[#7F1D1D] mx-auto mb-1.5" />
                <p className="text-xs text-[#64748B]">Ranked Students</p>
                <p className="text-lg font-black text-[#1F2937] mt-0.5">{leaderboard.length}</p>
              </div>
              <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 text-center shadow-xs">
                <Zap className="w-4 h-4 text-[#D97706] mx-auto mb-1.5" />
                <p className="text-xs text-[#64748B]">Top Score</p>
                <p className="text-lg font-black text-[#7F1D1D] mt-0.5 font-mono">
                  {(top3[0]?.xp ?? 0).toLocaleString()} XP
                </p>
              </div>
              <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 text-center shadow-xs">
                <Code2 className="w-4 h-4 text-emerald-600 mx-auto mb-1.5" />
                <p className="text-xs text-[#64748B]">Top Problem Solvers</p>
                <p className="text-lg font-black text-[#1F2937] mt-0.5 font-mono">
                  {top3[0]?.totalSolved ?? 0} problems
                </p>
              </div>
            </motion.div>

            {/* Full Ranked Table */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-30px" }}
              className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-xs"
            >
              {/* Table Header */}
              <div className="flex items-center gap-4 px-5 py-3.5 border-b border-[#E5E7EB] bg-[#FFFBF5]/80 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                <div className="w-10 text-center">Rank</div>
                <div className="w-10 text-center">Student</div>
                <div className="flex-1">Details</div>
                <div className="text-right">XP & Solved</div>
              </div>

              {/* Top 3 items */}
              {top3.map((user, i) => {
                const tier = TIER_CONFIG[user.tier] ?? TIER_CONFIG.Specialist;
                const medals = ["🥇", "🥈", "🥉"];
                return (
                  <motion.div
                    variants={fadeUp}
                    key={user._id}
                    className="flex items-center gap-4 p-4 border-b border-[#E5E7EB] hover:bg-[#FFFBF5]/40 transition-colors group"
                  >
                    <div className="w-10 text-center text-lg shrink-0 select-none">
                      {medals[i]}
                    </div>
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border ${tier.border} ${tier.bg} ${tier.color} shrink-0 shadow-xs`}
                    >
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        getInitials(user.name)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-[#1F2937] text-xs sm:text-sm truncate">{user.name}</p>
                        {user.uid && (
                          <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-gray-50 text-[#64748B] border border-[#E5E7EB]">
                            {user.uid}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#64748B] mt-0.5 flex-wrap">
                        <span className={`font-semibold ${tier.color}`}>{user.tier}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-medium">
                          <Code2 className="w-3 h-3 text-emerald-600" />
                          {user.totalSolved} solved
                        </span>
                        {user.currentStreak > 0 && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-[#D97706] font-bold">
                              <Flame className="w-3 h-3 fill-[#FACC15]" />
                              {user.currentStreak}d streak
                            </span>
                          </>
                        )}
                        {user.department && (
                          <span className="text-[#64748B] hidden md:inline">
                            · {user.department} {user.batch ? `(${user.batch})` : ""}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-[#7F1D1D] font-mono text-sm">{user.xp.toLocaleString()}</p>
                      <p className="text-[9px] font-semibold text-[#64748B] uppercase">XP</p>
                    </div>
                  </motion.div>
                );
              })}

              {/* Ranks #4 and beyond */}
              {rest.map((user) => {
                const tier = TIER_CONFIG[user.tier] ?? TIER_CONFIG.Specialist;
                return (
                  <motion.div
                    variants={fadeUp}
                    key={user._id}
                    className="flex items-center gap-4 p-4 border-b border-[#E5E7EB] last:border-0 hover:bg-[#FFFBF5]/40 transition-colors group"
                  >
                    <div className="w-10 text-center text-xs font-bold text-[#64748B] group-hover:text-[#1F2937] shrink-0 font-mono">
                      #{user.rank}
                    </div>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border ${tier.border} ${tier.bg} ${tier.color} shrink-0`}
                    >
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        getInitials(user.name)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-[#1F2937] text-xs sm:text-sm truncate">{user.name}</p>
                        {user.uid && (
                          <span className="text-[10px] font-mono text-[#64748B] px-1.5 py-0.5 rounded bg-gray-50 border border-[#E5E7EB]">
                            {user.uid}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#64748B] mt-0.5 flex-wrap">
                        <span className={`font-semibold ${tier.color}`}>{user.tier}</span>
                        <span>•</span>
                        <span>{user.totalSolved} solved</span>
                        {user.currentStreak > 0 && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-[#D97706] font-semibold">
                              <Flame className="w-3 h-3 fill-[#FACC15]" />
                              {user.currentStreak}d
                            </span>
                          </>
                        )}
                        {user.department && (
                          <span className="text-[#64748B] hidden md:inline">
                            · {user.department}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-[#1F2937] font-mono text-xs sm:text-sm">{user.xp.toLocaleString()}</p>
                      <p className="text-[9px] font-semibold text-[#64748B] uppercase">XP</p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </>
        )}

        {/* Footer info banner */}
        <motion.div
          variants={fadeUp}
          className="flex items-center justify-center gap-3 text-xs text-[#64748B] py-2"
        >
          <img
            src={OFFICIAL_CU_SEAL}
            alt="Chandigarh University"
            className="w-4 h-4 object-contain opacity-75"
            onError={(e) => {
              (e.target as HTMLImageElement).src = WIKIMEDIA_CU_SEAL;
            }}
          />
          <span>
            Chandigarh University Technical Assessment & Algorithm Rankings. Updated in real time.
          </span>
        </motion.div>
      </motion.div>
    </div>
  );
}
