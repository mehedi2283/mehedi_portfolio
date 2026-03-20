import * as THREE from "three";
import { lazy, Suspense, useMemo, useState, useEffect } from "react";
import axios from "axios";
import { Canvas } from "@react-three/fiber";

const textureLoader = new THREE.TextureLoader();
const TechStackPhysicsScene = lazy(() => import("./TechStackPhysicsScene"));
const TechStackEnvironment = lazy(() => import("./TechStackEnvironment"));
const TechStackPostFX = lazy(() => import("./TechStackPostFX"));

export type TechItem = {
  _id?: string;
  name: string;
  imageUrl: string;
  category: "automation" | "extra";
  highlighted?: boolean;
};

const TechStack = ({ previewData }: { previewData?: TechItem[] }) => {
  const [isActive, setIsActive] = useState(false);
  const [techItems, setTechItems] = useState<TechItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [accentColor, setAccentColor] = useState("#5eead4");

  useEffect(() => {
    axios
      .get("https://mehedi-portfolio-server-phi.vercel.app/api/settings")
      .then((res) => {
        if (res.data?.themeColor) {
          setAccentColor(res.data.themeColor);
          document.documentElement.style.setProperty('--accentColor', res.data.themeColor);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (previewData) {
      setTechItems(previewData);
      setLoading(false);
      setIsActive(true);
      return;
    }

    axios
      .get("https://mehedi-portfolio-server-phi.vercel.app/api/techstack")
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

  const isLowQuality = false;
  const enablePostFx = true;

  if (loading) return null;

  return (
    <div className="techstack">
      {!previewData && <h2> My Techstack</h2>}

      <Canvas
        shadows
        gl={{
          alpha: true,
          stencil: false,
          depth: false,
          antialias: true,
          powerPreference: "high-performance",
        }}
        dpr={[1, 2]}
        camera={{ position: [0, 0, 20], fov: 32.5, near: 1, far: 100 }}
        onCreated={(state) => (state.gl.toneMappingExposure = 1.5)}
        className="tech-canvas"
      >
        <ambientLight intensity={1} />
        <spotLight
          position={[20, 20, 25]}
          penumbra={1}
          angle={0.2}
          color="white"
          castShadow
          shadow-mapSize={[512, 512]}
        />
        <directionalLight position={[0, 5, -4]} intensity={2} />

        <Suspense fallback={null}>
          <TechStackPhysicsScene
            spheres={spheres}
            isActive={isActive}
            accentColor={accentColor}
            lowQuality={isLowQuality}
            previewMode={Boolean(previewData)}
          />
        </Suspense>

        <Suspense fallback={null}>
          <TechStackEnvironment lowQuality={isLowQuality} />
        </Suspense>

        {enablePostFx && (
          <Suspense fallback={null}>
            <TechStackPostFX lowQuality={isLowQuality} />
          </Suspense>
        )}
      </Canvas>
    </div>
  );
};

export default TechStack;
