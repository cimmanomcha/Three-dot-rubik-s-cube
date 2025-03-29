import * as THREE from 'three';
    import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
    import * as TWEEN from '@tweenjs/tween.js';
    import { createRubiksCube, CUBIE_GAP, CUBIE_SIZE } from './cube.js';
    import { rotateFace } from './rotate.js';

    // --- Basic Setup ---
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(4, 4, 6);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);

    // --- Rubik's Cube ---
    const rubiksCube = createRubiksCube();
    scene.add(rubiksCube);

    // --- Rotation Logic ---
    let isRotating = false;
    const rotationQueue = [];

    function processRotationQueue() {
      if (isRotating || rotationQueue.length === 0) {
        return;
      }
      isRotating = true;
      const { axis, layer, direction } = rotationQueue.shift();

      rotateFace(rubiksCube, axis, layer, direction, () => {
        isRotating = false;
        processRotationQueue(); // Process next rotation if any
      });
    }

    // --- Event Listeners ---
    window.addEventListener('keydown', (event) => {
      if (isRotating && rotationQueue.length > 5) return; // Limit queue size

      const key = event.key.toUpperCase();
      const shift = event.shiftKey;
      let axis = null;
      let layer = 0; // Layer index (-1, 0, 1)
      let direction = shift ? -1 : 1; // Clockwise (1) or Counter-clockwise (-1)

      const offset = CUBIE_SIZE + CUBIE_GAP;

      switch (key) {
        case 'U': axis = 'y'; layer = 1 * offset; break; // Top face
        case 'D': axis = 'y'; layer = -1 * offset; direction *= -1; break; // Bottom face (inverted controls relative to top)
        case 'L': axis = 'x'; layer = -1 * offset; direction *= -1; break; // Left face (inverted)
        case 'R': axis = 'x'; layer = 1 * offset; break; // Right face
        case 'F': axis = 'z'; layer = 1 * offset; break; // Front face
        case 'B': axis = 'z'; layer = -1 * offset; direction *= -1; break; // Back face (inverted)
        // Add middle slice rotations if desired (e.g., M, E, S)
        // case 'M': axis = 'x'; layer = 0; direction *= -1; break; // Middle slice (like L)
        // case 'E': axis = 'y'; layer = 0; direction *= -1; break; // Equatorial slice (like D)
        // case 'S': axis = 'z'; layer = 0; break; // Standing slice (like F)
        default: return; // Ignore other keys
      }

      if (axis) {
         // Check if the requested rotation is the opposite of the last queued one
         const lastRotation = rotationQueue[rotationQueue.length - 1];
         if (lastRotation && lastRotation.axis === axis && Math.abs(lastRotation.layer - layer) < 0.01 && lastRotation.direction === -direction) {
             rotationQueue.pop(); // Cancel out the last rotation
         } else {
             rotationQueue.push({ axis, layer, direction });
         }
         processRotationQueue();
      }
    });

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // --- Animation Loop ---
    function animate(time) {
      requestAnimationFrame(animate);
      controls.update();
      TWEEN.update(time); // Update animations
      renderer.render(scene, camera);
    }

    animate();
