import * as THREE from "three";
import { DRACOLoader, GLTF, GLTFLoader } from "three-stdlib";
import { setCharTimeline, setAllTimeline } from "../../utils/GsapScroll";
import { decryptFile } from "./decrypt";

const CHARACTER_MODEL_VERSION = 3;
const CHARACTER_MODEL_PASSWORDS = ["Character3D#@", "MyCharacter12"];
const CHARACTER_MODEL_PATHS = [
  `/models/character.enc?v=${CHARACTER_MODEL_VERSION}`,
  "/models/character.enc?v=2",
  "/models/character.enc",
];
const CAP_LOGO_TEXTURE_PATH = "/images/mhb_logo.svg";
const CAP_NAME_HINTS = ["cap", "hat", "helmet"];

const capLogoTexture = new THREE.TextureLoader().load(CAP_LOGO_TEXTURE_PATH);
capLogoTexture.colorSpace = THREE.SRGBColorSpace;
capLogoTexture.flipY = false;

const addCapLogoDecal = (capMesh: THREE.Mesh) => {
  const hasDecal = capMesh.children.some((c) => c.name === "cap_logo_decal");
  if (hasDecal) return;

  capMesh.geometry.computeBoundingBox();
  const bbox = capMesh.geometry.boundingBox;
  if (!bbox) return;

  const width = bbox.max.x - bbox.min.x;
  const height = bbox.max.y - bbox.min.y;
  if (width <= 0 || height <= 0) return;

  const decalGeometry = new THREE.PlaneGeometry(width * 0.2, height * 0.11);
  const decalMaterial = new THREE.MeshBasicMaterial({
    map: capLogoTexture,
    transparent: true,
    alphaTest: 0.05,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  const decal = new THREE.Mesh(decalGeometry, decalMaterial);
  decal.name = "cap_logo_decal";
  decal.renderOrder = 20;
  decal.position.set(
    (bbox.min.x + bbox.max.x) * 0.5,
    bbox.min.y + height * 0.55,
    bbox.max.z + 0.02
  );
  decal.rotation.x = -0.12;
  capMesh.add(decal);
};

const findCapMesh = (character: THREE.Object3D, meshes: THREE.Mesh[]) => {
  if (!meshes.length) return null;

  const namedCap = meshes.find((mesh) => {
    const lower = mesh.name.toLowerCase();
    return CAP_NAME_HINTS.some((hint) => lower.includes(hint));
  });
  if (namedCap) return namedCap;

  const characterBounds = new THREE.Box3().setFromObject(character);
  const midY = (characterBounds.min.y + characterBounds.max.y) * 0.5;

  let bestMesh: THREE.Mesh | null = null;
  let bestScore = -Infinity;

  for (const mesh of meshes) {
    const bounds = new THREE.Box3().setFromObject(mesh);
    const width = bounds.max.x - bounds.min.x;
    const height = bounds.max.y - bounds.min.y;
    const depth = bounds.max.z - bounds.min.z;

    // Prefer large, upper-head meshes likely to be the cap shell.
    const isUpper = bounds.max.y > midY;
    if (!isUpper || width < 0.3 || height < 0.2) continue;

    const score = bounds.max.y * 2 + width + depth;
    if (score > bestScore) {
      bestScore = score;
      bestMesh = mesh;
    }
  }

  return bestMesh;
};

const isValidGlbBuffer = (buffer: ArrayBuffer): boolean => {
  if (buffer.byteLength < 12) return false;
  const header = new Uint8Array(buffer, 0, 4);
  return (
    header[0] === 0x67 && // g
    header[1] === 0x6c && // l
    header[2] === 0x54 && // T
    header[3] === 0x46 // F
  );
};

const decryptCharacterModel = async (): Promise<ArrayBuffer> => {
  let lastError: unknown = new Error("Character model decryption failed");

  for (const path of CHARACTER_MODEL_PATHS) {
    for (const password of CHARACTER_MODEL_PASSWORDS) {
      try {
        const decrypted = await decryptFile(path, password);
        if (isValidGlbBuffer(decrypted)) {
          return decrypted;
        }
      } catch (error) {
        lastError = error;
      }
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
          const encryptedBlob = await decryptCharacterModel();
          const parseGltf = () =>
            new Promise<GLTF>((resolveParsed, rejectParsed) => {
              loader.parse(encryptedBlob, "", resolveParsed, rejectParsed);
            });

          const loadViaBlobUrl = () =>
            new Promise<GLTF>((resolveLoaded, rejectLoaded) => {
              const blobUrl = URL.createObjectURL(
                new Blob([encryptedBlob], { type: "model/gltf-binary" })
              );
              loader.load(
                blobUrl,
                (gltf) => {
                  URL.revokeObjectURL(blobUrl);
                  resolveLoaded(gltf);
                },
                undefined,
                (error) => {
                  URL.revokeObjectURL(blobUrl);
                  rejectLoaded(error);
                }
              );
            });

          let gltf: GLTF;
          try {
            gltf = await parseGltf();
          } catch {
            gltf = await loadViaBlobUrl();
          }

          const character = gltf.scene;

          // Resolve immediately so rendering can continue even if optional
          // styling logic fails on specific meshes.
          resolve(gltf);

          // Do not block initial UX on shader precompile.
          // Compile in background to reduce first-load waiting time.
          renderer.compileAsync(character, camera, scene).catch(() => {});

          try {
            const meshes: THREE.Mesh[] = [];
            character.traverse((child: THREE.Object3D) => {
              if (child instanceof THREE.Mesh) {
                const mesh = child;
                meshes.push(mesh);

                // Change clothing colors to match site theme
                if (mesh.material) {
                  if (mesh.name === "BODY.SHIRT") {
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

            const capMesh = findCapMesh(character, meshes);
            if (capMesh) {
              addCapLogoDecal(capMesh);
            }

            setCharTimeline(character, camera);
            setAllTimeline();
            const footR = character.getObjectByName("footR");
            const footL = character.getObjectByName("footL");
            if (footR) footR.position.y = 3.36;
            if (footL) footL.position.y = 3.36;
          } catch (styleError) {
            console.warn("Character loaded, but optional styling failed:", styleError);
          }

          // Monitor scale is handled by GsapScroll.ts animations

          dracoLoader.dispose();
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
