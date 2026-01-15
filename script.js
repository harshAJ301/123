// ===== GLOBAL VARIABLES =====
let currentPage = 1;
let totalScore = 0;
let chaosLevel = 0;
let gameActive = true;
let musicOn = true;
let effectsOn = true;
let chaosMode = false;
let backgrounds = [
    "url('https://images.unsplash.com/photo-1511795409834-ef04bbd61622?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')",
    "url('https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')",
    "url('https://images.unsplash.com/photo-1545696563-af8f6ec2295a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')",
    "url('https://images.unsplash.com/photo-1530103862676-de8c9debad1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')",
    "linear-gradient(135deg, #ff6b8b 0%, #a882dd 50%, #ffd166 100%)",
    "url('https://images.unsplash.com/photo-1532117182044-031e7cd916ee?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')"
];

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    // Remove timer elements
    const timerElement = document.querySelector('.timer-container');
    if (timerElement) timerElement.remove();
    
    // Update score position
    document.querySelector('.global-hud').style.left = 'auto';
    document.querySelector('.global-hud').style.right = '20px';
    
    updateChaosMeter();
    rotateBackground();
    createFloatingElements();
    setupMouseEffects();
    
    // Initialize audio immediately (no waiting for click)
    initAudio();
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', handleKeyboard);
    
    // Easter egg: triple click title
    let titleClickCount = 0;
    document.querySelector('.main-title').addEventListener('click', () => {
        titleClickCount++;
        if (titleClickCount >= 3) {
            unlockSecretMode();
            titleClickCount = 0;
        }
    });
    
    // Start balloon launcher
    setInterval(launchBalloon, 2000 + Math.random() * 3000);
    
    // Random surprises
    setInterval(randomSurprise, 20000);
    
    // Force audio on mobile
    document.body.addEventListener('touchstart', function() {
        const bgMusic = document.getElementById('bg-music');
        if (musicOn && bgMusic.paused) {
            bgMusic.play().catch(e => {
                // Show play button if autoplay blocked
                const musicBtn = document.getElementById('music-btn');
                musicBtn.innerHTML = '<i class="fas fa-music"></i> <span>▶️ TAP TO PLAY</span>';
            });
        }
    }, { once: true });
});

// ===== AUDIO SYSTEM - FIXED =====
function initAudio() {
    const bgMusic = document.getElementById('bg-music');
    bgMusic.volume = 0.3;
    
    // Try to play immediately
    const playPromise = bgMusic.play();
    
    if (playPromise !== undefined) {
        playPromise.catch(error => {
            // Autoplay was prevented - show instruction
            console.log("Autoplay prevented, waiting for user interaction");
            const musicBtn = document.getElementById('music-btn');
            musicBtn.innerHTML = '<i class="fas fa-music"></i> <span>▶️ TAP TO PLAY</span>';
            musicBtn.classList.add('pulse-glow');
        });
    }
}

function toggleMusic() {
    const bgMusic = document.getElementById('bg-music');
    const btn = document.getElementById('music-btn');
    
    if (musicOn) {
        bgMusic.pause();
        btn.innerHTML = '<i class="fas fa-music"></i> <span>🔇 OFF</span>';
        btn.classList.remove('pulse-glow');
    } else {
        bgMusic.volume = 0.3;
        bgMusic.play();
        btn.innerHTML = '<i class="fas fa-music"></i> <span>🎵 ON</span>';
        btn.classList.add('pulse-glow');
    }
    
    musicOn = !musicOn;
    playSound('click');
}

function playSound(type) {
    if (!musicOn) return;
    
    const sounds = {
        'click': document.getElementById('click-sound'),
        'pop': document.getElementById('pop-sound'),
        'confetti': document.getElementById('confetti-sound'),
        'cracker': document.getElementById('cracker-sound'),
        'sparkle': document.getElementById('sparkle-sound'),
        'whoosh': document.getElementById('whoosh-sound')
    };
    
    const sound = sounds[type];
    if (sound) {
        sound.currentTime = 0;
        
        // Set appropriate volumes
        const volumes = {
            'click': 0.3,
            'pop': 0.4,
            'confetti': 0.5,
            'cracker': 0.6,
            'sparkle': 0.4,
            'whoosh': 0.5
        };
        
        sound.volume = volumes[type] || 0.3;
        sound.play().catch(e => {
            // Silent fail - don't interrupt experience
        });
    }
}

// ===== PAGE 3: TAP GAME - FIXED =====
let tapCount = 0;
let tapInterval;

function startTapGame() {
    tapCount = 0;
    document.getElementById('tap-count').textContent = '0';
    document.getElementById('game-timer').style.display = 'none'; // Hide timer
    document.getElementById('continue-btn').classList.add('hidden');
    document.getElementById('tap-feedback').textContent = '';
    
    // Remove old timer logic
    clearInterval(tapInterval);
    
    // Reset cake animation
    const cake = document.getElementById('tap-cake');
    cake.style.animation = 'bounce 2s infinite';
}

function tapCake() {
    tapCount++;
    document.getElementById('tap-count').textContent = tapCount;
    playSound('pop'); // Balloon pop sound for tapping
    
    // Visual effects
    const cake = document.getElementById('tap-cake');
    cake.style.transform = 'scale(0.9)';
    setTimeout(() => cake.style.transform = 'scale(1)', 100);
    
    createExplosion(
        cake.offsetLeft + cake.offsetWidth/2,
        cake.offsetTop + cake.offsetHeight/2,
        '#ffd166',
        15
    );
    
    // Add score
    addScore(10);
    
    // Check if completed
    if (tapCount >= 15) {
        winTapGame();
    }
    
    // Random feedback
    if (tapCount % 5 === 0) {
        const feedbacks = ['🔥 Hot streak!', '⚡ Lightning fast!', '🎯 Bullseye!', '🚀 Keep going!'];
        showFloatingText(feedbacks[Math.floor(Math.random() * feedbacks.length)]);
    }
}

// ===== ENHANCED FINAL PAGE WITH CRACKERS =====
function setupFinalPage() {
    candlesBlown = 0;
    document.querySelectorAll('.candle').forEach(candle => {
        candle.classList.add('active');
    });
    document.getElementById('final-celebration').classList.add('hidden');
    
    // Update final stats
    document.getElementById('final-score').textContent = totalScore;
    
    // Calculate taps per second from earlier
    const tapsPerSec = document.getElementById('tap-speed').textContent || '0';
    document.getElementById('final-speed').textContent = tapsPerSec;
    document.getElementById('chaos-level').textContent = chaosLevel + '%';
    
    // Add virtual crackers
    createCrackers();
    
    // Setup spacebar for blowing candles
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            blowAllCandles();
        }
    });
}

function createCrackers() {
    const container = document.querySelector('.celebration-container');
    const crackers = ['🎇', '🎆', '✨', '💥', '🔥', '⭐'];
    
    // Create 6 crackers around the cake
    for (let i = 0; i < 6; i++) {
        const cracker = document.createElement('div');
        cracker.className = 'virtual-cracker';
        cracker.textContent = crackers[i % crackers.length];
        cracker.style.cssText = `
            position: absolute;
            font-size: 2rem;
            cursor: pointer;
            animation: floatSlow ${3 + i}s infinite ease-in-out;
            filter: drop-shadow(0 0 10px #ffd166);
            z-index: 100;
        `;
        
        // Position in a circle around cake
        const angle = (i / 6) * Math.PI * 2;
        const radius = 200;
        const x = Math.cos(angle) * radius + window.innerWidth/2;
        const y = Math.sin(angle) * radius + window.innerHeight/2;
        
        cracker.style.left = `${x}px`;
        cracker.style.top = `${y}px`;
        
        // Click to explode cracker
        cracker.addEventListener('click', function() {
            playSound('cracker');
            createCrackerExplosion(x, y);
            this.remove();
            addScore(50);
        });
        
        container.appendChild(cracker);
    }
}

function createCrackerExplosion(x, y) {
    playSound('cracker');
    createExplosion(x, y, '#ffd166', 50);
    shakeScreen(5, 300);
    
    // Show cracker effect text
    showFloatingText('💥 CRACKER!', x, y, '#ff6b8b');
    
    // Extra sparkles
    for (let i = 0; i < 10; i++) {
        setTimeout(() => {
            createParticles(x, y, ['#ff6b8b', '#ffd166', '#ffffff'][i % 3], 5);
        }, i * 50);
    }
}

function blowCandle(candleNum) {
    if (candlesBlown >= 8) return;
    
    const candle = document.getElementById(`candle${candleNum}`);
    if (!candle.classList.contains('active')) return;
    
    candle.classList.remove('active');
    playSound('pop'); // Balloon pop sound for candles
    
    // Visual effect
    createExplosion(
        candle.offsetLeft + candle.offsetWidth/2,
        candle.offsetTop,
        '#ffd166',
        20
    );
    
    // Add score
    addScore(25);
    
    // Check if all candles blown
    if (candlesBlown >= 8) {
        finishCelebration();
    }
}

function finishCelebration() {
    playSound('confetti');
    createConfetti(1000);
    shakeScreen(8, 1500);
    
    // Play multiple cracker sounds
    for (let i = 0; i < 5; i++) {
        setTimeout(() => playSound('cracker'), i * 200);
    }
    
    // Launch final crackers
    for (let i = 0; i < 10; i++) {
        setTimeout(() => {
            createCrackerExplosion(
                window.innerWidth/2 + (Math.random() - 0.5) * 300,
                window.innerHeight/2 + (Math.random() - 0.5) * 300
            );
        }, i * 300);
    }
    
    // Show final message
    setTimeout(() => {
        document.getElementById('final-celebration').classList.remove('hidden');
        addScore(500);
        
        // Big final message
        showFloatingText('🎉 HAPPY BIRTHDAY! 🎉', 
            window.innerWidth/2, 
            window.innerHeight/2,
            '#ffd166');
    }, 2000);
}

// ===== ENHANCED SOUND EFFECTS FOR ELEMENTS =====
function launchBalloon() {
    if (!effectsOn) return;
    
    const container = document.getElementById('floating-container');
    const balloon = document.createElement('div');
    
    // Random balloon type
    const types = [
        { emoji: '🎈', color: '#ff6b8b', size: '40px', sound: 'pop' },
        { emoji: '🎈', color: '#a882dd', size: '35px', sound: 'pop' },
        { emoji: '🎈', color: '#ffd166', size: '45px', sound: 'pop' },
        { emoji: '💝', color: '#ff8fa3', size: '30px', sound: 'sparkle' },
        { emoji: '✨', color: '#ffffff', size: '25px', sound: 'sparkle' }
    ];
    const type = types[Math.floor(Math.random() * types.length)];
    
    balloon.innerHTML = type.emoji;
    balloon.className = 'floating-balloon';
    balloon.style.cssText = `
        position: fixed;
        font-size: ${type.size};
        bottom: -50px;
        left: ${Math.random() * 85}%;
        z-index: 1000;
        filter: drop-shadow(0 0 10px ${type.color});
        cursor: pointer;
        animation: floatUp ${8 + Math.random() * 7}s linear forwards;
        pointer-events: auto;
    `;
    
    container.appendChild(balloon);
    
    // Pop on click with appropriate sound
    balloon.addEventListener('click', () => {
        playSound(type.sound);
        createExplosion(
            balloon.offsetLeft + parseInt(type.size)/2,
            balloon.offsetTop + parseInt(type.size)/2,
            type.color,
            20
        );
        balloon.remove();
        addScore(5);
    });
    
    // Auto-remove after animation
    setTimeout(() => {
        if (balloon.parentNode) {
            balloon.remove();
        }
    }, 15000);
}

function createExplosion(x, y, color = '#ffffff', count = 20) {
    if (!effectsOn) return;
    
    const container = document.getElementById('floating-container');
    
    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: fixed;
            width: 8px;
            height: 8px;
            background: ${color};
            border-radius: 50%;
            left: ${x}px;
            top: ${y}px;
            pointer-events: none;
            z-index: 999;
            opacity: 1;
        `;
        
        container.appendChild(particle);
        
        // Random explosion direction
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 4;
        const dx = Math.cos(angle) * speed;
        const dy = Math.sin(angle) * speed;
        
        let posX = x;
        let posY = y;
        let opacity = 1;
        
        // Animate particle
        function animate() {
            posX += dx;
            posY += dy;
            opacity -= 0.02;
            
            particle.style.left = posX + 'px';
            particle.style.top = posY + 'px';
            particle.style.opacity = opacity;
            
            if (opacity > 0) {
                requestAnimationFrame(animate);
            } else {
                particle.remove();
            }
        }
        
        animate();
    }
    
    // Play appropriate sound based on color/context
    if (color === '#ffd166' || color === '#ffffff') {
        playSound('sparkle');
    } else if (count > 30) {
        playSound('cracker');
    }
}

// ===== REMOVE TIMER FUNCTIONS =====
// Delete these functions entirely:
// startGlobalTimer()
// gameOver()

// Also remove any calls to startGlobalTimer()

// ===== UPDATE PAGE TRANSITIONS =====
function nextPage() {
    if (!gameActive) return;
    
    playSound('whoosh'); // Page transition sound
    
    const currentEl = document.getElementById(`page${currentPage}`);
    currentEl.classList.remove('active');
    
    currentPage++;
    if (currentPage > 8) currentPage = 1;
    
    const nextEl = document.getElementById(`page${currentPage}`);
    nextEl.classList.add('active');
    
    // Add score for progressing
    addScore(50);
    
    // Visual effect
    createParticles(window.innerWidth / 2, window.innerHeight / 2, '#a882dd', 30);
    
    // Start page-specific animations
    setTimeout(() => startPageAnimations(currentPage), 300);
}

// ===== FIXED RANDOM SURPRISE =====
function randomSurprise() {
    if (!effectsOn || Math.random() > 0.5) return;
    
    const surprises = [
        () => {
            playSound('sparkle');
            showFloatingText('✨ SURPRISE! ✨', 
                Math.random() * window.innerWidth,
                Math.random() * window.innerHeight);
        },
        () => {
            playSound('confetti');
            createConfetti(50);
        },
        () => {
            playSound('cracker');
            shakeScreen(3, 300);
            showFloatingText('💥 BOOM!', 
                window.innerWidth/2, 
                window.innerHeight/2);
        },
        () => {
            for (let i = 0; i < 5; i++) {
                setTimeout(() => launchBalloon(), i * 200);
            }
        }
    ];
    
    surprises[Math.floor(Math.random() * surprises.length)]();
}

// ===== ADD CSS FOR CRACKERS =====
const crackerStyle = document.createElement('style');
crackerStyle.textContent = `
    .virtual-cracker {
        transition: transform 0.3s;
    }
    
    .virtual-cracker:hover {
        transform: scale(1.3);
        animation: pulseGlow 0.5s infinite;
    }
    
    @keyframes pulseGlow {
        0%, 100% {
            filter: drop-shadow(0 0 10px #ffd166);
        }
        50% {
            filter: drop-shadow(0 0 20px #ff6b8b);
        }
    }
`;
document.head.appendChild(crackerStyle);

// ===== ENSURE ALL SOUNDS WORK =====
// Preload all sounds on first click
document.addEventListener('click', function preloadSounds() {
    const sounds = [
        'bg-music', 'pop-sound', 'confetti-sound', 
        'click-sound', 'cracker-sound', 'sparkle-sound', 'whoosh-sound'
    ];
    
    sounds.forEach(soundId => {
        const sound = document.getElementById(soundId);
        if (sound) {
            sound.load();
        }
    });
    
    document.removeEventListener('click', preloadSounds);
}, { once: true });
