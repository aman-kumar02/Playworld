// --- SCENE SETUP ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222233);
scene.fog = new THREE.Fog(0x222233, 50, 150);
const camera = new THREE.PerspectiveCamera(75, 800 / 600, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(800, 600);
renderer.shadowMap.enabled = true;
const canvasContainer = document.getElementById('game-canvas-container');
canvasContainer.appendChild(renderer.domElement);
canvasContainer.style.position = 'relative'; 

// --- LIGHTING ---
const ambientLight = new THREE.HemisphereLight(0xaaaaaa, 0x444444, 1.0);
scene.add(ambientLight);
const sun = new THREE.DirectionalLight(0xffffff, 1.5);
sun.position.set(10, 20, -20);
sun.castShadow = true;
scene.add(sun);

// --- GAME STATE & CONSTANTS ---
let score = 0, gameSpeed = 12, gameOver = false;
const lanePositions = [-5, 0, 5];
let currentLane = 1, obstacles = [];
const clock = new THREE.Clock();

// --- PLAYER CAR ---
const playerCar = new THREE.Group();
const carBody = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.5, 5), new THREE.MeshStandardMaterial({ color: 0x4d88ff, roughness: 0.4, metalness: 0.2 }));
carBody.castShadow = true;
playerCar.add(carBody);
const carCabin = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 3), new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.2, metalness: 0.1 }));
carCabin.position.set(0, 1.25, -0.5);
carCabin.castShadow = true;
playerCar.add(carCabin);
playerCar.position.set(lanePositions[currentLane], 1.2, 30);
scene.add(playerCar);
camera.position.set(0, 8, 42);
camera.lookAt(playerCar.position);

// --- ENVIRONMENT ---
const road = new THREE.Mesh(new THREE.PlaneGeometry(20, 200), new THREE.MeshStandardMaterial({ color: 0x333333 }));
road.rotation.x = -Math.PI / 2;
road.receiveShadow = true;
scene.add(road);
for (let i = 0; i < 20; i++) {
    const markGeo = new THREE.PlaneGeometry(0.5, 5), markMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const leftMark = new THREE.Mesh(markGeo, markMat);
    leftMark.rotation.x = -Math.PI / 2;
    leftMark.position.set(-2.5, 0.01, i * 10 - 50);
    scene.add(leftMark);
    const rightMark = new THREE.Mesh(markGeo, markMat);
    rightMark.rotation.x = -Math.PI / 2;
    rightMark.position.set(2.5, 0.01, i * 10 - 50);
    scene.add(rightMark);
}

// --- OBSTACLE LOGIC ---
function createObstacleCar() {
    const car = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.5, 5), new THREE.MeshStandardMaterial({ color: new THREE.Color(Math.random(), Math.random(), Math.random()), roughness: 0.6 }));
    body.castShadow = true;
    car.add(body);
    const lane = Math.floor(Math.random() * 3);
    car.position.set(lanePositions[lane], 1.2, -100);
    car.userData.bbox = new THREE.Box3().setFromObject(car);
    scene.add(car);
    obstacles.push(car);
}

// --- GAME LOGIC ---
function movePlayer(dir) { if (!gameOver) currentLane = Math.max(0, Math.min(2, currentLane + dir)); }
document.addEventListener('keydown', (e) => { if (e.key === 'a' || e.key === 'A') movePlayer(-1); if (e.key === 'd' || e.key === 'D') movePlayer(1); });

function resetGame() {
    obstacles.forEach(obs => scene.remove(obs));
    obstacles = [];
    score = 0;
    gameSpeed = 12;
    gameOver = false;
    currentLane = 1;
    playerCar.position.x = lanePositions[currentLane];
    document.getElementById('game-over-overlay').style.display = 'none';
    animate();
}
document.getElementById('play-again-button').addEventListener('click', resetGame);

function triggerGameOver() {
    if (gameOver) return;
    gameOver = true;

    // --- SCORE REPORTING LOGIC ---
    if (window.parent && window.parent.socket && window.parent.getCurrentRoom) {
        const roomCode = window.parent.getCurrentRoom();
        if (roomCode) {
            window.parent.socket.emit('updateScore', {
                roomCode: roomCode,
                game: 'car_game',
                score: score
            });
        }
    }
}

function animate() {
    if (gameOver) {
        document.getElementById('game-over-overlay').style.display = 'flex';
        document.getElementById('final-score').textContent = `Score: ${score}`;
        return;
    }
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    playerCar.position.x += (lanePositions[currentLane] - playerCar.position.x) * 0.15;
    const playerBox = new THREE.Box3().setFromObject(playerCar);
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        obs.position.z += gameSpeed * delta;
        obs.userData.bbox.setFromObject(obs);
        if (playerBox.intersectsBox(obs.userData.bbox)) triggerGameOver();
        if (obs.position.z > 50) {
            scene.remove(obs);
            obstacles.splice(i, 1);
            score++;
            gameSpeed += 0.2;
        }
    }
    document.getElementById('score-display').textContent = `Score: ${score}`;
    renderer.render(scene, camera);
}

setInterval(createObstacleCar, 900);
animate();
