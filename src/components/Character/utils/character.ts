import * as THREE from "three";
import { DRACOLoader, GLTF, GLTFLoader } from "three-stdlib";
import { setCharTimeline, setAllTimeline } from "../../utils/GsapScroll";
import { decryptFile } from "./decrypt";

const CHARACTER_MODEL_VERSION = 3;
const CHARACTER_MODEL_PASSWORD = "Character3D#@";
const CHARACTER_MODEL_PATH = `/models/character.enc?v=${CHARACTER_MODEL_VERSION}`;

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
          const encryptedBlob = await decryptFile(
            CHARACTER_MODEL_PATH,
            CHARACTER_MODEL_PASSWORD
          );
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
