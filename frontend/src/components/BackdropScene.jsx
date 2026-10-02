// three.js scene. Loaded lazily by Backdrop3D so three.js stays out of the main bundle.
import { useEffect, useRef } from 'react';
import {
  AdditiveBlending,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Color,
  CylinderGeometry,
  Fog,
  Group,
  IcosahedronGeometry,
  Mesh,
  MeshBasicMaterial,
  OctahedronGeometry,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Scene,
  SphereGeometry,
  TorusGeometry,
  WebGLRenderer,
} from 'three';

const PURPLE = 0xb249f8;
const CYAN = 0x00f5ff;

function buildGamepad(disposables) {
  const g = new Group();
  const wire = (color, opacity = 0.55) => {
    const m = new MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity });
    disposables.push(m);
    return m;
  };
  const add = (geo, mat, x = 0, y = 0, z = 0) => {
    disposables.push(geo);
    const mesh = new Mesh(geo, mat);
    mesh.position.set(x, y, z);
    g.add(mesh);
    return mesh;
  };
  add(new BoxGeometry(3.2, 1.2, 0.5, 8, 3, 2), wire(PURPLE));
  const gripL = add(new CylinderGeometry(0.5, 0.4, 1.7, 10, 3), wire(PURPLE), -1.45, -0.7, 0);
  const gripR = add(new CylinderGeometry(0.5, 0.4, 1.7, 10, 3), wire(PURPLE), 1.45, -0.7, 0);
  gripL.rotation.z = 0.22;
  gripR.rotation.z = -0.22;
  const stickL = add(new CylinderGeometry(0.22, 0.22, 0.25, 12), wire(CYAN, 0.8), -0.85, -0.15, 0.35);
  const stickR = add(new CylinderGeometry(0.22, 0.22, 0.25, 12), wire(CYAN, 0.8), 0.45, -0.4, 0.35);
  stickL.rotation.x = stickR.rotation.x = Math.PI / 2;
  [[1.1, 0.25], [1.5, 0.05], [0.7, 0.05], [1.1, -0.15]].forEach(([x, y]) => {
    add(new SphereGeometry(0.1, 6, 6), wire(CYAN, 0.9), x, y, 0.3);
  });
  return g;
}

export default function BackdropScene({ variant = 'ambient' }) {
  const hostRef = useRef(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    const hero = variant === 'hero';
    const disposables = [];
    let renderer;
    try {
      renderer = new WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'low-power' });
    } catch {
      return undefined; // WebGL failed after all; CSS gradient fallback stays visible
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setClearColor(0x000000, 0);
    const canvas = renderer.domElement;
    canvas.setAttribute('aria-hidden', 'true');
    host.appendChild(canvas);

    const scene = new Scene();
    scene.fog = new Fog(0x0a0e27, 8, 26);
    const camera = new PerspectiveCamera(55, 1, 0.1, 60);
    camera.position.set(0, 0, 11);

    // Floating low-poly shapes
    const shapes = new Group();
    const geos = [
      () => new IcosahedronGeometry(1, 0),
      () => new OctahedronGeometry(1, 0),
      () => new TorusGeometry(0.8, 0.28, 6, 10),
    ];
    const count = hero ? 16 : 10;
    const movers = [];
    for (let i = 0; i < count; i += 1) {
      const geo = geos[i % geos.length]();
      const mat = new MeshBasicMaterial({
        color: i % 2 ? PURPLE : CYAN,
        wireframe: true,
        transparent: true,
        opacity: hero ? 0.4 : 0.22,
      });
      disposables.push(geo, mat);
      const mesh = new Mesh(geo, mat);
      const s = 0.35 + Math.random() * 0.8;
      mesh.scale.setScalar(s);
      mesh.position.set((Math.random() - 0.5) * 22, (Math.random() - 0.5) * 12, -Math.random() * 10 - 1);
      mesh.rotation.set(Math.random() * 3, Math.random() * 3, 0);
      movers.push({ mesh, rx: (Math.random() - 0.5) * 0.4, ry: (Math.random() - 0.5) * 0.4, phase: Math.random() * 6.28 });
      shapes.add(mesh);
    }
    scene.add(shapes);

    // Particle field
    const pCount = hero ? 450 : 250;
    const positions = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * 34;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 24 - 4;
    }
    const pGeo = new BufferGeometry();
    pGeo.setAttribute('position', new BufferAttribute(positions, 3));
    const pMat = new PointsMaterial({
      color: new Color(CYAN),
      size: 0.05,
      transparent: true,
      opacity: 0.6,
      blending: AdditiveBlending,
      depthWrite: false,
    });
    disposables.push(pGeo, pMat);
    const points = new Points(pGeo, pMat);
    scene.add(points);

    // Hero-only: slowly rotating wireframe controller
    let pad = null;
    if (hero) {
      pad = buildGamepad(disposables);
      pad.position.set(3.2, 0.3, 0);
      pad.scale.setScalar(1.35);
      scene.add(pad);
    }

    const resize = () => {
      const w = host.clientWidth || window.innerWidth;
      const h = host.clientHeight || window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      if (pad) pad.position.x = w < 800 ? 0 : 3.2;
      if (pad) pad.position.y = w < 800 ? 2.6 : 0.3;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
    ro?.observe(host);
    window.addEventListener('resize', resize);

    const mouse = { x: 0, y: 0 };
    const onPointer = (e) => {
      mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    if (hero) window.addEventListener('pointermove', onPointer, { passive: true });

    let raf = 0;
    let last = performance.now();
    let elapsed = 0;
    const frame = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      elapsed += dt;
      movers.forEach((m) => {
        m.mesh.rotation.x += m.rx * dt;
        m.mesh.rotation.y += m.ry * dt;
        m.mesh.position.y += Math.sin(elapsed * 0.4 + m.phase) * 0.15 * dt;
      });
      points.rotation.y += dt * 0.02;
      if (pad) {
        pad.rotation.y = Math.sin(elapsed * 0.3) * 0.7;
        pad.rotation.x = Math.sin(elapsed * 0.4) * 0.15 + 0.1;
        pad.position.y += Math.sin(elapsed * 0.8) * 0.2 * dt;
      }
      camera.position.x += (mouse.x * 0.6 - camera.position.x) * 0.03;
      camera.position.y += (-mouse.y * 0.4 - camera.position.y) * 0.03;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    };
    const start = () => {
      if (raf || document.hidden) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };
    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', onVisibility);
    start();

    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointer);
      ro?.disconnect();
      disposables.forEach((d) => d.dispose?.());
      renderer.dispose();
      renderer.forceContextLoss?.();
      canvas.remove();
    };
  }, [variant]);

  return <div ref={hostRef} className="backdrop-canvas" />;
}
