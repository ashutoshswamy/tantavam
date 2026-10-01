"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Volume2, VolumeX, X } from "lucide-react";
import { startTourOnce } from "./tour";

import { INTRO_SEEN_KEY as KEY } from "@/lib/site";

// Plays once per browser session. A pre-paint script in app/layout.tsx hides it for returning visitors
// (and reduced-motion users) so they never see a flash of the overlay.
export function IntroVideo() {
  const [state, setState] = useState<"playing" | "closing" | "gone">("playing");
  const [muted, setMuted] = useState(false);
  const overlay = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  // server: not seen; client: whatever the inline script decided. Lets returning visitors unmount the video after hydration.
  const seenBefore = useSyncExternalStore(
    () => () => {},
    () => document.documentElement.hasAttribute("data-intro-seen"),
    () => false,
  );
  const active = state === "playing" && !seenBefore;

  // no intro this visit (already seen / reduced motion): go straight to the walkthrough
  useEffect(() => {
    if (seenBefore) startTourOnce();
  }, [seenBefore]);

  // Try with sound; browsers block unmuted autoplay until the visitor interacts, so fall back to muted + a sound button.
  useEffect(() => {
    const v = video.current;
    if (!active || !v) return;
    // blocked: play muted, then switch sound on at the visitor's first tap/click/key (the browser allows it from then on)
    const unmute = (e: Event) => {
      if ((e.target as HTMLElement).closest("[data-sound-toggle]")) return; // the speaker button handles itself
      v.muted = false;
      setMuted(false);
    };
    v.play().catch(() => {
      v.muted = true;
      setMuted(true);
      window.addEventListener("pointerdown", unmute, { once: true, capture: true });
      window.addEventListener("keydown", unmute, { once: true, capture: true });
      v.play().catch(close);
    });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", unmute, { capture: true });
      window.removeEventListener("keydown", unmute, { capture: true });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  function toggleSound() {
    const v = video.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }

  // Shrink the video into the navbar logo's box, then fade it out.
  function close() {
    if (state !== "playing") return;
    setState("closing");
    try {
      sessionStorage.setItem(KEY, "1");
    } catch {}
    const done = () => {
      document.documentElement.setAttribute("data-intro-seen", "");
      setState("gone");
      startTourOnce();
    };
    const el = overlay.current;
    const logo = document.getElementById("site-logo")?.getBoundingClientRect();
    if (!el || !logo) return done();
    // transform + opacity only: both run on the compositor, so the shrink stays smooth while the video decodes
    const { innerWidth: w, innerHeight: h } = window;
    const scale = Math.min(logo.width / w, logo.height / h);
    const x = logo.left + (logo.width - w * scale) / 2;
    const y = logo.top + (logo.height - h * scale) / 2;
    el.style.transformOrigin = "0 0";
    el.style.willChange = "transform, opacity";
    fadeAudio(video.current, 1000);
    el.animate(
      [
        { transform: "translate(0, 0) scale(1)", opacity: 1 },
        { transform: `translate(${x}px, ${y}px) scale(${scale})`, opacity: 1, offset: 0.7 },
        { transform: `translate(${x}px, ${y}px) scale(${scale})`, opacity: 0 },
      ],
      { duration: 1000, easing: "cubic-bezier(0.4, 0, 0.2, 1)", fill: "forwards" },
    ).finished.then(done, done);
  }

  if (state === "gone" || (seenBefore && state === "playing")) return null;
  return (
    <>
      <div
        ref={overlay}
        role="dialog"
        aria-label="Tantavam intro"
        className={`intro fixed inset-0 z-[100] bg-kajal ${state === "closing" ? "pointer-events-none" : ""}`}
      >
        <video ref={video} src="/hero-video-updated.mp4" playsInline onEnded={close} onError={close} className="h-full w-full object-cover" />
        <div className={`absolute bottom-6 right-6 flex gap-2 transition-opacity ${state === "closing" ? "opacity-0" : ""}`}>
          <button
            data-sound-toggle
            onClick={toggleSound}
            aria-label={muted ? "Turn sound on" : "Turn sound off"}
            className="grid size-11 place-content-center rounded-full bg-mallige/90 text-kajal backdrop-blur hover:bg-mallige"
          >
            {muted ? <VolumeX size={18} strokeWidth={2} /> : <Volume2 size={18} strokeWidth={2} />}
          </button>
          <button
            onClick={close}
            autoFocus
            className="inline-flex items-center gap-2 rounded-full bg-mallige/90 px-5 py-2.5 text-sm font-medium text-kajal backdrop-blur hover:bg-mallige"
          >
            Skip intro <X size={16} strokeWidth={2} />
          </button>
        </div>
      </div>
    </>
  );
}

// ramp the volume down instead of cutting the sound mid-note
function fadeAudio(v: HTMLVideoElement | null, ms: number) {
  if (!v || v.muted) return;
  const start = performance.now();
  const from = v.volume;
  const tick = (now: number) => {
    const t = Math.min((now - start) / ms, 1);
    v.volume = from * (1 - t);
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
