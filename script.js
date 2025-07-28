document.addEventListener('DOMContentLoaded', () => {
    // --- SOCKET.IO & STATE ---
    const socket = io();
    let currentRoom = null;
    let username = null;

    // Make socket and room info globally accessible for game iframes
    window.socket = socket;
    window.getCurrentRoom = () => currentRoom;

    // --- UI ELEMENTS ---
    const profileModal = document.getElementById('create-profile-modal');
    const usernameInput = document.getElementById('username-input');
    const createProfileBtn = document.getElementById('create-profile-btn');
    const profileUsernameDisplay = document.getElementById('profile-username-display');
    
    const createRoomBtn = document.getElementById('create-room-btn');
    const joinRoomBtn = document.getElementById('join-room-btn');
    const createRoomModal = document.getElementById('create-room-modal');
    const joinRoomModal = document.getElementById('join-room-modal');
    const roomCodeDisplay = createRoomModal.querySelector('.room-code-display');
    const joinRoomInput = joinRoomModal.querySelector('#join-room-input');
    const joinRoomSubmitBtn = joinRoomModal.querySelector('#join-room-submit-btn');

    const leaderboardScores = document.querySelector('.leaderboard-scores');
    const gameSelect = document.getElementById('game-select');
    const userIconBtn = document.getElementById('user-icon-btn');
    const userDropdown = document.getElementById('user-dropdown');

    // --- PROFILE CREATION ---
    createProfileBtn.addEventListener('click', () => {
        const name = usernameInput.value.trim();
        if (name) {
            username = name;
            socket.emit('createProfile', username);
            profileUsernameDisplay.textContent = username;
            profileModal.style.display = 'none';
        } else {
            alert('Please enter a username.');
        }
    });

    // --- EVENT EMITTERS (Client -> Server) ---
    createRoomBtn.addEventListener('click', () => socket.emit('createRoom'));
    joinRoomBtn.addEventListener('click', () => openModal(joinRoomModal));
    joinRoomSubmitBtn.addEventListener('click', () => {
        const roomCode = joinRoomInput.value.trim().toUpperCase();
        if (roomCode) socket.emit('joinRoom', roomCode);
    });

    // --- EVENT LISTENERS (Server -> Client) ---
    socket.on('roomCreated', (roomCode) => {
        currentRoom = roomCode;
        roomCodeDisplay.textContent = roomCode;
        openModal(createRoomModal);
        updateLeaderboard({ game: gameSelect.value, scores: { [username]: 0 } });
    });
    socket.on('joinedRoom', (roomCode) => {
        currentRoom = roomCode;
        closeModal();
        alert(`Successfully joined room: ${roomCode}`);
    });
    socket.on('updateLeaderboard', (data) => updateLeaderboard(data));
    socket.on('error', (message) => alert(`Error: ${message}`));
    
    function updateLeaderboard({ game, scores }) {
        if (game === gameSelect.value) {
            leaderboardScores.innerHTML = '';
            // Sort scores in descending order before displaying
            const sortedScores = Object.entries(scores).sort(([, a], [, b]) => b - a);
            for (const [playerName, score] of sortedScores) {
                const entry = document.createElement('div');
                entry.className = 'score-entry';
                const displayName = playerName === username ? `${playerName} (You)` : playerName;
                entry.innerHTML = `<span class="player-name">${displayName}</span><span class="player-score">${score}</span>`;
                leaderboardScores.appendChild(entry);
            }
        }
    }

    // --- LOCAL UI HELPERS ---
    const openModal = (modal) => modal.style.display = 'flex';
    const closeModal = () => { createRoomModal.style.display = 'none'; joinRoomModal.style.display = 'none'; };
    document.querySelectorAll('.modal-close-btn').forEach(btn => btn.addEventListener('click', closeModal));
    
    if (userIconBtn) {
        userIconBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdown.style.display = userDropdown.style.display === 'block' ? 'none' : 'block';
        });
    }
    window.addEventListener('click', () => {
        if (userDropdown && userDropdown.style.display === 'block') {
            userDropdown.style.display = 'none';
        }
    });

    // --- DRAMATIC Multi-Layer Neural Network Animation ---
    const canvas = document.getElementById('neural-background');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        const layerDefinition = [12, 8, 8, 6]; 
        let nodes = [];
        let pulses = [];
        let time = 0;

        function setupNetwork() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            nodes = [];
            pulses = [];
            const totalLayers = layerDefinition.length;
            const horizontalPadding = 50;
            const networkWidth = canvas.width - (horizontalPadding * 2);
            layerDefinition.forEach((nodeCount, layerIndex) => {
                const nodeSpacing = canvas.height / (nodeCount + 1);
                for (let i = 0; i < nodeCount; i++) {
                    const xPos = horizontalPadding + (networkWidth * (layerIndex / (totalLayers - 1)));
                    nodes.push({x: xPos, y: nodeSpacing * (i + 1), layer: layerIndex, connections: [], baseRadius: 4, animOffset: Math.random() * Math.PI * 2});
                }
            });
            nodes.forEach((node) => {
                if (node.layer < layerDefinition.length - 1) {
                    const nextLayerNodes = nodes.filter(n => n.layer === node.layer + 1);
                    for(let i = 0; i < 3; i++) {
                        node.connections.push(nextLayerNodes[Math.floor(Math.random() * nextLayerNodes.length)]);
                    }
                }
            });
        }

        function firePulse() {
            const startNodeIndex = Math.floor(Math.random() * layerDefinition[0]);
            const startNode = nodes.find(n => n.layer === 0 && nodes.indexOf(n) === startNodeIndex);
            if (startNode && startNode.connections.length > 0) {
                 const targetNode = startNode.connections[Math.floor(Math.random() * startNode.connections.length)];
                 pulses.push({from: startNode, to: targetNode, progress: 0, speed: 0.006 + Math.random() * 0.006});
            }
        }
        
        function draw() {
            time += 0.01;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = "rgba(77, 136, 255, 0.2)";
            ctx.lineWidth = 1;
            nodes.forEach(node => {node.connections.forEach(targetNode => {ctx.beginPath(); ctx.moveTo(node.x, node.y); ctx.lineTo(targetNode.x, targetNode.y); ctx.stroke();});});
            nodes.forEach(node => {const currentRadius = node.baseRadius + Math.sin(time + node.animOffset) * 1.5; ctx.fillStyle = `rgba(77, 136, 255, ${0.5 + Math.sin(time + node.animOffset) * 0.2})`; ctx.beginPath(); ctx.arc(node.x, node.y, currentRadius, 0, Math.PI * 2); ctx.fill();});
            ctx.fillStyle = "#fff";
            for (let i = pulses.length - 1; i >= 0; i--) {
                const p = pulses[i];
                p.progress += p.speed;
                if (p.progress >= 1) {
                    if (p.to.connections.length > 0) {const nextTarget = p.to.connections[Math.floor(Math.random() * p.to.connections.length)]; pulses.push({ from: p.to, to: nextTarget, progress: 0, speed: p.speed });}
                    pulses.splice(i, 1);
                    continue;
                }
                const currentX = p.from.x + (p.to.x - p.from.x) * p.progress;
                const currentY = p.from.y + (p.to.y - p.from.y) * p.progress;
                ctx.beginPath();
                ctx.arc(currentX, currentY, 3.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.lineWidth = 3;
                ctx.strokeStyle = `rgba(255, 255, 255, ${1 - p.progress})`;
                ctx.beginPath();
                ctx.moveTo(p.from.x, p.from.y);
                ctx.lineTo(currentX, currentY);
                ctx.stroke();
            }
            requestAnimationFrame(draw);
        }
        setupNetwork();
        draw();
        setInterval(firePulse, 200);
        window.addEventListener('resize', setupNetwork);
    }

    // --- Staged Scroll Animation & Header Logic ---
    const siteHeader = document.querySelector('.site-header');
    const heroStickyContent = document.getElementById('hero-sticky-content');
    const heroTitle = document.getElementById('hero-title');
    const heroIntro = document.getElementById('hero-intro');

    function handleScrollAnimation() {
        const scrollPosition = window.scrollY;
        const screenHeight = window.innerHeight;
        if (siteHeader) {
            if (scrollPosition > screenHeight) {
                siteHeader.classList.add('header-visible');
            } else {
                siteHeader.classList.remove('header-visible');
            }
        }
        const scrollProgress = Math.min(1, scrollPosition / screenHeight);
        const phase1Progress = Math.min(1, scrollProgress * 2);
        if (heroTitle && heroIntro) {
            heroTitle.style.opacity = 1 - phase1Progress;
            heroIntro.style.opacity = phase1Progress;
        }
        if (heroStickyContent) {
            if (scrollProgress > 0.5) {
                const phase2Progress = (scrollProgress - 0.5) * 2;
                heroStickyContent.style.opacity = 1 - phase2Progress;
            } else {
                heroStickyContent.style.opacity = 1;
            }
        }
    }
    handleScrollAnimation();
    window.addEventListener('scroll', handleScrollAnimation);

    // --- Carousel Logic ---
    const slider = document.querySelector('.carousel-slider');
    if (slider) {
        const slides = document.querySelectorAll('.slide');
        const prevButton = document.querySelector('.prev');
        const nextButton = document.querySelector('.next');
        let currentIndex = 0;
        const slideCount = slides.length;
        function goToSlide(index) {if (index < 0) {index = slideCount - 1;} else if (index >= slideCount) {index = 0;} slider.style.transform = `translateX(-${index * 100}%)`; currentIndex = index;}
        nextButton.addEventListener('click', () => {goToSlide(currentIndex + 1);});
        prevButton.addEventListener('click', () => {goToSlide(currentIndex - 1);});
        setInterval(() => {goToSlide(currentIndex + 1);}, 4000);
    }
    
    // --- Search Functionality ---
    const searchInput = document.getElementById('game-search-input');
    const gameTiles = document.querySelectorAll('.game-tile');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            gameTiles.forEach(tile => {
                const gameName = tile.dataset.name.toLowerCase();
                if (gameName.includes(searchTerm)) {
                    tile.style.display = 'block';
                } else {
                    tile.style.display = 'none';
                }
            });
        });
    }
});
