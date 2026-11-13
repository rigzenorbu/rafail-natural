"use client";

import { useRef, useState } from "react";

// Browsers only autoplay muted videos, so it starts silent with a button to turn sound on.
export default function PromoVideo({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  function toggle() {
    const v = ref.current;
    if (!v) return;
    v.muted = !muted;
    if (v.paused) v.play().catch(() => {});
    setMuted(!muted);
  }

  return (
    <>
      <video ref={ref} src={src} autoPlay muted loop playsInline preload="auto" />
      <button type="button" className="promo-sound" onClick={toggle} aria-label={muted ? "Turn sound on" : "Turn sound off"}>
        {muted ? "🔇 Sound off" : "🔊 Sound on"}
      </button>
    </>
  );
}
