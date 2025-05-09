// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Add lighting
const pointLight = new THREE.PointLight(0xffffff, 1, 100);
pointLight.position.set(50, 50, 50); // Adjusted for zoomed-out view
pointLight.intensity = 2;
pointLight.distance = 200;
scene.add(pointLight);

const ambientLight = new THREE.AmbientLight(0x606060); // Brighter for visibility
scene.add(ambientLight);

// Add coordinate axes
const axesHelper = new THREE.AxesHelper(100); // Size 100
scene.add(axesHelper);

// Sphere class with Simplex integration and trail (SHM in Y and Z)
class Sphere {
  constructor(radius, color, scene) {
    this.geometry = new THREE.SphereGeometry(radius, 32, 32);
    this.material = new THREE.MeshStandardMaterial({ color });
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    scene.add(this.mesh);

    // Position: Vector3
    this.position = new THREE.Vector3(0, 0, 0);

    // Velocity: Vector3
    this.velocity = new THREE.Vector3(100, 0, 0);

    // Acceleration: Vector3
    this.acceleration = new THREE.Vector3(0, 0, 0); // accelerationX = 0 (constant velocity)

    // Trail setup
    this.trailPositions = [];
    this.trailGeometry = new THREE.BufferGeometry();
    this.trailMaterial = new THREE.LineBasicMaterial({ color: 0xffffff }); // White trail
    this.trail = new THREE.Line(this.trailGeometry, this.trailMaterial);
    this.trailGeometry.setAttribute('position', new THREE.Float32BufferAttribute(this.trailPositions, 3));
    scene.add(this.trail);

    this.maxTrailPoints = 10000; // Limit trail points
  }

  // Simplex (semi-implicit Euler) integration: velocity first, then position
  simplexStep(position, velocity, acceleration, dt) {
    // Update velocity first: v_new = v + a * dt
    const newVelocity = velocity.clone().addScaledVector(acceleration, dt);

    // Update position using new velocity: x_new = x + v_new * dt
    const newPosition = position.clone().addScaledVector(newVelocity, dt);

    return { newPosition, newVelocity };
  }

  update(dt) {
    this.acceleration.set(
      0,
      -200,
      0,
    );

    // Update positions and velocities using Simplex
    const result = this.simplexStep(this.position, this.velocity, this.acceleration, dt);
    this.position = result.newPosition;
    this.velocity = result.newVelocity;

    // Apply to mesh
    this.mesh.position.copy(this.position);

    // Update trail
    this.trailPositions.push(this.position.x, this.position.y, this.position.z);
    // if (this.trailPositions.length > this.maxTrailPoints * 3) {
    //   this.trailPositions.splice(0, 3); // Remove oldest point
    // }
    this.trailGeometry.setAttribute('position', new THREE.Float32BufferAttribute(this.trailPositions, 3));
    this.trailGeometry.attributes.position.needsUpdate = true;
  }
}

// Create a sphere instance
const sphere = new Sphere(1, 0xff0000, scene);

// Isometric camera setup with zoomed-out position
camera.position.set(150, 150, 150); // Zoomed out
camera.lookAt(0, 0, 0); // Look at the origin

// Orbital controls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enableZoom = true;
controls.zoomSpeed = 1.0;
controls.target.set(0, 0, 0);

// Create a div to display the ball's position
const positionDisplay = document.createElement('div');
positionDisplay.style.position = 'absolute';
positionDisplay.style.top = '10px';
positionDisplay.style.left = '10px';
positionDisplay.style.color = 'white';
positionDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
positionDisplay.style.padding = '5px';
positionDisplay.style.fontFamily = 'Arial, sans-serif';
positionDisplay.style.fontSize = '14px';
document.body.appendChild(positionDisplay);

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Delta time setup with THREE.Clock
const clock = new THREE.Clock();

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  // Get delta time
  const dt = clock.getDelta();

  // Update sphere
  sphere.update(dt);

  // Update position display
  positionDisplay.textContent = `Position: X: ${sphere.position.x.toFixed(2)}, Y: ${sphere.position.y.toFixed(2)}, Z: ${sphere.position.z.toFixed(2)}`;

  // Update controls
  controls.update();

  renderer.render(scene, camera);
}

animate();
