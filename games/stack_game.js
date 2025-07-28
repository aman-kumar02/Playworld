// --- DOM & UI ELEMENTS ---
const canvasContainer = document.getElementById('canvas-container');
const ui = document.getElementById('game-ui');
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreDisplay = document.getElementById('final-score');
const playAgainButton = document.getElementById('play-again-button');

// --- SCENE SETUP ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, 800 / 600, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(800, 600);
renderer.shadowMap.enabled = true;
canvasContainer.appendChild(renderer.domElement);

// --- LIGHTING ---
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const light = new THREE.DirectionalLight(0xffffff, 0.8);
light.position.set(15, 25, 15);
light.castShadow = true;
scene.add(light);

// --- GAME STATE & LOGIC ---
let stack, overhangs, currentBlock;
let gameSpeed, score, gameOver, animReq;
let isShowcaseView = false; // --- NEW: Flag for post-game camera animation ---

function init() {
    if (animReq) {
        cancelAnimationFrame(animReq);
    }

    if (stack) {
        stack.forEach(mesh => scene.remove(mesh));
        overhangs.forEach(mesh => scene.remove(mesh));
        if (currentBlock && currentBlock.mesh) {
            scene.remove(currentBlock.mesh);
        }
    }
    
    stack = [];
    overhangs = [];
    currentBlock = null;
    animReq = null;
    gameSpeed = 0.1;
    score = 0;
    gameOver = false;
    isShowcaseView = false; // Reset the showcase flag

    scene.background = new THREE.Color('hsl(200, 50%, 15%)');
    ui.textContent = 'Score: 0';
    gameOverScreen.style.display = 'none';

    addBlock({ x: 0, z: 0, width: 10, depth: 10, isStatic: true });
    spawnBlock();

    camera.position.set(18, 18, 18);
    camera.lookAt(0, 0, 0);

    animate();
}

function addBlock({x, z, width, depth, isStatic}) {
    const y = stack.length * 2;
    const geometry = new THREE.BoxGeometry(width, 2, depth);
    const color = new THREE.Color(`hsl(${200 + stack.length * 4}, 90%, 60%)`);
    const material = new THREE.MeshLambertMaterial({ color });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);

    if (isStatic) {
        stack.push(mesh);
    } else {
        const direction = stack.length % 2 === 1 ? 'x' : 'z';
        mesh.position[direction] = -15;
        currentBlock = { mesh, direction };
    }
}

function spawnBlock() {
    if (gameOver) return;
    const topBlock = stack[stack.length - 1];
    addBlock({ 
        x: topBlock.position.x, 
        z: topBlock.position.z, 
        width: topBlock.geometry.parameters.width, 
        depth: topBlock.geometry.parameters.depth, 
        isStatic: false 
    });
}

function placeBlock() {
    if (gameOver || !currentBlock) return;

    const topBlock = stack[stack.length - 1];
    const movingMesh = currentBlock.mesh;
    const { direction } = currentBlock;
    const dimension = direction === 'x' ? 'width' : 'depth';

    const delta = movingMesh.position[direction] - topBlock.position[direction];
    const overhang = Math.abs(delta);
    const size = topBlock.geometry.parameters[dimension];

    if (overhang >= size) {
        endGame();
        return;
    }

    const newSize = size - overhang;

    const overhangProps = {
        width: direction === 'x' ? overhang : topBlock.geometry.parameters.width,
        depth: direction === 'z' ? overhang : topBlock.geometry.parameters.depth
    };
    const overhangGeo = new THREE.BoxGeometry(overhangProps.width, 2, overhangProps.depth);
    const overhangMat = new THREE.MeshLambertMaterial({ color: movingMesh.material.color });
    const overhangMesh = new THREE.Mesh(overhangGeo, overhangMat);

    const overhangSide = Math.sign(delta);
    const overhangShift = (size - newSize) / 2;
    overhangMesh.position[direction] = topBlock.position[direction] + (newSize / 2 + overhangShift) * overhangSide;
    overhangMesh.position[direction === 'x' ? 'z' : 'x'] = movingMesh.position[direction === 'x' ? 'z' : 'x'];
    overhangMesh.position.y = movingMesh.position.y;
    scene.add(overhangMesh);
    overhangs.push(overhangMesh);

    movingMesh.position[direction] = topBlock.position[direction] + delta / 2;
    movingMesh.geometry.dispose();
    movingMesh.geometry = new THREE.BoxGeometry(
        direction === 'x' ? newSize : topBlock.geometry.parameters.width, 2, direction === 'z' ? newSize : topBlock.geometry.parameters.depth
    );

    stack.push(movingMesh);
    currentBlock = null;

    score++;
    ui.textContent = `Score: ${score}`;
    scene.background.setHSL((200 + score * 5) / 360, 0.5, 0.15);
    
    spawnBlock();
}

function endGame() {
    gameOver = true;
    isShowcaseView = true; // --- NEW: Trigger the showcase view ---
    
    if (currentBlock && currentBlock.mesh) {
        scene.remove(currentBlock.mesh);
    }
    currentBlock = null;

    finalScoreDisplay.textContent = `Score: ${score}`;
    // We don't show the game over screen here anymore. It's shown after the animation.
}

function animate() {
    animReq = requestAnimationFrame(animate);

    // --- NEW SHOWCASE LOGIC ---
    if (isShowcaseView) {
        const stackHeight = score * 2;
        const camDistance = stackHeight * 0.8 + 15;
        const targetPos = new THREE.Vector3(camDistance, stackHeight / 2 + 10, camDistance);
        
        // Smoothly move camera to the showcase position
        camera.position.lerp(targetPos, 0.05);
        camera.lookAt(0, stackHeight / 2, 0);

        // Once the camera is close enough, show the game over screen
        if (camera.position.distanceTo(targetPos) < 1) {
            gameOverScreen.style.display = 'flex';
            isShowcaseView = false; // Stop this animation block
        }
    } 
    // Regular game logic only runs if the game is not over
    else if (!gameOver) {
        if (currentBlock) {
            const speed = gameSpeed + score * 0.005;
            currentBlock.mesh.position[currentBlock.direction] += speed;
            
            const boundary = 15;
            if (Math.abs(currentBlock.mesh.position[currentBlock.direction]) > boundary) {
                gameSpeed *= -1;
            }
        }

        if (stack.length > 0) {
            const targetY = stack.length * 2 + 10;
            camera.position.y += (targetY - camera.position.y) * 0.05;
            camera.lookAt(0, stack.length * 2 - 2, 0);
        }
    }

    // Animate falling overhangs (this runs during game and showcase)
    overhangs.forEach(o => {
        o.position.y -= 0.15;
        o.rotation[o.position.x > o.position.z ? 'z' : 'x'] += 0.01;
    });

    renderer.render(scene, camera);
}

// --- EVENT LISTENERS ---
window.addEventListener('click', placeBlock);
window.addEventListener('keydown', (e) => { if (e.code === 'Space') placeBlock(); });
playAgainButton.addEventListener('click', (e) => {
    e.stopPropagation();
    init();
});

// Start game
init();
