// ===== PASSWORD SYSTEM =====
const CORRECT_PASSWORD = "jenisha";
let attempts = 0;
const MAX_ATTEMPTS = 5;
let totalScore = 0;
let musicEnabled = true;
let soundEnabled = true;

// ===== GAME STATE VARIABLES =====
let currentPage = 1;
const totalPages = 7;

// Game 1: Cake Defense
let game1Score = 0;
let game1Lives = 3;
let game1Time = 60;
let game1Interval;
let game1Enemies = [];
let game1Active = false;

// Game 2: Gift Stacker
let game2Score = 0;
let game2Height = 0;
let game2Combo = 1;
let game2Interval;
let currentGift = null;
let stackedGifts = [];
let game2Active = false;

// Game 3: Party Photographer
let game3Score = 0;
let game3Photos = 0;
let game3Accuracy = 100;
let game3Interval;
let currentGuests = [];
let game3Active = false;

// Game 4: Dance Floor
let game4Score = 0;
let game4Streak = 0;
let game4Accuracy = 100;
let game4Interval;
let danceSequence = [];
let currentDanceStep = 0;
let game4Active = false;

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    console.log("Website loaded!");
    setupPasswordSystem();
    preloadAudio();
    
    // Set up floating elements
    setupFloatingElements();
    
    // Set up event listeners for password
    document.getElementById('password-submit').addEventListener('click', checkPassword);
    document.getElementById('password-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') checkPassword();
    });
    
    // Initialize games setup
    setupGameButtons();
});

function setupPasswordSystem() {
    const passwordInput = document.getElementById('password-input');
    if (passwordInput) {
        passwordInput.focus();
        
        // Allow viewing password on Alt key
        passwordInput.addEventListener('keydown', function(e) {
            if (e.altKey) {
                this.type = this.type === 'password' ? 'text' : 'password';
                setTimeout(() => {
                    this.type = 'password';
                }, 1000);
            }
        });
    }
}

function preloadAudio() {
    const audioElements = [
        'bg-music', 'click-sound', 'pop-sound', 
        'success-sound', 'celebration-sound', 'camera-sound'
    ];
    
    audioElements.forEach(id => {
        const audio = document.getElementById(id);
        if (audio) {
            audio.load();
            audio.volume = 0.5;
        }
    });
}

function setupFloatingElements() {
    const bg = document.getElementById('floating-bg');
    if (!bg) return;
    
    // Create floating elements
    for (let i = 0; i < 15; i++) {
        const element = document.createElement('div');
        element.className = 'floating-element';
        element.innerHTML = ['🎂', '🎁', '🎈', '✨', '🎮', '🎉', '🥳', '🎊'][i % 8];
        element.style.cssText = `
            top: ${Math.random() * 100}%;
            left: ${Math.random() * 100}%;
            animation-delay: ${Math.random() * 15}s;
            font-size: ${2 + Math.random() * 2}rem;
            opacity: ${0.1 + Math.random() * 0.3};
        `;
        bg.appendChild(element);
    }
}

// ===== PASSWORD CHECK =====
function checkPassword() {
    const passwordInput = document.getElementById('password-input');
    const errorMsg = document.getElementById('password-error');
    const submitBtn = document.getElementById('password-submit');
    const attemptCount = document.getElementById('attempt-count');
    
    if (!passwordInput || !errorMsg || !submitBtn || !attemptCount) {
        console.error("Password elements not found!");
        return;
    }
    
    const enteredPassword = passwordInput.value.trim().toLowerCase();
    
    if (!enteredPassword) {
        showPasswordError("Please enter a password!");
        shakeElement(passwordInput);
        return;
    }
    
    attempts++;
    attemptCount.textContent = attempts;
    
    if (enteredPassword === CORRECT_PASSWORD) {
        // Correct password - unlock website
        unlockWebsite();
    } else {
        // Wrong password
        showPasswordError(`Incorrect! Attempts: ${attempts}/${MAX_ATTEMPTS}`);
        shakeElement(passwordInput);
        passwordInput.value = '';
        passwordInput.focus();
        
        if (attempts >= MAX_ATTEMPTS) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-lock"></i> TOO MANY ATTEMPTS';
            submitBtn.style.opacity = '0.5';
            showPasswordError("Too many failed attempts. Refresh page.");
        }
    }
}

function showPasswordError(message) {
    const errorMsg = document.getElementById('password-error');
    if (errorMsg) {
        errorMsg.textContent = message;
        errorMsg.classList.add('show');
        
        setTimeout(() => {
            errorMsg.classList.remove('show');
        }, 3000);
    }
}

function shakeElement(element) {
    if (!element) return;
    element.style.animation = 'shake 0.5s ease';
    setTimeout(() => {
        element.style.animation = '';
    }, 500);
}

function unlockWebsite() {
    const passwordScreen = document.getElementById('password-screen');
    const mainContent = document.getElementById('main-content');
    const submitBtn = document.getElementById('password-submit');
    
    if (!passwordScreen || !mainContent || !submitBtn) {
        console.error("Unlock elements not found!");
        return;
    }
    
    // Play success sound
    playSound('success-sound', 0.7);
    
    // Update button to show success
    submitBtn.innerHTML = '<i class="fas fa-check"></i> ACCESS GRANTED!';
    submitBtn.style.background = 'linear-gradient(45deg, #06d6a0, #118ab2)';
    
    // Create confetti celebration
    createConfetti(200);
    
    // Hide password screen
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

// ===== MAIN WEBSITE INITIALIZATION =====
function initMainWebsite() {
    console.log("Initializing main website...");
    setupEventListeners();
    
    // Start background music
    if (musicEnabled) {
        const bgMusic = document.getElementById('bg-music');
        if (bgMusic) {
            bgMusic.volume = 0.3;
            bgMusic.play().catch(e => {
                console.log("Audio autoplay blocked:", e);
                // Add click-to-play fallback
                document.addEventListener('click', function startMusicOnce() {
                    bgMusic.play();
                    document.removeEventListener('click', startMusicOnce);
                }, { once: true });
            });
        }
    }
    
    // Set initial score
    updateGlobalScore();
}

function setupEventListeners() {
    console.log("Setting up event listeners...");
    
    // Music toggle
    const musicToggle = document.getElementById('music-toggle');
    if (musicToggle) {
        musicToggle.addEventListener('click', function() {
            const bgMusic = document.getElementById('bg-music');
            if (!bgMusic) return;
            
            if (musicEnabled) {
                bgMusic.pause();
                this.innerHTML = '<i class="fas fa-music"></i> <span>MUSIC: OFF</span>';
            } else {
                bgMusic.volume = 0.3;
                bgMusic.play().catch(e => console.log("Music play error:", e));
                this.innerHTML = '<i class="fas fa-music"></i> <span>MUSIC: ON</span>';
            }
            musicEnabled = !musicEnabled;
            playSound('click-sound');
        });
    }
    
    // Sound toggle
    const soundToggle = document.getElementById('sound-toggle');
    if (soundToggle) {
        soundToggle.addEventListener('click', function() {
            soundEnabled = !soundEnabled;
            this.innerHTML = `<i class="fas fa-volume-up"></i> <span>SOUND: ${soundEnabled ? 'ON' : 'OFF'}</span>`;
            playSound('click-sound');
        });
    }
    
    // Start game button
    const startGameBtn = document.getElementById('start-game-btn');
    if (startGameBtn) {
        startGameBtn.addEventListener('click', function() {
            playSound('celebration-sound');
            createConfetti(100);
            addToScore(100);
            goToPage(2);
        });
    }
    
    // Share button
    const shareBtn = document.getElementById('share-btn');
    if (shareBtn) {
        shareBtn.addEventListener('click', shareResults);
    }
    
    // Setup page navigation
    setupPageNavigation();
    
    // Keyboard navigation
    document.addEventListener('keydown', handleKeyboard);
}

function setupGameButtons() {
    console.log("Setting up game buttons...");
    
    // Game 1 buttons
    const game1Start = document.getElementById('game1-start');
    if (game1Start) {
        game1Start.addEventListener('click', startGame1);
    }
    
    // Game 2 buttons
    const game2Start = document.getElementById('game2-start');
    if (game2Start) {
        game2Start.addEventListener('click', startGame2);
    }
    
    const moveLeftBtn = document.getElementById('move-left');
    if (moveLeftBtn) {
        moveLeftBtn.addEventListener('click', () => moveGift('left'));
    }
    
    const moveRightBtn = document.getElementById('move-right');
    if (moveRightBtn) {
        moveRightBtn.addEventListener('click', () => moveGift('right'));
    }
    
    const dropGiftBtn = document.getElementById('drop-gift');
    if (dropGiftBtn) {
        dropGiftBtn.addEventListener('click', dropGift);
    }
    
    // Game 3 buttons
    const game3Start = document.getElementById('game3-start');
    if (game3Start) {
        game3Start.addEventListener('click', startGame3);
    }
    
    const captureBtn = document.getElementById('capture-btn');
    if (captureBtn) {
        captureBtn.addEventListener('click', capturePhoto);
    }
    
    // Game 4 buttons
    const game4Start = document.getElementById('game4-start');
    if (game4Start) {
        game4Start.addEventListener('click', startGame4);
    }
    
    // Celebration buttons
    const fireworksBtn = document.getElementById('fireworks-btn');
    if (fireworksBtn) {
        fireworksBtn.addEventListener('click', startFireworks);
    }
    
    const musicBtn = document.getElementById('music-btn');
    if (musicBtn) {
        musicBtn.addEventListener('click', playBirthdayMusic);
    }
}

function setupPageNavigation() {
    // Setup next/previous buttons if they exist
    const nextButtons = document.querySelectorAll('.nav-btn.next:not([onclick])');
    nextButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const currentPage = getCurrentPage();
            if (currentPage < totalPages) {
                goToPage(currentPage + 1);
            }
        });
    });
    
    const prevButtons = document.querySelectorAll('.nav-btn.prev:not([onclick])');
    prevButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const currentPage = getCurrentPage();
            if (currentPage > 1) {
                goToPage(currentPage - 1);
            }
        });
    });
}

function getCurrentPage() {
    for (let i = 1; i <= totalPages; i++) {
        const page = document.getElementById(`page${i}`);
        if (page && page.classList.contains('active')) {
            return i;
        }
    }
    return 1;
}

function handleKeyboard(e) {
    // Arrow keys for navigation
    if (e.key === 'ArrowRight' && currentPage < totalPages) {
        goToPage(currentPage + 1);
    } else if (e.key === 'ArrowLeft' && currentPage > 1) {
        goToPage(currentPage - 1);
    }
    
    // Game 2 controls
    if (currentPage === 3 && game2Active) {
        if (e.key === 'ArrowLeft') moveGift('left');
        if (e.key === 'ArrowRight') moveGift('right');
        if (e.key === ' ' || e.key === 'ArrowDown') {
            e.preventDefault();
            dropGift();
        }
    }
    
    // Game 4 controls
    if (currentPage === 5 && game4Active) {
        const arrowKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
        if (arrowKeys.includes(e.key)) {
            e.preventDefault();
            handleDanceInput(e.key.replace('Arrow', '').toLowerCase());
        }
    }
}

// ===== PAGE NAVIGATION =====
function goToPage(pageNum) {
    if (pageNum < 1 || pageNum > totalPages) return;
    
    // Stop any running games
    stopAllGames();
    
    // Hide current page
    const currentEl = document.getElementById(`page${currentPage}`);
    if (currentEl) currentEl.classList.remove('active');
    
    // Show new page
    currentPage = pageNum;
    const newEl = document.getElementById(`page${currentPage}`);
    if (newEl) newEl.classList.add('active');
    
    // Play click sound
    playSound('click-sound');
    
    // Scroll to top
    window.scrollTo(0, 0);
    
    // Start page-specific setup
    setupPage(pageNum);
}

function setupPage(pageNum) {
    console.log(`Setting up page ${pageNum}`);
    switch(pageNum) {
        case 2: // Cake Defense
            setupGame1();
            break;
        case 3: // Gift Stacker
            setupGame2();
            break;
        case 4: // Party Photographer
            setupGame3();
            break;
        case 5: // Dance Floor
            setupGame4();
            break;
        case 6: // Celebration
            showFinalScore();
            break;
        case 7: // Final
            // Final page setup if needed
            break;
    }
}

function stopAllGames() {
    clearInterval(game1Interval);
    clearInterval(game2Interval);
    clearInterval(game3Interval);
    clearInterval(game4Interval);
    
    game1Active = false;
    game2Active = false;
    game3Active = false;
    game4Active = false;
}

// ===== GAME 1: CAKE DEFENSE =====
function setupGame1() {
    // Reset game state
    game1Score = 0;
    game1Lives = 3;
    game1Time = 60;
    game1Enemies = [];
    
    // Update UI
    updateGame1UI();
    
    // Clear game area
    const gameArea = document.getElementById('game1-area');
    if (gameArea) {
        const enemies = gameArea.querySelectorAll('.enemy');
        enemies.forEach(enemy => enemy.remove());
        
        // Setup click handler for game area
        gameArea.addEventListener('click', handleCakeClick);
    }
}

function startGame1() {
    if (game1Active) return;
    
    game1Active = true;
    const startBtn = document.getElementById('game1-start');
    const feedback = document.getElementById('game1-feedback');
    
    if (startBtn) startBtn.disabled = true;
    if (feedback) {
        feedback.textContent = 'Game started! Defend the cake!';
        feedback.className = 'game-feedback feedback-success';
    }
    
    // Start game timer
    game1Interval = setInterval(updateGame1, 1000);
    
    // Start spawning enemies
    spawnEnemy();
    const enemyInterval = setInterval(() => {
        if (game1Active && game1Time > 0) {
            spawnEnemy();
        } else {
            clearInterval(enemyInterval);
        }
    }, 800);
}

// ... [Rest of the game functions remain the same as your original code] ...

// ===== UTILITY FUNCTIONS =====
function playSound(soundId, volume = 0.5) {
    if (!soundEnabled) return;
    
    const sound = document.getElementById(soundId);
    if (sound) {
        try {
            sound.currentTime = 0;
            sound.volume = volume;
            sound.play().catch(e => {
                console.log("Audio play failed:", e);
            });
        } catch (e) {
            console.log("Sound error:", e);
        }
    }
}

function addToScore(points) {
    totalScore += points;
    updateGlobalScore();
    
    // Animate score update
    const scoreDisplay = document.getElementById('global-score');
    if (scoreDisplay) {
        scoreDisplay.style.transform = 'scale(1.3)';
        scoreDisplay.style.color = '#ffd166';
        
        setTimeout(() => {
            scoreDisplay.style.transform = 'scale(1)';
            scoreDisplay.style.color = '';
        }, 300);
    }
}

function updateGlobalScore() {
    const scoreElements = [
        'global-score',
        'total-score',
        'total-points'
    ];
    
    scoreElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = totalScore;
        }
    });
}

// Add click effect animation to style
function addClickEffectStyle() {
    if (!document.querySelector('#click-effect-style')) {
        const style = document.createElement('style');
        style.id = 'click-effect-style';
        style.textContent = `
            @keyframes clickEffect {
                0% {
                    transform: translate(-50%, -50%) scale(0);
                    opacity: 1;
                }
                100% {
                    transform: translate(-50%, -50%) scale(3);
                    opacity: 0;
                }
            }
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-10px); }
                75% { transform: translateX(10px); }
            }
        `;
        document.head.appendChild(style);
    }
}

// Call this once to add the styles
addClickEffectStyle();

function createClickEffect(x, y, color) {
    const effect = document.createElement('div');
    effect.style.cssText = `
        position: fixed;
        top: ${y}px;
        left: ${x}px;
        width: 20px;
        height: 20px;
        background: ${color};
        border-radius: 50%;
        pointer-events: none;
        z-index: 10000;
        transform: translate(-50%, -50%);
        animation: clickEffect 0.6s ease-out forwards;
    `;
    
    document.body.appendChild(effect);
    
    setTimeout(() => {
        effect.remove();
    }, 600);
}

function createConfetti(count = 100) {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) {
        // Create canvas if it doesn't exist
        const newCanvas = document.createElement('canvas');
        newCanvas.id = 'confetti-canvas';
        newCanvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9999;
        `;
        document.body.appendChild(newCanvas);
        return createConfetti(count); // Recursive call with new canvas
    }
    
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const particles = [];
    const colors = ['#ff6b8b', '#ffd166', '#06d6a0', '#a882dd', '#118ab2'];
    
    // Create particles
    for (let i = 0; i < count; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            size: Math.random() * 10 + 5,
            color: colors[Math.floor(Math.random() * colors.length)],
            speed: Math.random() * 3 + 2,
            rotation: Math.random() * 360,
            rotationSpeed: Math.random() * 10 - 5
        });
    }
    
    let animationId;
    function animateConfetti() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        let particlesAlive = 0;
        
        particles.forEach(particle => {
            particle.y += particle.speed;
            particle.x += Math.sin(particle.y * 0.01);
            particle.rotation += particle.rotationSpeed;
            
            // Draw confetti
            ctx.save();
            ctx.translate(particle.x, particle.y);
            ctx.rotate(particle.rotation * Math.PI / 180);
            ctx.fillStyle = particle.color;
            ctx.fillRect(-particle.size/2, -particle.size/2, particle.size, particle.size);
            ctx.restore();
            
            if (particle.y < canvas.height) {
                particlesAlive++;
            }
        });
        
        if (particlesAlive > 0) {
            animationId = requestAnimationFrame(animateConfetti);
        } else {
            cancelAnimationFrame(animationId);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }
    
    animateConfetti();
}

// ... [Rest of your functions remain the same] ...

// ===== WINDOW RESIZE HANDLER =====
window.addEventListener('resize', () => {
    const canvas = document.getElementById('confetti-canvas');
    if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
});

// ===== DEBUG HELPER =====
// Add this to check if elements exist
function checkElements() {
    const importantElements = [
        'password-screen', 'password-input', 'password-submit',
        'password-error', 'main-content', 'start-game-btn'
    ];
    
    console.log("Checking important elements:");
    importantElements.forEach(id => {
        const el = document.getElementById(id);
        console.log(`${id}:`, el ? 'FOUND' : 'NOT FOUND');
    });
}

// Run check on load
setTimeout(checkElements, 1000);
// ===== MUSIC PLAYER SYSTEM =====
class MusicPlayer {
    constructor() {
        this.bgMusic = document.getElementById('bg-music');
        this.musicEnabled = true;
        this.hasUserInteracted = false;
        
        if (this.bgMusic) {
            this.bgMusic.volume = 1.0;
            this.bgMusic.loop = true;
            
            // Try to preload
            this.bgMusic.load();
            
            // Setup event listeners
            this.setupMusicListeners();
        }
    }
    
    setupMusicListeners() {
        // Music button in control panel
        const musicToggle = document.getElementById('music-toggle');
        if (musicToggle) {
            musicToggle.addEventListener('click', () => this.toggleMusic());
        }
        
        // Enable music button in password screen
        const enableMusicBtn = document.getElementById('enable-music-btn');
        if (enableMusicBtn) {
            enableMusicBtn.addEventListener('click', () => this.startMusicWithInteraction());
        }
        
        // Start music when website unlocks
        const originalUnlockWebsite = unlockWebsite;
        unlockWebsite = () => {
            const result = originalUnlockWebsite.apply(this, arguments);
            setTimeout(() => this.tryStartMusic(), 1000);
            return result;
        };
        
        // Try to start when start button is clicked
        const startBtn = document.getElementById('start-game-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                setTimeout(() => this.tryStartMusic(), 500);
            });
        }
        
        // Try to start on ANY user interaction
        const interactionEvents = ['click', 'touchstart', 'keydown'];
        interactionEvents.forEach(event => {
            document.addEventListener(event, () => {
                if (!this.hasUserInteracted) {
                    this.hasUserInteracted = true;
                    this.tryStartMusic();
                }
            }, { once: false });
        });
    }
    
    startMusicWithInteraction() {
        console.log("User clicked ENABLE MUSIC button");
        this.hasUserInteracted = true;
        
        if (this.bgMusic) {
            this.bgMusic.play().then(() => {
                console.log("Music started successfully via button!");
                this.musicEnabled = true;
                this.updateMusicButton();
                
                // Show success message
                const btn = document.getElementById('enable-music-btn');
                if (btn) {
                    btn.innerHTML = '<i class="fas fa-check"></i> MUSIC ENABLED!';
                    btn.style.background = 'linear-gradient(45deg, #06d6a0, #118ab2)';
                    btn.disabled = true;
                }
                
                // Play celebration sound
                playSound('success-sound', 0.5);
                
            }).catch(error => {
                console.error("Music play failed:", error);
                alert("Couldn't start music. Please allow audio permissions in your browser!");
            });
        }
    }
    
    tryStartMusic() {
        if (!this.bgMusic || !this.musicEnabled || this.bgMusic.played) return;
        
        console.log("Trying to start music...");
        
        this.bgMusic.play().then(() => {
            console.log("Music auto-started!");
            this.updateMusicButton();
        }).catch(error => {
            console.log("Music autoplay blocked, waiting for interaction...", error);
            
            // Show instruction to user
            if (document.getElementById('password-screen') && 
                document.getElementById('password-screen').style.display !== 'none') {
                this.showMusicInstruction();
            }
        });
    }
    
    showMusicInstruction() {
        const musicBox = document.querySelector('.music-permission-box');
        if (musicBox) {
            musicBox.style.animation = 'pulse 2s infinite';
            musicBox.style.borderColor = 'var(--hot-pink)';
        }
    }
    
    toggleMusic() {
        if (!this.bgMusic) return;
        
        if (this.musicEnabled && !this.bgMusic.paused) {
            this.bgMusic.pause();
            this.musicEnabled = false;
        } else {
            this.bgMusic.play().catch(e => {
                console.log("Toggle play failed:", e);
                this.startMusicWithInteraction();
            });
            this.musicEnabled = true;
        }
        
        this.updateMusicButton();
        playSound('click-sound');
    }
    
    updateMusicButton() {
        const musicBtn = document.getElementById('music-toggle');
        if (musicBtn) {
            const isPlaying = this.bgMusic && !this.bgMusic.paused;
            musicBtn.innerHTML = `<i class="fas fa-music"></i> <span>MUSIC: ${isPlaying ? 'ON' : 'OFF'}</span>`;
        }
    }
    
    forcePlayMusic() {
        if (!this.bgMusic) return;
        
        // Stop and restart
        this.bgMusic.pause();
        this.bgMusic.currentTime = 0;
        
        // Small delay then play
        setTimeout(() => {
            this.bgMusic.play().then(() => {
                console.log("Music force-played!");
                this.musicEnabled = true;
                this.updateMusicButton();
            }).catch(e => {
                console.error("Force play failed:", e);
            });
        }, 100);
    }
}

// ===== INITIALIZE MUSIC PLAYER =====
let musicPlayer = null;

document.addEventListener('DOMContentLoaded', function() {
    // Initialize music player
    musicPlayer = new MusicPlayer();
    
    // ... rest of your existing initialization code ...
    
    // Add CSS animation for pulse effect
    if (!document.querySelector('#music-animations')) {
        const style = document.createElement('style');
        style.id = 'music-animations';
        style.textContent = `
            @keyframes pulse {
                0% { box-shadow: 0 0 0 0 rgba(0, 255, 255, 0.7); }
                70% { box-shadow: 0 0 0 10px rgba(0, 255, 255, 0); }
                100% { box-shadow: 0 0 0 0 rgba(0, 255, 255, 0); }
            }
        `;
        document.head.appendChild(style);
    }
});
// ===== EMERGENCY MUSIC START =====
function emergencyStartMusic() {
    console.log("EMERGENCY: Starting music...");
    
    // Create a visible button for music start
    const musicBtn = document.createElement('button');
    musicBtn.innerHTML = '🎵 CLICK TO START MUSIC 🎵';
    musicBtn.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: linear-gradient(45deg, #ff00aa, #00ffff);
        color: white;
        border: none;
        padding: 15px 25px;
        border-radius: 25px;
        font-size: 1.2rem;
        font-weight: bold;
        cursor: pointer;
        z-index: 10000;
        box-shadow: 0 10px 30px rgba(255, 0, 170, 0.5);
        animation: pulse 2s infinite;
    `;
    
    musicBtn.onclick = function() {
        const bgMusic = document.getElementById('bg-music');
        if (bgMusic) {
            bgMusic.volume = 1.0;
            bgMusic.play().then(() => {
                console.log("Emergency music started!");
                musicBtn.innerHTML = '🎵 MUSIC PLAYING! 🎵';
                musicBtn.style.background = 'linear-gradient(45deg, #06d6a0, #118ab2)';
                musicBtn.disabled = true;
                
                setTimeout(() => {
                    musicBtn.remove();
                }, 3000);
            }).catch(e => {
                console.error("Still can't play:", e);
                musicBtn.innerHTML = '❌ PERMISSION DENIED';
                musicBtn.style.background = 'linear-gradient(45deg, #ff0000, #ff9500)';
            });
        }
    };
    
    document.body.appendChild(musicBtn);
    
    // Auto-remove after 30 seconds
    setTimeout(() => {
        if (musicBtn.parentNode) {
            musicBtn.remove();
        }
    }, 30000);
}

// Call this if music doesn't start after 5 seconds
setTimeout(() => {
    const bgMusic = document.getElementById('bg-music');
    if (bgMusic && bgMusic.paused) {
        emergencyStartMusic();
    }
}, 5000);
