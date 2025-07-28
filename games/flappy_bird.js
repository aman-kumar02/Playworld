const canvas = document.getElementById('flappyCanvas');
const ctx = canvas.getContext('2d');
const gameContainer = document.querySelector('.game-container');

let score = 0;
let gameOver = false;
const gravity = 0.4;
const flapStrength = -6.5; // Slightly stronger flap
let speed = 2;

// Bird
const bird = {
    x: 50,
    y: 150,
    width: 34,
    height: 24,
    velocity: 0
};

// Pipes
let pipes = [];
const pipeWidth = 60; // Wider pipes
const pipeGap = 130; // Slightly larger gap

// Create Play Again Button and add it to the game container
const playAgainButton = document.createElement('button');
playAgainButton.textContent = 'Play Again';
playAgainButton.className = 'back-link'; // Use existing style
playAgainButton.style.position = 'absolute';
playAgainButton.style.top = '65%';
playAgainButton.style.display = 'none'; // Initially hidden
gameContainer.appendChild(playAgainButton);

// Function to reset the game state
function resetGame() {
    score = 0;
    gameOver = false;
    bird.y = 150;
    bird.velocity = 0;
    pipes = [];
    playAgainButton.style.display = 'none';
    gameLoop(); // Restart the game loop
}

playAgainButton.addEventListener('click', resetGame);

function spawnPipe() {
    if (gameOver) return;
    let pipeY = Math.floor(Math.random() * (canvas.height - 350)) + 100;
    pipes.push({
        x: canvas.width,
        topPipeY: pipeY,
        bottomPipeY: pipeY + pipeGap,
        passed: false
    });
}

function moveBird() {
    bird.velocity += gravity;
    bird.y += bird.velocity;

    // Ground and sky collision
    if (bird.y + bird.height / 2 > canvas.height || bird.y - bird.height / 2 < 0) {
        endGame();
    }
}

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') flap();
});
canvas.addEventListener('mousedown', flap);

function flap() {
    if (!gameOver) {
        bird.velocity = flapStrength;
    } else {
        // Allow starting a new game with a flap on the game over screen
        let now = new Date().getTime();
        if (now - lastGameOverTime > 500) { // Small delay to prevent accidental restart
             resetGame();
        }
    }
}

function updatePipes() {
    for (let i = pipes.length - 1; i >= 0; i--) {
        pipes[i].x -= speed;

        // Collision detection with the bird
        if (bird.x < pipes[i].x + pipeWidth &&
            bird.x + bird.width > pipes[i].x &&
            (bird.y - bird.height / 2 < pipes[i].topPipeY || bird.y + bird.height / 2 > pipes[i].bottomPipeY)) {
            endGame();
        }

        // Update score
        if (pipes[i].x + pipeWidth < bird.x && !pipes[i].passed) {
            score++;
            pipes[i].passed = true;
        }

        // Remove pipes that are off-screen
        if (pipes[i].x + pipeWidth < 0) {
            pipes.splice(i, 1);
        }
    }
}

function draw() {
    // Background gradient for a "higher poly" feel
    const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGradient.addColorStop(0, '#3a7bd5');
    skyGradient.addColorStop(1, '#3a6073');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw improved pipes
    ctx.fillStyle = '#008000';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    pipes.forEach(pipe => {
        // Top pipe
        ctx.fillRect(pipe.x, 0, pipeWidth, pipe.topPipeY);
        ctx.strokeRect(pipe.x, 0, pipeWidth, pipe.topPipeY);
        // Bottom pipe
        ctx.fillRect(pipe.x, pipe.bottomPipeY, pipeWidth, canvas.height - pipe.bottomPipeY);
        ctx.strokeRect(pipe.x, pipe.bottomPipeY, pipeWidth, canvas.height - pipe.bottomPipeY);
    });

    // Draw a smoother, circular bird with an eye
    ctx.fillStyle = '#f2d43c';
    ctx.beginPath();
    ctx.arc(bird.x, bird.y, bird.height / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Eye
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(bird.x + 5, bird.y - 3, 2, 0, Math.PI * 2);
    ctx.fill();

    // Draw score
    ctx.fillStyle = '#fff';
    ctx.font = '45px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(score, canvas.width / 2, 50);

    if (gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 20);
        ctx.fillText('Score: ' + score, canvas.width / 2, canvas.height / 2 + 20);
        playAgainButton.style.display = 'block'; // Show the button
    }
}

let lastGameOverTime = 0;
function endGame() {
    if (!gameOver) {
      gameOver = true;
      lastGameOverTime = new Date().getTime();

      // --- SCORE REPORTING LOGIC ---
      if (window.parent && window.parent.socket && window.parent.getCurrentRoom) {
          const roomCode = window.parent.getCurrentRoom();
          if (roomCode) {
              window.parent.socket.emit('updateScore', {
                  roomCode: roomCode,
                  game: 'flappy_bird',
                  score: score
              });
          }
      }
    }
}

function gameLoop() {
    if (!gameOver) {
        moveBird();
        updatePipes();
        requestAnimationFrame(gameLoop);
    }
    draw();
}

// Start game
let pipeInterval = setInterval(spawnPipe, 1800);
gameLoop();
