// ===== PASSWORD CONFIGURATION =====
const CORRECT_PASSWORD = "jenisha"; // All lowercase
let attempts = 0;
const MAX_ATTEMPTS = 5;

// ===== PASSWORD SYSTEM =====
document.addEventListener('DOMContentLoaded', function() {
    // Initialize password system
    setupPasswordSystem();
    
    // Preload main website resources (but don't show yet)
    preloadMainContent();
});

function setupPasswordSystem() {
    const passwordInput = document.getElementById('password-input');
    const submitBtn = document.getElementById('password-submit');
    const errorMsg = document.getElementById('password-error');
    const attemptCount = document.getElementById('attempt-count');
    
    // Update attempt counter
    attemptCount.textContent = attempts;
    
    // Enter key support
    passwordInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            checkPassword();
        }
    });
    
    // Submit button
    submitBtn.addEventListener('click', checkPassword);
    
    // Focus on input
    setTimeout(() => {
        passwordInput.focus();
    }, 500);
    
    // Show/hide password on Alt key
    passwordInput.addEventListener('keydown', function(e) {
        if (e.altKey) {
            this.type = this.type === 'password' ? 'text' : 'password';
            setTimeout(() => {
                this.type = 'password';
            }, 1000);
        }
    });
}

function checkPassword() {
    const passwordInput = document.getElementById('password-input');
    const errorMsg = document.getElementById('password-error');
    const attemptCount = document.getElementById('attempt-count');
    const submitBtn = document.getElementById('password-submit');
    
    const enteredPassword = passwordInput.value.trim().toLowerCase();
    
    if (!enteredPassword) {
        showError("Please enter a password!");
        shakeInput();
        return;
    }
    
    attempts++;
    attemptCount.textContent = attempts;
    
    if (enteredPassword === CORRECT_PASSWORD) {
        // Correct password!
        unlockWebsite();
    } else {
        // Wrong password
        showError(`Incorrect password! Attempt ${attempts}/${MAX_ATTEMPTS}`);
        shakeInput();
        passwordInput.value = '';
        passwordInput.focus();
        
        // Disable after max attempts
        if (attempts >= MAX_ATTEMPTS) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-lock"></i> TOO MANY ATTEMPTS';
            submitBtn.style.opacity = '0.5';
            showError("Too many failed attempts. Refresh page to try again.");
            
            // Add timeout before allowing refresh hint
            setTimeout(() => {
                showError("Too many failed attempts. Refresh the page to try again.");
            }, 2000);
        }
    }
}

function showError(message) {
    const errorMsg = document.getElementById('password-error');
    errorMsg.textContent = message;
    errorMsg.classList.add('show');
    
    // Auto hide after 3 seconds
    setTimeout(() => {
        errorMsg.classList.remove('show');
    }, 3000);
}

function shakeInput() {
    const passwordInput = document.getElementById('password-input');
    passwordInput.style.animation = 'shake 0.5s ease';
    setTimeout(() => {
        passwordInput.style.animation = '';
    }, 500);
}

function unlockWebsite() {
    const passwordScreen = document.getElementById('password-screen');
    const mainContent = document.getElementById('main-content');
    const submitBtn = document.getElementById('password-submit');
    
    // Success animation and sound
    submitBtn.innerHTML = '<i class="fas fa-check"></i> ACCESS GRANTED!';
    submitBtn.style.background = 'linear-gradient(45deg, #06d6a0, #118ab2)';
    
    // Play unlock sound (using click sound)
    playSound('click-sound');
    
    // Create celebration effect
    createPasswordConfetti();
    
    // Hide password screen with delay
    setTimeout(() => {
        passwordScreen.style.opacity = '0';
        
        setTimeout(() => {
            passwordScreen.style.display = 'none';
            mainContent.classList.add('show');
            
            // Initialize main website
            initMainWebsite();
        }, 500);
    }, 1500);
}

function createPasswordConfetti() {
    const canvas = document.createElement('canvas');
    canvas.id = 'password-confetti';
    canvas.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 10001;
    `;
    
    document.body.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const confettiPieces = [];
    const colors = ['#ff6b8b', '#a882dd', '#ffd166', '#06d6a0'];
    
    // Create confetti
    for (let i = 0; i < 80; i++) {
        confettiPieces.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            r: Math.random() * 4 + 2,
            d: Math.random() * 5 + 2,
            color: colors[Math.floor(Math.random() * colors.length)]
        });
    }
    
    // Animate
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        for (let i = 0; i < confettiPieces.length; i++) {
            const p = confettiPieces[i];
            
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
            
            p.y += p.d;
            p.x += Math.sin(p.y * 0.01) * 2;
            
            if (p.y > canvas.height) {
                confettiPieces.splice(i, 1);
                i--;
            }
        }
        
        if (confettiPieces.length > 0) {
            requestAnimationFrame(animate);
        } else {
            // Remove canvas after animation
            setTimeout(() => {
                canvas.remove();
            }, 1000);
        }
    }
    
    animate();
}

function preloadMainContent() {
    // Preload audio files for faster loading after unlock
    const audioFiles = [
        'https://assets.mixkit.co/music/preview/mixkit-happy-day-583.mp3',
        'https://assets.mixkit.co/sfx/preview/mixkit-balloon-pop-2928.mp3',
        'https://assets.mixkit.co/sfx/preview/mixkit-select-click-1109.mp3',
        'https://assets.mixkit.co/sfx/preview/mixkit-party-horn-sound-2927.mp3'
    ];
    
    audioFiles.forEach(url => {
        const audio = new Audio();
        audio.src = url;
        audio.preload = 'auto';
    });
}

// ===== MAIN WEBSITE CODE =====
let currentPage = 1;
let totalPages = 6;
let score = 0;
let musicOn = true;
let effectsOn = true;
let gameActive = true;

function initMainWebsite() {
    // Initialize audio
    initAudio();
    
    // Setup all event listeners
    setupEventListeners();
    
    // Setup games
    setupBalloonGame();
    setupMemoryGame();
    setupCakeCustomization();
    
    // Start background music
    if (musicOn) {
        const bgMusic = document.getElementById('bg-music');
        bgMusic.volume = 0.3;
        bgMusic.play().catch(e => {
            console.log("Autoplay blocked");
        });
    }
}

function initAudio() {
    // Audio already initialized in password unlock
}

function playSound(soundId, volume = 0.5) {
    if (!effectsOn) return;
    
    const sound = document.getElementById(soundId);
    if (sound) {
        sound.currentTime = 0;
        sound.volume = volume;
        sound.play().catch(e => {
            // Silent fail
        });
    }
}

// ===== REST OF YOUR EXISTING CODE =====
// (Copy all the remaining functions from your previous script.js)
// Including: setupEventListeners, goToPage, startPageAnimations,
// balloon game functions, memory game functions, cake customization,
// visual effects, score system, etc.

// Just make sure to replace the original DOMContentLoaded with the new one above

// ===== EVENT LISTENERS FOR MAIN WEBSITE =====
function setupEventListeners() {
    // Music toggle
    document.getElementById('music-toggle').addEventListener('click', function() {
        const bgMusic = document.getElementById('bg-music');
        if (musicOn) {
            bgMusic.pause();
            this.innerHTML = '<i class="fas fa-music"></i> <span>Music: OFF</span>';
        } else {
            bgMusic.volume = 0.3;
            bgMusic.play();
            this.innerHTML = '<i class="fas fa-music"></i> <span>Music: ON</span>';
        }
        musicOn = !musicOn;
        playSound('click-sound');
    });
    
    // Effects toggle
    document.getElementById('fx-toggle').addEventListener('click', function() {
        effectsOn = !effectsOn;
        this.innerHTML = `<i class="fas fa-magic"></i> <span>FX: ${effectsOn ? 'ON' : 'OFF'}</span>`;
        playSound('click-sound');
    });
    
    // Start button
    document.getElementById('start-btn').addEventListener('click', function() {
        playSound('celebration-sound');
        createConfetti(100);
        addScore(100);
        goToPage(2);
    });
    
    // Navigation buttons
    for (let i = 1; i <= 3; i++) {
        const btn = document.getElementById(`next-btn${i}`);
        if (btn) {
            btn.addEventListener('click', () => {
                playSound('click-sound');
                goToPage(currentPage + 1);
            });
        }
    }
    
    // Final reveal
    document.getElementById('final-reveal').addEventListener('click', function() {
        playSound('celebration-sound');
        createConfetti(200);
        goToPage(6);
    });
    
    // Share button
    document.getElementById('share-btn').addEventListener('click', shareResults);
    
    // Play again button
    document.getElementById('play-again-btn').addEventListener('click', restartExperience);
    
    // Celebration buttons
    document.getElementById('confetti-btn').addEventListener('click', () => {
        playSound('celebration-sound');
        createConfetti(150);
        addScore(50);
    });
    
    document.getElementById('dance-btn').addEventListener('click', () => {
        playSound('celebration-sound');
        createConfetti(100);
        addScore(50);
        showFloatingText('💃 Dance Time!');
    });
    
    document.getElementById('cake-btn').addEventListener('click', () => {
        playSound('click-sound');
        createConfetti(100);
        addScore(50);
        showFloatingText('🎂 Cake Time!');
    });
}

// ===== PAGE NAVIGATION =====
function goToPage(pageNum) {
    if (pageNum < 1 || pageNum > totalPages) return;
    
    // Hide current page
    const currentEl = document.getElementById(`page${currentPage}`);
    currentEl.classList.remove('active');
    
    // Show new page
    currentPage = pageNum;
    const newEl = document.getElementById(`page${currentPage}`);
    newEl.classList.add('active');
    
    // Start page animations
    startPageAnimations(pageNum);
}

function startPageAnimations(pageNum) {
    switch(pageNum) {
        case 2:
            startBalloonGame();
            break;
        case 3:
            setupCakeCustomization();
            break;
        case 4:
            startMemoryGame();
            break;
        case 6:
            startFireworks();
            break;
    }
}

// ===== BALLOON GAME =====
let balloonsPopped = 0;
let gameTimer;
let timeLeft = 30;

function setupBalloonGame() {
    const balloonArea = document.getElementById('balloon-area');
    balloonArea.innerHTML = '';
}

function startBalloonGame() {
    balloonsPopped = 0;
    timeLeft = 30;
    
    document.getElementById('pop-count').textContent = '0';
    document.getElementById('game-timer').textContent = timeLeft;
    document.getElementById('pop-feedback').textContent = '';
    
    // Clear existing balloons
    const balloonArea = document.getElementById('balloon-area');
    balloonArea.innerHTML = '';
    
    // Create initial balloons
    for (let i = 0; i < 8; i++) {
        setTimeout(() => createBalloon(), i * 100);
    }
    
    // Start timer
    clearInterval(gameTimer);
    gameTimer = setInterval(() => {
        timeLeft--;
        document.getElementById('game-timer').textContent = timeLeft;
        
        if (timeLeft <= 0) {
            clearInterval(gameTimer);
            endBalloonGame();
        }
    }, 1000);
}

function createBalloon() {
    const balloonArea = document.getElementById('balloon-area');
    if (!balloonArea) return;
    
    const balloon = document.createElement('div');
    balloon.className = 'balloon';
    
    // Random color
    const colors = ['#ff6b8b', '#a882dd', '#ffd166', '#06d6a0'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    balloon.style.background = color;
    
    // Random position
    const row = Math.floor(Math.random() * 3) + 1;
    const col = Math.floor(Math.random() * 5) + 1;
    balloon.style.gridRow = row;
    balloon.style.gridColumn = col;
    
    // Click event
    balloon.addEventListener('click', function() {
        if (!this.classList.contains('popped')) {
            popBalloon(this, color);
        }
    });
    
    balloonArea.appendChild(balloon);
}

function popBalloon(balloon, color) {
    balloon.classList.add('popped');
    playSound('pop-sound');
    
    // Update score
    balloonsPopped++;
    document.getElementById('pop-count').textContent = balloonsPopped;
    addScore(10);
    
    // Check win condition
    if (balloonsPopped >= 15) {
        winBalloonGame();
    }
    
    // Remove balloon after animation
    setTimeout(() => {
        balloon.remove();
        // Create new balloon
        if (gameActive) createBalloon();
    }, 300);
}

function winBalloonGame() {
    clearInterval(gameTimer);
    playSound('celebration-sound');
    
    const bonus = timeLeft * 5;
    addScore(bonus + 100);
    
    const feedback = document.getElementById('pop-feedback');
    feedback.innerHTML = `🎉 POP MASTER! +${bonus} bonus!`;
    feedback.style.color = '#06d6a0';
}

function endBalloonGame() {
    const feedback = document.getElementById('pop-feedback');
    feedback.innerHTML = `⏰ Time's up! Popped: ${balloonsPopped}/15`;
    feedback.style.color = '#ff6b8b';
}

// ===== CAKE CUSTOMIZATION =====
function setupCakeCustomization() {
    const colorOptions = document.querySelectorAll('.color-option');
    const customButtons = document.querySelectorAll('.custom-btn');
    const cakeLayers = document.querySelectorAll('.cake-layer');
    
    let selectedLayer = 1;
    
    // Layer selection
    customButtons.forEach(btn => {
        if (btn.id !== 'add-candle') {
            btn.addEventListener('click', function() {
                selectedLayer = parseInt(this.dataset.layer);
                playSound('click-sound');
                
                // Highlight selected button
                customButtons.forEach(b => b.style.opacity = '0.7');
                this.style.opacity = '1';
            });
        }
    });
    
    // Add candle button
    document.getElementById('add-candle').addEventListener('click', function() {
        playSound('click-sound');
        const cakePreview = document.getElementById('cake-preview');
        const candle = document.createElement('div');
        candle.className = 'candle';
        candle.textContent = '🕯️';
        candle.style.left = `${70 + Math.random() * 60}px`;
        cakePreview.appendChild(candle);
        addScore(20);
    });
    
    // Color selection
    colorOptions.forEach(option => {
        option.addEventListener('click', function() {
            const color = this.dataset.color;
            if (selectedLayer >= 1 && selectedLayer <= 3) {
                cakeLayers[selectedLayer - 1].style.background = color;
                playSound('click-sound');
                addScore(10);
            }
        });
    });
}

// ===== MEMORY GAME =====
let memoryCards = [];
let flippedCards = [];
let matchedPairs = 0;
let moves = 0;

function setupMemoryGame() {
    // Create card pairs
    const symbols = ['🎂', '🎁', '🎈', '✨', '🥳', '🎉'];
    memoryCards = [...symbols, ...symbols];
    
    // Shuffle
    for (let i = memoryCards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [memoryCards[i], memoryCards[j]] = [memoryCards[j], memoryCards[i]];
    }
}

function startMemoryGame() {
    const grid = document.getElementById('memory-grid');
    grid.innerHTML = '';
    flippedCards = [];
    matchedPairs = 0;
    moves = 0;
    
    document.getElementById('match-count').textContent = '0';
    document.getElementById('move-count').textContent = '0';
    
    // Create cards
    memoryCards.forEach((symbol, index) => {
        const card = document.createElement('div');
        card.className = 'memory-card';
        card.dataset.index = index;
        
        const front = document.createElement('div');
        front.className = 'front';
        front.textContent = '?';
        
        const back = document.createElement('div');
        back.className = 'back';
        back.textContent = symbol;
        
        card.appendChild(front);
        card.appendChild(back);
        
        card.addEventListener('click', () => flipCard(card));
        grid.appendChild(card);
    });
}

function flipCard(card) {
    if (flippedCards.length >= 2 || card.classList.contains('flipped')) return;
    
    playSound('click-sound');
    card.classList.add('flipped');
    flippedCards.push(card);
    
    if (flippedCards.length === 2) {
        moves++;
        document.getElementById('move-count').textContent = moves;
        
        const [card1, card2] = flippedCards;
        const match = card1.querySelector('.back').textContent === card2.querySelector('.back').textContent;
        
        if (match) {
            // Match found
            setTimeout(() => {
                card1.classList.add('matched');
                card2.classList.add('matched');
                playSound('celebration-sound');
                matchedPairs++;
                document.getElementById('match-count').textContent = matchedPairs;
                addScore(50);
                
                flippedCards = [];
                
                if (matchedPairs === 6) {
                    winMemoryGame();
                }
            }, 500);
        } else {
            // No match
            setTimeout(() => {
                card1.classList.remove('flipped');
                card2.classList.remove('flipped');
                flippedCards = [];
            }, 1000);
        }
    }
}

function winMemoryGame() {
    playSound('celebration-sound');
    createConfetti(150);
    addScore(200);
}

// ===== VISUAL EFFECTS =====
function createConfetti(count = 100) {
    if (!effectsOn) return;
    
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const confetti = [];
    const colors = ['#ff6b8b', '#a882dd', '#ffd166', '#06d6a0'];
    
    // Create confetti
    for (let i = 0; i < Math.min(count, 100); i++) {
        confetti.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            r: Math.random() * 4 + 2,
            d: Math.random() * 5 + 2,
            color: colors[Math.floor(Math.random() * colors.length)]
        });
    }
    
    // Animate
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        for (let i = 0; i < confetti.length; i++) {
            const p = confetti[i];
            
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
            
            p.y += p.d;
            p.x += Math.sin(p.y * 0.01) * 2;
            
            if (p.y > canvas.height) {
                confetti.splice(i, 1);
                i--;
            }
        }
        
        if (confetti.length > 0) {
            requestAnimationFrame(animate);
        }
    }
    
    animate();
}

function showFloatingText(text) {
    if (!effectsOn) return;
    
    const floatText = document.createElement('div');
    floatText.textContent = text;
    floatText.style.cssText = `
        position: fixed;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        color: #ffd166;
        font-size: 2rem;
        font-weight: bold;
        pointer-events: none;
        z-index: 1000;
        animation: floatUp 1s ease-out forwards;
    `;
    
    document.body.appendChild(floatText);
    
    setTimeout(() => floatText.remove(), 1000);
}

// Add floating animation CSS
const floatStyle = document.createElement('style');
floatStyle.textContent = `
    @keyframes floatUp {
        0% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
        }
        100% {
            opacity: 0;
            transform: translate(-50%, -150px) scale(1.5);
        }
    }
`;
document.head.appendChild(floatStyle);

function startFireworks() {
    if (!effectsOn) return;
    
    const container = document.getElementById('fireworks');
    if (!container) return;
    
    // Simple fireworks
    const fireworksInterval = setInterval(() => {
        if (!effectsOn || currentPage !== 6) {
            clearInterval(fireworksInterval);
            return;
        }
        
        const x = Math.random() * window.innerWidth;
        const y = Math.random() * window.innerHeight * 0.7;
        const color = ['#ff6b8b', '#a882dd', '#ffd166'][Math.floor(Math.random() * 3)];
        
        // Create simple firework effect
        const canvas = document.getElementById('confetti-canvas');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();
            
            // Fade out
            setTimeout(() => {
                ctx.clearRect(x - 10, y - 10, 20, 20);
            }, 500);
        }
    }, 1000);
}

// ===== SCORE SYSTEM =====
function addScore(points) {
    score += points;
    document.getElementById('score').textContent = score;
    
    // Update final score display
    const finalScoreEl = document.getElementById('final-score');
    if (finalScoreEl) {
        finalScoreEl.textContent = score;
    }
}

// ===== UTILITY FUNCTIONS =====
function shareResults() {
    const text = `I scored ${score} points in Jenisha's Birthday Celebration! 🎉`;
    
    if (navigator.share) {
        navigator.share({
            title: 'Birthday Celebration',
            text: text,
            url: window.location.href
        });
    } else {
        navigator.clipboard.writeText(text + '\n' + window.location.href);
        showFloatingText('Copied to clipboard!');
    }
}

function restartExperience() {
    // Reset scores
    score = 0;
    balloonsPopped = 0;
    matchedPairs = 0;
    moves = 0;
    
    // Update UI
    document.getElementById('score').textContent = '0';
    
    // Go to first page
    goToPage(1);
    
    // Restart music
    if (musicOn) {
        const bgMusic = document.getElementById('bg-music');
        bgMusic.currentTime = 0;
        bgMusic.play();
    }
    
    playSound('celebration-sound');
    createConfetti(100);
}

// ===== WINDOW RESIZE =====
window.addEventListener('resize', function() {
    const canvas = document.getElementById('confetti-canvas');
    if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
});
