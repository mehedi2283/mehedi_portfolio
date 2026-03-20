import * as THREE from "three";
import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";

const sphereGeometry = new THREE.SphereGeometry(1, 28, 28);
const textureLoader = new THREE.TextureLoader();

function RotatingBall({ scale, material }: { scale: number; material: THREE.MeshPhysicalMaterial }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_state, delta) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y += delta * 1.15;
    meshRef.current.rotation.x += delta * 0.42;
  });

  return (
    <mesh
      ref={meshRef}
      rotation={[0.3, 1, 0.5]}
      scale={scale}
      geometry={sphereGeometry}
      material={material}
    />
  );
}

export function SingleTechBall({
  imageUrl,
  scale = 1,
  highlighted = false,
  accentColor: propAccentColor,
}: {
  imageUrl: string;
  scale?: number;
  highlighted?: boolean;
  accentColor?: string;
}) {
  const texture = useMemo(() => textureLoader.load(imageUrl), [imageUrl]);
  const accentColor = useMemo(() => {
    if (propAccentColor) return propAccentColor;
    if (typeof window === "undefined") return "#5eead4";
    const c = getComputedStyle(document.documentElement).getPropertyValue("--accentColor").trim();
    return c || "#5eead4";
  }, [propAccentColor]);

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
        envMapIntensity: 0.9,
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
        onCreated={(state) => {
          state.gl.toneMappingExposure = 1.35;
        }}
      >
        <ambientLight intensity={1.05} />
        <spotLight position={[4.5, 4.5, 5]} intensity={highlighted ? 2.0 : 1.6} angle={0.34} penumbra={0.85} />
        <directionalLight position={[-3, 2, 4]} intensity={0.85} />
        <RotatingBall scale={0.9 * scale} material={material} />
      </Canvas>
    </div>
  );
}
