import * as THREE from 'three';

    export const CUBIE_SIZE = 1;
    export const CUBIE_GAP = 0.05; // Small gap between cubies
    const CUBE_SIZE = CUBIE_SIZE * 3 + CUBIE_GAP * 2;

    // Standard Rubik's Cube Colors
    const colors = {
      white: 0xffffff,
      yellow: 0xffff00,
      blue: 0x0000ff,
      green: 0x00ff00,
      red: 0xff0000,
      orange: 0xffa500,
      black: 0x1a1a1a // Inner color slightly lighter
    };

    // Face order: Right (+X), Left (-X), Top (+Y), Bottom (-Y), Front (+Z), Back (-Z)
    const faceColors = [
      colors.red, colors.orange, colors.white, colors.yellow, colors.blue, colors.green
    ];

    export function createRubiksCube() {
      const group = new THREE.Group();
      const cubieGeometry = new THREE.BoxGeometry(CUBIE_SIZE, CUBIE_SIZE, CUBIE_SIZE);

      const offset = CUBIE_SIZE + CUBIE_GAP;

      for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
          for (let z = -1; z <= 1; z++) {
            // Center cubie is not needed visually, but helps with rotation logic if included
            // if (x === 0 && y === 0 && z === 0) continue;

            const materials = [];
            for (let i = 0; i < 6; i++) {
              // Use MeshStandardMaterial for better lighting
              materials.push(new THREE.MeshStandardMaterial({
                color: colors.black,
                roughness: 0.7,
                metalness: 0.1,
                side: THREE.FrontSide // Render only front side
              }));
            }

            // Apply face colors based on position
            // Check the positive/negative side along each axis
            if (x === 1) materials[0].color.set(faceColors[0]); // Right face (+X)
            if (x === -1) materials[1].color.set(faceColors[1]); // Left face (-X)
            if (y === 1) materials[2].color.set(faceColors[2]); // Top face (+Y)
            if (y === -1) materials[3].color.set(faceColors[3]); // Bottom face (-Y)
            if (z === 1) materials[4].color.set(faceColors[4]); // Front face (+Z)
            if (z === -1) materials[5].color.set(faceColors[5]); // Back face (-Z)

            const cubie = new THREE.Mesh(cubieGeometry, materials);

            // Position the cubie with gaps
            cubie.position.set(x * offset, y * offset, z * offset);

            // Store initial logical position (useful for debugging, less for rotation)
            cubie.userData.initialPosition = { x, y, z };
            // We will rely on the cubie's current world position for rotation logic

            group.add(cubie);
          }
        }
      }
      return group;
    }
