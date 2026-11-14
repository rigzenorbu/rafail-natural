"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatINR } from "@/lib/pricing";

type NewOrder = { id: number; orderNumber: string; total: number; paymentMethod: string; customerName: string; city: string };
type PushState = "checking" | "unsupported" | "off" | "on" | "blocked" | "busy";

const HOW: Record<string, string> = { COD: "Cash on Delivery", UPI: "UPI / QR · check payment", ONLINE: "Paid online" };

function keyBytes(base64: string) {
  const pad = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

// A short two-note chime. Browsers only allow sound once the page has been clicked.
function chime() {
  try {
    const ctx = new AudioContext();
    [880, 1318.5].forEach((freq, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = freq;
      const t = ctx.currentTime + i * 0.16;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + 0.55);
    });
    setTimeout(() => ctx.close(), 1200);
  } catch {}
}

export default function OrderAlerts({ vapidKey }: { vapidKey: string | null }) {
  const router = useRouter();
  const known = useRef<Set<number> | null>(null);
  const count = useRef(0);
  const showCount = () => {
    const plain = document.title.replace(/^\(\d+\) /, "");
    document.title = count.current ? `(${count.current}) ${plain}` : plain;
  };
  const [toasts, setToasts] = useState<NewOrder[]>([]);
  const [push, setPush] = useState<PushState>("checking");
  const [note, setNote] = useState("");
  const [iosHint, setIosHint] = useState(false);

  // Check for new orders every 15 seconds, and straight away when the tab comes back into view.
  useEffect(() => {
    async function check() {
      try {
        const res = await fetch("/api/admin/orders/feed", { cache: "no-store" });
        if (!res.ok) return;
        const { newOrders } = (await res.json()) as { newOrders: NewOrder[] };
        if (known.current) {
          const fresh = newOrders.filter((o) => !known.current!.has(o.id));
          if (fresh.length) {
            chime();
            setToasts((t) => [...fresh, ...t].slice(0, 3));
            router.refresh();
          }
        }
        known.current = new Set(newOrders.map((o) => o.id));
        count.current = newOrders.length;
        showCount();
        setTimeout(showCount, 1500); // a page refresh resets the tab title; put the count back
      } catch {}
    }
    check();
    const timer = setInterval(check, 15000);
    const onVisible = () => !document.hidden && check();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [router]);

  // Is this device already set up for alerts?
  useEffect(() => {
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
    if (!vapidKey || !("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      setIosHint(ios && !standalone);
      setPush("unsupported");
      return;
    }
    if (Notification.permission === "denied") return setPush("blocked");
    navigator.serviceWorker
      .getRegistration("/admin")
      .then((reg) => reg?.pushManager.getSubscription())
      .then((sub) => setPush(sub ? "on" : "off"))
      .catch(() => setPush("off"));
  }, [vapidKey]);

  async function turnOn() {
    setNote("");
    setPush("busy");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setPush(permission === "denied" ? "blocked" : "off");
        return;
      }
      // the browser's push service can be slow or unreachable; give up after 20 seconds instead of hanging
      const timeout = <T,>(p: Promise<T>) =>
        Promise.race([p, new Promise<T>((_, no) => setTimeout(() => no(new Error("This browser did not respond. Check the internet connection and try again.")), 20000))]);
      const reg = await timeout(navigator.serviceWorker.register("/sw.js", { scope: "/admin" }));
      await timeout(navigator.serviceWorker.ready);
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await timeout(reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(vapidKey!) })));
      const res = await fetch("/api/admin/push", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(sub.toJSON()) });
      if (!res.ok) throw new Error("Could not save this device");
      setPush("on");
      setNote("Order alerts are on for this device.");
    } catch (err) {
      setPush("off");
      setNote((err as Error).message || "Could not turn on alerts on this device.");
    }
  }

  async function turnOff() {
    setPush("busy");
    try {
      const reg = await navigator.serviceWorker.getRegistration("/admin");
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/admin/push", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: sub.endpoint }) });
        await sub.unsubscribe();
      }
    } catch {}
    setPush("off");
    setNote("");
  }

  async function sendTest() {
    setNote("Sending…");
    const res = await fetch("/api/admin/push/test", { method: "POST" });
    const r = await res.json().catch(() => ({ sent: 0 }));
    setNote(r.sent ? `Test alert sent to ${r.sent} device${r.sent === 1 ? "" : "s"}. It should appear in a few seconds.` : "No alert could be sent. Try turning alerts off and on again.");
  }

  return (
    <>
      {push === "on" ? (
        <div className="alerts-bar is-on">
          <span>🔔 Order alerts are on for this device.</span>
          <button onClick={sendTest}>Send a test</button>
          <button onClick={turnOff}>Turn off</button>
          {note && <span className="muted">{note}</span>}
        </div>
      ) : push === "off" || push === "busy" ? (
        <div className="alerts-bar">
          <span><b>Get an alert the moment an order comes in</b>, on this phone or computer, even when the admin panel is closed.</span>
          <button className="btn btn-primary" onClick={turnOn} disabled={push === "busy"}>{push === "busy" ? "Turning on…" : "Turn on order alerts"}</button>
          {note && <span className="muted">{note}</span>}
        </div>
      ) : push === "blocked" ? (
        <div className="alerts-bar">
          <span>Order alerts are blocked in this browser. Allow notifications for this site in the browser settings, then reload the page.</span>
        </div>
      ) : push === "unsupported" && iosHint ? (
        <div className="alerts-bar">
          <span>To get order alerts on iPhone: tap the <b>Share</b> button, choose <b>Add to Home Screen</b>, open “Rafail Orders” from the home screen, and turn alerts on there.</span>
        </div>
      ) : null}

      <div className="order-toasts" aria-live="assertive">
        {toasts.map((o) => (
          <div className="order-toast" key={o.id}>
            <div>
              <b>New order · {formatINR(o.total)}</b>
              <div className="small">{o.orderNumber} · {HOW[o.paymentMethod] ?? o.paymentMethod}</div>
              <div className="small muted">{o.customerName}, {o.city}</div>
            </div>
            <Link href={`/admin/orders/${o.id}`} className="btn btn-primary" onClick={() => setToasts((t) => t.filter((x) => x.id !== o.id))}>Open</Link>
            <button className="order-toast-x" aria-label="Dismiss" onClick={() => setToasts((t) => t.filter((x) => x.id !== o.id))}>×</button>
          </div>
        ))}
      </div>
    </>
  );
}
