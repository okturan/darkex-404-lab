/**
 * Renderer, camera and backdrop. WebGPU where available, WebGL2 otherwise —
 * WebGPURenderer picks the backend on init and every node in this project
 * compiles to either.
 */
import * as THREE from 'three/webgpu';
import { color, mix, screenUV, smoothstep, vec2 } from 'three/tsl';

export function createStage(
  container,
  frameSize,
  { fov = 38, fill = 0.34, lift = 0, focusY = 0.42, backgroundCenter = 0x101014, backgroundEdge = 0x050506 } = {},
) {
  const renderer = new THREE.WebGPURenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  container.append(renderer.domElement);

  const scene = new THREE.Scene();
  // A faint node-based vignette instead of a flat clear color keeps the page
  // from reading as a dead #09090a rectangle, without any extra DOM.
  const vignette = smoothstep(0, 0.8, screenUV.distance(vec2(0.5, focusY)));
  scene.backgroundNode = mix(color(backgroundCenter), color(backgroundEdge), vignette);

  const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 50);
  camera.position.y = -lift; // the camera sits low, so the scene rides high in frame

  // Back the camera off far enough that `frameSize` spans `fill` of
  // whichever viewport axis limits it.
  const frame = () => {
    renderer.setSize(innerWidth, innerHeight);
    camera.aspect = innerWidth / innerHeight;
    const halfTan = Math.tan(THREE.MathUtils.degToRad(fov) / 2);
    const forHeight = frameSize.height / 2 / fill / halfTan;
    const forWidth = frameSize.width / 2 / fill / (halfTan * camera.aspect);
    camera.position.z = Math.max(forHeight, forWidth);
    camera.updateProjectionMatrix();
  };

  frame();
  window.addEventListener('resize', frame);

  return { renderer, scene, camera };
}
