const particleCount = 20000;
const positionProps = ['x', 'y', 'z'];
const velocityProps = ['vx', 'vx', 'vz', 'vw'];
const ageProps = ['age', 'life'];
const colorProps = ['r', 'g', 'b'];
const simplex = new SimplexNoise(); // jwagner's simplex-noise-js: https://github.com/jwagner/simplex-noise.js

let scene;
let camera;
let composer;
let renderer;
let material;
let mesh;
let time;
let geometry;
let positions;
let velocities;
let ages;
let colors;
let controls;

addEventListener('DOMContentLoaded', start);
addEventListener('resize', resize);

function start() {
  time = 0;
  createScene();
  createCamera();
  createParticles();
  createMesh();
  createRenderer();
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  render();
}

function createScene() {
  scene = new THREE.Scene();
}

function createCamera() {
  camera = new THREE.PerspectiveCamera(
  50,
  innerWidth / innerHeight,
  0.1,
  10000);

  camera.position.z = 400;
}

function createParticles() {
  positions = new PropsArray(particleCount, positionProps);
  velocities = new PropsArray(particleCount, velocityProps);
  colors = new PropsArray(particleCount, colorProps);
  ages = new PropsArray(particleCount, ageProps);
  positions.map(createPosition);
  velocities.map(createVelocity);
  colors.map(createColor);
  ages.map(createAge);
}

function resetParticle(i) {
  positions.set(createPosition(), i * positions.spread);
  velocities.set(createVelocity(), i * velocities.spread);
  colors.set(createColor(), i * colors.spread);
  ages.set(createAge(), i * ages.spread);
}

function createPosition(v, i) {
  let d, p, t, x, y, z, vx, vy, vz;

  d = 100;
  p = rand(TAU);
  t = rand(PI);

  x = d * sin(p) * cos(t);
  y = d * sin(p) * sin(t);
  z = d * cos(p);

  return [x, y, z];
}

function createVelocity(v, i) {
  let vx, vy, vz, vw;

  vx = vy = vz = 0;
  vw = 6 + rand(4);

  return [vx, vy, vz, vw];
}

function createAge(v, i) {
  let age, life;

  age = 0;
  life = rand(600) + 200;

  return [age, life];
}

function createColor(v, i) {
  let r, g, b;

  r = fadeIn(60 + rand(40), 360);
  g = fadeIn(60 + rand(60), 360);
  b = fadeIn(100 + rand(120), 360);

  return [r, g, b];
}

function createMesh() {
  const uniforms = {
    u_time: {
      type: 'f',
      value: 0.0 },

    u_texture: {
      type: 'sampler2D',
      value: new THREE.TextureLoader().load('https://s3-us-west-2.amazonaws.com/s.cdpn.io/544318/particle-texture-2.png') },

    u_resolution: {
      type: 'v2',
      value: new THREE.Vector2(50, 50) } };



  material = new THREE.ShaderMaterial({
    vertexShader: document.getElementById('vert-shader').textContent,
    fragmentShader: document.getElementById('frag-shader').textContent,
    blending: THREE.AdditiveBlending,
    depthTest: true,
    depthWrite: false,
    transparent: true,
    uniforms });


  geometry = new THREE.BufferGeometry();

  geometry.setAttribute('position', new THREE.BufferAttribute(positions.values, positions.spread));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors.values, colors.spread));
  geometry.setAttribute('age', new THREE.BufferAttribute(ages.values, ages.spread));

  mesh = new THREE.Points(geometry, material);
  mesh.rotation.x = 0.5;

  camera.lookAt(mesh.position);

  scene.add(mesh);
}

function createRenderer() {
  renderer = new THREE.WebGLRenderer({
    powerPreference: 'high-performance',
    alpha: true,
    canvas: document.getElementById('canvas') });


  resize();
}

function updateParticles() {
  let i, x, y, z, vx, vy, vz, vw, age, life, p, t;

  for (i = 0; i < particleCount; i++) {
    [age, life] = ages.get(i * ages.spread);

    if (age > life) {
      resetParticle(i);
    } else {
      [x, y, z] = positions.get(i * positions.spread),
      [vx, vy, vz, vw] = velocities.get(i * velocities.spread);

      t = simplex.noise4D(x * 0.005, y * 0.005, z * 0.005, time * 0.0005) * TAU * 4;
      p = cos(t) * TAU * 2;

      vx = lerp(vx, sin(p) * cos(t) * vw, 0.125);
      vy = lerp(vy, sin(p) * sin(t) * vw, 0.125);
      vz = lerp(vz, cos(p) * vw, 0.125);
      // vw *= 0.9975;

      x = lerp(x, x + vx, 0.05);
      y = lerp(y, y + vy, 0.05);
      z = lerp(z, z + vz, 0.05);

      positions.set([x, y, z], i * positions.spread);
      velocities.set([vx, vy, vz, vw], i * velocities.spread);
      ages.set([++age], i * ages.spread);
    }
  }
}

function render() {
  requestAnimationFrame(render);

  time++;

  updateParticles();

  geometry.attributes.position.needsUpdate = true;
  geometry.attributes.color.needsUpdate = true;
  geometry.attributes.age.needsUpdate = true;

  mesh.rotation.y += 0.003;

  renderer.render(scene, camera);
}

function resize() {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(devicePixelRatio);
}