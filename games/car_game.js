// --- SCENE SETUP ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222233);
scene.fog = new THREE.Fog(0x222233, 50, 150);

const camera = new THREE.PerspectiveCamera(75, 800 / 600, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(800, 600);
renderer.shadowMap.enabled = true;
// Append canvas to the dedicated container
const canvasContainer = document.getElementById('game-canvas-container');
canvasContainer.appendChild(renderer.domElement);
// Make canvas container relative to position UI elements over it
canvasContainer.style.position = 'relative'; 

// --- LIGHTING ---
const ambientLight = new THREE.HemisphereLight(0xaaaaaa, 0x444444, 1.0);
scene.add(ambientLight);

const sun = new THREE.DirectionalLight(0xffffff, 1.5);
sun.position.set(10, 20, -20);
sun.castShadow = true;
sun.shadow.mapSize.width = 2048;
sun.shadow.mapSize.height = 2048;
scene.add(sun);

// --- GAME STATE & CONSTANTS ---
let score = 0;
// --- INCREASED SPEED ---
let gameSpeed = 12; // Increased from 8
let gameOver = false;
const lanePositions = [-5, 0, 5];
let currentLane = 1;
let obstacles = [];
const clock = new THREE.Clock();

// --- PLAYER CAR ---
const playerCar = new THREE.Group();
const carBody = new THREE.Mesh(
    new THREE.BoxGeometry(2.5, 1.5, 5),
    new THREE.MeshStandardMaterial({ color: 0x4d88ff, roughness: 0.4, metalness: 0.2 })
);
carBody.castShadow = true;
playerCar.add(carBody);

const carCabin = new THREE.Mesh(
    new THREE.BoxGeometry(2, 1, 3),
    new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.2, metalness: 0.1 })
);
carCabin.position.y = 1.25;
carCabin.position.z = -0.5;
carCabin.castShadow = true;
playerCar.add(carCabin);
playerCar.position.set(lanePositions[currentLane], 1.2, 30);
scene.add(playerCar);

// --- CAMERA SETUP (CHASE CAM) ---
camera.position.set(0, 8, 42);
camera.lookAt(playerCar.position);

// --- ENVIRONMENT ---
const roadGeo = new THREE.PlaneGeometry(20, 200);
const roadMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
const road = new THREE.Mesh(roadGeo, roadMat);
road.rotation.x = -Math.PI / 2;
road.receiveShadow = true;
scene.add(road);

for (let i = 0; i < 20; i++) {
    const laneMarkingGeo = new THREE.PlaneGeometry(0.5, 5);
    const laneMarkingMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const leftMarking = new THREE.Mesh(laneMarkingGeo, laneMarkingMat);
    leftMarking.rotation.x = -Math.PI / 2;
    leftMarking.position.set(-2.5, 0.01, i * 10 - 50);
    scene.add(leftMarking);
    const rightMarking = new THREE.Mesh(laneMarkingGeo, laneMarkingMat);
    rightMarking.rotation.x = -Math.PI / 2;
    rightMarking.position.set(2.5, 0.01, i * 10 - 50);
    scene.add(rightMarking);
}

// --- OBSTACLE LOGIC ---
function createObstacleCar() {
    const obstacleCar = new THREE.Group();
    const body = new THREE.Mesh(
        new THREE.BoxGeometry(2.5, 1.5, 5),
        new THREE.MeshStandardMaterial({ color: new THREE.Color(Math.random(), Math.random(), Math.random()), roughness: 0.6 })
    );
    body.castShadow = true;
    obstacleCar.add(body);
    const lane = Math.floor(Math.random() * 3);
    obstacleCar.position.set(lanePositions[lane], 1.2, -100);
    obstacleCar.userData.bbox = new THREE.Box3().setFromObject(obstacleCar);
    scene.add(obstacleCar);
    obstacles.push(obstacleCar);
}

// --- GAME LOGIC ---
function movePlayer(direction) {
    if (gameOver) return;
    currentLane = Math.max(0, Math.min(2, currentLane + direction));
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'a' || e.key === 'A') movePlayer(-1);
    if (e.key === 'd' || e.key === 'D') movePlayer(1);
});

function resetGame() {
    obstacles.forEach(obs => scene.remove(obs));
    obstacles = [];
    score = 0;
    // --- RESET TO INCREASED SPEED ---
    gameSpeed = 12;
    gameOver = false;
    currentLane = 1;
    playerCar.position.x = lanePositions[currentLane];
    document.getElementById('game-over-overlay').style.display = 'none';
    animate();
}

document.getElementById('play-again-button').addEventListener('click', resetGame);

function animate() {
    if (gameOver) {
        document.getElementById('game-over-overlay').style.display = 'flex';
        document.getElementById('final-score').textContent = `Score: ${score}`;
        return;
    }
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    
    const targetX = lanePositions[currentLane];
    playerCar.position.x += (targetX - playerCar.position.x) * 0.15;

    const playerBox = new THREE.Box3().setFromObject(playerCar);
    
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obstacle = obstacles[i];
        obstacle.position.z += gameSpeed * delta;
        obstacle.userData.bbox.setFromObject(obstacle);
        
        if (playerBox.intersectsBox(obstacle.userData.bbox)) {
            gameOver = true;
        }

        if (obstacle.position.z > 50) {
            scene.remove(obstacle);
            obstacles.splice(i, 1);
            score++;
            // --- INCREASED SPEED INCREMENT ---
            gameSpeed += 0.2; // Increased from 0.1
        }
    }
    
    document.getElementById('score-display').textContent = `Score: ${score}`;
    renderer.render(scene, camera);
}

// --- START GAME ---
// --- FASTER SPAWN RATE ---
setInterval(createObstacleCar, 900); // Decreased from 1200ms
animate();
