const canvas = document.getElementById('pongCanvas');
const ctx = canvas.getContext('2d');

let gameOver = false;
const winningScore = 5;

// Paddles
const paddleWidth = 10, paddleHeight = 100;
const player = {
    x: 10,
    y: canvas.height / 2 - paddleHeight / 2,
    width: paddleWidth,
    height: paddleHeight,
    score: 0
};
const ai = {
    x: canvas.width - paddleWidth - 10,
    y: canvas.height / 2 - paddleHeight / 2,
    width: paddleWidth,
    height: paddleHeight,
    score: 0
};

// Ball
const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 7,
    speed: 5,
    dx: 5,
    dy: 5
};

// Mouse movement
canvas.addEventListener('mousemove', (e) => {
    let rect = canvas.getBoundingClientRect();
    player.y = e.clientY - rect.top - player.height / 2;
});

function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.speed = 5;
    ball.dx = -ball.dx; // Change direction
}

function update() {
    if (gameOver) return;

    // Move ball
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Wall collision (top/bottom)
    if (ball.y + ball.radius > canvas.height || ball.y - ball.radius < 0) {
        ball.dy *= -1;
    }

    // Score
    if (ball.x + ball.radius > canvas.width) {
        player.score++;
        resetBall();
    } else if (ball.x - ball.radius < 0) {
        ai.score++;
        resetBall();
    }

    // Paddle collision
    let selectedPaddle = (ball.x < canvas.width / 2) ? player : ai;
    if (collides(ball, selectedPaddle)) {
        let collidePoint = (ball.y - (selectedPaddle.y + selectedPaddle.height / 2));
        collidePoint = collidePoint / (selectedPaddle.height / 2);
        let angleRad = (Math.PI / 4) * collidePoint;
        
        let direction = (ball.x < canvas.width / 2) ? 1 : -1;
        ball.dx = direction * ball.speed * Math.cos(angleRad);
        ball.dy = ball.speed * Math.sin(angleRad);
        
        ball.speed += 0.5;
    }
    
    // AI movement
    ai.y += (ball.y - (ai.y + ai.height / 2)) * 0.1;

    // Check for winner
    if (player.score === winningScore || ai.score === winningScore) {
        gameOver = true;
        
        // --- SCORE REPORTING LOGIC ---
        if (window.parent && window.parent.socket && window.parent.getCurrentRoom) {
            const roomCode = window.parent.getCurrentRoom();
            if (roomCode) {
                window.parent.socket.emit('updateScore', {
                    roomCode: roomCode,
                    game: 'ping_pong', // Matches the value in the dropdown
                    score: player.score // Report the player's score
                });
            }
        }
    }
}

function collides(b, p) {
    p.top = p.y;
    p.bottom = p.y + p.height;
    p.left = p.x;
    p.right = p.x + p.width;

    b.top = b.y - b.radius;
    b.bottom = b.y + b.radius;
    b.left = b.x - b.radius;
    b.right = b.x + b.radius;

    return p.left < b.right && p.top < b.bottom && p.right > b.left && p.bottom > b.top;
}

function draw() {
    // Clear canvas
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw paddles
    ctx.fillStyle = '#4d88ff';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    ctx.fillStyle = '#ff4d4d';
    ctx.fillRect(ai.x, ai.y, ai.width, ai.height);

    // Draw ball
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2, false);
    ctx.fill();

    // Draw net
    ctx.beginPath();
    ctx.setLineDash([10, 15]);
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.strokeStyle = "grey";
    ctx.stroke();

    // Draw score
    ctx.font = "45px Arial";
    ctx.fillText(player.score, canvas.width / 4, 50);
    ctx.fillText(ai.score, 3 * canvas.width / 4, 50);

    if (gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.font = '50px Arial';
        ctx.textAlign = 'center';
        let winner = player.score > ai.score ? "You Win!" : "AI Wins!";
        ctx.fillText(winner, canvas.width / 2, canvas.height / 2);
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
