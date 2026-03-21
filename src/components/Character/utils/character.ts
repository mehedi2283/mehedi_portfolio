import * as THREE from "three";
import { DRACOLoader, GLTF, GLTFLoader } from "three-stdlib";
import { setCharTimeline, setAllTimeline } from "../../utils/GsapScroll";
import { decryptFile } from "./decrypt";

const CHARACTER_MODEL_VERSION = 3;
const CHARACTER_MODEL_PASSWORDS = ["Character3D#@", "MyCharacter12"];
const CHARACTER_MODEL_PATH = `/models/character.enc?v=${CHARACTER_MODEL_VERSION}`;
const CAP_LOGO_TEXTURE_PATH = "/images/mhb_logo.svg";
const CAP_NAME_HINTS = ["cap", "hat"];
const CAP_LOGO_UV_SCALE = 0.55;

const capLogoTexture = new THREE.TextureLoader().load(CAP_LOGO_TEXTURE_PATH);
capLogoTexture.colorSpace = THREE.SRGBColorSpace;

const looksLikeCapMesh = (name: string) => {
  const lower = name.toLowerCase();
  return CAP_NAME_HINTS.some((hint) => lower.includes(hint));
};

const withCapLogo = (material: THREE.Material): THREE.Material => {
  const logoMaterial = material.clone() as THREE.MeshStandardMaterial;
  const logoTexture = capLogoTexture.clone();
  logoTexture.repeat.set(CAP_LOGO_UV_SCALE, CAP_LOGO_UV_SCALE);
  logoTexture.offset.set(
    (1 - CAP_LOGO_UV_SCALE) * 0.5,
    (1 - CAP_LOGO_UV_SCALE) * 0.5
  );
  logoTexture.needsUpdate = true;

  logoMaterial.emissiveMap = logoTexture;
  logoMaterial.emissive = new THREE.Color("#da2020");
  logoMaterial.emissiveIntensity = 0.9;
  logoMaterial.needsUpdate = true;
  return logoMaterial;
};

const decryptCharacterModel = async (url: string): Promise<ArrayBuffer> => {
  let lastError: unknown;
  for (const password of CHARACTER_MODEL_PASSWORDS) {
    try {
      return await decryptFile(url, password);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
};

const setCharacter = (
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera
) => {
  const loader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath("/draco/");
  loader.setDRACOLoader(dracoLoader);

  const loadCharacter = () => {
    return new Promise<GLTF | null>((resolve, reject) => {
      (async () => {
        try {
          const encryptedBlob = await decryptCharacterModel(CHARACTER_MODEL_PATH);
          const blobUrl = URL.createObjectURL(new Blob([encryptedBlob]));

          let character: THREE.Object3D;
          loader.load(
            blobUrl,
            async (gltf) => {
              character = gltf.scene;

              // Do not block initial UX on shader precompile.
              // Compile in background to reduce first-load waiting time.
              renderer.compileAsync(character, camera, scene).catch(() => {});

              character.traverse((child: THREE.Object3D) => {
                if (child instanceof THREE.Mesh) {
                  const mesh = child;

                  // Change clothing colors to match site theme
                  if (mesh.material) {
                    if (mesh.name === "BODY.SHIRT") { // The shirt mesh
                      const newMat = (mesh.material as THREE.Material).clone() as THREE.MeshStandardMaterial;
                      newMat.color = new THREE.Color("#8B4513");
                      mesh.material = newMat;
                    } else if (mesh.name === "Pant") {
                      const newMat = (mesh.material as THREE.Material).clone() as THREE.MeshStandardMaterial;
                      newMat.color = new THREE.Color("#000000");
                      mesh.material = newMat;
                    }
                  }

                  if (looksLikeCapMesh(mesh.name)) {
                    if (Array.isArray(mesh.material)) {
                      mesh.material = mesh.material.map((m) => withCapLogo(m));
                    } else {
                      mesh.material = withCapLogo(mesh.material);
                    }
                  }

                  child.castShadow = true;
                  child.receiveShadow = true;
                  mesh.frustumCulled = true;
                }
              });
              resolve(gltf);
              setCharTimeline(character, camera);
              setAllTimeline();
              character!.getObjectByName("footR")!.position.y = 3.36;
              character!.getObjectByName("footL")!.position.y = 3.36;

              // Monitor scale is handled by GsapScroll.ts animations

              dracoLoader.dispose();
            },
            undefined,
            (error) => {
              console.error("Error loading GLTF model:", error);
              reject(error);
            }
          );
        } catch (err) {
          reject(err);
          console.error(err);
        }
      })();
    });
  };

  return { loadCharacter };
};

export default setCharacter;
