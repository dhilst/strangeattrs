import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

class FunctionPlotter {
  constructor(containerId, config = {}) {
    // Configuration defaults
    this.config = {
      width: 800,
      height: 600,
      axes: true,
      grid: true,
      backgroundColor: 0x111111,
      curveColor: 0x00ff00,
      ...config
    };

    // Initialize Three.js
    this.initScene();
    this.initCamera();
    this.initRenderer(containerId);
    this.initControls();
    this.initLighting();

    // Add coordinate system
    if (this.config.axes) this.addAxes();
    if (this.config.grid) this.addGrid();

    // Animation loop
    this.animate();
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.config.backgroundColor);
  }

  initCamera() {
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.config.width / this.config.height,
      0.1,
      1000
    );
    this.camera.position.set(5, 5, 10);
    this.camera.lookAt(0, 0, 0);
  }

  initRenderer(containerId) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(this.config.width, this.config.height);
    document.getElementById(containerId).appendChild(this.renderer.domElement);
  }

  initControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
  }

  initLighting() {
    const ambientLight = new THREE.AmbientLight(0x404040);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    this.scene.add(directionalLight);
  }

  addAxes(size = 5) {
    const axesHelper = new THREE.AxesHelper(size);
    this.scene.add(axesHelper);
  }

  addGrid(size = 10, divisions = 10) {
    const gridHelper = new THREE.GridHelper(size, divisions);
    this.scene.add(gridHelper);
  }

  plotFunction(fn, options = {}) {
    const config = {
      range: { x: [-5, 5] },
      segments: 100,
      color: this.config.curveColor,
      thickness: 2,
      ...options
    };

    const points = [];
    const step = (config.range.x[1] - config.range.x[0]) / config.segments;

    for (let i = 0; i <= config.segments; i++) {
      const x = config.range.x[0] + i * step;
      const y = fn(x);
      points.push(new THREE.Vector3(x, y, 0));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: config.color,
      linewidth: config.thickness
    });

    this.curve = new THREE.Line(geometry, material);
    this.scene.add(this.curve);
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  resize(width, height) {
    this.config.width = width;
    this.config.height = height;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
}

// Usage Example
const plotter = new FunctionPlotter('plot-container', {
  backgroundColor: 0x222222,
  curveColor: 0xff00ff
});

// Plot linear function f(x) = 2x
plotter.plotFunction(x => 2 * x, {
  range: { x: [-10, 10] },
  color: 0x00ffff
});

// Plot quadratic function
plotter.plotFunction(x => x * x, {
  range: { x: [-5, 5] },
  color: 0xff9900,
  segments: 200
});

// Handle window resize
window.addEventListener('resize', () => {
  plotter.resize(window.innerWidth, window.innerHeight);
});
