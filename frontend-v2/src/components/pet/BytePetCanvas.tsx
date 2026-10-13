"use client";

import { useEffect, useRef } from "react";

export type PetMood = "idle" | "active" | "typing" | "listening" | "thinking" | "talking" | "happy";

export default function BytePetCanvas({ mood, hovered, active = false, gazeX = 0, gazeY = 0 }: { mood: PetMood; hovered: boolean; active?: boolean; gazeX?: number; gazeY?: number }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const moodRef = useRef(mood);
  const hoverRef = useRef(hovered);
  const gazeRef = useRef({ x: gazeX, y: gazeY });

  useEffect(() => { moodRef.current = mood; }, [mood]);
  useEffect(() => { hoverRef.current = hovered; }, [hovered]);
  useEffect(() => { gazeRef.current = { x: gazeX, y: gazeY }; }, [gazeX, gazeY]);

  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};

    const setup = async () => {
      const { Application, Container, Graphics } = await import("pixi.js");
      if (disposed || !mountRef.current) return;

      const app = new Application();
      await app.init({
        width: 116,
        height: 132,
        backgroundAlpha: 0,
        antialias: true,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
        autoDensity: true,
        preference: "webgl",
      });
      if (disposed || !mountRef.current) {
        app.destroy(true);
        return;
      }
      app.ticker.maxFPS = 30;
      app.canvas.style.width = "100%";
      app.canvas.style.height = "100%";
      app.canvas.style.pointerEvents = "none";
      mountRef.current.appendChild(app.canvas);

      const shadow = new Graphics().ellipse(58, 116, 26, 3).fill({ color: 0x343d35, alpha: 0.13 });
      app.stage.addChild(shadow);

      const pet = new Container();
      pet.pivot.set(58, 70);
      pet.position.set(58, 70);
      app.stage.addChild(pet);

      const halo = new Graphics()
        .circle(58, 70, 47).stroke({ color: 0xc9676b, alpha: 0.24, width: 1.5 });
      pet.addChild(halo);

      const leftEar = new Graphics()
        .moveTo(29, 54).quadraticCurveTo(22, 24, 32, 23)
        .quadraticCurveTo(45, 23, 49, 43).closePath()
        .fill(0xdf6268).stroke({ color: 0xb14f58, width: 2.5 });
      const rightEar = new Graphics()
        .moveTo(67, 43).quadraticCurveTo(71, 23, 84, 23)
        .quadraticCurveTo(94, 24, 87, 54).closePath()
        .fill(0xdf6268).stroke({ color: 0xb14f58, width: 2.5 });
      pet.addChild(leftEar, rightEar);
      pet.addChild(
        new Graphics().ellipse(36, 38, 5, 10).fill(0xffb4b8),
        new Graphics().ellipse(80, 38, 5, 10).fill(0xffb4b8),
      );

      const leftFoot = new Graphics().ellipse(40, 105, 15, 7).fill(0xb74050);
      const rightFoot = new Graphics().ellipse(76, 105, 15, 7).fill(0xb74050);
      const body = new Graphics()
        .roundRect(23, 38, 70, 69, 32).fill(0xdf6268)
        .roundRect(23, 38, 70, 69, 32).stroke({ color: 0xb14f58, width: 2.5 });
      const shine = new Graphics()
        .roundRect(31, 42, 52, 15, 8).fill({ color: 0xffffff, alpha: 0.10 });
      pet.addChild(leftFoot, rightFoot, body, shine);

      const face = new Graphics()
        .roundRect(30, 49, 56, 46, 22).fill(0xfff1e4)
        .roundRect(30, 49, 56, 46, 22).stroke({ color: 0xffc5ad, width: 1.5 });
      pet.addChild(face);

      const leftEye = new Graphics().ellipse(45, 67, 6.8, 8.2).fill(0xffffff);
      const rightEye = new Graphics().ellipse(71, 67, 6.8, 8.2).fill(0xffffff);
      const leftPupil = new Graphics()
        .ellipse(45, 68, 4.2, 5.6).fill(0x392d40)
        .circle(43.5, 65.5, 1.7).fill(0xffffff);
      const rightPupil = new Graphics()
        .ellipse(71, 68, 4.2, 5.6).fill(0x392d40)
        .circle(69.5, 65.5, 1.7).fill(0xffffff);
      const eyelids = new Graphics()
        .moveTo(40, 67).quadraticCurveTo(45, 71, 50, 67)
        .moveTo(66, 67).quadraticCurveTo(71, 71, 76, 67)
        .stroke({ color: 0x6d4050, width: 2.5, cap: "round" });
      const cheeks = new Graphics()
        .ellipse(39, 79, 5, 3).fill({ color: 0xff9aaa, alpha: 0.8 })
        .ellipse(77, 79, 5, 3).fill({ color: 0xff9aaa, alpha: 0.8 });
      const nose = new Graphics().circle(58, 77, 2.4).fill(0xef8392);
      const smile = new Graphics()
        .moveTo(51, 80).quadraticCurveTo(58, 88, 65, 80)
        .stroke({ color: 0x9a5061, width: 2.3, cap: "round" });
      const thinkingMouth = new Graphics().circle(58, 83, 2.5).fill(0x9a5061);
      const talkingMouth = new Graphics().ellipse(0, 0, 4, 3.5).fill(0x9a5061);
      talkingMouth.position.set(58, 84);
      pet.addChild(leftEye, rightEye, leftPupil, rightPupil, eyelids, cheeks, nose, smile, thinkingMouth, talkingMouth);

      const leftPaw = new Graphics().ellipse(24, 81, 7, 12).fill(0xdd5362);
      const rightPaw = new Graphics().ellipse(92, 81, 7, 12).fill(0xdd5362);
      leftPaw.pivot.set(24, 81);
      leftPaw.position.set(24, 81);
      rightPaw.pivot.set(92, 81);
      rightPaw.position.set(92, 81);
      pet.addChild(leftPaw, rightPaw);

      const orbit = new Container();
      orbit.position.set(58, 13);
      orbit.addChild(
        new Graphics().circle(-9, 0, 2.2).fill(0xb87578),
        new Graphics().circle(0, 0, 2.2).fill(0xb87578),
        new Graphics().circle(9, 0, 2.2).fill(0xb87578),
      );
      app.stage.addChild(orbit);

      let elapsed = 0;
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const tick = (ticker: { deltaMS: number }) => {
        elapsed += ticker.deltaMS / 1000;
        const currentMood = moodRef.current;
        const lively = hoverRef.current || currentMood !== "idle";
        const speed = currentMood === "thinking" ? 1.5 : currentMood === "talking" ? 4 : lively ? 2.2 : 1.7;
        const bob = reducedMotion ? 0 : Math.sin(elapsed * speed) * (currentMood === "talking" ? 1 : lively ? 0.8 : 0.5);
        pet.y = 70 + bob;
        pet.scale.set(currentMood === "happy" && !reducedMotion ? 1.015 + Math.sin(elapsed * 4) * 0.01 : 1);
        pet.rotation = reducedMotion ? 0 : currentMood === "typing"
          ? gazeRef.current.x * 0.055 + gazeRef.current.y * 0.04
          : currentMood === "thinking"
          ? -0.045 + Math.sin(elapsed * 1.6) * 0.016
          : currentMood === "talking" ? Math.sin(elapsed * 5) * 0.015
          : currentMood === "active" ? Math.sin(elapsed * 2) * 0.008 : 0;
        shadow.alpha = 0.78 - Math.abs(bob) * 0.04;
        const blink = !reducedMotion && elapsed % (currentMood === "active" ? 3.7 : 4.6) > (currentMood === "active" ? 3.55 : 4.45);
        leftEye.visible = rightEye.visible = !blink;
        leftPupil.visible = rightPupil.visible = !blink;
        eyelids.visible = blink;
        const pupilX = currentMood === "typing" ? gazeRef.current.x * 2.3 : 0;
        const pupilY = currentMood === "typing" ? gazeRef.current.y * 2.5 : currentMood === "thinking" ? -1.8 : 0;
        leftPupil.x = rightPupil.x = pupilX;
        leftPupil.y = rightPupil.y = pupilY;
        leftPaw.rotation = reducedMotion ? 0 : currentMood === "talking" ? Math.sin(elapsed * 5) * 0.08 : 0;
        rightPaw.rotation = reducedMotion ? 0 : currentMood === "talking" ? -Math.sin(elapsed * 5) * 0.08 : 0;
        talkingMouth.visible = currentMood === "talking";
        thinkingMouth.visible = currentMood === "thinking";
        smile.visible = !talkingMouth.visible && !thinkingMouth.visible;
        if (talkingMouth.visible) talkingMouth.scale.y = reducedMotion ? 1 : 0.65 + Math.abs(Math.sin(elapsed * 12)) * 1.2;
        orbit.visible = currentMood === "thinking";
        orbit.children.forEach((dot, index) => { dot.alpha = reducedMotion ? 1 : 0.35 + (Math.sin(elapsed * 4 - index) + 1) * 0.3; });
        halo.visible = currentMood === "listening";
        halo.alpha = currentMood === "listening" && !reducedMotion ? 0.65 + Math.sin(elapsed * 10) * 0.3 : 1;
      };
      app.ticker.add(tick);
      const onVisibility = () => {
        if (document.hidden) app.ticker.stop();
        else app.ticker.start();
      };
      document.addEventListener("visibilitychange", onVisibility);
      cleanup = () => {
        document.removeEventListener("visibilitychange", onVisibility);
        app.ticker.remove(tick);
        app.destroy(true);
      };
    };

    setup().catch(() => {
      // The HTML fallback remains visible if WebGL is unavailable.
    });
    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return (
    <div ref={mountRef} aria-hidden="true" className={`relative [&:has(canvas)_.pet-fallback]:hidden ${active ? "h-[55px] w-[48px]" : "h-[100px] w-[88px]"}`}>
      <svg className="pet-fallback absolute inset-0 h-full w-full" viewBox="0 0 116 132" aria-hidden="true">
        <ellipse cx="58" cy="121" rx="30" ry="5" fill="#433039" opacity=".22" />
        <path d="M29 54 Q22 24 33 23 Q45 23 49 43 M67 43 Q71 23 84 23 Q94 24 87 54" fill="#df6268" stroke="#b14f58" strokeWidth="2.5" />
        <rect x="23" y="38" width="70" height="69" rx="32" fill="#df6268" stroke="#b14f58" strokeWidth="2.5" />
        <rect x="30" y="49" width="56" height="46" rx="22" fill="#fff1e4" />
        <ellipse cx="45" cy="67" rx="7" ry="8" fill="white" />
        <ellipse cx="71" cy="67" rx="7" ry="8" fill="white" />
        <g transform={mood === "typing" ? `translate(${gazeX * 2.3} ${gazeY * 2.5})` : undefined}>
          <ellipse cx="45" cy="68" rx="4" ry="5.5" fill="#392d40" />
          <ellipse cx="71" cy="68" rx="4" ry="5.5" fill="#392d40" />
          <circle cx="43" cy="65" r="1.7" fill="white" /><circle cx="69" cy="65" r="1.7" fill="white" />
        </g>
        <ellipse cx="39" cy="79" rx="5" ry="3" fill="#ff9aaa" /><ellipse cx="77" cy="79" rx="5" ry="3" fill="#ff9aaa" />
        <path d="M51 80 Q58 88 65 80" fill="none" stroke="#9a5061" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}
