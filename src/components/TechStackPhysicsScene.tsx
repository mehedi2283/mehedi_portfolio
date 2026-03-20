import * as THREE from "three";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  BallCollider,
  Physics,
  RigidBody,
  CylinderCollider,
  RapierRigidBody,
} from "@react-three/rapier";

type SphereConfig = {
  scale: number;
  material: THREE.MeshPhysicalMaterial;
  highlighted: boolean;
};

type SphereProps = {
  vec?: THREE.Vector3;
  scale: number;
  geometry: THREE.SphereGeometry;
  r?: typeof THREE.MathUtils.randFloatSpread;
  material: THREE.MeshPhysicalMaterial;
  isActive: boolean;
  highlighted?: boolean;
  accentColor?: string;
  useSoftBreathing?: boolean;
  prioritizeFront?: boolean;
  lowQuality?: boolean;
};

function SphereGeo({
  vec = new THREE.Vector3(),
  scale,
  geometry,
  r = THREE.MathUtils.randFloatSpread,
  material,
  isActive,
  highlighted = false,
  accentColor = "#5eead4",
  useSoftBreathing = false,
  prioritizeFront = false,
  lowQuality = false,
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
        api.current?.applyImpulse(new THREE.Vector3(0, 0, (lowQuality ? 20 : 30) * delta * scale), true);
      }
    }

    const impulse = vec
      .copy(api.current!.translation())
      .normalize()
      .multiply(
        new THREE.Vector3(
          -(lowQuality ? 35 : 50) * delta * scale,
          -(lowQuality ? 105 : 150) * delta * scale,
          -(lowQuality ? 35 : 50) * delta * scale
        )
      );

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
      <CylinderCollider
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, 0, 1.2 * scale]}
        args={[0.15 * scale, 0.275 * scale]}
      />
      <mesh castShadow={!lowQuality} receiveShadow scale={scale} geometry={geometry} material={material} rotation={[0.3, 1, 1]} />
    </RigidBody>
  );
}

type PointerProps = {
  vec?: THREE.Vector3;
  isActive: boolean;
  lowQuality?: boolean;
};

function Pointer({ vec = new THREE.Vector3(), isActive, lowQuality = false }: PointerProps) {
  const ref = useRef<RapierRigidBody>(null);

  useFrame(({ pointer, viewport }) => {
    if (!isActive) return;
    const targetVec = vec.lerp(
      new THREE.Vector3((pointer.x * viewport.width) / 2, (pointer.y * viewport.height) / 2, 0),
      lowQuality ? 0.28 : 0.2
    );
    ref.current?.setNextKinematicTranslation(targetVec);
  });

  return (
    <RigidBody position={[100, 100, 100]} type="kinematicPosition" colliders={false} ref={ref}>
      <BallCollider args={[lowQuality ? 1.6 : 2]} />
    </RigidBody>
  );
}

export default function TechStackPhysicsScene({
  spheres,
  isActive,
  accentColor,
  lowQuality,
  previewMode,
}: {
  spheres: SphereConfig[];
  isActive: boolean;
  accentColor: string;
  lowQuality: boolean;
  previewMode: boolean;
}) {
  const sphereGeometry = useMemo(
    () => new THREE.SphereGeometry(1, lowQuality ? 18 : 28, lowQuality ? 18 : 28),
    [lowQuality]
  );

  return (
    <Physics gravity={[0, 0, 0]}>
      <Pointer isActive={isActive} lowQuality={lowQuality} />
      {spheres.map((props, i) => (
        <SphereGeo
          key={i}
          scale={props.scale}
          geometry={sphereGeometry}
          material={props.material}
          highlighted={props.highlighted}
          accentColor={accentColor}
          useSoftBreathing={!previewMode}
          prioritizeFront={!previewMode}
          isActive={isActive}
          lowQuality={lowQuality}
        />
      ))}
    </Physics>
  );
}
