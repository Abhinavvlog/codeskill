"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Bug, Code2, LoaderCircle, Maximize2, Minimize2, RotateCw, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

type RootErrorProps = { error: Error & { digest?: string; status?: number; code?: string }; reset: () => void; reportError?: boolean };
type Pickup = { x: number; y: number; label: string; color: string; taken: boolean; value: number };
type Hazard = { x: number; y: number; w: number; h: number; speed: number; phase: number; kind: "bug" | "glitch" | "drop" };
type GameTheme = { top: string; bottom: string; grid: string; platform: string; accent: string };
type Game = {
  player: { x: number; y: number; vx: number; vy: number; w: number; h: number; grounded: boolean };
  camera: number; score: number; lives: number; level: number; paused: boolean; mode: "ready" | "countdown" | "playing" | "gameover";
  countdown: number; countdownAt: number; lastAt: number; invulnerableUntil: number; worldWidth: number;
  platforms: { x: number; y: number; w: number; h: number; moving?: number }[]; pickups: Pickup[]; hazards: Hazard[]; finishX: number;
  title: string; challenge: string; specialChallenge: boolean; theme: GameTheme; playerSpeed: number; hazardPeriod: number;
};

const VIEW_W = 800;
const VIEW_H = 280;
const GRAVITY = 1500;
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

export function buildGame(level: number, score: number, lives: number): Game {
  let seed = (level * 0x45d9f3b) >>> 0;
  const random = () => { seed = (Math.imul(seed ^ (seed >>> 16), 0x45d9f3b) + 0x27100001) >>> 0; return seed / 0x100000000; };
  const specialChallenge = level % 5 === 0;
  const stageNames = ["Neon Boot Sequence", "Moving Data Bridges", "Firewall Chase", "Falling Code", "Quantum Overload", "Glitch Garden"];
  const stageDescriptions = ["Learn the route and collect code fragments.", "Watch the bridges: some platforms are moving.", "Moving bugs patrol the data lanes.", "Glitch blocks and falling code join the chase.", "Bonus round: bugs offline, crystal values doubled!", "A fresh route with mixed hazards and shifting bridges."];
  const stageIndex = (level - 1) % stageNames.length;
  const title = specialChallenge ? "Crystal Cache Bonus" : stageNames[stageIndex];
  const challenge = specialChallenge ? stageDescriptions[4] : stageDescriptions[stageIndex];
  const themes: GameTheme[] = [
    { top: "#0b1025", bottom: "#10122d", grid: "rgba(72,111,190,.15)", platform: "#172b47", accent: "#67e8f9" },
    { top: "#10102d", bottom: "#201336", grid: "rgba(168,85,247,.17)", platform: "#29234d", accent: "#c4b5fd" },
    { top: "#071c2a", bottom: "#102b3d", grid: "rgba(34,211,238,.16)", platform: "#15364a", accent: "#5eead4" },
    { top: "#1b1028", bottom: "#30162f", grid: "rgba(251,113,133,.16)", platform: "#3a203d", accent: "#f9a8d4" },
    { top: "#171b24", bottom: "#263047", grid: "rgba(250,204,21,.2)", platform: "#343d50", accent: "#fde68a" },
  ];
  const theme = themes[specialChallenge ? 4 : (level - 1) % 4];
  const difficulty = Math.log2(level);
  const movingPlatform = Math.min(8 + difficulty * 4, 24);
  const platforms: Game["platforms"] = [{ x: 0, y: 250, w: 260, h: 30 }];
  const floorHeights = [218, 230, 206, 238, 214, 226, 202];
  while (true) {
    const previous = platforms[platforms.length - 1];
    const gap = 50 + Math.floor(random() * 27);
    const x = previous.x + previous.w + gap;
    const width = 150 + Math.floor(random() * 51);
    if (x >= 1650 || x + width >= 1690) {
      platforms.push({ x, y: previous.y, w: 180, h: 30 });
      break;
    }
    const availableHeights = floorHeights.filter((y) => Math.abs(y - previous.y) <= 34);
    const y = availableHeights[Math.floor(random() * availableHeights.length)];
    const moving = level >= 2 && platforms.length % (level >= 4 ? 2 : 3) !== 0 ? movingPlatform : 0;
    platforms.push({ x, y, w: width, h: 18, moving });
  }
  const labels = [{ label: "JS", color: "#facc15" }, { label: "JAVA", color: "#fb923c" }, { label: "PY", color: "#60a5fa" }, { label: "⚛", color: "#67e8f9" }, { label: "✦", color: "#c4b5fd" }];
  const pickups: Pickup[] = platforms.slice(1, -1).map((platform, i) => {
    const item = labels[(i + level) % labels.length];
    return { x: platform.x + platform.w / 2, y: Math.max(132, platform.y - 38 - Math.floor(random() * 16)), ...item, taken: false, value: specialChallenge ? 100 : item.label === "✦" ? 25 : 50 };
  });
  if (specialChallenge) {
    for (let i = 1; i < platforms.length - 1; i += 2) {
      const platform = platforms[i];
      pickups.push({ x: platform.x + platform.w * .72, y: Math.max(128, platform.y - 65), label: "✦", color: "#fde68a", taken: false, value: 100 });
    }
  }
  const hazards: Hazard[] = [];
  if (!specialChallenge && level >= 1) {
    const hazardCount = Math.min(2 + Math.floor((level - 1) / 2), 6);
    const hazardPlatforms = platforms.slice(2, -1).filter((_, i) => i % Math.max(1, Math.floor((platforms.length - 3) / hazardCount)) === 0).slice(0, hazardCount);
    hazardPlatforms.forEach((platform, i) => {
      const kind: Hazard["kind"] = level >= 4 && i % 3 === 2 ? "drop" : level >= 3 && i % 2 === 1 ? "glitch" : "bug";
      hazards.push({
        x: platform.x + platform.w * (i % 2 ? .75 : .25) + (random() - .5) * 18,
        y: kind === "drop" ? Math.max(90, platform.y - 115) : platform.y - 25,
        w: kind === "glitch" ? 24 : 26,
        h: kind === "drop" ? 25 : 22,
        speed: kind === "glitch" ? 0 : Math.min(10 + difficulty * 3, 30),
        phase: random() * Math.PI * 2,
        kind,
      });
    });
  }
  const finalPlatform = platforms[platforms.length - 1];
  const finishX = finalPlatform.x + 105;
  const worldWidth = finalPlatform.x + finalPlatform.w;
  return {
    player: { x: 42, y: 205, vx: 0, vy: 0, w: 23, h: 34, grounded: false }, camera: 0, score, lives, level,
    paused: false, mode: "ready", countdown: 3, countdownAt: 0, lastAt: 0, invulnerableUntil: 0,
    worldWidth, platforms, pickups, hazards, finishX, title, challenge, specialChallenge, theme,
    playerSpeed: Math.min(205 + (level - 1) * 2.5, 270), hazardPeriod: Math.max(300, 760 - Math.min(level - 1, 25) * 17),
  };
}

function hazardPosition(hazard: Hazard, game: Game, now: number) {
  const phase = now / game.hazardPeriod + hazard.phase;
  return { x: hazard.x + Math.sin(phase) * hazard.speed, y: hazard.kind === "drop" ? hazard.y + Math.abs(Math.sin(phase * .7)) * 24 : hazard.y };
}

function drawGame(ctx: CanvasRenderingContext2D, g: Game, now: number) {
  const gradient = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  gradient.addColorStop(0, g.theme.top); gradient.addColorStop(1, g.theme.bottom);
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.save(); ctx.translate(-g.camera, 0);
  ctx.strokeStyle = g.theme.grid; ctx.lineWidth = 1;
  for (let x = Math.floor(g.camera / 36) * 36; x < g.camera + VIEW_W + 36; x += 36) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, VIEW_H); ctx.stroke(); }
  for (let y = 18; y < VIEW_H; y += 30) { ctx.beginPath(); ctx.moveTo(g.camera, y); ctx.lineTo(g.camera + VIEW_W, y); ctx.stroke(); }
  for (const p of g.platforms) {
    const bob = p.moving ? Math.sin(now / 600 + p.x) * p.moving : 0;
    ctx.shadowColor = g.theme.accent; ctx.shadowBlur = 13; ctx.fillStyle = g.theme.platform; ctx.fillRect(p.x, p.y + bob, p.w, p.h);
    ctx.shadowBlur = 0; ctx.fillStyle = g.theme.accent; ctx.fillRect(p.x, p.y + bob, p.w, 3);
    ctx.fillStyle = "rgba(129,140,248,.15)"; ctx.fillRect(p.x + 8, p.y + bob + 7, p.w - 16, 3);
  }
  for (const item of g.pickups) if (!item.taken) {
    const bob = Math.sin(now / 210 + item.x) * 4; ctx.save(); ctx.translate(item.x, item.y + bob);
    ctx.shadowColor = item.color; ctx.shadowBlur = 16; ctx.fillStyle = "rgba(11,18,39,.96)"; ctx.beginPath(); ctx.arc(0, 0, 13, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = item.color; ctx.lineWidth = 2; ctx.stroke(); ctx.shadowBlur = 0; ctx.fillStyle = item.color; ctx.font = "bold 9px ui-monospace, monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(item.label, 0, 1); ctx.restore();
  }
  for (const h of g.hazards) {
    const position = hazardPosition(h, g, now);
    ctx.save(); ctx.translate(position.x + h.w / 2, position.y + h.h / 2); ctx.rotate(Math.sin(now / 180 + h.phase) * .14);
    ctx.shadowColor = h.kind === "glitch" ? "#c084fc" : h.kind === "drop" ? "#fb923c" : "#fb3c86"; ctx.shadowBlur = 16;
    ctx.fillStyle = h.kind === "glitch" ? "#a855f7" : h.kind === "drop" ? "#f97316" : "#f43f7a";
    if (h.kind === "drop") { ctx.beginPath(); ctx.moveTo(0, h.h / 2); ctx.lineTo(-h.w / 2, -h.h / 2); ctx.lineTo(h.w / 2, -h.h / 2); ctx.closePath(); ctx.fill(); }
    else if (h.kind === "glitch") { ctx.fillRect(-h.w / 2, -h.h / 2, h.w, h.h); ctx.fillStyle = "#e9d5ff"; ctx.fillRect(-h.w / 2 - 4, -2, h.w + 8, 3); }
    else { ctx.beginPath(); ctx.roundRect(-h.w / 2, -h.h / 2, h.w, h.h, 7); ctx.fill(); }
    ctx.shadowBlur = 0; ctx.fillStyle = "#fff1f2"; ctx.fillRect(-6, -2, 4, 4); ctx.fillRect(3, -2, 4, 4); ctx.restore();
  }
  ctx.fillStyle = `${g.theme.accent}66`; ctx.fillRect(g.finishX, 100, 3, 150); ctx.fillStyle = g.theme.accent; ctx.font = "bold 10px ui-monospace, monospace"; ctx.fillText("EXIT", g.finishX - 9, 91);
  if (now >= g.invulnerableUntil || Math.floor(now / 90) % 2 === 0) {
    const p = g.player; ctx.save(); ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
    ctx.shadowColor = "#22d3ee"; ctx.shadowBlur = 15; ctx.fillStyle = "#36d9ed"; ctx.beginPath(); ctx.roundRect(-p.w / 2, -p.h / 2, p.w, p.h, 7); ctx.fill();
    ctx.shadowBlur = 0; ctx.fillStyle = "#101b35"; ctx.fillRect(-7, -7, 14, 9); ctx.fillStyle = "#a5f3fc"; ctx.fillRect(-4, -4, 3, 3); ctx.fillRect(2, -4, 3, 3);
    ctx.fillStyle = "#c4b5fd"; ctx.fillRect(-8, 10, 6, 5); ctx.fillRect(3, 10, 6, 5); ctx.restore();
  }
  ctx.restore();
}

export default function RootError({ error, reset, reportError = true }: RootErrorProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [retrying, setRetrying] = useState(false);
  const [gameView, setGameView] = useState({ mode: "ready" as Game["mode"], score: 0, lives: 3, level: 1, paused: false, best: 0, title: "Neon Boot Sequence", challenge: "Learn the route and collect code fragments.", specialChallenge: false });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenMessage, setFullscreenMessage] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Game>(buildGame(1, 0, 3));
  const keysRef = useRef({ left: false, right: false, jump: false });
  const frameRef = useRef<number | null>(null);
  const reducedMotion = useRef(false);
  const bestRef = useRef(0);
  const status = error.status ?? (error as Error & { response?: { status?: number } }).response?.status;
  const code = error.code;
  const message = status === 403 ? "You don’t have permission to access this page."
    : status === 404 ? "We couldn’t find the page you were looking for."
      : status === 429 ? "We’re getting too many requests right now. Please wait a moment and try again."
        : status === 408 || code === "ECONNABORTED" ? "This is taking longer than expected. Please try again."
          : status && status >= 500 ? "Our servers are taking a short break."
            : !status && (code === "ERR_NETWORK" || code === "ECONNREFUSED") ? "We couldn’t connect. Check your internet connection."
              : "Something unexpected happened.";
  const dashboard = user?.isAdmin || user?.role?.toLowerCase() === "admin" ? "/admin/dashboard"
    : user?.role?.toLowerCase() === "teacher" ? "/teacher/dashboard"
      : user?.role?.toLowerCase() === "company" ? "/company/dashboard"
        : user?.role?.toLowerCase() === "campus" ? "/campus/dashboard" : user ? "/dashboard" : "/";

  const syncView = useCallback((g: Game) => {
    setGameView((old) => old.mode === g.mode && old.score === g.score && old.lives === g.lives && old.level === g.level && old.paused === g.paused && old.best === bestRef.current && old.title === g.title && old.challenge === g.challenge && old.specialChallenge === g.specialChallenge ? old : { mode: g.mode, score: g.score, lives: g.lives, level: g.level, paused: g.paused, best: bestRef.current, title: g.title, challenge: g.challenge, specialChallenge: g.specialChallenge });
  }, []);

  useEffect(() => {
    if (reportError) console.error("Root application error:", error?.digest || "unexpected error");
    reducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    try { bestRef.current = Number(localStorage.getItem("codeskill-cyber-escape-best") || 0); setGameView((old) => ({ ...old, best: bestRef.current })); } catch { /* storage can be unavailable */ }
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    let mounted = true;
    const collide = (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    const tick = (now: number) => {
      if (!mounted) return;
      const g = gameRef.current;
      if (g.mode === "countdown" && now - g.countdownAt >= 850) {
        g.countdown -= 1; g.countdownAt = now;
        if (g.countdown <= 0) { g.mode = "playing"; g.lastAt = now; }
        syncView(g);
      }
      if (g.mode === "playing" && !g.paused) {
        const dt = Math.min((now - (g.lastAt || now)) / 1000, .035); g.lastAt = now;
        const p = g.player; const speed = g.playerSpeed;
        p.vx = (keysRef.current.right ? speed : 0) - (keysRef.current.left ? speed : 0);
        if (keysRef.current.jump && p.grounded) { p.vy = -515; p.grounded = false; }
        p.x = clamp(p.x + p.vx * dt, 0, g.worldWidth - p.w);
        const prevBottom = p.y + p.h; p.vy += GRAVITY * dt; p.y += p.vy * dt; p.grounded = false;
        for (const platform of g.platforms) {
          const bob = platform.moving ? Math.sin(now / 600 + platform.x) * platform.moving : 0;
          const top = platform.y + bob;
          if (p.vy >= 0 && prevBottom <= top + 7 && p.y + p.h >= top && p.x + p.w > platform.x && p.x < platform.x + platform.w) { p.y = top - p.h; p.vy = 0; p.grounded = true; }
        }
        if (p.y > VIEW_H + 40) { g.lives -= 1; p.x = Math.max(30, p.x - 100); p.y = 150; p.vy = 0; g.invulnerableUntil = now + 1100; }
        for (const item of g.pickups) if (!item.taken && collide(p, { x: item.x - 13, y: item.y - 13, w: 26, h: 26 })) { item.taken = true; g.score += item.value; }
        if (now > g.invulnerableUntil) for (const h of g.hazards) {
          const position = hazardPosition(h, g, now);
          if (collide(p, { x: position.x, y: position.y, w: h.w, h: h.h })) { g.lives -= 1; g.invulnerableUntil = now + 1300; p.vy = -220; p.vx = p.x < position.x ? -100 : 100; break; }
        }
        if (g.lives <= 0) g.mode = "gameover";
        if (p.x >= g.finishX) {
          const next = buildGame(g.level + 1, g.score + 100, g.lives); next.mode = "playing"; next.lastAt = now; gameRef.current = next;
        }
        g.camera = clamp(p.x - 190, 0, g.worldWidth - VIEW_W);
        const best = Math.max(bestRef.current, g.score);
        if (best > bestRef.current) { bestRef.current = best; try { localStorage.setItem("codeskill-cyber-escape-best", String(best)); } catch { /* storage can be unavailable */ } }
        drawGame(ctx, g, reducedMotion.current ? 0 : now);
        syncView(g);
      } else {
        drawGame(ctx, g, reducedMotion.current ? 0 : now);
        if (g.mode === "countdown") { ctx.fillStyle = "rgba(5,8,22,.46)"; ctx.fillRect(0, 0, VIEW_W, VIEW_H); ctx.fillStyle = "#e0f2fe"; ctx.font = "bold 44px ui-sans-serif,system-ui"; ctx.textAlign = "center"; ctx.fillText(String(g.countdown), VIEW_W / 2, VIEW_H / 2 + 14); }
        if (g.paused && g.mode === "playing") { ctx.fillStyle = "rgba(5,8,22,.6)"; ctx.fillRect(0, 0, VIEW_W, VIEW_H); ctx.fillStyle = "#e0f2fe"; ctx.font = "bold 25px ui-sans-serif,system-ui"; ctx.textAlign = "center"; ctx.fillText("PAUSED", VIEW_W / 2, VIEW_H / 2 + 9); }
      }
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    const keyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("button,a,input,textarea,select,[contenteditable='true']")) return;
      const key = event.key.toLowerCase();
      if (["arrowleft", "arrowright", " ", "arrowup"].includes(key)) event.preventDefault();
      if (key === "arrowleft" || key === "a") keysRef.current.left = true;
      if (key === "arrowright" || key === "d") keysRef.current.right = true;
      if (key === " " || key === "arrowup" || key === "w") keysRef.current.jump = true;
      if (key === "p" || key === "escape") { const g = gameRef.current; if (g.mode === "playing") { g.paused = !g.paused; syncView(g); } }
    };
    const keyUp = (event: KeyboardEvent) => { const key = event.key.toLowerCase(); if (key === "arrowleft" || key === "a") keysRef.current.left = false; if (key === "arrowright" || key === "d") keysRef.current.right = false; if ([" ", "arrowup", "w"].includes(key)) keysRef.current.jump = false; };
    const visibility = () => { if (document.hidden && gameRef.current.mode === "playing") { gameRef.current.paused = true; keysRef.current = { left: false, right: false, jump: false }; syncView(gameRef.current); } };
    window.addEventListener("keydown", keyDown); window.addEventListener("keyup", keyUp); document.addEventListener("visibilitychange", visibility);
    return () => { mounted = false; if (frameRef.current !== null) cancelAnimationFrame(frameRef.current); window.removeEventListener("keydown", keyDown); window.removeEventListener("keyup", keyUp); document.removeEventListener("visibilitychange", visibility); };
  }, [error, reportError, syncView]);

  useEffect(() => {
    const updateFullscreen = () => setIsFullscreen(document.fullscreenElement === gameContainerRef.current);
    document.addEventListener("fullscreenchange", updateFullscreen);
    return () => document.removeEventListener("fullscreenchange", updateFullscreen);
  }, []);

  const start = () => { gameRef.current = buildGame(1, 0, 3); gameRef.current.mode = "countdown"; gameRef.current.countdownAt = performance.now(); syncView(gameRef.current); };
  const restart = () => start();
  const pause = () => { const g = gameRef.current; if (g.mode === "playing") { g.paused = !g.paused; syncView(g); } };
  const touch = (key: "left" | "right" | "jump", value: boolean) => { keysRef.current[key] = value; };
  const toggleFullscreen = async () => {
    const container = gameContainerRef.current;
    setFullscreenMessage("");
    if (!container || !document.fullscreenEnabled) { setFullscreenMessage("Fullscreen is not available in this browser."); return; }
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await container.requestFullscreen();
    } catch {
      setFullscreenMessage("Could not change fullscreen mode. Your browser may block this action.");
    }
  };
  const retry = () => { if (retrying) return; setRetrying(true); reset(); window.setTimeout(() => setRetrying(false), 1500); };

  return (
    <main className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-[#080b18] px-4 py-8 text-white sm:px-6">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(99,60,190,0.24),transparent_55%),radial-gradient(ellipse_at_90%_80%,rgba(14,165,233,0.12),transparent_45%)]" />
      <div aria-hidden="true" className="error-stars pointer-events-none absolute inset-0 opacity-50" />
      <section className="relative z-10 w-full max-w-3xl animate-[error-enter_.55s_ease-out_both] rounded-3xl border border-white/10 bg-[#111629]/90 p-5 shadow-[0_24px_100px_rgba(0,0,0,.5)] backdrop-blur-xl sm:p-8">
        <div className="text-center">
          <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-violet-300/20 bg-violet-300/10 px-3 py-1 text-xs font-semibold tracking-wide text-violet-200"><Sparkles className="h-3.5 w-3.5" /> CODE SKILL RECOVERY</span>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Oops! Something Went Wrong</h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-300">Looks like our little robot hit a bug. Let’s get things back on track!</p>
          <p role="status" className="mt-2 inline-flex items-center gap-2 text-sm text-cyan-200"><AlertTriangle aria-hidden="true" className="h-4 w-4" />{message}</p>
        </div>

        <div ref={gameContainerRef} className={`mt-5 overflow-hidden rounded-2xl border border-cyan-300/15 bg-[#090d1b]/90 shadow-[0_0_32px_rgba(34,211,238,.06)] ${isFullscreen ? "flex h-screen w-screen flex-col justify-center rounded-none border-0 p-4" : ""}`}>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-2"><Code2 className="h-4 w-4 text-cyan-200" /><h2 className="text-sm font-bold tracking-wide">CYBER ESCAPE: SERVER DOWN!</h2></div>
            <div className="flex items-center gap-3 text-xs font-semibold tabular-nums"><span className="text-cyan-200">SCORE {gameView.score}</span><span className="text-violet-200">LEVEL {gameView.level}</span><span className="text-rose-300">{"♥ ".repeat(gameView.lives)}</span><span className="text-slate-400">BEST {gameView.best}</span></div>
          </div>
          <div className={`flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-white/5 px-4 py-2 ${gameView.specialChallenge ? "bg-amber-300/10" : "bg-white/[.02]"}`}>
            <p className={`text-xs font-bold ${gameView.specialChallenge ? "text-amber-200" : "text-cyan-100"}`}>{gameView.title}</p>
            <p className="text-[11px] text-slate-400">{gameView.challenge}</p>
          </div>
          <div className="relative">
            <canvas ref={canvasRef} width={VIEW_W} height={VIEW_H} aria-label="Cyber Escape platform game. Use arrow keys or A and D to move, Space or W to jump, and P or Escape to pause." className={`block h-auto w-full touch-none ${isFullscreen ? "max-h-[70vh] object-contain" : ""}`} />
            {gameView.mode === "ready" && <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#080b18]/65 text-center"><Bug aria-hidden="true" className="mb-2 h-8 w-8 text-cyan-200" /><p className="text-lg font-bold">Escape the corrupted server</p><p className="mt-1 text-xs text-slate-300">Collect code, dodge bugs, reach the exit.</p><button type="button" onClick={start} className="mt-3 rounded-lg border-2 border-cyan-100 bg-cyan-300 px-5 py-2 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-950/40 transition hover:bg-cyan-200 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">Play</button></div>}
            {gameView.mode === "gameover" && <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#080b18]/85 text-center"><p className="text-2xl font-black text-cyan-100">GAME OVER</p><p className="mt-1 text-sm text-slate-300">Final score: {gameView.score} · Best: {Math.max(gameView.best, gameView.score)}</p><button type="button" onClick={restart} className="mt-3 rounded-lg bg-violet-500 px-5 py-2 text-sm font-bold hover:bg-violet-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">Restart</button></div>}
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-white/10 px-3 py-2">
            <p className="hidden text-[11px] text-slate-400 sm:block">← → / A D move · SPACE / W jump · P pause</p>
            <div className="flex gap-2 sm:hidden">
              <button type="button" aria-label="Move left" onPointerDown={() => touch("left", true)} onPointerUp={() => touch("left", false)} onPointerLeave={() => touch("left", false)} className="rounded-lg border border-white/15 px-4 py-2 text-sm">←</button>
              <button type="button" aria-label="Move right" onPointerDown={() => touch("right", true)} onPointerUp={() => touch("right", false)} onPointerLeave={() => touch("right", false)} className="rounded-lg border border-white/15 px-4 py-2 text-sm">→</button>
              <button type="button" aria-label="Jump" onPointerDown={() => touch("jump", true)} onPointerUp={() => touch("jump", false)} onPointerLeave={() => touch("jump", false)} className="rounded-lg border border-cyan-300/30 px-4 py-2 text-sm text-cyan-100">JUMP</button>
            </div>
            <div className="ml-auto flex gap-2">
              <button type="button" onClick={toggleFullscreen} className="flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200">{isFullscreen ? <Minimize2 aria-hidden="true" className="h-3.5 w-3.5" /> : <Maximize2 aria-hidden="true" className="h-3.5 w-3.5" />}{isFullscreen ? "Exit Full Screen" : "Enter Full Screen"}</button>
              {(gameView.mode === "playing" || gameView.paused) && <button type="button" onClick={pause} className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold hover:bg-white/10">{gameView.paused ? "Resume" : "Pause"}</button>}
              {gameView.mode === "gameover" && <button type="button" onClick={restart} className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold hover:bg-white/10">Restart</button>}
            </div>
          </div>
          {fullscreenMessage && <p role="status" className="px-3 pb-2 text-xs text-amber-200">{fullscreenMessage}</p>}
        </div>

        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row">
          <button type="button" onClick={() => router.push(dashboard)} className="flex-1 rounded-xl border border-white/15 bg-white/[.04] px-5 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200">Go to Dashboard</button>
          <button type="button" onClick={retry} disabled={retrying} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-500 px-5 py-3 text-sm font-bold shadow-lg shadow-violet-950/40 transition hover:brightness-110 disabled:cursor-wait disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-200">{retrying ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : <RotateCw aria-hidden="true" className="h-4 w-4" />}{retrying ? "Trying again…" : "Try Again"}</button>
        </div>
      </section>
      <style jsx>{`@keyframes error-enter { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } } .error-stars { background-image: radial-gradient(1px 1px at 18% 22%,rgba(255,255,255,.65) 50%,transparent 100%),radial-gradient(1px 1px at 76% 34%,rgba(167,139,250,.8) 50%,transparent 100%),radial-gradient(1px 1px at 84% 77%,rgba(103,232,249,.7) 50%,transparent 100%),radial-gradient(1px 1px at 35% 82%,rgba(255,255,255,.5) 50%,transparent 100%); } @media (prefers-reduced-motion: reduce) { :global(*) { animation-duration: .01ms !important; animation-iteration-count: 1 !important; scroll-behavior: auto !important; } }`}</style>
    </main>
  );
}
