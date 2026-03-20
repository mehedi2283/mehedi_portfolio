import { EffectComposer, N8AO } from "@react-three/postprocessing";

export default function TechStackPostFX({ lowQuality }: { lowQuality: boolean }) {
  return (
    <EffectComposer enableNormalPass={false}>
      <N8AO color="#0f002c" aoRadius={lowQuality ? 1.2 : 2} intensity={lowQuality ? 0.7 : 1.15} />
    </EffectComposer>
  );
}
