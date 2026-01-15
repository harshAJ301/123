// ===== GLOBAL VARIABLES =====
let currentPage = 1;
let totalScore = 0;
let chaosLevel = 0;
let gameActive = true;
let musicOn = true;
let effectsOn = true;
let chaosMode = false;
let startTime;
let globalTimer;
let backgrounds = [
    "url('https://images.unsplash.com/photo-1511795409834-ef04bbd61622?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1920&q=80')",
    "url('https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1920&q=80')",
    "url('https://images.unsplash.com/photo-1545696563-af8f6ec2295a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1920&q=80')",
    "url('https://images.unsplash.com/photo-1530103862676-de8c9debad1d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1920&q=80')",
    "linear-gradient(135deg, #ff6b8b 0%, #a882dd 50%, #ffd166 100%)",
    "url('https://images.unsplash.com/photo-1532117182044-031e7cd916ee?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1920&q=80')"
];

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    startTime = Date.now();
    updateChaosMeter();
    rotateBackground();
    startGlobalTimer();
    createFloatingElements();
    setupMouseEffects();
    
    // Start background music after user interaction
    document.addEventListener('click', initAudio, { once: true });
    
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
});

// ===== PAGE NAVIGATION =====
function nextPage() {
    if (!gameActive) return;
    
    playSound('click');
    const currentEl = document.getElementById(`page${currentPage}`);
    currentEl.classList.remove('active');
    
    currentPage++;
    if (currentPage > 8) currentPage = 1;
    
    const nextEl = document.getElementById(`page${currentPage}`);
    nextEl.classList.add('active');
    
    // Add score for progressing
    addScore(50);
    
    // Start page-specific animations
    startPageAnimations(currentPage);
    
    // Visual effect
    createExplosion(window.innerWidth / 2, window.innerHeight / 2, '#ff6b8b', 30);
}

function startPageAnimations(pageNum) {
    switch(pageNum) {
        case 1:
            break;
        case 2:
            startCountdown();
            break;
        case 3:
            startTapGame();
            break;
        case 4:
            resetQuiz();
            break;
        case 5:
            startErrorSequence();
            break;
        case 6:
            startStory();
            break;
        case 7:
            startButtonChallenge();
            break;
        case 8:
            setupFinalPage();
            break;
    }
}

// ===== PAGE 1: LANDING =====
function startExperience() {
    playSound('confetti');
    createConfetti(200);
    shakeScreen(5, 500);
    addScore(100);
    
    // Launch extra balloons
    for (let i = 0; i < 10; i++) {
        setTimeout(() => launchBalloon(), i * 100);
    }
    
    nextPage();
}

// ===== PAGE 2: COUNTDOWN =====
function startCountdown() {
    let count = 5;
    const countdownEl = document.getElementById('countdown');
    const countdownInterval = setInterval(() => {
        countdownEl.textContent = count;
        playSound('click');
        shakeScreen(2, 200);
        
        // Particle effect on number change
        createParticles(countdownEl.offsetLeft + 75, countdownEl.offsetTop + 75, '#ffd166', 10);
        
        if (count === 0) {
            clearInterval(countdownInterval);
            countdownEl.textContent = '🎉';
            playSound('confetti');
            createConfetti(300);
            shakeScreen(10, 1000);
            
            // Big explosion
            createExplosion(window.innerWidth/2, window.innerHeight/2, '#ff6b8b', 100);
            
            // Auto continue
            setTimeout(() => {
                addScore(200);
                nextPage();
            }, 2000);
        }
        count--;
    }, 1000);
}

// ===== PAGE 3: TAP GAME =====
let tapCount = 0;
let tapStartTime;
let tapInterval;
let gameTime = 10;

function startTapGame() {
    tapCount = 0;
    gameTime = 10;
    document.getElementById('tap-count').textContent = '0';
    document.getElementById('game-timer').textContent = gameTime;
    document.getElementById('continue-btn').classList.add('hidden');
    document.getElementById('tap-feedback').textContent = '';
    
    // Start game timer
    tapStartTime = Date.now();
    tapInterval = setInterval(() => {
        gameTime--;
        document.getElementById('game-timer').textContent = gameTime;
        
        if (gameTime <= 0) {
            clearInterval(tapInterval);
            endTapGame();
        }
        
        // Speed up animation as time runs out
        const cake = document.getElementById('tap-cake');
        const speed = 1 + (10 - gameTime) * 0.1;
        cake.style.animationDuration = `${2 / speed}s`;
    }, 1000);
}

function tapCake() {
    if (gameTime <= 0) return;
    
    tapCount++;
    document.getElementById('tap-count').textContent = tapCount;
    playSound('pop');
    
    // Calculate taps per second
    const elapsed = (Date.now() - tapStartTime) / 1000;
    const tapsPerSecond = (tapCount / elapsed).toFixed(1);
    document.getElementById('tap-speed').textContent = tapsPerSecond;
    
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
        clearInterval(tapInterval);
        winTapGame();
    }
    
    // Random feedback
    if (tapCount % 5 === 0) {
        const feedbacks = ['🔥 Hot streak!', '⚡ Lightning fast!', '🎯 Bullseye!', '🚀 Keep going!'];
        showFloatingText(feedbacks[Math.floor(Math.random() * feedbacks.length)]);
    }
}

function winTapGame() {
    playSound('confetti');
    createConfetti(150);
    shakeScreen(5, 500);
    
    const feedback = document.getElementById('tap-feedback');
    feedback.innerHTML = '🎉 CHALLENGE COMPLETED! 🎉<br>+200 Bonus Points!';
    feedback.style.color = '#06d6a0';
    
    document.getElementById('continue-btn').classList.remove('hidden');
    addScore(200 + Math.floor(gameTime * 10));
    
    // Special effect
    startEmojiRain(['🎯', '⚡', '🔥', '🌟'], 2000);
}

function endTapGame() {
    const feedback = document.getElementById('tap-feedback');
    if (tapCount < 15) {
        feedback.innerHTML = `⏰ Time's up!<br>You got ${tapCount}/15 taps`;
        feedback.style.color = '#ff6b8b';
    }
    document.getElementById('continue-btn').classList.remove('hidden');
}

// ===== PAGE 4: QUIZ =====
let currentQuestion = 1;
let quizScore = 0;

function resetQuiz() {
    currentQuestion = 1;
    quizScore = 0;
    document.querySelectorAll('.question').forEach(q => q.classList.remove('active'));
    document.getElementById('question1').classList.add('active');
    document.getElementById('current-q').textContent = '1';
    document.getElementById('quiz-feedback').innerHTML = '';
    document.getElementById('quiz-next').classList.add('hidden');
}

function selectAnswer(questionNum, answerNum) {
    if (questionNum !== currentQuestion) return;
    
    playSound('click');
    const isCorrect = (questionNum === 1 && answerNum === 3) ||
                     (questionNum === 2 && answerNum === 2) ||
                     (questionNum === 3 && answerNum === 4);
    
    const feedback = document.getElementById('quiz-feedback');
    
    if (isCorrect) {
        quizScore++;
        feedback.innerHTML = '✅ Correct! +100 points';
        feedback.style.color = '#06d6a0';
        playSound('confetti');
        createConfetti(50);
        addScore(100);
    } else {
        feedback.innerHTML = '❌ Nice try!';
        feedback.style.color = '#ff6b8b';
        shakeScreen(3, 300);
    }
    
    // Move to next question or finish
    setTimeout(() => {
        if (currentQuestion < 3) {
            document.getElementById(`question${currentQuestion}`).classList.remove('active');
            currentQuestion++;
            document.getElementById(`question${currentQuestion}`).classList.add('active');
            document.getElementById('current-q').textContent = currentQuestion;
            feedback.innerHTML = '';
        } else {
            finishQuiz();
        }
    }, 1000);
}

function finishQuiz() {
    const feedback = document.getElementById('quiz-feedback');
    let message = '';
    
    if (quizScore === 3) {
        message = '🎯 PERFECT SCORE! +300 Bonus!';
        addScore(300);
        createConfetti(200);
        startEmojiRain(['🏆', '🎯', '✨', '💫'], 3000);
    } else if (quizScore === 2) {
        message = '👍 Great job! +150 Bonus!';
        addScore(150);
        createConfetti(100);
    } else {
        message = '😅 Better luck next time!';
    }
    
    feedback.innerHTML = `${message}<br>You got ${quizScore}/3 correct!`;
    document.getElementById('quiz-next').classList.remove('hidden');
}

// ===== PAGE 5: ERROR SEQUENCE =====
function startErrorSequence() {
    // Typewriter effect for terminal
    const lines = document.querySelectorAll('.terminal-line');
    lines.forEach((line, index) => {
        setTimeout(() => {
            line.style.animation = 'typeWriter 0.5s steps(40) forwards';
            setTimeout(() => {
                line.style.opacity = '1';
            }, 500);
        }, index * 500);
    });
    
    // Animate loading bar
    setTimeout(() => {
        const loadingFill = document.getElementById('loading-fill');
        loadingFill.style.width = '100%';
    }, 3500);
    
    // Show surprise message
    setTimeout(() => {
        document.getElementById('surprise-msg').classList.remove('hidden');
        playSound('confetti');
        createConfetti(100);
        shakeScreen(3, 400);
        addScore(150);
        
        // Auto continue
        setTimeout(() => {
            nextPage();
        }, 2500);
    }, 6000);
}

// ===== PAGE 6: STORY =====
let currentLine = 1;
let storyInterval;

function startStory() {
    currentLine = 1;
    document.querySelectorAll('.story-line').forEach(line => {
        line.classList.remove('active');
    });
    document.getElementById('line1').classList.add('active');
    
    // Auto-advance story
    clearInterval(storyInterval);
    storyInterval = setInterval(nextLine, 2000);
}

function nextLine() {
    if (currentLine >= 6) {
        clearInterval(storyInterval);
        return;
    }
    
    document.getElementById(`line${currentLine}`).classList.remove('active');
    currentLine++;
    document.getElementById(`line${currentLine}`).classList.add('active');
    playSound('click');
    
    // Special effects on certain lines
    if (currentLine === 4) {
        createConfetti(50);
    } else if (currentLine === 6) {
        playSound('confetti');
        shakeScreen(4, 400);
        addScore(100);
    }
}

function prevLine() {
    if (currentLine <= 1) return;
    
    document.getElementById(`line${currentLine}`).classList.remove('active');
    currentLine--;
    document.getElementById(`line${currentLine}`).classList.add('active');
    playSound('click');
}

function skipStory() {
    clearInterval(storyInterval);
    for (let i = 1; i <= 6; i++) {
        document.getElementById(`line${i}`).classList.remove('active');
    }
    document.getElementById('line6').classList.add('active');
    playSound('confetti');
    createConfetti(100);
    addScore(50);
}

// ===== PAGE 7: BUTTON CHALLENGE =====
let temptationTime = 0;
let temptationInterval;
let buttonHoverCount = 0;

function startButtonChallenge() {
    temptationTime = 0;
    buttonHoverCount = 0;
    document.getElementById('resistance').textContent = '100%';
    document.getElementById('temptation-time').textContent = '0';
    document.getElementById('trap-feedback').classList.add('hidden');
    document.getElementById('trap-next').classList.add('hidden');
    
    // Start temptation timer
    clearInterval(temptationInterval);
    temptationInterval = setInterval(() => {
        temptationTime++;
        document.getElementById('temptation-time').textContent = temptationTime;
        
        // Decrease resistance over time
        const resistance = Math.max(0, 100 - temptationTime * 5);
        document.getElementById('resistance').textContent = resistance + '%';
        
        // Make button more tempting
        const button = document.getElementById('trap-button');
        if (temptationTime % 5 === 0) {
            button.style.transform = `scale(${1 + temptationTime * 0.01})`;
            createParticles(
                button.offsetLeft + button.offsetWidth/2,
                button.offsetTop + button.offsetHeight/2,
                '#ff3366',
                5
            );
        }
    }, 1000);
}

function buttonHover() {
    if (buttonHoverCount < 3) {
        buttonHoverCount++;
        playSound('click');
        
        // Button shakes when hovered
        const button = document.getElementById('trap-button');
        button.style.animation = 'shake 0.3s';
        setTimeout(() => button.style.animation = '', 300);
        
        // Show warning
        showFloatingText(['🤔', '👀', '😈'][buttonHoverCount-1]);
    }
}

function pressButton() {
    clearInterval(temptationInterval);
    playSound('confetti');
    
    // Massive explosion
    createConfetti(500);
    shakeScreen(10, 1000);
    startEmojiRain(['💥', '🎆', '✨', '🎇'], 5000);
    
    // Calculate willpower level
    const willpower = Math.max(0, 100 - temptationTime * 5);
    document.getElementById('willpower-level').textContent = willpower + '%';
    
    // Show feedback
    const feedback = document.getElementById('trap-feedback');
    feedback.classList.remove('hidden');
    
    let message = '';
    if (willpower >= 80) {
        message = 'Iron Will! +300 points';
        addScore(300);
    } else if (willpower >= 50) {
        message = 'Good resistance! +200 points';
        addScore(200);
    } else {
        message = 'Zero patience! +100 points';
        addScore(100);
    }
    
    feedback.querySelector('.funny-quote').textContent = message;
    
    // Show next button
    setTimeout(() => {
        document.getElementById('trap-next').classList.remove('hidden');
    }, 1500);
    
    // Disable button
    const button = document.getElementById('trap-button');
    button.disabled = true;
    button.style.opacity = '0.5';
    button.style.cursor = 'not-allowed';
}

// ===== PAGE 8: FINAL CELEBRATION =====
let candlesBlown = 0;

function setupFinalPage() {
    candlesBlown = 0;
    document.querySelectorAll('.candle').forEach(candle => {
        candle.classList.add('active');
    });
    document.getElementById('final-celebration').classList.add('hidden');
    
    // Update final stats
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    document.getElementById('final-time').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    document.getElementById('final-score').textContent = totalScore;
    
    // Calculate taps per second from earlier
    const tapsPerSec = document.getElementById('tap-speed').textContent || '0';
    document.getElementById('final-speed').textContent = tapsPerSec;
    document.getElementById('chaos-level').textContent = chaosLevel + '%';
    
    // Setup spacebar for blowing candles
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            blowAllCandles();
        }
    });
}

function blowCandle(candleNum) {
    if (candlesBlown >= 8) return;
    
    const candle = document.getElementById(`candle${candleNum}`);
    if (!candle.classList.contains('active')) return;
    
    candle.classList.remove('active');
    playSound('pop');
    candlesBlown++;
    
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

function blowAllCandles() {
    playSound('confetti');
    shakeScreen(5, 500);
    
    document.querySelectorAll('.candle').forEach(candle => {
        candle.classList.remove('active');
    });
    
    candlesBlown = 8;
    setTimeout(finishCelebration, 500);
}

function finishCelebration() {
    playSound('confetti');
    createConfetti(1000);
    shakeScreen(8, 1500);
    startEmojiRain(['🎉', '🎊', '✨', '🥳', '🎂', '🎁'], 8000);
    
    // Show final message
    setTimeout(() => {
        document.getElementById('final-celebration').classList.remove('hidden');
        addScore(500); // Completion bonus
    }, 1000);
}

function shareResults() {
    const text = `I scored ${totalScore} points in the Ultimate Birthday Experience! 🎂🎉 Try it yourself!`;
    if (navigator.share) {
        navigator.share({
            title: 'Birthday Celebration',
            text: text,
            url: window.location.href
        });
    } else {
        navigator.clipboard.writeText(text + '\n' + window.location.href);
        alert('Results copied to clipboard! 📋');
    }
}

function playAgain() {
    currentPage = 1;
    totalScore = 0;
    chaosLevel = 0;
    startTime = Date.now();
    
    // Reset all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById('page1').classList.add('active');
    
    // Reset UI
    document.getElementById('total-score').textContent = '0';
    updateChaosMeter();
    startGlobalTimer();
    
    // Restart music
    if (musicOn) {
        document.getElementById('bg-music').currentTime = 0;
        document.getElementById('bg-music').play();
    }
}

// ===== VISUAL EFFECTS SYSTEM =====
function rotateBackground() {
    const container = document.querySelector('.bg-container');
    if (!container) return;
    
    let currentBg = 0;
    
    function rotate() {
        container.style.opacity = '0';
        
        setTimeout(() => {
            currentBg = (currentBg + 1) % backgrounds.length;
            container.style.backgroundImage = backgrounds[currentBg];
            container.style.opacity = '0.7';
        }, 1000);
        
        // Random interval between 15-20 seconds
        setTimeout(rotate, 15000 + Math.random() * 5000);
    }
    
    rotate();
}

function launchBalloon() {
    if (!effectsOn) return;
    
    const container = document.getElementById('floating-container');
    const balloon = document.createElement('div');
    
    // Random balloon type
    const types = [
        { emoji: '🎈', color: '#ff6b8b', size: '40px' },
        { emoji: '🎈', color: '#a882dd', size: '35px' },
        { emoji: '🎈', color: '#ffd166', size: '45px' },
        { emoji: '💝', color: '#ff8fa3', size: '30px' },
        { emoji: '✨', color: '#ffffff', size: '25px' }
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
    
    // Pop on click
    balloon.addEventListener('click', () => {
        playSound('pop');
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

function createFloatingElements() {
    setInterval(() => {
        if (!effectsOn || Math.random() > 0.3) return;
        
        const emojis = ['✨', '🌟', '💫', '⭐', '⚡'];
        const emoji = emojis[Math.floor(Math.random() * emojis.length)];
        
        showFloatingText(
            emoji,
            Math.random() * window.innerWidth,
            window.innerHeight,
            ['#ff6b8b', '#a882dd', '#ffd166', '#06d6a0'][Math.floor(Math.random()*4)]
        );
    }, 3000);
}

function showFloatingText(text, x, y, color = '#ffffff') {
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
        text-shadow: 0 0 10px ${color};
        animation: floatText 2s ease-out forwards;
    `;
    
    document.body.appendChild(floatText);
    
    setTimeout(() => floatText.remove(), 2000);
}

function startEmojiRain(emojis, duration = 3000) {
    if (!effectsOn) return;
    
    const rainInterval = setInterval(() => {
        for (let i = 0; i < 3; i++) {
            showFloatingText(
                emojis[Math.floor(Math.random() * emojis.length)],
                Math.random() * window.innerWidth,
                -50,
                ['#ff6b8b', '#a882dd', '#ffd166'][Math.floor(Math.random()*3)]
            );
        }
    }, 100);
    
    setTimeout(() => clearInterval(rainInterval), duration);
}

function createConfetti(count = 100) {
    if (!effectsOn) return;
    
    const canvas = document.getElementById('confetti-canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const confetti = [];
    const colors = ['#ff6b8b', '#a882dd', '#ffd166', '#06d6a0', '#118ab2'];
    
    // Create confetti particles
    for (let i = 0; i < count; i++) {
        confetti.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            r: Math.random() * 6 + 2,
            d: Math.random() * count + 10,
            color: colors[Math.floor(Math.random() * colors.length)],
            tilt: Math.floor(Math.random() * 10) - 10,
            tiltAngleIncremental: Math.random() * 0.07 + 0.05,
            tiltAngle: 0
        });
    }
    
    // Animation loop
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        confetti.forEach((p, i) => {
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
            
            // Remove if off screen
            if (p.y > canvas.height) {
                confetti.splice(i, 1);
            }
        });
        
        if (confetti.length > 0) {
            requestAnimationFrame(draw);
        }
    }
    
    draw();
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
}

function createParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            createExplosion(x + (Math.random() - 0.5) * 50, 
                          y + (Math.random() - 0.5) * 50, 
                          color, 1);
        }, i * 30);
    }
}

function shakeScreen(intensity = 5, duration = 500) {
    if (!effectsOn) return;
    
    const body = document.body;
    const originalTransform = body.style.transform;
    
    let start = null;
    
    function doShake(timestamp) {
        if (!start) start = timestamp;
        const progress = timestamp - start;
        
        // Calculate shake offset
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

function setupMouseEffects() {
    document.addEventListener('mousemove', (e) => {
        if (!effectsOn || Math.random() > 0.1) return;
        
        // Create subtle trail
        createParticles(e.clientX, e.clientY, '#ffffff', 1);
    });
}

function randomSurprise() {
    if (!effectsOn || Math.random() > 0.5) return;
    
    const surprises = [
        () => {
            showFloatingText('🎉 SURPRISE! 🎉', 
                Math.random() * window.innerWidth,
                Math.random() * window.innerHeight);
        },
        () => {
            createConfetti(50);
            playSound('pop');
        },
        () => {
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

// ===== AUDIO SYSTEM =====
function initAudio() {
    const bgMusic = document.getElementById('bg-music');
    if (musicOn) {
        bgMusic.volume = 0.3;
        bgMusic.play().catch(e => {
            console.log("Autoplay blocked - user needs to interact");
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

function toggleEffects() {
    const btn = document.getElementById('fx-btn');
    
    if (effectsOn) {
        effectsOn = false;
        btn.innerHTML = '<i class="fas fa-magic"></i> <span>✨ OFF</span>';
    } else {
        effectsOn = true;
        btn.innerHTML = '<i class="fas fa-magic"></i> <span>✨ ON</span>';
    }
    
    playSound('click');
}

function toggleChaos() {
    const btn = document.getElementById('chaos-btn');
    
    if (chaosMode) {
        chaosMode = false;
        btn.innerHTML = '<i class="fas fa-fire"></i> <span>🔥 Normal</span>';
        document.body.classList.remove('chaos-mode');
    } else {
        chaosMode = true;
        btn.innerHTML = '<i class="fas fa-fire"></i> <span>💥 CHAOS!</span>';
        document.body.classList.add('chaos-mode');
        createConfetti(200);
        shakeScreen(5, 500);
        addScore(100);
    }
    
    playSound('click');
}

function playSound(type) {
    if (!musicOn) return;
    
    const sounds = {
        'click': document.getElementById('click-sound'),
        'pop': document.getElementById('pop-sound'),
        'confetti': document.getElementById('confetti-sound')
    };
    
    const sound = sounds[type];
    if (sound) {
        sound.currentTime = 0;
        sound.volume = type === 'confetti' ? 0.5 : 0.3;
        sound.play().catch(e => console.log("Sound play failed:", e));
    }
}

// ===== GAME SYSTEMS =====
function addScore(points) {
    totalScore += points;
    document.getElementById('total-score').textContent = totalScore;
    
    // Increase chaos level
    chaosLevel = Math.min(100, chaosLevel + points / 50);
    updateChaosMeter();
    
    // Visual feedback
    if (points >= 100) {
        showFloatingText(`+${points}`, 
            window.innerWidth - 100, 
            50, 
            '#ffd166');
    }
}

function updateChaosMeter() {
    const fill = document.getElementById('chaos-fill');
    fill.style.width = chaosLevel + '%';
    
    // Change color based on chaos level
    if (chaosLevel > 80) {
        fill.style.background = 'linear-gradient(90deg, #ff3366, #ff0066)';
    } else if (chaosLevel > 50) {
        fill.style.background = 'linear-gradient(90deg, #ff6b8b, #ff3366)';
    } else {
        fill.style.background = 'linear-gradient(90deg, var(--primary-pink), var(--purple))';
    }
}

function startGlobalTimer() {
    clearInterval(globalTimer);
    let timeLeft = 5 * 60; // 5 minutes in seconds
    
    globalTimer = setInterval(() => {
        timeLeft--;
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        document.getElementById('total-timer').textContent = 
            `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        if (timeLeft <= 0) {
            clearInterval(globalTimer);
            gameOver();
        }
        
        // Speed up background rotation as time runs low
        if (timeLeft === 60) {
            showFloatingText('⏰ 1 MINUTE LEFT!', 
                window.innerWidth/2, 
                window.innerHeight/2,
                '#ff3366');
        }
    }, 1000);
}

function gameOver() {
    gameActive = false;
    playSound('confetti');
    createConfetti(300);
    
    showFloatingText('⏰ TIME\'S UP!', 
        window.innerWidth/2, 
        window.innerHeight/2,
        '#ff3366');
    
    // Auto show final page after delay
    setTimeout(() => {
        currentPage = 8;
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        document.getElementById('page8').classList.add('active');
        setupFinalPage();
        finishCelebration();
    }, 2000);
}

// ===== KEYBOARD SHORTCUTS =====
function handleKeyboard(e) {
    switch(e.key) {
        case 'ArrowRight':
            e.preventDefault();
            nextPage();
            break;
        case ' ':
            if (currentPage === 8) {
                e.preventDefault();
                blowAllCandles();
            }
            break;
        case 'm':
        case 'M':
            toggleMusic();
            break;
        case 'c':
        case 'C':
            toggleChaos();
            break;
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
            const pageNum = parseInt(e.key);
            if (pageNum >= 1 && pageNum <= 8) {
                e.preventDefault();
                document.querySelectorAll('.page').forEach(page => {
                    page.classList.remove('active');
                });
                document.getElementById(`page${pageNum}`).classList.add('active');
                currentPage = pageNum;
                startPageAnimations(pageNum);
            }
            break;
    }
}

// ===== SECRET MODE =====
function unlockSecretMode() {
    playSound('confetti');
    createConfetti(500);
    shakeScreen(8, 1000);
    
    // Change all colors to rainbow
    document.documentElement.style.setProperty('--primary-pink', '#ff0000');
    document.documentElement.style.setProperty('--purple', '#00ff00');
    document.documentElement.style.setProperty('--gold', '#0000ff');
    
    // Add crazy animations
    document.querySelectorAll('*').forEach(el => {
        el.style.animation = 'glitch 0.3s infinite';
    });
    
    // Add massive score
    addScore(1000);
    
    // Show secret message
    showFloatingText('🎮 SECRET MODE UNLOCKED!', 
        window.innerWidth/2, 
        window.innerHeight/2,
        '#ff00ff');
    
    // Auto disable after 10 seconds
    setTimeout(() => {
        document.querySelectorAll('*').forEach(el => {
            el.style.animation = '';
        });
        document.documentElement.style.setProperty('--primary-pink', '#ff6b8b');
        document.documentElement.style.setProperty('--purple', '#a882dd');
        document.documentElement.style.setProperty('--gold', '#ffd166');
    }, 10000);
}

// ===== CSS ANIMATIONS =====
// Add missing CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes floatUp {
        0% {
            transform: translateY(0) translateX(0) rotate(0deg);
            opacity: 1;
        }
        100% {
            transform: translateY(-100vh) translateX(var(--x-move, 0)) rotate(360deg);
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
    
    .floating-balloon {
        pointer-events: auto !important;
    }
    
    .chaos-mode * {
        animation: glitch 0.5s infinite !important;
    }
    
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
`;
document.head.appendChild(style);

// ===== WINDOW RESIZE HANDLER =====
window.addEventListener('resize', () => {
    const canvas = document.getElementById('confetti-canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// ===== TOUCH SUPPORT =====
document.addEventListener('touchstart', function() {
    // Initialize audio on first touch
    if (musicOn) {
        const bgMusic = document.getElementById('bg-music');
        bgMusic.play().catch(e => console.log("Audio play failed"));
    }
}, { once: true });
