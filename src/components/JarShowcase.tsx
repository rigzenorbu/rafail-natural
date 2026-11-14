"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type * as T from "three";
import { useCart } from "./CartProvider";
import { formatINR } from "@/lib/pricing";
import type { ShowcaseProduct } from "@/lib/showcase";

type Api = { focus: (i: number | null) => void };

// World size of one jar radius, and the gap between jars standing in a row.
const SCALE = 0.5;
const SPACING = 1.4;

export default function JarShowcase({ products }: { products: ShowcaseProduct[] }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const tagRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const apiRef = useRef<Api | null>(null);
  const [active, setActive] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [toast, setToast] = useState(false);
  const { add } = useCart();

  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};
    (async () => {
      try {
        const THREE = await import("three");
        const { RoomEnvironment } = await import("three/examples/jsm/environments/RoomEnvironment.js");
        if (disposed || !mountRef.current) return;
        cleanup = buildScene(THREE, RoomEnvironment);
      } catch (e) {
        console.warn("3D showcase unavailable", e);
        if (!disposed) setFailed(true);
      }
    })();

    function buildScene(THREE: typeof T, RoomEnvironment: new () => T.Scene) {
      const root = mountRef.current!;
      const n = products.length;
      const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
      let W = root.clientWidth || 1;
      let H = root.clientHeight || 1;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
      renderer.setPixelRatio(Math.min(devicePixelRatio, W < 700 ? 1.5 : 2));
      renderer.setSize(W, H);
      // Neutral tone mapping keeps the label artwork's own colours and contrast.
      renderer.toneMapping = THREE.NeutralToneMapping;
      renderer.toneMappingExposure = 1;
      renderer.shadowMap.enabled = true;
      // The jars only turn on their own axis, so the shadows are drawn once, not every frame.
      renderer.shadowMap.autoUpdate = false;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      root.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.environmentIntensity = 0.7;

      const camera = new THREE.PerspectiveCamera(30, W / H, 0.1, 60);

      // ---------- lights ----------
      const key = new THREE.DirectionalLight(0xfff1e2, 1.7);
      key.position.set(1.6, 6.5, 4.6);
      key.castShadow = true;
      key.shadow.mapSize.set(2048, 2048);
      Object.assign(key.shadow.camera, { left: -3.5, right: 3.5, top: 3, bottom: -2, near: 1, far: 15 });
      key.shadow.bias = -0.0004;
      key.shadow.normalBias = 0.02;
      key.shadow.radius = 5;
      const rim = new THREE.DirectionalLight(0xffe0bd, 1.2);
      rim.position.set(-3, 3.2, -4);
      scene.add(key, rim, new THREE.HemisphereLight(0xfff8ef, 0xd9cbb5, 0.35));

      const ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: 0.09 }));
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      scene.add(ground);

      // ---------- procedural textures ----------
      function canvasTex(w: number, h: number, draw: (x: CanvasRenderingContext2D) => void) {
        const c = document.createElement("canvas");
        c.width = w;
        c.height = h;
        draw(c.getContext("2d")!);
        const t = new THREE.CanvasTexture(c);
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        return t;
      }
      const grain = canvasTex(256, 256, (x) => {
        x.fillStyle = "#e8e8e8";
        x.fillRect(0, 0, 256, 256);
        for (let i = 0; i < 9000; i++) {
          const v = 170 + Math.random() * 85;
          x.fillStyle = `rgb(${v},${v},${v})`;
          x.fillRect(Math.random() * 256, Math.random() * 256, 1 + Math.random() * 2, 1 + Math.random() * 2);
        }
      });
      grain.repeat.set(5, 4);
      // fine vertical knurling on the lid edge
      const knurl = canvasTex(64, 4, (x) => {
        for (let i = 0; i < 64; i++) {
          const v = 128 + Math.sin((i / 64) * Math.PI * 2) * 127;
          x.fillStyle = `rgb(${v},${v},${v})`;
          x.fillRect(i, 0, 1, 4);
        }
      });
      knurl.repeat.set(110, 1);
      const shadowBlob = canvasTex(256, 256, (x) => {
        const g = x.createRadialGradient(128, 128, 10, 128, 128, 128);
        g.addColorStop(0, "rgba(40,28,16,.55)");
        g.addColorStop(0.5, "rgba(40,28,16,.18)");
        g.addColorStop(1, "rgba(40,28,16,0)");
        x.fillStyle = g;
        x.fillRect(0, 0, 256, 256);
      });

      // ---------- shared jar parts ----------
      const v2 = (pts: number[][]) => pts.map(([a, b]) => new THREE.Vector2(a, b));
      const glassGeo = new THREE.LatheGeometry(
        v2([[0, 0], [0.85, 0], [0.95, 0.025], [0.995, 0.09], [1, 0.2], [1, 2.28], [0.985, 2.4], [0.94, 2.5], [0.9, 2.55], [0.9, 2.66]]),
        96
      );
      // Plain see-through glass with strong reflections: far cheaper per frame than
      // true transmission, which re-renders the whole scene behind every jar.
      const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0xf4faf7,
        roughness: 0.04,
        metalness: 0,
        transparent: true,
        opacity: 0.16,
        envMapIntensity: 2.6,
        clearcoat: 1,
        clearcoatRoughness: 0.03,
        depthWrite: false,
      });
      const baseGeo = new THREE.CylinderGeometry(0.96, 0.94, 0.07, 64);
      const lidGeo = new THREE.LatheGeometry(
        v2([[0, 2.98], [0.9, 2.98], [0.99, 2.965], [1.035, 2.93], [1.05, 2.88], [1.05, 2.62], [1.04, 2.585], [1, 2.57], [0.95, 2.57]]),
        128
      );
      const lidMat = new THREE.MeshPhysicalMaterial({
        color: 0xe6bd68,
        metalness: 1,
        roughness: 0.3,
        clearcoat: 0.6,
        clearcoatRoughness: 0.12,
        bumpMap: knurl,
        bumpScale: 0.2,
        envMapIntensity: 1.5,
      });
      const powderGeo = new THREE.LatheGeometry(
        v2([[0, 0.06], [0.9, 0.06], [0.94, 0.1], [0.94, 2.14], [0.82, 2.19], [0.5, 2.23], [0, 2.24]]),
        64
      );
      const labelTheta = (height: number, aspect: number) => Math.min(2.75, (height * aspect) / 1.008);

      // ---------- container shapes (all measured in radii of the container body) ----------
      const blackLidMat = new THREE.MeshPhysicalMaterial({
        color: 0x161616,
        metalness: 0.55,
        roughness: 0.42,
        clearcoat: 0.3,
        clearcoatRoughness: 0.4,
        bumpMap: knurl,
        bumpScale: 0.7,
      });
      const shapes = {
        // the Snow Land jar: tall, gold lid
        jar: { glass: glassGeo, lid: lidGeo, lidMat, fill: powderGeo, height: 2.98, labelBottom: 0.4, labelH: 1.66 },
        // the small squat shilajit jar: black ribbed lid, label band low on the body
        pot: {
          glass: new THREE.LatheGeometry(
            v2([[0, 0], [0.86, 0], [0.96, 0.03], [1, 0.1], [1, 1.56], [0.98, 1.7], [0.92, 1.8], [0.87, 1.85], [0.87, 1.98]]),
            96
          ),
          lid: new THREE.LatheGeometry(
            v2([[0, 2.36], [0.9, 2.36], [0.97, 2.345], [1.0, 2.31], [1.01, 2.26], [1.01, 1.99], [1.0, 1.955], [0.96, 1.94], [0.9, 1.94]]),
            128
          ),
          lidMat: blackLidMat,
          fill: new THREE.LatheGeometry(v2([[0, 0.06], [0.9, 0.06], [0.94, 0.1], [0.94, 1.52], [0.9, 1.62], [0.6, 1.68], [0, 1.7]]), 64),
          height: 2.36,
          labelBottom: 0.3,
          labelH: 1.2,
        },
        // the pulp bottle: straight body, rounded shoulders, narrow neck and a small gold cap
        bottle: {
          glass: new THREE.LatheGeometry(
            v2([[0, 0], [0.88, 0], [0.97, 0.04], [1, 0.14], [1, 2.8], [0.985, 2.98], [0.94, 3.16], [0.86, 3.34], [0.77, 3.5], [0.7, 3.64], [0.66, 3.78], [0.65, 3.98]]),
            96
          ),
          lid: new THREE.LatheGeometry(
            v2([[0, 4.25], [0.6, 4.25], [0.67, 4.225], [0.7, 4.17], [0.7, 3.97], [0.69, 3.94], [0.64, 3.93]]),
            96
          ),
          lidMat,
          fill: new THREE.LatheGeometry(
            v2([[0, 0.08], [0.9, 0.08], [0.95, 0.14], [0.95, 2.8], [0.93, 2.98], [0.89, 3.14], [0.81, 3.32], [0.72, 3.48], [0.65, 3.6], [0, 3.62]]),
            64
          ),
          height: 4.25,
          labelBottom: 0.52,
          labelH: 2.22,
        },
      };
      const maxAniso = renderer.capabilities.getMaxAnisotropy();
      let pending = n;
      let readyAt = 0;
      const loaded = () => {
        renderer.shadowMap.needsUpdate = true;
        if (--pending <= 0 && !disposed) {
          readyAt = performance.now();
          setReady(true);
        }
      };
      // Label artwork, redrawn with a little extra contrast so the fine print stays
      // readable once it is scaled down onto the jar.
      function labelTexture(url: string) {
        const c = document.createElement("canvas");
        c.width = c.height = 2;
        const tex = new THREE.CanvasTexture(c);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = maxAniso;
        const img = new Image();
        img.onload = () => {
          if (disposed) return;
          const k = Math.min(1, 2048 / img.naturalWidth);
          c.width = Math.round(img.naturalWidth * k);
          c.height = Math.round(img.naturalHeight * k);
          const x = c.getContext("2d")!;
          x.imageSmoothingQuality = "high";
          x.filter = "contrast(1.22) saturate(1.12)";
          x.drawImage(img, 0, 0, c.width, c.height);
          tex.dispose(); // canvas was resized: allocate fresh GPU storage
          tex.needsUpdate = true;
          loaded();
        };
        img.onerror = loaded;
        img.src = url;
        return tex;
      }

      function berries(color: string) {
        const geo = new THREE.SphereGeometry(0.088, 16, 12);
        const mat = new THREE.MeshPhysicalMaterial({ roughness: 0.48, clearcoat: 0.3, clearcoatRoughness: 0.35, sheen: 0.4, sheenColor: new THREE.Color("#ffd7a8") });
        const mats: T.Matrix4[] = [];
        const m = new THREE.Matrix4();
        const q = new THREE.Quaternion();
        const s = new THREE.Vector3();
        const p = new THREE.Vector3();
        for (let y = 0.15, layer = 0; y < 2.1; y += 0.15, layer++) {
          for (let gx = -0.86; gx <= 0.86; gx += 0.17) {
            for (let gz = -0.86; gz <= 0.86; gz += 0.15) {
              const ox = gx + (Math.round(gz / 0.15) % 2 ? 0.085 : 0) + (layer % 2) * 0.045;
              p.set(ox + (Math.random() - 0.5) * 0.05, y + (Math.random() - 0.5) * 0.06, gz + (Math.random() - 0.5) * 0.05);
              const rad = Math.hypot(p.x, p.z);
              if (rad > 0.84 || (rad < 0.5 && y < 1.8)) continue; // the core is never seen
              const k = 0.78 + Math.random() * 0.4;
              s.set(k, k * (0.85 + Math.random() * 0.2), k);
              q.setFromEuler(new THREE.Euler(Math.random() * 3, Math.random() * 3, 0));
              mats.push(m.compose(p, q, s).clone());
            }
          }
        }
        const mesh = new THREE.InstancedMesh(geo, mat, mats.length);
        const base = new THREE.Color(color);
        const deep = new THREE.Color("#b5470f");
        const light = new THREE.Color("#f2a24a");
        const c = new THREE.Color();
        mats.forEach((mm, i) => {
          mesh.setMatrixAt(i, mm);
          const r = Math.random();
          mesh.setColorAt(i, c.copy(base).lerp(r < 0.5 ? deep : light, Math.random() * 0.75));
        });
        mesh.castShadow = true;
        return mesh;
      }

      // ---------- build jars ----------
      const jars = products.map((p, i) => {
        const shape = shapes[p.shape ?? "jar"];
        const scale = p.scale ?? SCALE;
        const outer = new THREE.Group();
        outer.scale.setScalar(scale);
        const spin = new THREE.Group();
        outer.add(spin);

        const glass = new THREE.Mesh(shape.glass, glassMat);
        glass.renderOrder = 2;
        const base = new THREE.Mesh(baseGeo, glassMat);
        base.position.y = 0.035;
        const lid = new THREE.Mesh(shape.lid, shape.lidMat);
        lid.castShadow = true;
        spin.add(glass, base, lid);

        const fillMat =
          p.fill === "resin"
            ? new THREE.MeshPhysicalMaterial({ color: p.fillColor, roughness: 0.28, clearcoat: 0.7, clearcoatRoughness: 0.2 })
            : p.fill === "pulp"
              ? new THREE.MeshStandardMaterial({ color: p.fillColor, roughness: 0.5, bumpMap: grain, bumpScale: 0.6 })
              : new THREE.MeshStandardMaterial({ color: p.fillColor, roughness: 0.96, map: grain, bumpMap: grain, bumpScale: 1.5 });
        const fill = p.fill === "berries" ? berries(p.fillColor) : new THREE.Mesh(shape.fill, fillMat);
        fill.castShadow = true;
        spin.add(fill);

        const theta = labelTheta(shape.labelH, p.labelAspect);
        const labelGeo = new THREE.CylinderGeometry(1.008, 1.008, shape.labelH, 128, 1, true, -theta / 2, theta);
        const tex = labelTexture(p.label);
        const label = new THREE.Mesh(labelGeo, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.62, envMapIntensity: 0.55 }));
        label.position.y = shape.labelBottom + shape.labelH / 2;
        label.castShadow = true;
        // Behind the artwork: either a band in the label's own colour that wraps the whole way
        // round, or the paper's back, seen through the glass when the jar turns round.
        const behind = p.band
          ? new THREE.Mesh(
              new THREE.CylinderGeometry(1.004, 1.004, shape.labelH, 96, 1, true),
              new THREE.MeshStandardMaterial({ color: p.band, roughness: 0.62, envMapIntensity: 0.55, side: THREE.DoubleSide })
            )
          : new THREE.Mesh(labelGeo, new THREE.MeshStandardMaterial({ color: 0xebe3d5, roughness: 0.9, side: THREE.BackSide }));
        behind.position.y = label.position.y;
        spin.add(behind, label);

        const blob = new THREE.Mesh(
          new THREE.PlaneGeometry(3.2, 3.2),
          new THREE.MeshBasicMaterial({ map: shadowBlob, transparent: true, depthWrite: false })
        );
        blob.rotation.x = -Math.PI / 2;
        blob.position.y = 0.004;
        outer.add(blob);

        const hit = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, shape.height + 0.12, 16));
        hit.position.y = shape.height / 2;
        hit.visible = false;
        hit.userData.index = i;
        outer.add(hit);

        scene.add(outer);
        return { outer, spin, hit, angle: 0, vel: 0, lift: 0, face: 0, scale, h: shape.height * scale, px: 0, py: 0, casters: [lid, fill, label] };
      });
      const hits = jars.map((j) => j.hit);

      // ---------- where each jar stands ----------
      // One row on wide screens. On a phone, more than three jars stand in two rows so they stay big enough to read.
      let rowCount = 1;
      let spanW = 0;
      let totalH = 0;
      const maxH = Math.max(...jars.map((j) => j.h));
      function layout() {
        const twoRows = W / H < 1 && n > 3;
        const top = twoRows ? Math.ceil(n / 2) : n;
        const rows = twoRows ? [jars.slice(0, top), jars.slice(top)] : [jars];
        // the same clear space between neighbours, however wide each container is
        const gap = (twoRows ? 1.3 : n > 3 ? 1.25 : SPACING) - 2 * SCALE;
        const pitch = maxH + 1.22; // leaves room for the price tag under the upper row
        const widths = rows.map((row) => row.reduce((s, j) => s + 2 * j.scale, 0) + (row.length - 1) * gap);
        rows.forEach((row, r) => {
          const y = (rows.length - 1 - r) * pitch;
          let x = -widths[r] / 2;
          row.forEach((j) => {
            j.px = x + j.scale;
            x += 2 * j.scale + gap;
            j.py = y;
            j.casters.forEach((m) => (m.castShadow = y === 0)); // only jars on the floor shade it
          });
        });
        rowCount = rows.length;
        spanW = Math.max(...widths) + 0.1;
        totalH = (rows.length - 1) * pitch + maxH;
        renderer.shadowMap.needsUpdate = true;
      }
      layout();

      // ---------- camera framing ----------
      let focused: number | null = null;
      let hovered: number | null = null;
      const camPos = new THREE.Vector3();
      const camLook = new THREE.Vector3();
      const wantPos = new THREE.Vector3();
      const wantLook = new THREE.Vector3();
      const parallax = new THREE.Vector2();

      function frame() {
        const aspect = W / H;
        const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
        if (focused === null) {
          const needW = spanW + (aspect < 1 ? 0.35 : n > 3 ? 1.2 : 1.8);
          const needH = rowCount > 1 ? totalH + 2.5 : n > 3 ? 3.65 : 3.3;
          const d = Math.max(needW / aspect, needH) / (2 * t);
          const visH = 2 * d * t;
          // jars sit below centre, leaving the top of the frame for the heading
          const mid = rowCount > 1 ? totalH / 2 + visH * 0.035 : Math.min(maxH, 1.49) / 2 + visH * (aspect < 1 ? 0.04 : 0.1);
          wantLook.set(parallax.x * 0.25, mid, 0);
          wantPos.set(parallax.x * 0.6, wantLook.y + d * 0.13 + parallax.y * 0.2, d);
        } else {
          // wide screens: jar on the left, panel on the right; narrow: jar on top, panel below
          const j = jars[focused];
          const x = j.px;
          const cy = j.py + j.h / 2;
          const size = Math.max(j.h, 1.3); // a small jar is not blown up to fill the frame
          const wide = aspect >= 1.05;
          const d = wide ? size / (0.6 * 2 * t) : Math.max(size / (0.4 * 2 * t), 1.4 / (0.85 * 2 * t * aspect));
          if (wide) wantLook.set(x + 2 * d * t * aspect * 0.17, cy, 0);
          else wantLook.set(x, cy - 2 * d * t * 0.24, 0);
          wantPos.set(wantLook.x, wantLook.y + d * 0.1, d);
        }
      }
      frame();
      camPos.copy(wantPos);
      camLook.copy(wantLook);

      function focus(i: number | null) {
        focused = i;
        setActive(i);
        if (i !== null) jars[i].vel = 0;
        frame();
      }
      apiRef.current = { focus };

      // ---------- input ----------
      const el = renderer.domElement;
      el.style.touchAction = "pan-y";
      const ray = new THREE.Raycaster();
      const ndc = new THREE.Vector2();
      function pick(e: PointerEvent): number | null {
        const r = el.getBoundingClientRect();
        ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
        ray.setFromCamera(ndc, camera);
        const h = ray.intersectObjects(hits, false)[0];
        return h ? (h.object.userData.index as number) : null;
      }
      let down = false;
      let moved = 0;
      let lastX = 0;
      let lastT = 0;
      let dragJar: number | null = null;
      let lastTouch = 0;
      const onDown = (e: PointerEvent) => {
        down = true;
        moved = 0;
        lastX = e.clientX;
        lastT = performance.now();
        dragJar = focused ?? pick(e);
        if (dragJar !== null) jars[dragJar].vel = 0;
      };
      const onMove = (e: PointerEvent) => {
        if (down && dragJar !== null) {
          const dx = e.clientX - lastX;
          moved += Math.abs(dx);
          const now = performance.now();
          const da = dx * 0.012;
          jars[dragJar].angle += da;
          jars[dragJar].vel = da / Math.max((now - lastT) / 1000, 0.008);
          lastX = e.clientX;
          lastT = now;
          lastTouch = now;
          if (moved > 6 && e.pointerType !== "mouse") el.setPointerCapture?.(e.pointerId);
          return;
        }
        if (e.pointerType === "mouse") {
          hovered = pick(e);
          el.style.cursor = hovered !== null ? "pointer" : focused !== null ? "grab" : "default";
          const r = el.getBoundingClientRect();
          parallax.set(((e.clientX - r.left) / r.width) * 2 - 1, ((e.clientY - r.top) / r.height) * 2 - 1);
          if (focused === null) frame();
        }
      };
      const onUp = (e: PointerEvent) => {
        if (!down) return;
        down = false;
        lastTouch = performance.now();
        if (moved < 6) {
          const i = pick(e);
          if (i !== null && i !== focused) focus(i);
        }
        dragJar = null;
      };
      const onLeave = () => {
        hovered = null;
        parallax.set(0, 0);
        if (focused === null) frame();
      };
      el.addEventListener("pointerdown", onDown);
      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerleave", onLeave);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);

      // ---------- loop (paused while off-screen or in a background tab) ----------
      let visible = true;
      let raf = 0;
      let prev = performance.now();
      const proj = new THREE.Vector3();
      function tick(now: number) {
        raf = 0;
        if (disposed || !visible || document.hidden) return;
        raf = requestAnimationFrame(tick);
        const dt = Math.min((now - prev) / 1000, 0.05);
        prev = now;
        const k = 1 - Math.exp(-dt * 4.2);
        camPos.lerp(wantPos, k);
        camLook.lerp(wantLook, k);
        camera.position.copy(camPos);
        camera.lookAt(camLook);

        jars.forEach((j, i) => {
          const idle = now - lastTouch > 2500 && !(down && dragJar === i);
          if (!(down && dragJar === i)) {
            j.angle += j.vel * dt;
            j.vel *= Math.exp(-dt * 3.2);
          }
          const hot = hovered === i && focused === null;
          // in the overview, a jar that was dragged round eases back to show its label again
          if (focused === null && idle) {
            const front = Math.round(j.angle / (Math.PI * 2)) * Math.PI * 2;
            j.angle += (front - j.angle) * (1 - Math.exp(-dt * 2.2));
          }
          let sway = 0;
          if (!reduceMotion) {
            if (focused === i && idle && Math.abs(j.vel) < 0.05) j.angle += dt * 0.35;
            // a slow, shallow sway that never turns the label away from the viewer
            else if (focused === null) sway = Math.sin(now * 0.0004 + i * 1.7) * 0.16;
          }
          // a hovered jar eases round to face the viewer squarely
          j.face += ((hot ? 1 : 0) - j.face) * (1 - Math.exp(-dt * 6));
          // each jar is turned towards the camera, so side jars show their label square-on too
          const toCam = Math.atan2(camPos.x - j.px, camPos.z);
          j.spin.rotation.y = toCam + j.angle + sway * (1 - j.face);
          j.lift += ((hot ? 0.06 : 0) - j.lift) * (1 - Math.exp(-dt * 8));
          // jars rise into place one after another once the artwork has loaded
          const u = readyAt && !reduceMotion ? Math.min(Math.max((now - readyAt - i * 110) / 900, 0), 1) : readyAt ? 1 : 0;
          const rise = 1 - Math.pow(1 - u, 3);
          j.outer.position.set(j.px, j.py + j.lift - (1 - rise) * 0.22, 0);
          j.outer.scale.setScalar(j.scale * (0.94 + 0.06 * rise));

          const tag = tagRefs.current[i];
          if (tag) {
            proj.set(j.px, j.py - 0.12, 0.45).project(camera);
            tag.style.transform = `translate(-50%, 0) translate(${((proj.x + 1) / 2) * W}px, ${((1 - proj.y) / 2) * H}px)`;
          }
        });
        renderer.render(scene, camera);
      }
      const start = () => {
        if (!raf && visible && !document.hidden && !disposed) {
          prev = performance.now();
          raf = requestAnimationFrame(tick);
        }
      };
      const io = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        start();
      });
      io.observe(root);
      const onVis = () => start();
      document.addEventListener("visibilitychange", onVis);

      const ro = new ResizeObserver(() => {
        W = root.clientWidth || 1;
        H = root.clientHeight || 1;
        renderer.setPixelRatio(Math.min(devicePixelRatio, W < 700 ? 1.5 : 2));
        renderer.setSize(W, H);
        camera.aspect = W / H;
        camera.updateProjectionMatrix();
        layout();
        frame();
        camPos.copy(wantPos);
        camLook.copy(wantLook);
      });
      ro.observe(root);
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      start();

      return () => {
        cancelAnimationFrame(raf);
        io.disconnect();
        ro.disconnect();
        document.removeEventListener("visibilitychange", onVis);
        el.removeEventListener("pointerdown", onDown);
        el.removeEventListener("pointermove", onMove);
        el.removeEventListener("pointerleave", onLeave);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
        apiRef.current = null;
        scene.traverse((o) => {
          const m = o as T.Mesh;
          if (m.geometry) m.geometry.dispose();
          const mats = m.material ? (Array.isArray(m.material) ? m.material : [m.material]) : [];
          mats.forEach((mat) => {
            Object.values(mat).forEach((v) => (v as T.Texture)?.isTexture && (v as T.Texture).dispose());
            mat.dispose();
          });
        });
        scene.environment?.dispose();
        pmrem.dispose();
        renderer.dispose();
        el.remove();
      };
    }

    return () => {
      disposed = true;
      cleanup();
    };
  }, [products]);

  const focus = (i: number | null) => apiRef.current?.focus(i);
  const step = (d: number) => active !== null && focus((active + d + products.length) % products.length);
  const p = active !== null ? products[active] : null;

  function onKey(e: React.KeyboardEvent) {
    if (active === null) return;
    if (e.key === "Escape") focus(null);
    else if (e.key === "ArrowRight") step(1);
    else if (e.key === "ArrowLeft") step(-1);
  }

  function addToCart(item: ShowcaseProduct) {
    add(item.variantId, 1);
    setToast(true);
    setTimeout(() => setToast(false), 3000);
  }

  if (failed) {
    return (
      <section className="jar3d jar3d-fallback">
        <div className="container">
          <div className="product-grid">
            {products.map((item) => (
              <Link key={item.slug} href={`/products/${item.slug}`} className="product-card">
                <div className="img-wrap"><img src={item.image} alt={item.name} /></div>
                <div className="body">
                  <span className="name">{item.name}</span>
                  <span className="price">{formatINR(item.price)}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`jar3d ${products.length > 3 ? "jar3d-many" : ""} ${active !== null ? "is-focused" : ""}`} onKeyDown={onKey} aria-label="Our products in 3D">
      <div className="jar3d-stage" ref={mountRef} data-ready={ready} />
      {!ready && <div className="jar3d-loading">Preparing the jars…</div>}

      <div className="jar3d-intro">
        <div className="hero-eyebrow">Snow Land · from Ladakh</div>
        <h1>Nature&rsquo;s touch, pure as snow</h1>
        <p>Tap a jar to explore it. Drag to turn it around.</p>
      </div>

      {products.map((item, i) => (
        <button
          key={item.slug}
          ref={(b) => { tagRefs.current[i] = b; }}
          className="jar3d-tag"
          onClick={() => focus(i)}
          aria-label={`${item.name}, ${item.sizeLabel}, ${formatINR(item.price)}`}
        >
          <span className="jar3d-tag-name">{item.name}</span>
          <span className="jar3d-tag-price">
            {formatINR(item.price)} <span>· {item.sizeLabel}</span>
          </span>
        </button>
      ))}

      {p && (
        <aside className="jar3d-panel" role="dialog" aria-label={p.name} key={p.slug}>
          <button className="jar3d-close" onClick={() => focus(null)} aria-label="Back to all jars">×</button>
          <div className="hero-eyebrow">Rafail Natural</div>
          <h2>{p.name}</h2>
          <p className="muted">{p.shortDescription}</p>
          <div className="product-price">
            <span className="price">{formatINR(p.price)}</span>
            {p.mrp > p.price && <span className="mrp">MRP {formatINR(p.mrp)}</span>}
          </div>
          <p className="muted small">
            Net quantity {p.sizeLabel} · {p.stock > 0 ? "In stock" : "Out of stock"} · Inclusive of all taxes
          </p>
          <div className="jar3d-actions">
            <button className="btn btn-accent btn-lg" disabled={p.stock <= 0} onClick={() => addToCart(p)}>Add to cart</button>
            <Link className="btn btn-primary btn-lg" href={`/checkout?buy=${p.variantId}&qty=1`}>Buy now</Link>
          </div>
          <Link href={`/products/${p.slug}`} className="link small">Full details →</Link>
          <div className="jar3d-nav">
            <button onClick={() => step(-1)} aria-label="Previous product">←</button>
            <span>{active! + 1} / {products.length}</span>
            <button onClick={() => step(1)} aria-label="Next product">→</button>
          </div>
        </aside>
      )}

      {toast && (
        <div className="toast" role="status">
          Added to cart <Link href="/cart">View cart →</Link>
        </div>
      )}
    </section>
  );
}
