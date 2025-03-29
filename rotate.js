import * as THREE from 'three';
    import * as TWEEN from '@tweenjs/tween.js';

    const ROTATION_SPEED = 300; // milliseconds for 90 degree turn

    // Helper function to select cubies in a layer
    function getCubiesInLayer(cubeGroup, axis, layerPosition) {
        const cubies = [];
        const tolerance = 0.01; // Tolerance for floating point comparisons
        cubeGroup.children.forEach(cubie => {
            // Use world position for accurate layer checking after rotations
            const worldPos = new THREE.Vector3();
            cubie.getWorldPosition(worldPos);

            if (Math.abs(worldPos[axis] - layerPosition) < tolerance) {
                cubies.push(cubie);
            }
        });
        return cubies;
    }


    export function rotateFace(cubeGroup, axis, layerPosition, direction, onComplete) {
        const cubiesToRotate = getCubiesInLayer(cubeGroup, axis, layerPosition);

        if (cubiesToRotate.length === 0) {
            console.warn(`No cubies found for axis ${axis} at layer ${layerPosition}`);
            onComplete(); // Call completion callback even if no cubies found
            return;
        }

        const pivot = new THREE.Group();
        // Position the pivot at the center of the cube (which is the world origin)
        pivot.position.set(0, 0, 0);
        // Ensure the pivot's rotation is reset
        pivot.rotation.set(0, 0, 0);
        // Add pivot to the scene temporarily to ensure correct world matrix updates
        cubeGroup.parent.add(pivot); // Assumes cubeGroup is added directly to the scene

        // Attach cubies to the pivot
        cubiesToRotate.forEach(cubie => {
            // We need to convert the cubie's world position to the pivot's local space
            // Since the pivot is at the origin and has no rotation initially,
            // the world position IS the local position relative to the pivot.
            const worldPos = new THREE.Vector3();
            cubie.getWorldPosition(worldPos); // Get current world position

            // Remove from main group FIRST to preserve world transforms
            cubeGroup.remove(cubie);
            // Add to pivot - THREE will automatically calculate local position/rotation
            pivot.add(cubie);
        });


        // Determine rotation angle
        const angle = (Math.PI / 2) * direction;
        const targetRotation = new THREE.Euler();
        targetRotation[axis] = angle; // Set rotation on the correct axis

        // Create the animation tween
        const tween = new TWEEN.Tween(pivot.rotation)
            .to({ [axis]: pivot.rotation[axis] + angle }, ROTATION_SPEED)
            .easing(TWEEN.Easing.Quadratic.Out) // Smooth easing
            .onComplete(() => {
                // IMPORTANT: Reattach cubies back to the main group
                // Update matrices before detaching to capture final transforms
                pivot.updateMatrixWorld(true);

                // Use a temporary array to avoid issues while iterating and modifying the group
                const childrenToMove = [...pivot.children];

                childrenToMove.forEach(cubie => {
                    // Get world position/rotation AFTER pivot rotation
                    const worldPos = new THREE.Vector3();
                    const worldQuat = new THREE.Quaternion();
                    cubie.getWorldPosition(worldPos);
                    cubie.getWorldQuaternion(worldQuat);

                    // Remove from pivot
                    pivot.remove(cubie);

                    // Add back to the main cube group
                    cubeGroup.add(cubie);

                    // Set the position and rotation directly in the main group's space
                    // (which is world space if the main group is at the origin)
                    cubie.position.copy(worldPos);
                    cubie.quaternion.copy(worldQuat);

                    // Optional: Snap position/rotation to nearest grid/90deg to avoid float errors accumulating
                    snapToGrid(cubie);
                });

                // Remove the pivot from the scene
                cubeGroup.parent.remove(pivot);

                // Call the completion callback
                if (onComplete) {
                    onComplete();
                }
            })
            .start();
    }

    // Helper to mitigate floating point errors over many rotations
    function snapToGrid(object) {
        const snapAngle = Math.PI / 2;
        object.rotation.x = Math.round(object.rotation.x / snapAngle) * snapAngle;
        object.rotation.y = Math.round(object.rotation.y / snapAngle) * snapAngle;
        object.rotation.z = Math.round(object.rotation.z / snapAngle) * snapAngle;

        // Snap position based on expected cubie locations
        const offset = CUBIE_SIZE + CUBIE_GAP;
        object.position.x = Math.round(object.position.x / offset) * offset;
        object.position.y = Math.round(object.position.y / offset) * offset;
        object.position.z = Math.round(object.position.z / offset) * offset;
    }
