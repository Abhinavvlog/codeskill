"use client";

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { ExternalLink, Plus, UsersRound } from "lucide-react";
import { motion, useAnimationControls, useInView, useReducedMotion, useSpring } from "motion/react";
import { team, type TeamMember } from "@/data/team";

/** Seconds for all animation times. Keep the pause after the line intentional. */
export const TEAM_MOTION_CONFIG = {
  trigger: { amount: 0.33, margin: "0px 0px -4% 0px" as const },
  layout: { navbarHeight: 56, navbarTop: 12, navbarClearance: 24, headingGap: 64, cardGap: 12 },
  timing: {
    label: 0, title: 0.12, subtitle: 0.24, headingDuration: 0.5,
    lineDuration: 0.42, pauseAfterLine: 0.4, cardStagger: 0.07,
    captionDuration: 0.22, hoverDuration: 0.2, glareDuration: 0.65, reducedFade: 0.12,
  },
  spring: { stiffness: 120, damping: 16, mass: 1 },
  hoverSpring: { stiffness: 260, damping: 24 },
  entrance: { scale: 0.78, rotation: 6, y: 16 },
  hover: { maxTilt: 8, scale: 1.04, lift: 8, neighbourOpacity: 0.7 },
  ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
};

const desktopQuery = "(min-width: 768px)";
const subscribeDesktop = (notify: () => void) => {
  const query = window.matchMedia(desktopQuery);
  query.addEventListener("change", notify);
  return () => query.removeEventListener("change", notify);
};
const desktopSnapshot = () => window.matchMedia(desktopQuery).matches;
const serverSnapshot = () => false;

type PortraitProps = {
  member: TeamMember; index: number; desktop: boolean; reduced: boolean;
  offset: number; started: boolean; settled: boolean; active: boolean; dimmed: boolean;
  controls: ReturnType<typeof useAnimationControls>; selected: boolean;
  onActivate: (index: number | null) => void; onSelect: () => void;
};

function TeamPortrait({ member, index, desktop, reduced, offset, started, settled, active, dimmed, controls, selected, onActivate, onSelect }: PortraitProps) {
  const ref = useRef<HTMLLIElement>(null);
  const visible = useInView(ref, { once: true, amount: 0.2 });
  const config = TEAM_MOTION_CONFIG;
  const rotateX = useSpring(0, config.hoverSpring);
  const rotateY = useSpring(0, config.hoverSpring);
  const spotX = useSpring(0, config.hoverSpring);
  const spotY = useSpring(0, config.hoverSpring);
  const interactive = desktop && !reduced && settled;
  const captionVisible = reduced || (desktop ? settled : selected || active);
  const resetTilt = () => { rotateX.set(0); rotateY.set(0); };

  return <motion.li
    ref={ref}
    custom={index}
    className="min-w-0 shrink-0 basis-[64%] snap-center md:basis-auto"
    initial={reduced ? { opacity: 0 } : { opacity: 0, x: desktop ? offset : 0, y: config.entrance.y, scale: desktop ? config.entrance.scale : 1, rotate: desktop ? ((index * 7) % 13) - config.entrance.rotation : 0 }}
    animate={reduced ? { opacity: 1 } : desktop ? controls : { opacity: started && visible ? 1 : 0, y: started && visible ? 0 : config.entrance.y, x: 0, scale: 1, rotate: 0 }}
    transition={{ duration: reduced ? config.timing.reducedFade : config.timing.headingDuration, ease: config.ease }}
    style={{ perspective: 900, zIndex: active ? team.length + 1 : team.length - Math.abs(index - 4), willChange: started && !settled && !reduced ? "transform, opacity" : undefined }}
  >
    <motion.div animate={{ opacity: dimmed ? config.hover.neighbourOpacity : 1 }} transition={{ duration: config.timing.hoverDuration }}>
      <motion.button
        type="button"
        aria-label={`Meet ${member.name}, ${member.role}`}
        aria-expanded={captionVisible}
        aria-controls={`team-caption-${index}`}
        className="relative block aspect-[2/3] w-full cursor-pointer overflow-hidden rounded-2xl border border-border bg-background text-left shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-card"
        style={{ rotateX: interactive ? rotateX : 0, rotateY: interactive ? rotateY : 0, transformStyle: "preserve-3d" }}
        animate={{ y: interactive && active ? -config.hover.lift : 0, scale: interactive && active ? config.hover.scale : 1 }}
        transition={config.hoverSpring}
        onPointerEnter={event => {
          if (!interactive || event.pointerType === "touch") return;
          onActivate(index);
          const box = event.currentTarget.getBoundingClientRect();
          spotX.set(box.width / 2); spotY.set(box.height / 2);
        }}
        onPointerMove={event => {
          if (!interactive || event.pointerType === "touch") return;
          const box = event.currentTarget.getBoundingClientRect();
          const x = event.clientX - box.left; const y = event.clientY - box.top;
          rotateX.set(-(y / box.height - 0.5) * 2 * config.hover.maxTilt);
          rotateY.set((x / box.width - 0.5) * 2 * config.hover.maxTilt);
          spotX.set(x); spotY.set(y);
        }}
        onPointerLeave={event => {
          resetTilt();
          if (!event.currentTarget.matches(":focus-visible")) onActivate(null);
        }}
        onFocus={event => {
          onActivate(index);
          const box = event.currentTarget.getBoundingClientRect();
          spotX.set(box.width / 2); spotY.set(box.height / 2);
          if (interactive) { rotateX.set(-3); rotateY.set(3); }
        }}
        onBlur={() => { resetTilt(); onActivate(null); }}
        onClick={onSelect}
      >
        <Image src={member.image} alt={`Portrait of ${member.name}, ${member.role}`} fill sizes="(max-width: 767px) 64vw, (max-width: 1536px) 10vw, 150px" className="object-cover object-top" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
        <motion.div aria-hidden="true" className="pointer-events-none absolute inset-y-0 -left-full w-2/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent" animate={{ x: active && interactive ? "330%" : "0%", opacity: active && interactive ? 1 : 0 }} transition={{ duration: config.timing.glareDuration, ease: config.ease }} />
        <motion.div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-2xl border border-primary/60" animate={{ opacity: active ? 1 : 0 }} transition={{ duration: config.timing.hoverDuration }} />
        {/* A static radial texture moves with transforms; no animated gradient repaint. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-2xl p-px" style={{ maskImage: "linear-gradient(#fff 0 0), linear-gradient(#fff 0 0)", maskClip: "content-box, border-box", maskComposite: "exclude" }}>
          <motion.div className="absolute -left-24 -top-24 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(34,197,94,0.95),transparent_70%)]" style={{ x: spotX, y: spotY }} animate={{ opacity: active && !reduced ? 1 : 0 }} transition={{ duration: config.timing.hoverDuration }} />
        </div>
        <span aria-hidden="true" className="absolute bottom-3 right-3 flex h-7 w-7 items-center justify-center rounded-full border border-white/25 bg-black/35 text-white backdrop-blur-sm md:hidden"><Plus className="h-4 w-4" /></span>
      </motion.button>
      <motion.div id={`team-caption-${index}`} initial={false} animate={{ opacity: captionVisible ? 1 : 0, y: captionVisible || reduced ? 0 : 8 }} transition={{ duration: reduced ? config.timing.reducedFade : config.timing.captionDuration }} className="min-h-20 pt-4 text-center">
        <p className="text-base font-semibold tracking-tight md:text-xs lg:text-sm xl:text-base">{member.name}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground md:text-[9px] lg:text-[10px] xl:text-xs">{member.role}</p>
        {(member.linkedin || member.github) && <div className="mt-2 flex justify-center gap-3 text-muted-foreground">
          {member.linkedin && <a href={member.linkedin} target="_blank" rel="noopener noreferrer" aria-label={`${member.name} on LinkedIn`} className="inline-flex items-center gap-1 rounded text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">LinkedIn<ExternalLink className="h-3 w-3" /></a>}
          {member.github && <a href={member.github} target="_blank" rel="noopener noreferrer" aria-label={`${member.name} on GitHub`} className="inline-flex items-center gap-1 rounded text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">GitHub<ExternalLink className="h-3 w-3" /></a>}
        </div>}
      </motion.div>
    </motion.div>
  </motion.li>;
}

export default function TeamSection() {
  const section = useRef<HTMLElement>(null);
  const row = useRef<HTMLUListElement>(null);
  const desktop = useSyncExternalStore(subscribeDesktop, desktopSnapshot, serverSnapshot);
  const reduced = Boolean(useReducedMotion());
  const config = TEAM_MOTION_CONFIG;
  const inView = useInView(section, { once: true, ...config.trigger });
  const controls = useAnimationControls();
  const [rowWidth, setRowWidth] = useState(0);
  const [started, setStarted] = useState(false);
  const [settled, setSettled] = useState(false);
  const [active, setActive] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const played = useRef(false);
  const middle = (team.length - 1) / 2;
  const columnWidth = (rowWidth - config.layout.cardGap * (team.length - 1)) / team.length;

  useLayoutEffect(() => {
    if (!row.current) return;
    const measure = () => setRowWidth(row.current?.clientWidth || 0);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(row.current);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    if (!desktop || !rowWidth || played.current || reduced) return;
    controls.set(index => ({
      x: (middle - index) * (columnWidth + config.layout.cardGap),
      y: config.entrance.y, scale: config.entrance.scale,
      rotate: ((index * 7) % 13) - config.entrance.rotation, opacity: 0,
    }));
  }, [desktop, rowWidth, reduced, controls, columnWidth, middle, config]);

  useEffect(() => {
    if (!inView || (desktop && rowWidth === 0)) return;
    let cancelled = false;
    // Crossing the breakpoint after playing must never put cards back in a stack.
    if (played.current || reduced) {
      setStarted(true); setSettled(true);
      controls.set({ x: 0, y: 0, scale: 1, rotate: 0, opacity: 1 });
      return;
    }
    const delay = config.timing.subtitle + config.timing.lineDuration + config.timing.pauseAfterLine;
    const timer = window.setTimeout(() => {
      played.current = true;
      setStarted(true);
      if (!desktop) { setSettled(true); return; }
      void controls.start(index => ({
        x: 0, y: 0, scale: 1, rotate: 0, opacity: 1,
        transition: { type: "spring", ...config.spring, delay: Math.abs(index - middle) * config.timing.cardStagger },
      })).then(() => { if (!cancelled) setSettled(true); });
    }, delay * 1000);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [inView, desktop, reduced, rowWidth, controls, config, middle]);

  const heading = (delay: number, y: number, blur = false) => ({
    initial: reduced ? { opacity: 0 } : { opacity: 0, y, ...(blur ? { filter: "blur(8px)" } : {}) },
    animate: inView || reduced ? { opacity: 1, y: 0, ...(blur ? { filter: "blur(0px)" } : {}) } : undefined,
    transition: { delay: reduced ? 0 : delay, duration: reduced ? config.timing.reducedFade : config.timing.headingDuration, ease: config.ease },
  });

  return <section ref={section} id="team" aria-labelledby="team-title" className="relative mx-auto mt-14 max-w-screen-2xl rounded-[2rem] border border-border bg-card px-5 pb-6 shadow-sm sm:mt-16 sm:px-8 lg:px-10 2xl:px-12" style={{ paddingTop: config.layout.navbarHeight + config.layout.navbarTop + config.layout.navbarClearance, scrollMarginTop: config.layout.navbarHeight + config.layout.navbarTop + config.layout.navbarClearance }}>
    <header className="relative text-center">
      <motion.p {...heading(config.timing.label, 12)} className="inline-flex items-center justify-center gap-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary sm:text-xs lg:text-sm"><UsersRound className="h-5 w-5 shrink-0" aria-hidden="true" /><span className="h-5 w-px bg-primary/40" aria-hidden="true" />OUR DEVELOPERS &amp; CONTRIBUTORS</motion.p>
      <motion.h2 {...heading(config.timing.title, 24, true)} id="team-title" className="mx-auto mt-5 max-w-4xl text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">Meet the Team Behind CodeSkill</motion.h2>
      <motion.p {...heading(config.timing.subtitle, 0)} className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base lg:text-lg">The team building practical, hands-on learning experiences.</motion.p>
      <motion.span aria-hidden="true" initial={reduced ? false : { scaleX: 0, opacity: 0 }} animate={inView || reduced ? { scaleX: 1, opacity: 1 } : undefined} transition={{ delay: reduced ? 0 : config.timing.subtitle, duration: reduced ? config.timing.reducedFade : config.timing.lineDuration, ease: config.ease }} className="mx-auto mt-6 block h-1 w-12 origin-center rounded-full bg-primary" />
    </header>
    <ul ref={row} aria-label="CodeSkill team" className="relative -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain px-5 pb-3 pt-3 md:mx-0 md:grid md:grid-cols-9 md:overflow-visible md:px-0" style={{ marginTop: config.layout.headingGap - 12, columnGap: config.layout.cardGap }}>
      {team.map((member, index) => <TeamPortrait key={member.name} member={member} index={index} desktop={desktop} reduced={reduced} offset={(middle - index) * (columnWidth + config.layout.cardGap)} controls={controls} started={started} settled={settled} selected={selected === index} active={active === index} dimmed={desktop && settled && active !== null && active !== index} onActivate={setActive} onSelect={() => setSelected(value => value === index ? null : index)} />)}
    </ul>
    <p className="pb-5 text-center text-xs text-muted-foreground md:hidden">Swipe to meet the team. Tap a portrait for details.</p>
  </section>;
}
