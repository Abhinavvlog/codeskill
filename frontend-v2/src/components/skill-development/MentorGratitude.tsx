import Image from 'next/image';
import { Heart, UsersRound } from 'lucide-react';

export default function MentorGratitude() {
  return (
    <div className="mx-auto mt-12 w-full max-w-6xl">
      <section
        aria-labelledby="mentor-gratitude-title"
        className="relative isolate grid overflow-hidden rounded-[2rem] border border-emerald-700/10 bg-white/80 shadow-[0_24px_70px_-42px_rgba(15,23,42,0.28)] backdrop-blur-sm dark:bg-card/80 md:grid-cols-[1.12fr_0.96fr_1fr]"
      >
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_12%_20%,rgba(16,185,129,0.08),transparent_36%),radial-gradient(ellipse_at_86%_52%,rgba(16,185,129,0.10),transparent_34%)]" />

        <div className="flex flex-col items-center justify-center px-7 py-10 text-center sm:px-10 md:py-12">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-600/15 bg-emerald-600/[0.06] px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">
            <Heart className="h-4 w-4 fill-current" aria-hidden="true" />
            Gratitude
          </span>
          <h2 id="mentor-gratitude-title" className="mt-5 text-3xl font-extrabold leading-tight tracking-tight text-slate-950 sm:text-4xl dark:text-foreground">
            Our Sincere Gratitude
            <span className="block text-emerald-700 dark:text-emerald-400">to Our Mentor</span>
          </h2>
          <p className="mt-5 max-w-lg text-sm leading-7 text-slate-600 sm:text-base dark:text-muted-foreground">
            We extend our heartfelt thanks to Dr. Ishdeep Singla for his constant guidance, encouragement, and support in making this initiative possible. His vision and leadership continue to inspire and empower students to grow and excel.
          </p>
        </div>

        <div className="flex flex-col justify-center border-t border-emerald-900/10 px-7 py-8 sm:px-10 md:border-l md:border-t-0 md:py-12">
          <h3 className="text-xl font-extrabold tracking-tight text-slate-950 sm:text-2xl dark:text-foreground">
            Dr. Ishdeep Singla
          </h3>
          <span className="mt-3 inline-flex w-fit max-w-full flex-col items-start rounded-2xl border border-emerald-700/10 bg-emerald-600/[0.07] px-4 py-2 text-xs font-semibold leading-5 text-emerald-800 sm:text-sm dark:text-emerald-300">
            <span>Assistant Director</span>
            <span className="whitespace-nowrap">(Skill Development)</span>
          </span>
          <div className="mt-4 flex items-center gap-3 text-sm font-bold text-slate-700 dark:text-foreground">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-emerald-700/15 bg-white p-1 shadow-sm dark:bg-background">
              <Image
                src="/cu-emblem.png"
                alt=""
                width={24}
                height={30}
                className="h-7 w-6 object-contain"
                aria-hidden="true"
              />
            </span>
            <span>Chandigarh University</span>
          </div>
        </div>

        <div className="relative flex min-h-[19rem] items-center justify-center px-6 py-9 sm:min-h-[22rem] md:min-h-0 md:px-8">
          <div aria-hidden="true" className="absolute h-64 w-64 rounded-full border border-emerald-500/10 bg-emerald-500/[0.035] sm:h-72 sm:w-72" />
          <div aria-hidden="true" className="absolute h-56 w-56 rounded-full border border-emerald-500/15 sm:h-64 sm:w-64" />
          <div className="relative h-48 w-48 overflow-hidden rounded-full border-[7px] border-white shadow-[0_18px_50px_-20px_rgba(15,23,42,0.45)] ring-1 ring-emerald-500/20 sm:h-56 sm:w-56 sm:border-[9px] md:h-52 md:w-52 lg:h-60 lg:w-60">
            <Image
              src="/dr-ishdeep-singla.jpeg"
              alt="Dr. Ishdeep Singla, Assistant Director (Skill Development), Chandigarh University"
              fill
              priority
              sizes="(max-width: 640px) 192px, (max-width: 1024px) 224px, 240px"
              className="object-cover object-[center_38%]"
            />
          </div>
          <div aria-hidden="true" className="absolute left-[12%] top-[24%] h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_0_6px_rgba(16,185,129,0.10)]" />
          <div aria-hidden="true" className="absolute right-[12%] top-[48%] h-4 w-4 rotate-45 rounded-sm bg-emerald-500/20" />
        </div>
      </section>

      <aside
        aria-label="Project acknowledgment"
        className="relative mx-auto mt-6 flex w-full items-center justify-center gap-4 overflow-hidden rounded-2xl border border-emerald-700/15 bg-[linear-gradient(110deg,rgba(16,185,129,0.07),rgba(255,255,255,0.92)_42%,rgba(16,185,129,0.045))] px-5 py-5 shadow-[0_14px_38px_-30px_rgba(15,23,42,0.38)] sm:px-8 sm:py-6 dark:bg-card/80"
      >
        <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-emerald-700/15 bg-white/90 text-emerald-700 shadow-sm dark:bg-background dark:text-emerald-400">
          <UsersRound className="h-5 w-5" />
        </span>
        <p className="max-w-4xl text-left text-sm leading-6 text-slate-700 sm:text-base sm:leading-7 dark:text-muted-foreground">
          <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700 sm:text-[11px] dark:text-emerald-400">
            A collaborative initiative
          </span>
          <span className="font-medium text-slate-900 dark:text-foreground">A teamwork project by the </span>
          <span className="font-bold text-emerald-700 dark:text-emerald-400">Technical Training team</span>
          <span className="font-medium text-slate-900 dark:text-foreground">, under the supervision of </span>
          <span className="font-bold text-slate-900 dark:text-foreground">Dr. Ishdeep Singla.</span>
        </p>
      </aside>
    </div>
  );
}
