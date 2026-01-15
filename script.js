// ===== GLOBAL VARIABLES =====
let currentPage = 1;
let totalPages = 8;
let score = 0;
let musicOn = true;
let effectsOn = true;
let balloonsPopped = 0;
let balloonsTotal = 20;
let memoryMatches = 0;
let quizScore = 0;
let gameActive = true;

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    // Initialize audio
    initAudio();
    
    // Setup event listeners
    setupEventListeners();
    
    // Start floating emojis
    startFloatingEmojis();
    
    // Setup games
    setupBalloonGame();
    setupMemoryGame();
    setupQuiz();
    
    // Force audio on mobile
    document.body.addEventListener('touchstart', function initMobileAudio() {
        const bgMusic = document.getElementById('bg-music');
        if (musicOn && bgMusic.paused) {
            bgMusic.play().catch(e => {
                console.log("Audio play failed, user needs to interact");
            });
        }
        document.body.removeEventListener('touchstart', initMobileAudio);
    });
    
    // Easter egg: Click birthday name 3 times
    let clickCount = 0;
    document.querySelector('.friend-name').addEventListener('click', function() {
        clickCount++;
        if (clickCount >= 3) {
            unlockSecretMode();
            clickCount = 0;
        }
    });
    
    // Preload sounds
    preloadSounds();
});

// ===== AUDIO SYSTEM =====
function initAudio() {
    const bgMusic = document.getElementById('bg-music');
    bgMusic.volume = 0.3;
    
    // Try to play immediately
    const playPromise = bgMusic.play();
    
    if (playPromise !== undefined) {
        playPromise.catch(error => {
            // Show play button if autoplay blocked
            const musicBtn = document.getElementById('music-toggle');
            musicBtn.innerHTML = '<i class="fas fa-music"></i> <span>▶️ TAP TO PLAY</span>';
            musicBtn.classList.add('pulse');
        });
    }
}

function preloadSounds() {
    const sounds = ['pop-sound', 'confetti-sound', 'click-sound', 'success-sound', 'celebrate-sound'];
    sounds.forEach(soundId => {
        const sound = document.getElementById(soundId);
        if (sound) {
            sound.load();
        }
    });
}

function playSound(soundId, volume = 0.5) {
    if (!effectsOn) return;
    
    const sound = document.getElementById(soundId);
    if (sound) {
        sound.currentTime = 0;
        sound.volume = volume;
        sound.play().catch(e => {
            // Silent fail - don't interrupt experience
        });
    }
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    // Music toggle
    document.getElementById('music-toggle').addEventListener('click', function() {
        const bgMusic = document.getElementById('bg-music');
        if (musicOn) {
            bgMusic.pause();
            this.innerHTML = '<i class="fas fa-music"></i> <span>🔇 OFF</span>';
            this.classList.remove('pulse');
        } else {
            bgMusic.volume = 0.3;
            bgMusic.play();
            this.innerHTML = '<i class="fas fa-music"></i> <span>🎵 ON</span>';
            this.classList.add('pulse');
        }
        musicOn = !musicOn;
        playSound('click-sound', 0.3);
    });
    
    // Effects toggle
    document.getElementById('fx-toggle').addEventListener('click', function() {
        if (effectsOn) {
            effectsOn = false;
            this.innerHTML = '<i class="fas fa-magic"></i> <span>✨ OFF</span>';
        } else {
            effectsOn = true;
            this.innerHTML = '<i class="fas fa-magic"></i> <span>✨ ON</span>';
        }
        playSound('click-sound', 0.3);
    });
    
    // Start button
    document.getElementById('start-btn').addEventListener('click', function() {
        playSound('confetti-sound', 0.6);
        createConfetti(200);
        shakeScreen(5, 500);
        addScore(100);
        
        // Launch extra effects
        for (let i = 0; i < 5; i++) {
            setTimeout(() => createBalloon(), i * 100);
        }
        
        setTimeout(() => {
            goToPage(2);
        }, 1000);
    });
    
    // Next buttons
    document.querySelectorAll('.next-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            playSound('click-sound', 0.3);
            createParticleEffect(this);
            
            const currentPageNum = parseInt(this.closest('.page').id.replace('page', ''));
            goToPage(currentPageNum + 1);
        });
    });
    
    // Final reveal button
    document.getElementById('final-reveal')?.addEventListener('click', function() {
        playSound('celebrate-sound', 0.7);
        createConfetti(500);
        shakeScreen(8, 1000);
        
        // Launch fireworks
        startFireworks();
        
        setTimeout(() => {
            goToPage(8);
        }, 1500);
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
        switch(e.key) {
            case 'ArrowRight':
                e.preventDefault();
                if (currentPage < totalPages) goToPage(currentPage + 1);
                break;
            case 'ArrowLeft':
                e.preventDefault();
                if (currentPage > 1) goToPage(currentPage - 1);
                break;
            case ' ':
                e.preventDefault();
                if (currentPage === 3) popRandomBalloon();
                break;
            case 'm':
            case 'M':
                document.getElementById('music-toggle').click();
                break;
        }
    });
}

// ===== PAGE NAVIGATION =====
function goToPage(pageNumber) {
    if (pageNumber < 1 || pageNumber > totalPages || !gameActive) return;
    
    // Hide current page
    const currentPageEl = document.getElementById(`page${currentPage}`);
    currentPageEl.classList.remove('active');
    
    // Show new page
    currentPage = pageNumber;
    const newPageEl = document.getElementById(`page${currentPage}`);
    newPageEl.classList.add('active');
    
    playSound('click-sound', 0.3);
    createPageTransitionEffect();
    
    // Start page-specific animations
    startPageAnimations(pageNumber);
}

function createPageTransitionEffect() {
    if (!effectsOn) return;
    
    // Create particle burst from center
    createExplosion(window.innerWidth / 2, window.innerHeight / 2, '#a882dd', 30);
    
    // Screen fade effect
    document.body.style.animation = 'pageFade 0.5s';
    setTimeout(() => {
        document.body.style.animation = '';
    }, 500);
}

// Add this CSS animation
const pageTransitionStyle = document.createElement('style');
pageTransitionStyle.textContent = `
    @keyframes pageFade {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.8; }
    }
    
    .pulse {
        animation: pulseGlow 2s infinite;
    }
    
    @keyframes pulseGlow {
        0%, 100% { 
            box-shadow: 0 0 10px rgba(255, 107, 139, 0.3);
        }
        50% { 
            box-shadow: 0 0 20px rgba(255, 107, 139, 0.6);
        }
    }
`;
document.head.appendChild(pageTransitionStyle);

// ===== PAGE ANIMATIONS =====
function startPageAnimations(pageNumber) {
    switch(pageNumber) {
        case 2:
            startCountdown();
            break;
        case 3:
            startBalloonGame();
            break;
        case 4:
            setupCakeCustomization();
            break;
        case 5:
            resetMemoryGame();
            break;
        case 6:
            resetQuiz();
            break;
        case 7:
            setupCelebration();
            break;
        case 8:
            setupFinalMessage();
            break;
    }
}

// ===== PAGE 2: COUNTDOWN =====
function startCountdown() {
    const digits = document.querySelectorAll('.count-digit');
    const goText = document.querySelector('.go-text');
    
    // Reset
    digits.forEach(digit => {
        digit.style.opacity = '1';
        digit.style.transform = 'scale(1)';
    });
    goText.classList.add('hidden');
    
    let currentDigit = 0;
    
    const countdownInterval = setInterval(() => {
        if (currentDigit < digits.length) {
            // Animate current digit
            const digit = digits[currentDigit];
            playSound('click-sound', 0.4);
            
            digit.style.animation = 'countPulse 0.5s';
            setTimeout(() => {
                digit.style.animation = '';
            }, 500);
            
            // Hide digit after display
            setTimeout(() => {
                digit.style.opacity = '0';
                digit.style.transform = 'scale(0.5)';
            }, 800);
            
            currentDigit++;
        } else {
            clearInterval(countdownInterval);
            
            // Show GO text
            playSound('confetti-sound', 0.7);
            goText.classList.remove('hidden');
            createConfetti(150);
            shakeScreen(5, 300);
            
            // Auto continue
            setTimeout(() => {
                goToPage(3);
            }, 1500);
        }
    }, 1000);
}

// ===== PAGE 3: BALLOON POP GAME =====
let balloonTimer;
let timeLeft = 30;
let balloons = [];

function setupBalloonGame() {
    const container = document.getElementById('balloon-container');
    container.innerHTML = '';
    balloons = [];
    
    // Create balloons
    for (let i = 0; i < balloonsTotal; i++) {
        setTimeout(() => {
            createBalloon();
        }, i * 300);
    }
}

function createBalloon() {
    if (!gameActive) return;
    
    const container = document.getElementById('balloon-container');
    const balloon = document.createElement('div');
    balloon.className = 'balloon';
    
    // Random properties
    const colors = ['#ff6b8b', '#a882dd', '#ffd166', '#06d6a0', '#ff8fa3'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = 60 + Math.random() * 40;
    const duration = 2 + Math.random() * 3;
    
    balloon.style.background = color;
    balloon.style.width = `${size}px`;
    balloon.style.height = `${size * 1.2}px`;
    balloon.style.animationDuration = `${duration}s`;
    balloon.style.animationDelay = `${Math.random() * 2}s`;
    
    // Position randomly but within grid
    const row = Math.floor(Math.random() * 4);
    const col = Math.floor(Math.random() * 5);
    balloon.style.gridRow = row + 1;
    balloon.style.gridColumn = col + 1;
    
    // Click event
    balloon.addEventListener('click', function() {
        if (!this.classList.contains('popped')) {
            popBalloon(this, color);
        }
    });
    
    container.appendChild(balloon);
    balloons.push(balloon);
}

function popBalloon(balloon, color) {
    if (balloon.classList.contains('popped')) return;
    
    balloon.classList.add('popped');
    playSound('pop-sound', 0.5);
    
    // Visual effects
    createExplosion(
        balloon.offsetLeft + balloon.offsetWidth / 2,
        balloon.offsetTop + balloon.offsetHeight / 2,
        color,
        20
    );
    
    // Update score
    balloonsPopped++;
    document.getElementById('pop-count').textContent = balloonsPopped;
    addScore(10);
    
    // Check win condition
    if (balloonsPopped >= balloonsTotal) {
        winBalloonGame();
    }
    
    // Create new balloon after delay
    setTimeout(() => {
        balloon.remove();
        if (gameActive) {
            createBalloon();
        }
    }, 300);
}

function popRandomBalloon() {
    if (balloons.length === 0) return;
    
    const randomBalloon = balloons[Math.floor(Math.random() * balloons.length)];
    if (!randomBalloon.classList.contains('popped')) {
        const color = randomBalloon.style.backgroundColor || '#ff6b8b';
        popBalloon(randomBalloon, color);
    }
}

function startBalloonGame() {
    balloonsPopped = 0;
    timeLeft = 30;
    
    document.getElementById('pop-count').textContent = '0';
    document.getElementById('pop-timer').textContent = timeLeft;
    document.getElementById('pop-feedback').textContent = '';
    document.getElementById('pop-next').classList.add('hidden');
    
    // Clear existing balloons
    const container = document.getElementById('balloon-container');
    container.innerHTML = '';
    balloons = [];
    
    // Create initial balloons
    for (let i = 0; i < 15; i++) {
        setTimeout(() => createBalloon(), i * 200);
    }
    
    // Start timer
    clearInterval(balloonTimer);
    balloonTimer = setInterval(() => {
        timeLeft--;
        document.getElementById('pop-timer').textContent = timeLeft;
        
        if (timeLeft <= 0) {
            clearInterval(balloonTimer);
            endBalloonGame();
        }
        
        // Speed up balloon generation as time runs out
        if (timeLeft === 20 || timeLeft === 10) {
            for (let i = 0; i < 3; i++) {
                setTimeout(() => createBalloon(), i * 300);
            }
        }
    }, 1000);
}

function winBalloonGame() {
    clearInterval(balloonTimer);
    playSound('success-sound', 0.6);
    createConfetti(200);
    shakeScreen(4, 400);
    
    const bonus = timeLeft * 5;
    addScore(bonus + 100);
    
    const feedback = document.getElementById('pop-feedback');
    feedback.innerHTML = `🎉 POP MASTER! 🎉<br>+${bonus} time bonus!`;
    feedback.style.color = '#06d6a0';
    
    document.getElementById('pop-next').classList.remove('hidden');
    
    // Stop creating new balloons
    gameActive = false;
    setTimeout(() => {
        gameActive = true;
    }, 2000);
}

function endBalloonGame() {
    const feedback = document.getElementById('pop-feedback');
    feedback.innerHTML = `⏰ Time's up!<br>You popped ${balloonsPopped}/${balloonsTotal} balloons`;
    feedback.style.color = '#ff6b8b';
    
    document.getElementById('pop-next').classList.remove('hidden');
    
    // Pop all remaining balloons
    balloons.forEach(balloon => {
        if (!balloon.classList.contains('popped')) {
            setTimeout(() => {
                balloon.classList.add('popped');
                setTimeout(() => balloon.remove(), 300);
            }, Math.random() * 500);
        }
    });
}

// ===== PAGE 4: CAKE CUSTOMIZATION =====
function setupCakeCustomization() {
    const customBtns = document.querySelectorAll('.custom-btn');
    const colorPicker = document.getElementById('color-picker');
    const colorOptions = document.querySelectorAll('.color-option');
    
    let currentCustomization = null;
    
    customBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const type = this.dataset.type;
            currentCustomization = type;
            playSound('click-sound', 0.3);
            
            // Show color picker
            colorPicker.classList.remove('hidden');
            
            // Highlight active button
            customBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Show instruction
            showFloatingText(`Choose a color for the ${type}!`, 
                this.offsetLeft + this.offsetWidth/2,
                this.offsetTop);
        });
    });
    
    colorOptions.forEach((colorOption, index) => {
        colorOption.addEventListener('click', function() {
            if (!currentCustomization) return;
            
            const color = this.style.backgroundColor;
            applyCakeCustomization(currentCustomization, color, index);
            playSound('click-sound', 0.3);
            
            // Hide color picker
            colorPicker.classList.add('hidden');
            customBtns.forEach(b => b.classList.remove('active'));
            
            // Add score
            addScore(25);
            
            // Show creativity score
            updateCreativityScore();
        });
    });
    
    // Reset creativity score
    document.getElementById('creativity-score').textContent = '0';
}

function applyCakeCustomization(type, color, index) {
    const cakeLayers = document.querySelectorAll('.cake-layer');
    const cakeBase = document.querySelector('.cake-base');
    
    switch(type) {
        case 'flavor':
            cakeLayers[1].style.background = `linear-gradient(45deg, ${color}, ${lightenColor(color, 20)})`;
            break;
        case 'frosting':
            cakeLayers[2].style.background = `linear-gradient(45deg, ${color}, ${lightenColor(color, 30)})`;
            break;
        case 'topping':
            // Add sprinkles
            const sprinkles = document.querySelector('.sprinkles');
            const sprinkleCount = 20;
            sprinkles.innerHTML = '';
            
            for (let i = 0; i < sprinkleCount; i++) {
                const sprinkle = document.createElement('div');
                sprinkle.style.cssText = `
                    position: absolute;
                    width: 5px;
                    height: 5px;
                    background: ${color};
                    border-radius: 50%;
                    left: ${Math.random() * 200}px;
                    top: ${Math.random() * 200}px;
                `;
                sprinkles.appendChild(sprinkle);
            }
            break;
        case 'candles':
            // Add candles
            const candles = document.querySelector('.candles');
            const candleCount = 8;
            candles.innerHTML = '';
            
            for (let i = 0; i < candleCount; i++) {
                const candle = document.createElement('div');
                candle.style.cssText = `
                    position: absolute;
                    width: 10px;
                    height: 40px;
                    background: ${color};
                    border-radius: 5px;
                    left: ${50 + i * 25}px;
                    top: 50px;
                `;
                
                // Add flame
                const flame = document.createElement('div');
                flame.style.cssText = `
                    position: absolute;
                    width: 15px;
                    height: 20px;
                    background: #ffd166;
                    border-radius: 50% 50% 20% 20%;
                    left: -2.5px;
                    top: -15px;
                    animation: flicker 0.5s infinite alternate;
                `;
                candle.appendChild(flame);
                candles.appendChild(candle);
            }
            break;
    }
    
    // Visual feedback
    createParticleEffect(cakeBase);
}

function lightenColor(color, percent) {
    // Simple color lightening
    return color.replace('rgb(', 'rgba(').replace(')', `, ${percent/100})`);
}

function updateCreativityScore() {
    const currentScore = parseInt(document.getElementById('creativity-score').textContent);
    const newScore = Math.min(100, currentScore + 25);
    document.getElementById('creativity-score').textContent = newScore;
    
    if (newScore >= 100) {
        showFloatingText('🎨 CREATIVITY MAXED!', 
            window.innerWidth/2,
            window.innerHeight/2 - 100);
    }
}

// ===== PAGE 5: MEMORY GAME =====
let memoryCards = [];
let flippedCards = [];
let matchedPairs = 0;
let moves = 0;
const memoryPairs = 8;

function setupMemoryGame() {
    const symbols = ['🎂', '🎁', '🎈', '✨', '🥳', '🎉', '🎊', '🎇'];
    const allCards = [...symbols, ...symbols]; // Duplicate for pairs
    
    // Shuffle cards
    for (let i = allCards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allCards[i], allCards[j]] = [allCards[j], allCards[i]];
    }
    
    memoryCards = allCards;
}

function resetMemoryGame() {
    const grid = document.getElementById('memory-grid');
    grid.innerHTML = '';
    flippedCards = [];
    matchedPairs = 0;
    moves = 0;
    
    document.getElementById('match-count').textContent = '0';
    document.getElementById('move-count').textContent = '0';
    document.getElementById('memory-feedback').textContent = '';
    document.getElementById('memory-next').classList.add('hidden');
    
    // Create cards
    memoryCards.forEach((symbol, index) => {
        const card = document.createElement('div');
        card.className = 'memory-card';
        card.dataset.index = index;
        card.dataset.symbol = symbol;
        
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
    if (flippedCards.length >= 2 || card.classList.contains('flipped') || card.classList.contains('matched')) {
        return;
    }
    
    playSound('click-sound', 0.3);
    card.classList.add('flipped');
    flippedCards.push(card);
    
    // Check for match
    if (flippedCards.length === 2) {
        moves++;
        document.getElementById('move-count').textContent = moves;
        
        const [card1, card2] = flippedCards;
        const match = card1.dataset.symbol === card2.dataset.symbol;
        
        if (match) {
            // Match found
            setTimeout(() => {
                card1.classList.add('matched');
                card2.classList.add('matched');
                playSound('success-sound', 0.6);
                createParticleEffect(card1);
                createParticleEffect(card2);
                
                matchedPairs++;
                document.getElementById('match-count').textContent = matchedPairs;
                addScore(50);
                
                flippedCards = [];
                
                // Check win condition
                if (matchedPairs === memoryPairs) {
                    winMemoryGame();
                }
            }, 500);
        } else {
            // No match - flip back
            setTimeout(() => {
                card1.classList.remove('flipped');
                card2.classList.remove('flipped');
                flippedCards = [];
            }, 1000);
        }
    }
}

function winMemoryGame() {
    playSound('confetti-sound', 0.7);
    createConfetti(200);
    shakeScreen(4, 400);
    
    const bonus = Math.max(0, 500 - moves * 10);
    addScore(bonus);
    
    const feedback = document.getElementById('memory-feedback');
    feedback.innerHTML = `🧠 MEMORY MASTER! 🧠<br>+${bonus} efficiency bonus!`;
    feedback.style.color = '#06d6a0';
    
    document.getElementById('memory-next').classList.remove('hidden');
}

// ===== PAGE 6: QUIZ =====
let currentQuestion = 1;
const totalQuestions = 5;

function setupQuiz() {
    const optionBtns = document.querySelectorAll('.option-btn');
    
    optionBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const isCorrect = this.classList.contains('correct');
            handleAnswer(isCorrect);
            
            // Disable all options
            optionBtns.forEach(b => {
                b.disabled = true;
                b.style.opacity = '0.7';
            });
            
            // Highlight correct answer
            this.closest('.options').querySelector('.correct').style.background = 'rgba(6, 214, 160, 0.3)';
            
            if (!isCorrect) {
                this.style.background = 'rgba(255, 107, 139, 0.3)';
            }
        });
    });
}

function resetQuiz() {
    currentQuestion = 1;
    quizScore = 0;
    
    document.getElementById('quiz-score').textContent = '0';
    document.getElementById('quiz-feedback').innerHTML = '';
    document.getElementById('quiz-next').classList.add('hidden');
    
    // Show first question
    document.querySelectorAll('.question-card').forEach(card => {
        card.classList.remove('active');
    });
    document.getElementById('q1').classList.add('active');
    
    // Reset all buttons
    document.querySelectorAll('.option-btn').forEach(btn => {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.background = '';
    });
}

function handleAnswer(isCorrect) {
    playSound(isCorrect ? 'success-sound' : 'click-sound', 0.4);
    
    if (isCorrect) {
        quizScore++;
        document.getElementById('quiz-score').textContent = quizScore;
        addScore(100);
        
        // Visual feedback
        createConfetti(50);
    } else {
        shakeScreen(3, 200);
    }
    
    // Move to next question or finish
    setTimeout(() => {
        if (currentQuestion < totalQuestions) {
            document.getElementById(`q${currentQuestion}`).classList.remove('active');
            currentQuestion++;
            document.getElementById(`q${currentQuestion}`).classList.add('active');
            
            // Re-enable buttons for next question
            document.querySelectorAll('.option-btn').forEach(btn => {
                btn.disabled = false;
                btn.style.opacity = '1';
                btn.style.background = '';
            });
        } else {
            finishQuiz();
        }
    }, 1000);
}

function finishQuiz() {
    const feedback = document.getElementById('quiz-feedback');
    let message = '';
    
    if (quizScore === totalQuestions) {
        message = '🏆 PERFECT SCORE! +500 Bonus!';
        addScore(500);
        createConfetti(300);
        shakeScreen(5, 500);
    } else if (quizScore >= 3) {
        message = '🎯 Great job! +300 Bonus!';
        addScore(300);
        createConfetti(150);
    } else {
        message = '😅 Better luck next time!';
    }
    
    feedback.innerHTML = `${message}<br>You got ${quizScore}/${totalQuestions} correct!`;
    document.getElementById('quiz-next').classList.remove('hidden');
}

// ===== PAGE 7: CELEBRATION =====
function setupCelebration() {
    document.getElementById('final-score').textContent = score;
}

function launchConfetti() {
    playSound('confetti-sound', 0.7);
    createConfetti(300);
    shakeScreen(5, 400);
    addScore(50);
    
    showFloatingText('🎉 CONFETTI!', 
        window.innerWidth/2,
        window.innerHeight/2 - 100);
}

function startDance() {
    playSound('celebrate-sound', 0.6);
    
    // Animate dance floor
    const danceFloor = document.getElementById('dance-floor');
    danceFloor.style.animation = 'dance 1s infinite';
    
    // Create dancing emojis
    for (let i = 0; i < 10; i++) {
        setTimeout(() => {
            createFloatingEmoji(['💃', '🕺', '🎊', '✨'][Math.floor(Math.random() * 4)]);
        }, i * 100);
    }
    
    addScore(50);
    
    setTimeout(() => {
        danceFloor.style.animation = '';
    }, 3000);
}

function cutCake() {
    playSound('success-sound', 0.6);
    
    // Animate cake cutting
    const cake = document.querySelector('.cake-base');
    cake.style.transform = 'scale(0.95)';
    setTimeout(() => cake.style.transform = 'scale(1)', 200);
    
    // Create cake particles
    createExplosion(
        cake.offsetLeft + cake.offsetWidth/2,
        cake.offsetTop + cake.offsetHeight/2,
        '#ffd166',
        50
    );
    
    addScore(100);
    
    showFloatingText('🎂 CAKE TIME!', 
        cake.offsetLeft + cake.offsetWidth/2,
        cake.offsetTop);
}

// ===== PAGE 8: FINAL MESSAGE =====
function setupFinalMessage() {
    // Start continuous fireworks
    startFireworks();
    
    // Update final score
    document.querySelectorAll('#final-score').forEach(el => {
        el.textContent = score;
    });
    
    // Add click effects to message
    document.querySelector('.personal-message').addEventListener('click', function(e) {
        if (e.target.classList.contains('highlight')) {
            playSound('pop-sound', 0.4);
            createConfetti(50);
        }
    });
}

function startFireworks() {
    if (!effectsOn) return;
    
    const container = document.getElementById('fireworks');
    if (!container) return;
    
    // Clear existing
    container.innerHTML = '';
    
    // Create multiple fireworks
    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            createFirework();
        }, i * 500);
    }
    
    // Continue fireworks
    const fireworkInterval = setInterval(() => {
        if (currentPage === 8) {
            createFirework();
        } else {
            clearInterval(fireworkInterval);
        }
    }, 1500);
}

function createFirework() {
    if (!effectsOn) return;
    
    const container = document.getElementById('fireworks') || document.body;
    const colors = ['#ff6b8b', '#a882dd', '#ffd166', '#06d6a0'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    // Create explosion
    const x = Math.random() * (container.offsetWidth || window.innerWidth);
    const y = Math.random() * (container.offsetHeight || window.innerHeight) * 0.8;
    
    playSound('pop-sound', 0.3);
    createExplosion(x, y, color, 30);
    
    // Add trail
    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            createParticleTrail(x, y, color);
        }, i * 50);
    }
}

// ===== VISUAL EFFECTS =====
function createConfetti(count = 100) {
    if (!effectsOn) return;
    
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const confettiPieces = [];
    const colors = ['#ff6b8b', '#a882dd', '#ffd166', '#06d6a0', '#118ab2'];
    
    // Create confetti
    for (let i = 0; i < count; i++) {
        confettiPieces.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            r: Math.random() * 6 + 2,
            d: Math.random() * count + 10,
            color: colors[Math.floor(Math.random() * colors.length)],
            tilt: Math.floor(Math.random() * 10) - 10,
            tiltAngle: 0,
            tiltAngleIncremental: Math.random() * 0.07 + 0.05
        });
    }
    
    // Animation
    function animateConfetti() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        for (let i = 0; i < confettiPieces.length; i++) {
            const p = confettiPieces[i];
            
            ctx.beginPath();
            ctx.lineWidth = p.r / 2;
            ctx.strokeStyle = p.color;
            ctx.moveTo(p.x + p.tilt + p.r / 4, p.y);
            ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 4);
            ctx.stroke();
            
            p.tiltAngle += p.tiltAngleIncremental;
            p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
            p.x += Math.sin(p.d);
            p.tilt = Math.sin(p.tiltAngle) * 15;
            
            if (p.y > canvas.height) {
                confettiPieces.splice(i, 1);
                i--;
            }
        }
        
        if (confettiPieces.length > 0) {
            requestAnimationFrame(animateConfetti);
        }
    }
    
    animateConfetti();
}

function createExplosion(x, y, color, count) {
    if (!effectsOn) return;
    
    const container = document.querySelector('.floating-container');
    if (!container) return;
    
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
        
        // Random direction
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 3;
        const dx = Math.cos(angle) * speed;
        const dy = Math.sin(angle) * speed;
        
        let posX = x;
        let posY = y;
        let opacity = 1;
        
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
}

function createParticleEffect(element) {
    if (!effectsOn) return;
    
    const rect = element.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    
    createExplosion(x, y, '#a882dd', 10);
}

function createParticleTrail(x, y, color) {
    createExplosion(x, y, color, 5);
}

function shakeScreen(intensity = 5, duration = 500) {
    if (!effectsOn) return;
    
    const body = document.body;
    const originalTransform = body.style.transform;
    
    let start = null;
    
    function doShake(timestamp) {
        if (!start) start = timestamp;
        const progress = timestamp - start;
        
        const shakeX = (Math.random() - 0.5) * intensity * 2;
        const shakeY = (Math.random() - 0.5) * intensity * 2;
        
        body.style.transform = `translate(${shakeX}px, ${shakeY}px)`;
        
        if (progress < duration) {
            requestAnimationFrame(doShake);
        } else {
            body.style.transform = originalTransform;
        }
    }
    
    requestAnimationFrame(doShake);
}

function showFloatingText(text, x, y, color = '#ffffff') {
    if (!effectsOn) return;
    
    const floatText = document.createElement('div');
    floatText.textContent = text;
    floatText.style.cssText = `
        position: fixed;
        left: ${x}px;
        top: ${y}px;
        color: ${color};
        font-size: 24px;
        font-weight: bold;
        pointer-events: none;
        z-index: 1001;
        animation: floatText 2s ease-out forwards;
        text-shadow: 0 0 10px ${color};
    `;
    
    document.body.appendChild(floatText);
    
    setTimeout(() => floatText.remove(), 2000);
}

function createFloatingEmoji(emoji) {
    const container = document.querySelector('.floating-container');
    const floatEmoji = document.createElement('div');
    
    floatEmoji.textContent = emoji;
    floatEmoji.style.cssText = `
        position: fixed;
        font-size: 2rem;
        left: ${Math.random() * window.innerWidth}px;
        top: ${window.innerHeight}px;
        pointer-events: none;
        z-index: 999;
        animation: floatUp 3s ease-in forwards;
    `;
    
    container.appendChild(floatEmoji);
    
    setTimeout(() => floatEmoji.remove(), 3000);
}

function startFloatingEmojis() {
    setInterval(() => {
        if (!effectsOn || Math.random() > 0.3) return;
        
        const emojis = ['✨', '🌟', '💫', '⭐'];
        createFloatingEmoji(emojis[Math.floor(Math.random() * emojis.length)]);
    }, 3000);
}

// ===== SCORE SYSTEM =====
function addScore(points) {
    score += points;
    document.getElementById('score').textContent = score;
    
    // Visual feedback for large scores
    if (points >= 100) {
        showFloatingText(`+${points}`, 
            window.innerWidth - 100, 
            50, 
            '#ffd166');
    }
}

// ===== SPECIAL FUNCTIONS =====
function unlockSecretMode() {
    playSound('celebrate-sound', 0.8);
    createConfetti(500);
    shakeScreen(8, 1000);
    
    // Change theme colors temporarily
    document.documentElement.style.setProperty('--primary-pink', '#ff00ff');
    document.documentElement.style.setProperty('--purple', '#00ffff');
    document.documentElement.style.setProperty('--gold', '#ffff00');
    
    addScore(1000);
    
    showFloatingText('🎮 SECRET MODE UNLOCKED!', 
        window.innerWidth/2, 
        window.innerHeight/2,
        '#ff00ff');
    
    // Reset colors after 10 seconds
    setTimeout(() => {
        document.documentElement.style.setProperty('--primary-pink', '#ff6b8b');
        document.documentElement.style.setProperty('--purple', '#a882dd');
        document.documentElement.style.setProperty('--gold', '#ffd166');
    }, 10000);
}

function shareCelebration() {
    const text = `I scored ${score} points in the Ultimate Birthday Celebration! 🎉 Try it: ${window.location.href}`;
    
    if (navigator.share) {
        navigator.share({
            title: 'Birthday Celebration',
            text: text,
            url: window.location.href
        });
    } else if (navigator.clipboard) {
        navigator.clipboard.writeText(text);
        alert('Celebration copied to clipboard! 📋');
    } else {
        prompt('Copy this link to share:', window.location.href);
    }
}

function restartExperience() {
    // Reset all games
    currentPage = 1;
    score = 0;
    balloonsPopped = 0;
    memoryMatches = 0;
    quizScore = 0;
    gameActive = true;
    
    // Update UI
    document.getElementById('score').textContent = '0';
    
    // Go to first page
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById('page1').classList.add('active');
    
    // Restart music
    if (musicOn) {
        const bgMusic = document.getElementById('bg-music');
        bgMusic.currentTime = 0;
        bgMusic.play();
    }
    
    playSound('confetti-sound', 0.6);
    createConfetti(200);
}

function showEasterEgg() {
    const messages = [
        "You found an egg! 🥚",
        "Secret birthday power unlocked! 💪",
        "Cake consumption increased by 100%! 🎂",
        "Party mode: MAXIMUM! 🎉",
        "You're officially awesome! 🌟"
    ];
    
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    playSound('success-sound', 0.6);
    createConfetti(100);
    
    showFloatingText(randomMessage, 
        window.innerWidth/2, 
        window.innerHeight/2,
        '#ffd166');
    
    addScore(250);
}

// ===== WINDOW RESIZE HANDLER =====
window.addEventListener('resize', function() {
    const canvas = document.getElementById('confetti-canvas');
    if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
});

// ===== ADD MISSING CSS ANIMATIONS =====
const extraStyles = document.createElement('style');
extraStyles.textContent = `
    @keyframes floatUp {
        0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
        }
        100% {
            transform: translateY(-100vh) rotate(360deg);
            opacity: 0;
        }
    }
    
    @keyframes floatText {
        0% {
            transform: translateY(0) scale(1);
            opacity: 1;
        }
        100% {
            transform: translateY(-100px) scale(1.5);
            opacity: 0;
        }
    }
    
    @keyframes flicker {
        0%, 100% {
            opacity: 1;
            transform: scale(1);
        }
        50% {
            opacity: 0.7;
            transform: scale(1.1);
        }
    }
    
    @keyframes dance {
        0%, 100% {
            transform: translateY(0) rotate(0deg);
        }
        25% {
            transform: translateY(-10px) rotate(5deg);
        }
        75% {
            transform: translateY(-10px) rotate(-5deg);
        }
    }
    
    .memory-card {
        transform-style: preserve-3d;
        transition: transform 0.6s;
    }
    
    .memory-card .front,
    .memory-card .back {
        position: absolute;
        width: 100%;
        height: 100%;
        backface-visibility: hidden;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .memory-card .front {
        background: linear-gradient(45deg, var(--primary-pink), var(--purple));
        color: white;
        font-size: 2rem;
        font-weight: bold;
    }
    
    .memory-card .back {
        background: white;
        color: #333;
        transform: rotateY(180deg);
        font-size: 2.5rem;
    }
    
    .memory-card.flipped {
        transform: rotateY(180deg);
    }
    
    .memory-card.matched {
        opacity: 0.7;
        cursor: default;
    }
`;
document.head.appendChild(extraStyles);
