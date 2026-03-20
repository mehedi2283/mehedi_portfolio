import * as THREE from "three";
import { useRef, useMemo, useState, useEffect } from "react";
import axios from "axios";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { EffectComposer, N8AO } from "@react-three/postprocessing";
import {
  BallCollider,
  Physics,
  RigidBody,
  CylinderCollider,
  RapierRigidBody,
} from "@react-three/rapier";

const sphereGeometry = new THREE.SphereGeometry(1, 28, 28);
const instanceTextureLoader = new THREE.TextureLoader();

export type TechItem = {
  _id?: string;
  name: string;
  imageUrl: string;
  category: "automation" | "extra";
  highlighted?: boolean;
};

function RotatingBall({ scale, geometry, material }: { scale: number; geometry: any; material: any }) {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((_state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 1.15;
      meshRef.current.rotation.x += delta * 0.42;
    }
  });
  return (
    <mesh
      ref={meshRef}
      rotation={[0.3, 1, 0.5]}
      scale={scale}
      geometry={geometry}
      material={material}
    />
  );
}

export function SingleTechBall({ imageUrl, scale = 1, highlighted = false }: { imageUrl: string; scale?: number; highlighted?: boolean }) {
  const texture = useMemo(() => instanceTextureLoader.load(imageUrl), [imageUrl]);
  const accentColor = useMemo(() => {
    if (typeof window === "undefined") return "#5eead4";
    const c = getComputedStyle(document.documentElement).getPropertyValue("--accentColor").trim();
    return c || "#5eead4";
  }, []);

  const material = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        map: texture,
        emissive: highlighted ? accentColor : "#ffffff",
        emissiveMap: texture,
        emissiveIntensity: highlighted ? 0.6 : 0.3,
        metalness: 0.62,
        roughness: 0.38,
        clearcoat: 0.82,
        clearcoatRoughness: 0.18,
        envMapIntensity: 1.1,
        transparent: true,
        alphaTest: 0.05,
      }),
    [texture, highlighted, accentColor]
  );

  return (
    <div style={{ width: "100%", height: "100%", minWidth: "100px", minHeight: "100px" }}>
      <Canvas
        camera={{ position: [0, 0, 3.5], fov: 35 }}
        gl={{ alpha: true, antialias: true }}
        onCreated={(state) => (state.gl.toneMappingExposure = 1.45)}
      >
        <ambientLight intensity={0.9} />
        <spotLight position={[4.5, 4.5, 5]} intensity={highlighted ? 2.1 : 1.7} angle={0.34} penumbra={0.85} />
        <directionalLight position={[-3, 2, 4]} intensity={0.75} />
        <Environment files="/models/char_enviorment.hdr" environmentIntensity={0.8} environmentRotation={[0, 4, 2]} />
        <RotatingBall scale={0.9 * scale} geometry={sphereGeometry} material={material} />
      </Canvas>
    </div>
  );
}

const textureLoader = instanceTextureLoader;

type SphereProps = {
  vec?: THREE.Vector3;
  scale: number;
  r?: typeof THREE.MathUtils.randFloatSpread;
  material: THREE.MeshPhysicalMaterial;
  isActive: boolean;
  highlighted?: boolean;
  accentColor?: string;
  useSoftBreathing?: boolean;
  prioritizeFront?: boolean;
};

function SphereGeo({
  vec = new THREE.Vector3(),
  scale,
  r = THREE.MathUtils.randFloatSpread,
  material,
  isActive,
  highlighted = false,
  accentColor = "#5eead4",
  useSoftBreathing = false,
  prioritizeFront = false,
}: SphereProps) {
  const api = useRef<RapierRigidBody | null>(null);
  const white = useMemo(() => new THREE.Color("#f7fbff"), []);
  const accent = useMemo(() => new THREE.Color(accentColor), [accentColor]);
  const pulse = useMemo(() => new THREE.Color(), []);
  const tint = useMemo(() => new THREE.Color(), []);

  useFrame((state, delta) => {
    if (!isActive) return;
    delta = Math.min(0.1, delta);

    if (highlighted) {
      if (useSoftBreathing) {
        const t = (Math.sin(state.clock.elapsedTime * 1.6) + 1) * 0.5;
        pulse.copy(white).lerp(accent, 0.42 + t * 0.34);
        tint.copy(white).lerp(accent, 0.2 + t * 0.22);
        material.color.copy(tint);
        material.emissive.copy(pulse);
        material.emissiveIntensity = 0.46 + t * 0.34;
      } else {
        material.emissive.set(accentColor);
        material.emissiveIntensity = 0.42 + (Math.sin(state.clock.elapsedTime * 2.15) + 1) * 0.14;
      }

      if (prioritizeFront) {
        api.current?.applyImpulse(new THREE.Vector3(0, 0, 30 * delta * scale), true);
      }
    }

    const impulse = vec
      .copy(api.current!.translation())
      .normalize()
      .multiply(new THREE.Vector3(-50 * delta * scale, -150 * delta * scale, -50 * delta * scale));

    api.current?.applyImpulse(impulse, true);
  });

  return (
    <RigidBody
      linearDamping={0.75}
      angularDamping={0.15}
      friction={0.2}
      position={highlighted && prioritizeFront ? [r(14), r(14) - 22, 8 + r(4)] : [r(20), r(20) - 25, r(20) - 10]}
      ref={api}
      colliders={false}
    >
      <BallCollider args={[scale]} />
      <CylinderCollider rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 1.2 * scale]} args={[0.15 * scale, 0.275 * scale]} />
      <mesh castShadow receiveShadow scale={scale} geometry={sphereGeometry} material={material} rotation={[0.3, 1, 1]} />
    </RigidBody>
  );
}

type PointerProps = {
  vec?: THREE.Vector3;
  isActive: boolean;
};

function Pointer({ vec = new THREE.Vector3(), isActive }: PointerProps) {
  const ref = useRef<RapierRigidBody>(null);

  useFrame(({ pointer, viewport }) => {
    if (!isActive) return;
    const targetVec = vec.lerp(new THREE.Vector3((pointer.x * viewport.width) / 2, (pointer.y * viewport.height) / 2, 0), 0.2);
    ref.current?.setNextKinematicTranslation(targetVec);
  });

  return (
    <RigidBody position={[100, 100, 100]} type="kinematicPosition" colliders={false} ref={ref}>
      <BallCollider args={[2]} />
    </RigidBody>
  );
}

const TechStack = ({ previewData }: { previewData?: TechItem[] }) => {
  const [isActive, setIsActive] = useState(false);
  const [techItems, setTechItems] = useState<TechItem[]>([]);
  const [loading, setLoading] = useState(true);

  const accentColor = useMemo(() => {
    if (typeof window === "undefined") return "#5eead4";
    const c = getComputedStyle(document.documentElement).getPropertyValue("--accentColor").trim();
    return c || "#5eead4";
  }, []);

  useEffect(() => {
    if (previewData) {
      setTechItems(previewData);
      setLoading(false);
      setIsActive(true);
      return;
    }

    axios
      .get("http://localhost:5000/api/techstack")
      .then((res) => {
        setTechItems(res.data);
        setLoading(false);
      })
      .catch(() => {
        setTechItems([]);
        setLoading(false);
      });
  }, [previewData]);

  useEffect(() => {
    if (previewData) return;

    const handleScroll = () => {
      const workElem = document.getElementById("work");
      if (!workElem) return;
      const threshold = workElem.getBoundingClientRect().top;
      setIsActive(window.scrollY > threshold);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [previewData]);

  const sortedItems = useMemo(() => {
    const score = (item: TechItem) => {
      if (item.category === "automation" && item.highlighted) return 0;
      if (item.category === "automation") return 1;
      if (item.category === "extra" && item.highlighted) return 2;
      return 3;
    };

    return [...techItems].sort((a, b) => {
      const delta = score(a) - score(b);
      if (delta !== 0) return delta;
      return a.name.localeCompare(b.name);
    });
  }, [techItems]);

  const entries = useMemo(() => {
    return sortedItems.map((item) => {
      const texture = textureLoader.load(item.imageUrl);
      const highlighted = Boolean(item.highlighted);
      const material = new THREE.MeshPhysicalMaterial({
        map: texture,
        emissive: highlighted ? accentColor : "#ffffff",
        emissiveMap: texture,
        emissiveIntensity: highlighted ? 0.6 : 0.3,
        metalness: 0.5,
        roughness: 0.95,
        clearcoat: 0.15,
      });
      return { item, material, highlighted };
    });
  }, [sortedItems, accentColor]);

  const spheres = useMemo(() => {
    if (entries.length === 0) return [];
    return entries.map(({ item, material, highlighted }) => ({
      scale: item.category === "automation" ? 1 : 0.65,
      material,
      highlighted,
    }));
  }, [entries]);

  if (loading) return null;

  return (
    <div className="techstack">
      {!previewData && <h2> My Techstack</h2>}

      <Canvas
        shadows
        gl={{ alpha: true, stencil: false, depth: false, antialias: false }}
        camera={{ position: [0, 0, 20], fov: 32.5, near: 1, far: 100 }}
        onCreated={(state) => (state.gl.toneMappingExposure = 1.5)}
        className="tech-canvas"
      >
        <ambientLight intensity={1} />
        <spotLight position={[20, 20, 25]} penumbra={1} angle={0.2} color="white" castShadow shadow-mapSize={[512, 512]} />
        <directionalLight position={[0, 5, -4]} intensity={2} />
        <Physics gravity={[0, 0, 0]}>
          <Pointer isActive={isActive} />
          {spheres.map((props, i) => (
            <SphereGeo
              key={i}
              scale={props.scale}
              material={props.material}
              highlighted={props.highlighted}
              accentColor={accentColor}
              useSoftBreathing={!previewData}
              prioritizeFront={!previewData}
              isActive={isActive}
            />
          ))}
        </Physics>
        <Environment files="/models/char_enviorment.hdr" environmentIntensity={0.5} environmentRotation={[0, 4, 2]} />
        <EffectComposer enableNormalPass={false}>
          <N8AO color="#0f002c" aoRadius={2} intensity={1.15} />
        </EffectComposer>
      </Canvas>
    </div>
  );
};

export default TechStack;
