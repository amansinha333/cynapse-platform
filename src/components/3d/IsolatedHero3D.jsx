import React, { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Html,
  PerspectiveCamera,
  useProgress,
  useGLTF,
} from "@react-three/drei";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import * as THREE from "three";

const MODEL_URL = "/models/character.glb";

/** Manual, known-good placement relative to the red debug cube (origin). */
const MANUAL_SCALE = 0.38;
const MANUAL_POS = [0.35, -2.0, 0];
const DEBUG_HERO = true;

const SCREEN_GLOW = {
  // Pull back toward the screen so it doesn't blow out teeth/speculars
  // Higher + closer to screen so it hits face, not desk
  position: [0.05, 1.82, 0.75],
  color: "#22c55e",
  intensity: 0.2,
  distance: 3.6,
};

const EYE_TRACK = {
  maxYaw: 0.28,
  maxPitch: 0.14,
  smooth: 0.08,
};

const BASE_ROTATION = [0, -Math.PI / 6, 0]; // 3/4 view, toward left text
const BASE_LOCAL_POSITION = [0.12, 0, 0]; // small nudge to keep centered after rotation

// Freeze the body at a good seated moment (prevents arm/body lifting),
// while still allowing eye-only tracking below.
const FREEZE_BODY_POSE = true;
const POSE_TIME_SECONDS = 1.15;

class Hero3DErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <Html center prepend>
          <div className="max-w-[320px] rounded-xl border border-white/15 bg-black/60 px-4 py-3 text-xs text-white">
            <div className="font-semibold">Hero 3D failed to load</div>
            <div className="mt-1 text-white/70 break-words">
              {String(this.state.error?.message || this.state.error)}
            </div>
          </div>
        </Html>
      );
    }
    return this.props.children;
  }
}

function updateSkeletons(root) {
  root.traverse((o) => {
    if (o.isSkinnedMesh && o.skeleton) {
      o.skeleton.update();
    }
  });
}

/**
 * Skinned GLBs often yield an empty Box3 from setFromObject until the skeleton
 * has updated. Union mesh geometry bounds in world space as a reliable fallback.
 */
function unionBoundsFromMeshes(root) {
  const box = new THREE.Box3();
  let valid = false;
  root.updateMatrixWorld(true);
  root.traverse((o) => {
    // Important: we hide some meshes (desk helpers / lights / shadowcatchers)
    // but bounds computation must ignore them, otherwise the fit may place
    // the whole model far off-screen.
    if (!o.isMesh || !o.geometry) return;
    if (o.visible === false) return;
    const g = o.geometry;
    if (!g.boundingBox) g.computeBoundingBox();
    if (!g.boundingBox) return;
    const bb = g.boundingBox.clone();
    bb.applyMatrix4(o.matrixWorld);
    if (!valid) {
      box.copy(bb);
      valid = true;
    } else {
      box.union(bb);
    }
  });
  return { box, valid: valid && !box.isEmpty() };
}

function DeskScene() {
  // Draco disabled: this asset is uncompressed; avoids decoder path quirks.
  const { scene, animations } = useGLTF(MODEL_URL, false);
  const root = useMemo(() => {
    const clone = cloneSkinned(scene);

    clone.traverse((ch) => {
      if (!ch.isMesh) return;
      const n = ch.name.toLowerCase();
      // Don't hide meshes by name while dialing in placement — it can accidentally remove the character.
      ch.visible = true;
      ch.castShadow = true;
      ch.receiveShadow = true;
      // Prevent "rendered but invisible" issues caused by bad bounds/skin animation.
      ch.frustumCulled = false;

      // Keep original materials (colors/textures), but force sane render flags.
      const applyFlags = (m) => {
        if (!m) return;
        m.transparent = false;
        m.opacity = 1;
        m.depthWrite = true;
        m.side = THREE.FrontSide;
        m.needsUpdate = true;
      };
      const mats = Array.isArray(ch.material) ? ch.material : [ch.material];
      mats.forEach(applyFlags);

      // --- Material overrides (premium polish) ---
      const setIf = (m, fn) => {
        if (!m) return;
        // Roughness/metalness/color exist on PBR materials (MeshStandard/Physical).
        fn(m);
        m.needsUpdate = true;
      };

      // 1) Desk/table: matte slate-white, no metal.
      if (/(desk|table|surface)/i.test(n)) {
        mats.forEach((m) =>
          setIf(m, (mm) => {
            if (mm.color) mm.color.set("#f8fafc");
            if ("roughness" in mm) mm.roughness = 1.0;
            if ("metalness" in mm) mm.metalness = 0.0;
          })
        );
      }

      // 2) Face/mouth/teeth/skin: kill shiny speculars under HDR.
      if (/(head|face|teeth|mouth|skin)/i.test(n)) {
        mats.forEach((m) =>
          setIf(m, (mm) => {
            if ("roughness" in mm) mm.roughness = 0.8;
            if ("metalness" in mm) mm.metalness = 0.0;
          })
        );
      }

      // 3) Clothes: deep Cynapse green, premium matte.
      if (/(body|shirt|top|jacket|cloth)/i.test(n)) {
        mats.forEach((m) =>
          setIf(m, (mm) => {
            if (mm.color) mm.color.set("#042f1f");
            if ("roughness" in mm) mm.roughness = 0.9;
            if ("metalness" in mm) mm.metalness = 0.0;
          })
        );
      }

      // Hide any baked-in floor plane from the GLB (removes grey box floor).
      if (/(floor|ground|stage|base|plane)/i.test(n)) {
        try {
          const g = ch.geometry;
          if (g && !g.boundingBox) g.computeBoundingBox();
          if (g?.boundingBox) {
            const size = new THREE.Vector3();
            g.boundingBox.getSize(size);
            const maxXZ = Math.max(size.x, size.z);
            const flat = size.y <= Math.max(0.02, maxXZ * 0.03);
            const big = maxXZ >= 0.6;
            if (flat && big) {
              ch.visible = false;
            }
          } else {
            // If we can't measure it, still hide by name-match.
            ch.visible = false;
          }
        } catch {
          ch.visible = false;
        }
      }
    });

    // Manual placement: center of the scene is the red cube at origin.
    clone.position.set(MANUAL_POS[0], MANUAL_POS[1], MANUAL_POS[2]);
    clone.scale.setScalar(MANUAL_SCALE);
    clone.updateMatrixWorld(true);

    if (DEBUG_HERO) {
      let meshCount = 0;
      clone.traverse((o) => {
        if (o.isMesh) meshCount += 1;
      });
      // eslint-disable-next-line no-console
      console.log("[Hero3D] model cloned; meshCount=", meshCount);
    }
    return clone;
  }, [scene]);

  const mixerRef = useRef(null);
  const rootRef = useRef(null);
  const frameCount = useRef(0);
  const target = useRef({ x: 0, y: 0 });
  const smooth = useRef({ x: 0, y: 0 });
  const rigRef = useRef({
    head: null,
    headQ0: null,
    leftEye: null,
    rightEye: null,
  });

  useEffect(() => {
    if (!animations?.length || !root) return;
    if (DEBUG_HERO) {
      // eslint-disable-next-line no-console
      console.log("[Hero3D] animations=", animations.map((a) => a.name));
    }
    const mixer = new THREE.AnimationMixer(root);
    mixer.timeScale = 1;
    mixerRef.current = mixer;

    const pick =
      animations.find((a) => {
        const n = a.name.toLowerCase();
        return /sit|type|desk|idle|work/i.test(n);
      }) || animations[0];

    const action = mixer.clipAction(pick);
    action.reset();
    action.enabled = true;
    action.setEffectiveTimeScale(1);
    action.setEffectiveWeight(1);
    action.play();

    // Freeze at a stable seated moment (no lift), but keep eye tracking.
    if (FREEZE_BODY_POSE) {
      action.time = POSE_TIME_SECONDS;
      action.paused = true;
      mixer.update(0);
      updateSkeletons(root);
      root.updateMatrixWorld(true);
    } else {
      action.fadeIn(0.25);
    }

    return () => {
      action.fadeOut(0.2);
      mixer.stopAllAction();
      mixer.uncacheRoot(root);
      mixerRef.current = null;
    };
  }, [animations, root]);

  useEffect(() => {
    const onMove = (e) => {
      target.current.x = (e.clientX / window.innerWidth - 0.5) * 0.38;
      target.current.y = (e.clientY / window.innerHeight - 0.5) * -0.24;
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  // Capture bones once (head gets locked; eyes are allowed to move).
  useEffect(() => {
    if (!root) return;
    let head = null;
    let leftEye = null;
    let rightEye = null;
    root.traverse((o) => {
      if (!o.isBone) return;
      const n = (o.name || "").toLowerCase();
      if (!head && /head/.test(n) && !/helper|target/.test(n)) head = o;
      if (!leftEye && /(eye|eyel)/.test(n) && /(l|left)/.test(n)) leftEye = o;
      if (!rightEye && /(eye|eyel)/.test(n) && /(r|right)/.test(n)) rightEye = o;
    });
    rigRef.current.head = head;
    rigRef.current.leftEye = leftEye;
    rigRef.current.rightEye = rightEye;
    rigRef.current.headQ0 = head ? head.quaternion.clone() : null;
    if (DEBUG_HERO) {
      // eslint-disable-next-line no-console
      console.log("[Hero3D] bones:", {
        head: head?.name,
        leftEye: leftEye?.name,
        rightEye: rightEye?.name,
      });
    }
  }, [root]);

  useFrame((_, delta) => {
    if (mixerRef.current) mixerRef.current.update(delta);

    frameCount.current += 1;
    // Keep skeletons fresh (skinned meshes) even though we aren't auto-fitting.
    if (root && frameCount.current < 180) updateSkeletons(root);

    smooth.current.x = THREE.MathUtils.lerp(smooth.current.x, target.current.x, 0.06);
    smooth.current.y = THREE.MathUtils.lerp(smooth.current.y, target.current.y, 0.06);

    // Restore subtle overall yaw (we removed this in the broken iteration).
    if (rootRef.current) {
      rootRef.current.rotation.y = THREE.MathUtils.lerp(
        rootRef.current.rotation.y,
        smooth.current.x * 0.1,
        0.05
      );
    }

    // Lock head rotation back to initial pose (no nodding/turning).
    const head = rigRef.current.head;
    const headQ0 = rigRef.current.headQ0;
    if (head && headQ0) {
      head.quaternion.slerp(headQ0, 0.25);
    }

    // Eyes track cursor subtly (yaw + pitch only).
    const leftEye = rigRef.current.leftEye;
    const rightEye = rigRef.current.rightEye;
    if (leftEye || rightEye) {
      const yaw = THREE.MathUtils.clamp(smooth.current.x, -1, 1) * EYE_TRACK.maxYaw;
      const pitch = THREE.MathUtils.clamp(smooth.current.y, -1, 1) * EYE_TRACK.maxPitch;
      const applyEye = (eye) => {
        if (!eye) return;
        eye.rotation.y = THREE.MathUtils.lerp(eye.rotation.y, yaw, EYE_TRACK.smooth);
        eye.rotation.x = THREE.MathUtils.lerp(eye.rotation.x, pitch, EYE_TRACK.smooth);
      };
      applyEye(leftEye);
      applyEye(rightEye);
    }
  });

  return (
    <group ref={rootRef}>
      <group rotation={BASE_ROTATION} position={BASE_LOCAL_POSITION}>
        <primitive object={root} />
      </group>

      {/* "Dashboard glow" from monitor */}
      <pointLight
        position={SCREEN_GLOW.position}
        color={SCREEN_GLOW.color}
        intensity={SCREEN_GLOW.intensity}
        distance={SCREEN_GLOW.distance}
        decay={2}
      />

      {/* Green rim light to separate silhouette */}
      <pointLight
        position={[-1.25, 2.05, -1.35]}
        color="#22c55e"
        intensity={0.42}
        distance={10}
        decay={2}
      />

      <ContactShadows
        position={[0, -1.6, 0]}
        opacity={0.5}
        scale={20}
        blur={3}
        far={4}
        color="#000000"
      />
    </group>
  );
}

/** Camera: higher + further so the seated figure + desk stay in vertical FOV. */
const CAM = { x: 2.0, y: 2.75, z: 9.2 };

function Rig() {
  const cameraRef = useRef(null);
  const aimFrames = useRef(0);

  useFrame(() => {
    const cam = cameraRef.current;
    if (!cam || !(cam instanceof THREE.PerspectiveCamera)) return;
    // Aim repeatedly for a few frames to ensure we point at the model.
    if (aimFrames.current++ < 60) {
      cam.lookAt(0, 0.95, 0);
      cam.updateProjectionMatrix();
    }
  });

  return (
    <>
      <PerspectiveCamera
        ref={cameraRef}
        makeDefault
        position={[CAM.x, CAM.y, CAM.z]}
        fov={34}
        near={0.1}
        far={120}
      />

      <ambientLight intensity={0.95} />
      <directionalLight
        position={[-5, 14, 10]}
        intensity={1.15}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[5, 7, -5]} intensity={0.22} color="#bbf7d0" />
      <pointLight position={[2.5, 3.5, 2.5]} intensity={0.35} color="#22c55e" distance={14} />
      <pointLight position={[-0.2, 1.5, 0.5]} intensity={0.18} color="#fda4af" distance={8} />

      {/* Environment + GLB can suspend; keep camera & lights mounted so Html fallback works. */}
      <Suspense fallback={<CanvasLoading />}>
        <Environment files="/models/char_enviorment.hdr" environmentIntensity={1} />
        <DeskScene />
      </Suspense>
    </>
  );
}

function CanvasLoading() {
  const { active, progress, item, errors } = useProgress();
  return (
    <Html center prepend distanceFactor={10}>
      <div className="flex flex-col items-center gap-2">
        <div
          className="h-10 w-10 rounded-full border-2 border-white/25 border-t-white/90 animate-spin"
          aria-hidden
        />
        <div className="rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-[11px] text-white/80">
          <div>
            <span className="font-semibold text-white">Loading 3D</span>{" "}
            <span className="text-white/60">
              {active ? `${Math.round(progress)}%` : "…"}
            </span>
          </div>
          {item ? <div className="mt-1 max-w-[260px] truncate text-white/60">{item}</div> : null}
          {errors?.length ? (
            <div className="mt-1 text-red-200/90">Asset error: {String(errors[0])}</div>
          ) : null}
        </div>
      </div>
    </Html>
  );
}

export default function IsolatedHero3D() {
  return (
    <div
      className="relative h-full min-h-[520px] w-full overflow-hidden pointer-events-none"
      style={{ minHeight: 520 }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <Canvas
        className="!absolute inset-0 block h-full w-full"
        dpr={[1, 2]}
        shadows
        onContextMenu={(e) => e.preventDefault()}
        resize={{ debounce: 0 }}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
        }}
        onCreated={({ gl, scene }) => {
          scene.background = null;
          gl.setClearColor(0x000000, 0);
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.1;
        }}
      >
        <Hero3DErrorBoundary>
          <Rig />
        </Hero3DErrorBoundary>
      </Canvas>
    </div>
  );
}

useGLTF.preload(MODEL_URL, false);
