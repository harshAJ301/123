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
    setupPasswordSystem();
    preloadAudio();
    
    // Set up floating elements
    setupFloatingElements();
    
    // Set up event listeners for when website unlocks
    document.getElementById('password-submit').addEventListener('click', checkPassword);
    document.getElementById('password-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') checkPassword();
    });
});

function setupPasswordSystem() {
    const passwordInput = document.getElementById('password-input');
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
    
    // Create more floating elements
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
    errorMsg.textContent = message;
    errorMsg.classList.add('show');
    
    setTimeout(() => {
        errorMsg.classList.remove('show');
    }, 3000);
}

function shakeElement(element) {
    element.style.animation = 'shake 0.5s ease';
    setTimeout(() => {
        element.style.animation = '';
    }, 500);
}

function unlockWebsite() {
    const passwordScreen = document.getElementById('password-screen');
    const mainContent = document.getElementById('main-content');
    const submitBtn = document.getElementById('password-submit');
    
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
    setupEventListeners();
    setupGames();
    
    // Start background music
    if (musicEnabled) {
        const bgMusic = document.getElementById('bg-music');
        bgMusic.volume = 0.3;
        bgMusic.play().catch(e => {
            console.log("Audio autoplay blocked");
        });
    }
    
    // Set initial score
    updateGlobalScore();
}

function setupEventListeners() {
    // Music toggle
    document.getElementById('music-toggle').addEventListener('click', function() {
        const bgMusic = document.getElementById('bg-music');
        if (musicEnabled) {
            bgMusic.pause();
            this.innerHTML = '<i class="fas fa-music"></i> <span>MUSIC: OFF</span>';
        } else {
            bgMusic.volume = 0.3;
            bgMusic.play();
            this.innerHTML = '<i class="fas fa-music"></i> <span>MUSIC: ON</span>';
        }
        musicEnabled = !musicEnabled;
        playSound('click-sound');
    });
    
    // Sound toggle
    document.getElementById('sound-toggle').addEventListener('click', function() {
        soundEnabled = !soundEnabled;
        this.innerHTML = `<i class="fas fa-volume-up"></i> <span>SOUND: ${soundEnabled ? 'ON' : 'OFF'}</span>`;
        playSound('click-sound');
    });
    
    // Start game button
    document.getElementById('start-game-btn').addEventListener('click', function() {
        playSound('celebration-sound');
        createConfetti(100);
        addToScore(100);
        goToPage(2);
    });
    
    // Share button
    document.getElementById('share-btn').addEventListener('click', shareResults);
    
    // Setup game buttons
    setupGameButtons();
    
    // Keyboard navigation
    document.addEventListener('keydown', handleKeyboard);
}

function setupGameButtons() {
    // Game 1 buttons
    document.getElementById('game1-start').addEventListener('click', startGame1);
    
    // Game 2 buttons
    document.getElementById('game2-start').addEventListener('click', startGame2);
    document.getElementById('move-left').addEventListener('click', () => moveGift('left'));
    document.getElementById('move-right').addEventListener('click', () => moveGift('right'));
    document.getElementById('drop-gift').addEventListener('click', dropGift);
    
    // Game 3 buttons
    document.getElementById('game3-start').addEventListener('click', startGame3);
    document.getElementById('capture-btn').addEventListener('click', capturePhoto);
    
    // Game 4 buttons
    document.getElementById('game4-start').addEventListener('click', startGame4);
    
    // Celebration buttons
    document.getElementById('fireworks-btn').addEventListener('click', startFireworks);
    document.getElementById('music-btn').addEventListener('click', playBirthdayMusic);
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
    const enemies = gameArea.querySelectorAll('.enemy');
    enemies.forEach(enemy => enemy.remove());
    
    // Setup click handler for game area
    gameArea.addEventListener('click', handleCakeClick);
}

function startGame1() {
    if (game1Active) return;
    
    game1Active = true;
    document.getElementById('game1-start').disabled = true;
    document.getElementById('game1-feedback').textContent = 'Game started! Defend the cake!';
    document.getElementById('game1-feedback').className = 'game-feedback feedback-success';
    
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

function spawnEnemy() {
    if (!game1Active || game1Time <= 0) return;
    
    const gameArea = document.getElementById('game1-area');
    const enemy = document.createElement('div');
    enemy.className = 'enemy';
    
    // Random enemy type
    const enemyTypes = [
        { emoji: '📧', color: '#ff6b8b', points: 10 }, // Email
        { emoji: '💼', color: '#a882dd', points: 15 }, // Work
        { emoji: '📝', color: '#06d6a0', points: 20 }, // Homework
        { emoji: '💸', color: '#ffd166', points: 25 }  // Bills
    ];
    
    const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
    enemy.innerHTML = type.emoji;
    enemy.style.background = type.color;
    enemy.dataset.points = type.points;
    
    // Random starting position around the circle
    const angle = Math.random() * Math.PI * 2;
    const radius = 250;
    const centerX = gameArea.offsetWidth / 2;
    const centerY = gameArea.offsetHeight / 2;
    
    const startX = centerX + Math.cos(angle) * radius;
    const startY = centerY + Math.sin(angle) * radius;
    
    enemy.style.left = `${startX}px`;
    enemy.style.top = `${startY}px`;
    
    // Store enemy data
    const enemyData = {
        element: enemy,
        targetX: centerX,
        targetY: centerY,
        speed: 1 + Math.random() * 2,
        angle: Math.atan2(centerY - startY, centerX - startX)
    };
    
    game1Enemies.push(enemyData);
    gameArea.appendChild(enemy);
}

function updateGame1() {
    if (!game1Active) return;
    
    // Update timer
    game1Time--;
    document.getElementById('game1-time').textContent = game1Time;
    
    // Move enemies
    game1Enemies.forEach((enemy, index) => {
        const dx = Math.cos(enemy.angle) * enemy.speed;
        const dy = Math.sin(enemy.angle) * enemy.speed;
        
        const currentX = parseFloat(enemy.element.style.left);
        const currentY = parseFloat(enemy.element.style.top);
        
        enemy.element.style.left = `${currentX + dx}px`;
        enemy.element.style.top = `${currentY + dy}px`;
        
        // Check if enemy reached cake (distance < 100px)
        const distance = Math.sqrt(
            Math.pow(currentX - enemy.targetX, 2) + 
            Math.pow(currentY - enemy.targetY, 2)
        );
        
        if (distance < 100) {
            // Enemy reached cake
            enemy.element.remove();
            game1Enemies.splice(index, 1);
            loseLife();
        }
    });
    
    // Check win/lose conditions
    if (game1Time <= 0) {
        winGame1();
    } else if (game1Lives <= 0) {
        loseGame1();
    }
}

function handleCakeClick(e) {
    if (!game1Active || e.target.id === 'cake' || e.target.id === 'game1-area') return;
    
    if (e.target.classList.contains('enemy')) {
        // Clicked an enemy
        const points = parseInt(e.target.dataset.points);
        game1Score += points;
        addToScore(points);
        
        // Remove enemy
        const enemyIndex = game1Enemies.findIndex(enemy => enemy.element === e.target);
        if (enemyIndex > -1) {
            game1Enemies.splice(enemyIndex, 1);
        }
        
        // Visual feedback
        e.target.style.transform = 'scale(1.5)';
        e.target.style.opacity = '0.5';
        
        // Play sound
        playSound('pop-sound');
        
        // Create particle effect
        createClickEffect(e.clientX, e.clientY, e.target.style.background);
        
        // Remove after animation
        setTimeout(() => {
            if (e.target.parentNode) {
                e.target.remove();
            }
        }, 300);
        
        updateGame1UI();
    }
}

function loseLife() {
    game1Lives--;
    updateGame1UI();
    
    if (game1Lives > 0) {
        document.getElementById('game1-feedback').textContent = `Cake attacked! ${game1Lives} lives left!`;
        document.getElementById('game1-feedback').className = 'game-feedback feedback-error';
        
        // Visual feedback
        const cake = document.getElementById('cake');
        cake.style.animation = 'none';
        setTimeout(() => {
            cake.style.animation = 'cakeFloat 3s infinite ease-in-out';
        }, 10);
        
        cake.style.transform = 'translate(-50%, -50%) scale(1.2)';
        setTimeout(() => {
            cake.style.transform = 'translate(-50%, -50%) scale(1)';
        }, 300);
    }
}

function winGame1() {
    clearInterval(game1Interval);
    game1Active = false;
    
    const bonus = game1Lives * 100 + game1Time * 10;
    game1Score += bonus;
    addToScore(bonus);
    
    updateGame1UI();
    
    document.getElementById('game1-feedback').innerHTML = 
        `🎉 VICTORY! Cake defended!<br>+${bonus} bonus points!`;
    document.getElementById('game1-feedback').className = 'game-feedback feedback-success';
    
    document.getElementById('game1-next').disabled = false;
    
    // Celebration
    playSound('success-sound');
    createConfetti(150);
}

function loseGame1() {
    clearInterval(game1Interval);
    game1Active = false;
    
    document.getElementById('game1-feedback').textContent = 
        '💔 Cake destroyed! Try again!';
    document.getElementById('game1-feedback').className = 'game-feedback feedback-error';
    
    document.getElementById('game1-start').disabled = false;
    
    // Sad animation
    const cake = document.getElementById('cake');
    cake.innerHTML = '😢';
    cake.style.background = '#666';
}

function updateGame1UI() {
    document.getElementById('game1-score').textContent = game1Score;
    document.getElementById('game1-lives').textContent = game1Lives;
}

// ===== GAME 2: GIFT STACKER =====
function setupGame2() {
    // Reset game state
    game2Score = 0;
    game2Height = 0;
    game2Combo = 1;
    stackedGifts = [];
    
    // Update UI
    updateGame2UI();
    
    // Clear stack area
    const stackArea = document.querySelector('.stack-area');
    stackArea.innerHTML = '';
    
    // Create new falling gift
    createNewGift();
}

function createNewGift() {
    if (!game2Active) return;
    
    const stackArea = document.querySelector('.stack-area');
    const gift = document.createElement('div');
    gift.className = 'falling-gift';
    
    // Random gift properties
    const giftTypes = [
        { emoji: '🎁', color: '#ff6b8b' },
        { emoji: '🎀', color: '#ff8fa3' },
        { emoji: '🎊', color: '#a882dd' },
        { emoji: '🎉', color: '#06d6a0' },
        { emoji: '✨', color: '#ffd166' }
    ];
    
    const type = giftTypes[Math.floor(Math.random() * giftTypes.length)];
    gift.innerHTML = type.emoji;
    gift.style.background = type.color;
    gift.style.width = `${80 + Math.random() * 40}px`;
    
    // Start at top center
    gift.style.left = '50%';
    gift.style.top = '0px';
    gift.style.transform = 'translateX(-50%)';
    
    currentGift = {
        element: gift,
        x: stackArea.offsetWidth / 2,
        width: parseInt(gift.style.width),
        speed: 2,
        type: type
    };
    
    stackArea.appendChild(gift);
    
    // Start falling animation
    animateGiftFall();
}

function animateGiftFall() {
    if (!game2Active || !currentGift) return;
    
    const fallInterval = setInterval(() => {
        if (!game2Active || !currentGift) {
            clearInterval(fallInterval);
            return;
        }
        
        const gift = currentGift.element;
        const currentTop = parseFloat(gift.style.top);
        
        // Check if gift reached bottom or top of stack
        const stackBottom = 400 - game2Height * 40;
        
        if (currentTop >= stackBottom) {
            // Gift reached stack
            clearInterval(fallInterval);
            placeGiftOnStack();
        } else {
            // Continue falling
            gift.style.top = `${currentTop + currentGift.speed}px`;
        }
    }, 16);
}

function moveGift(direction) {
    if (!game2Active || !currentGift) return;
    
    const gift = currentGift.element;
    const stackArea = document.querySelector('.stack-area');
    const areaWidth = stackArea.offsetWidth;
    
    let newX = currentGift.x;
    const moveAmount = 20;
    
    if (direction === 'left') {
        newX = Math.max(currentGift.width / 2, newX - moveAmount);
    } else {
        newX = Math.min(areaWidth - currentGift.width / 2, newX + moveAmount);
    }
    
    currentGift.x = newX;
    gift.style.left = `${newX}px`;
    gift.style.transform = 'translateX(-50%)';
    
    playSound('click-sound');
}

function dropGift() {
    if (!game2Active || !currentGift) return;
    
    currentGift.speed = 10; // Fast drop
    
    playSound('click-sound');
}

function placeGiftOnStack() {
    if (!currentGift) return;
    
    const gift = currentGift.element;
    gift.className = 'stacked-gift';
    gift.style.background = currentGift.type.color;
    gift.style.top = `${400 - game2Height * 40}px`;
    gift.style.left = `${currentGift.x}px`;
    gift.style.transform = 'translateX(-50%)';
    
    // Check placement accuracy
    const center = 150; // Center of stack area
    const offset = Math.abs(currentGift.x - center);
    const maxOffset = 75;
    const accuracy = Math.max(0, 100 - (offset / maxOffset) * 100);
    
    // Calculate points
    let points = Math.floor(10 * accuracy / 100);
    if (accuracy > 90) {
        game2Combo++;
        points *= game2Combo;
    } else {
        game2Combo = 1;
    }
    
    game2Score += points;
    game2Height++;
    addToScore(points);
    
    // Store gift data
    stackedGifts.push({
        element: gift,
        x: currentGift.x,
        width: currentGift.width
    });
    
    // Check if stack is stable
    if (!isStackStable()) {
        endGame2();
        return;
    }
    
    // Check win condition
    if (game2Height >= 20) {
        winGame2();
        return;
    }
    
    updateGame2UI();
    
    // Create new gift
    setTimeout(() => {
        if (game2Active) {
            createNewGift();
        }
    }, 500);
}

function isStackStable() {
    if (stackedGifts.length < 2) return true;
    
    const lastGift = stackedGifts[stackedGifts.length - 1];
    const secondLastGift = stackedGifts[stackedGifts.length - 2];
    
    // Check if gift is too far off center
    const center = 150;
    const offset = Math.abs(lastGift.x - center);
    
    return offset < 100; // Allow some offset
}

function startGame2() {
    if (game2Active) return;
    
    game2Active = true;
    document.getElementById('game2-start').disabled = true;
    document.getElementById('game2-feedback').textContent = 'Game started! Stack those gifts!';
    document.getElementById('game2-feedback').className = 'game-feedback feedback-success';
    
    createNewGift();
}

function winGame2() {
    game2Active = false;
    
    const bonus = game2Combo * 500;
    game2Score += bonus;
    addToScore(bonus);
    
    updateGame2UI();
    
    document.getElementById('game2-feedback').innerHTML = 
        `🎉 PERFECT STACK!<br>+${bonus} combo bonus!`;
    document.getElementById('game2-feedback').className = 'game-feedback feedback-success';
    
    document.getElementById('game2-next').disabled = false;
    
    // Celebration
    playSound('success-sound');
    createConfetti(150);
}

function endGame2() {
    game2Active = false;
    
    document.getElementById('game2-feedback').textContent = 
        '💔 Stack collapsed! Try again!';
    document.getElementById('game2-feedback').className = 'game-feedback feedback-error';
    
    document.getElementById('game2-start').disabled = false;
    
    // Animate collapse
    stackedGifts.forEach((gift, index) => {
        setTimeout(() => {
            gift.element.style.transform = 'translateX(-50%) rotate(45deg)';
            gift.element.style.opacity = '0.5';
        }, index * 50);
    });
}

function updateGame2UI() {
    document.getElementById('game2-score').textContent = game2Score;
    document.getElementById('game2-height').textContent = game2Height;
    document.getElementById('game2-combo').textContent = game2Combo + 'x';
}

// ===== GAME 3: PARTY PHOTOGRAPHER =====
function setupGame3() {
    // Reset game state
    game3Score = 0;
    game3Photos = 0;
    game3Accuracy = 100;
    currentGuests = [];
    
    // Update UI
    updateGame3UI();
    
    // Clear photo frame
    const photoFrame = document.querySelector('.photo-frame');
    photoFrame.innerHTML = '';
}

function spawnGuest() {
    if (!game3Active || game3Photos >= 10) return;
    
    const photoFrame = document.querySelector('.photo-frame');
    const guest = document.createElement('div');
    guest.className = 'guest';
    
    // Random guest with pose
    const guestTypes = [
        { emoji: '😎', pose: 'cool' },
        { emoji: '🤪', pose: 'crazy' },
        { emoji: '😜', pose: 'wink' },
        { emoji: '🤩', pose: 'star' },
        { emoji: '🥳', pose: 'party' },
        { emoji: '🕺', pose: 'dance' }
    ];
    
    const type = guestTypes[Math.floor(Math.random() * guestTypes.length)];
    guest.innerHTML = type.emoji;
    guest.dataset.pose = type.pose;
    
    // Random position
    const frameWidth = photoFrame.offsetWidth;
    const frameHeight = photoFrame.offsetHeight;
    
    const x = Math.random() * (frameWidth - 80) + 40;
    const y = Math.random() * (frameHeight - 80) + 40;
    
    guest.style.left = `${x}px`;
    guest.style.top = `${y}px`;
    
    // Random pose timing
    const poseDelay = 500 + Math.random() * 1500;
    const poseDuration = 500 + Math.random() * 1000;
    
    guest.dataset.poseTime = Date.now() + poseDelay;
    guest.dataset.poseEnd = Date.now() + poseDelay + poseDuration;
    
    photoFrame.appendChild(guest);
    currentGuests.push(guest);
    
    // Set up pose animation
    setTimeout(() => {
        if (guest.parentNode) {
            guest.style.animation = 'guestPose 0.5s infinite alternate';
            guest.style.fontSize = '5rem';
            guest.style.filter = 'drop-shadow(0 0 20px gold)';
        }
    }, poseDelay);
    
    // Remove guest after pose ends
    setTimeout(() => {
        if (guest.parentNode) {
            guest.remove();
            const index = currentGuests.indexOf(guest);
            if (index > -1) currentGuests.splice(index, 1);
            
            // Spawn new guest if game still active
            if (game3Active && game3Photos < 10) {
                setTimeout(spawnGuest, 500);
            }
        }
    }, poseDelay + poseDuration);
}

function capturePhoto() {
    if (!game3Active) return;
    
    playSound('camera-sound');
    
    // Flash effect
    const flash = document.getElementById('flash');
    flash.style.opacity = '0.8';
    setTimeout(() => {
        flash.style.opacity = '0';
    }, 200);
    
    // Check for posed guests
    const now = Date.now();
    let photoTaken = false;
    
    currentGuests.forEach(guest => {
        const poseTime = parseInt(guest.dataset.poseTime);
        const poseEnd = parseInt(guest.dataset.poseEnd);
        
        if (now >= poseTime && now <= poseEnd) {
            // Perfect timing!
            photoTaken = true;
            game3Photos++;
            game3Score += 100;
            addToScore(100);
            
            // Visual feedback
            guest.style.animation = 'none';
            guest.innerHTML = '📸';
            guest.style.color = '#06d6a0';
            guest.style.filter = 'drop-shadow(0 0 30px #06d6a0)';
            
            // Remove after celebration
            setTimeout(() => {
                if (guest.parentNode) {
                    guest.remove();
                    const index = currentGuests.indexOf(guest);
                    if (index > -1) currentGuests.splice(index, 1);
                }
            }, 1000);
            
            // Spawn new guest
            if (game3Active && game3Photos < 10) {
                setTimeout(spawnGuest, 1000);
            }
        }
    });
    
    if (photoTaken) {
        document.getElementById('game3-feedback').textContent = '📸 PERFECT SHOT! +100 points!';
        document.getElementById('game3-feedback').className = 'game-feedback feedback-success';
    } else {
        document.getElementById('game3-feedback').textContent = '⏱️ Missed the pose! Try again!';
        document.getElementById('game3-feedback').className = 'game-feedback feedback-error';
        
        // Reduce accuracy
        game3Accuracy = Math.max(0, game3Accuracy - 10);
    }
    
    updateGame3UI();
    
    // Check win condition
    if (game3Photos >= 10) {
        winGame3();
    }
}

function startGame3() {
    if (game3Active) return;
    
    game3Active = true;
    document.getElementById('game3-start').disabled = true;
    document.getElementById('game3-feedback').textContent = 'Game started! Capture the poses!';
    document.getElementById('game3-feedback').className = 'game-feedback feedback-success';
    
    // Spawn first guest
    spawnGuest();
}

function winGame3() {
    game3Active = false;
    
    const bonus = Math.floor(game3Accuracy * 10);
    game3Score += bonus;
    addToScore(bonus);
    
    updateGame3UI();
    
    document.getElementById('game3-feedback').innerHTML = 
        `🎉 PHOTO ALBUM COMPLETE!<br>+${bonus} accuracy bonus!`;
    document.getElementById('game3-feedback').className = 'game-feedback feedback-success';
    
    document.getElementById('game3-next').disabled = false;
    
    // Celebration
    playSound('success-sound');
    createConfetti(150);
}

function updateGame3UI() {
    document.getElementById('game3-score').textContent = game3Score;
    document.getElementById('game3-photos').textContent = `${game3Photos}/10`;
    document.getElementById('game3-accuracy').textContent = `${game3Accuracy}%`;
}

// ===== GAME 4: DANCE FLOOR =====
function setupGame4() {
    // Reset game state
    game4Score = 0;
    game4Streak = 0;
    game4Accuracy = 100;
    danceSequence = [];
    currentDanceStep = 0;
    
    // Update UI
    updateGame4UI();
    
    // Setup dance floor
    setupDanceFloor();
}

function setupDanceFloor() {
    const danceFloor = document.getElementById('dance-floor');
    danceFloor.innerHTML = '';
    
    // Create 3x4 grid of tiles
    for (let i = 0; i < 12; i++) {
        const tile = document.createElement('div');
        tile.className = 'dance-tile';
        tile.dataset.index = i;
        danceFloor.appendChild(tile);
    }
}

function generateDanceStep() {
    if (!game4Active || danceSequence.length >= 30) return;
    
    const directions = ['up', 'down', 'left', 'right'];
    const direction = directions[Math.floor(Math.random() * directions.length)];
    
    // Map direction to tile index
    let tileIndex;
    switch(direction) {
        case 'up': tileIndex = 1; break;
        case 'down': tileIndex = 9; break;
        case 'left': tileIndex = 4; break;
        case 'right': tileIndex = 7; break;
    }
    
    danceSequence.push({
        direction: direction,
        tileIndex: tileIndex,
        timestamp: Date.now() + 1000 // Show after 1 second
    });
    
    // Update arrow indicator
    const arrowIndicator = document.getElementById('arrow-indicator');
    const arrows = { up: '⬆️', down: '⬇️', left: '⬅️', right: '➡️' };
    arrowIndicator.textContent = arrows[direction];
    
    // Show tile highlight
    highlightTile(tileIndex);
    
    // Schedule next step
    if (danceSequence.length < 30) {
        setTimeout(generateDanceStep, 1500);
    }
}

function highlightTile(index) {
    const tiles = document.querySelectorAll('.dance-tile');
    tiles.forEach(tile => tile.classList.remove('active'));
    
    if (tiles[index]) {
        tiles[index].classList.add('active');
        
        // Remove highlight after time
        setTimeout(() => {
            tiles[index].classList.remove('active');
        }, 1000);
    }
}

function handleDanceInput(direction) {
    if (!game4Active || danceSequence.length === 0) return;
    
    const currentStep = danceSequence[0];
    const now = Date.now();
    const timeDiff = Math.abs(now - currentStep.timestamp);
    
    if (direction === currentStep.direction && timeDiff < 500) {
        // Perfect input!
        game4Streak++;
        game4Score += 50 * game4Streak;
        addToScore(50 * game4Streak);
        
        danceSequence.shift();
        currentDanceStep++;
        
        document.getElementById('game4-feedback').textContent = 
            `🎯 PERFECT! Streak: ${game4Streak}x`;
        document.getElementById('game4-feedback').className = 'game-feedback feedback-success';
        
                playSound('click-sound');
        
        // Visual feedback
        highlightTile(currentStep.tileIndex);
        setTimeout(() => {
            highlightTile(-1); // Clear highlight
        }, 200);
        
    } else {
        // Wrong input or bad timing
        game4Streak = 0;
        game4Accuracy = Math.max(0, game4Accuracy - 5);
        
        document.getElementById('game4-feedback').textContent = 
            '💥 Missed! Watch the timing!';
        document.getElementById('game4-feedback').className = 'game-feedback feedback-error';
        
        playSound('pop-sound');
    }
    
    updateGame4UI();
    
    // Check win condition
    if (currentDanceStep >= 30) {
        winGame4();
    }
}

function startGame4() {
    if (game4Active) return;
    
    game4Active = true;
    document.getElementById('game4-start').disabled = true;
    document.getElementById('game4-feedback').textContent = 'Game started! Follow the arrows!';
    document.getElementById('game4-feedback').className = 'game-feedback feedback-success';
    
    // Start generating dance steps
    generateDanceStep();
}

function winGame4() {
    game4Active = false;
    
    const bonus = game4Streak * 200 + game4Accuracy * 5;
    game4Score += bonus;
    addToScore(bonus);
    
    updateGame4UI();
    
    document.getElementById('game4-feedback').innerHTML = 
        `🎉 DANCE PARTY COMPLETE!<br>+${bonus} bonus points!`;
    document.getElementById('game4-feedback').className = 'game-feedback feedback-success';
    
    document.getElementById('game4-next').disabled = false;
    
    // Celebration
    playSound('success-sound');
    createConfetti(200);
    
    // Make all tiles dance
    const tiles = document.querySelectorAll('.dance-tile');
    tiles.forEach(tile => {
        tile.classList.add('active');
        tile.style.animation = 'guestPose 0.5s infinite alternate';
    });
}

function updateGame4UI() {
    document.getElementById('game4-score').textContent = game4Score;
    document.getElementById('game4-streak').textContent = game4Streak;
    document.getElementById('game4-accuracy').textContent = `${game4Accuracy}%`;
}

// ===== UTILITY FUNCTIONS =====
function playSound(soundId, volume = 0.5) {
    if (!soundEnabled) return;
    
    const sound = document.getElementById(soundId);
    if (sound) {
        sound.currentTime = 0;
        sound.volume = volume;
        sound.play().catch(e => {
            console.log("Audio play failed:", e);
        });
    }
}

function addToScore(points) {
    totalScore += points;
    updateGlobalScore();
    
    // Animate score update
    const scoreDisplay = document.getElementById('global-score');
    scoreDisplay.style.transform = 'scale(1.3)';
    scoreDisplay.style.color = '#ffd166';
    
    setTimeout(() => {
        scoreDisplay.style.transform = 'scale(1)';
        scoreDisplay.style.color = '';
    }, 300);
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

// Add click effect animation to style
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
    `;
    document.head.appendChild(style);
}

function createConfetti(count = 100) {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;
    
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

function showFinalScore() {
    // Calculate grade based on performance
    let grade = 'C';
    let message = 'Good job!';
    
    if (totalScore >= 5000) {
        grade = 'A+';
        message = 'BIRTHDAY CHAMPION! 🏆';
    } else if (totalScore >= 4000) {
        grade = 'A';
        message = 'AMAZING SKILLS!';
    } else if (totalScore >= 3000) {
        grade = 'B';
        message = 'GREAT EFFORT!';
    } else if (totalScore >= 2000) {
        grade = 'C';
        message = 'WELL PLAYED!';
    }
    
    // Update celebration page
    const celebrationText = document.querySelector('#page6 .welcome-subtitle');
    if (celebrationText) {
        celebrationText.innerHTML = `
            You completed all 4 birthday games!<br>
            <strong style="color: #ffd166; font-size: 2rem;">${message}</strong><br>
            Final Grade: <span style="color: #ff6b8b">${grade}</span>
        `;
    }
    
    // Create extra celebration
    if (totalScore >= 3000) {
        createConfetti(300);
        playSound('celebration-sound');
    }
}

function startFireworks() {
    playSound('celebration-sound');
    
    // Create intense fireworks
    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            createConfetti(200);
        }, i * 300);
    }
    
    // Visual feedback
    const btn = document.getElementById('fireworks-btn');
    btn.innerHTML = '<i class="fas fa-fire"></i> FIREWORKS ACTIVE!';
    btn.style.background = 'linear-gradient(45deg, #ff0000, #ff9500)';
    
    setTimeout(() => {
        btn.innerHTML = '<i class="fas fa-fireworks"></i> FIREWORKS SHOW';
        btn.style.background = 'linear-gradient(45deg, #ff6b8b, #ff8fa3)';
    }, 3000);
}

function playBirthdayMusic() {
    const btn = document.getElementById('music-btn');
    const celebrationSound = document.getElementById('celebration-sound');
    
    if (celebrationSound.paused) {
        celebrationSound.currentTime = 0;
        celebrationSound.volume = 0.7;
        celebrationSound.play();
        btn.innerHTML = '<i class="fas fa-pause"></i> STOP MUSIC';
        btn.style.background = 'linear-gradient(45deg, #06d6a0, #118ab2)';
    } else {
        celebrationSound.pause();
        btn.innerHTML = '<i class="fas fa-music"></i> BIRTHDAY MUSIC';
        btn.style.background = 'linear-gradient(45deg, #a882dd, #c19ee0)';
    }
}

function shareResults() {
    const shareText = `🎮 I scored ${totalScore} points in Jenisha's Birthday Arcade! Can you beat my score?`;
    
    if (navigator.share) {
        navigator.share({
            title: 'Jenisha\'s Birthday Arcade',
            text: shareText,
            url: window.location.href
        });
    } else {
        // Fallback: Copy to clipboard
        navigator.clipboard.writeText(shareText + '\n' + window.location.href)
            .then(() => {
                alert('Results copied to clipboard! Share it with friends!');
            })
            .catch(err => {
                alert('Share this link: ' + window.location.href);
            });
    }
}

// ===== WINDOW RESIZE HANDLER =====
window.addEventListener('resize', () => {
    const canvas = document.getElementById('confetti-canvas');
    if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
});

// ===== INITIALIZE WHEN UNLOCKED =====
// If password screen is hidden (testing), initialize immediately
if (document.getElementById('password-screen').style.display === 'none') {
    setTimeout(() => {
        document.getElementById('main-content').classList.add('show');
        initMainWebsite();
    }, 1000);
}
