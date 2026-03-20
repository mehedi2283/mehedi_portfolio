import { Environment } from "@react-three/drei";

export default function TechStackEnvironment({ lowQuality }: { lowQuality: boolean }) {
  return (
    <Environment
      files="/models/char_enviorment.hdr"
      environmentIntensity={lowQuality ? 0.3 : 0.5}
      environmentRotation={[0, 4, 2]}
    />
  );
}
