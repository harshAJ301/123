// Current page tracking
let currentPage = 1;
const totalPages = 8;

// Navigate to next page
function nextPage() {
    // Hide current page
    document.getElementById(`page${currentPage}`).classList.remove('active');
    
    // Show next page
    currentPage++;
    const nextPageEl = document.getElementById(`page${currentPage}`);
    nextPageEl.classList.add('active');
    
    // Start page-specific animations
    startPageAnimation(currentPage);
}

// Start animation based on page
function startPageAnimation(pageNum) {
    switch(pageNum) {
        case 2:
            startCountdown();
            break;
        case 4:
            resetQuiz();
            break;
        case 5:
            startErrorAnimation();
            break;
        case 6:
            startStory();
            break;
        case 8:
            resetCandles();
            break;
    }
}

// PAGE 2: Countdown
function startCountdown() {
    let count = 5;
    const countdownEl = document.getElementById('countdown');
    const cakeEl = document.getElementById('hidden-cake');
    
    const countdownInterval = setInterval(() => {
        countdownEl.textContent = count;
        
        if (count === 0) {
            clearInterval(countdownInterval);
            countdownEl.textContent = '🎉';
            cakeEl.classList.add('show');
            
            // Create confetti
            createConfetti();
            
            // Auto continue after 2 seconds
            setTimeout(() => {
                nextPage();
            }, 2000);
        }
        
        count--;
    }, 1000);
}

// PAGE 3: Tap Game
let tapCount = 0;
function tapCake() {
    const cakeEl = document.getElementById('tap-cake');
    const tapCountEl = document.getElementById('tap-count');
    const continueBtn = document.getElementById('continue-btn');
    
    // Shake animation
    cakeEl.style.transform = `scale(${0.9 + Math.random()*0.2}) rotate(${Math.random()*10-5}deg)`;
    
    // Update count
    tapCount++;
    tapCountEl.textContent = tapCount;
    
    // Check if completed
    if (tapCount >= 10) {
        createConfetti();
        continueBtn.disabled = false;
        continueBtn.innerHTML = 'Continue <i class="fas fa-unlock"></i>';
    }
    
    // Reset animation
    setTimeout(() => {
        cakeEl.style.transform = 'scale(1) rotate(0deg)';
    }, 100);
}

// PAGE 4: Quiz
let currentQuestion = 1;
let correctAnswers = 0;

function selectAnswer(questionNum, answerNum) {
    const responseEl = document.getElementById('quiz-response');
    const nextBtn = document.getElementById('quiz-next');
    
    if (questionNum === 1) {
        if (answerNum === 1) {
            responseEl.innerHTML = '<p class="correct-answer">✓ Correct. Universe agrees.</p>';
            correctAnswers++;
        } else {
            responseEl.innerHTML = '<p class="wrong-answer">✗ Nope, try again!</p>';
        }
        
        // Show next question after delay
        setTimeout(() => {
            document.getElementById('question1').classList.add('hidden');
            document.getElementById('question2').classList.remove('hidden');
            responseEl.innerHTML = '';
        }, 1000);
        
    } else if (questionNum === 2) {
        if (answerNum === 3) {
            responseEl.innerHTML = '<p class="correct-answer">✓ Approved by birthday law 🎉</p>';
            correctAnswers++;
        } else {
            responseEl.innerHTML = '<p class="wrong-answer">✗ Not approved!</p>';
        }
        
        // Show next button
        setTimeout(() => {
            nextBtn.classList.remove('hidden');
        }, 1000);
    }
}

function resetQuiz() {
    currentQuestion = 1;
    correctAnswers = 0;
    document.getElementById('question1').classList.remove('hidden');
    document.getElementById('question2').classList.add('hidden');
    document.getElementById('quiz-next').classList.add('hidden');
    document.getElementById('quiz-response').innerHTML = '';
}

// PAGE 5: Fake 404
function startErrorAnimation() {
    const loadingBar = document.querySelector('.loading-bar');
    const jkText = document.getElementById('jk');
    
    // Animate loading bar
    setTimeout(() => {
        loadingBar.style.width = '100%';
    }, 100);
    
    // Show "just kidding" after delay
    setTimeout(() => {
        jkText.classList.remove('hidden');
    }, 2200);
    
    // Auto continue
    setTimeout(() => {
        nextPage();
    }, 4000);
}

// PAGE 6: Story
function startStory() {
    const lines = document.querySelectorAll('.story-line');
    let delay = 500;
    
    lines.forEach((line, index) => {
        setTimeout(() => {
            line.classList.add('show');
        }, delay * index);
    });
}

// PAGE 7: Danger Button
function pressButton() {
    const button = document.getElementById('trap-button');
    const result = document.getElementById('button-result');
    const nextBtn = document.getElementById('button-next');
    
    // Button explosion effect
    button.style.transform = 'scale(1.5)';
    button.style.opacity = '0.5';
    button.disabled = true;
    
    // Create massive confetti
    createConfetti(200);
    
    // Shake screen
    document.body.style.animation = 'shake 0.5s';
    
    // Show result
    setTimeout(() => {
        result.classList.remove('hidden');
    }, 500);
    
    // Show next button
    setTimeout(() => {
        nextBtn.classList.remove('hidden');
        document.body.style.animation = '';
    }, 1500);
}

// PAGE 8: Blow Candles
let candlesBlown = 0;
function blowCandle(candleNum) {
    const candle = document.querySelectorAll('.candle')[candleNum - 1];
    
    if (!candle.classList.contains('blown')) {
        candle.classList.add('blown');
        candlesBlown++;
        
        // Play blow sound (optional - would need audio file)
        // new Audio('blow.mp3').play();
        
        // Check if all candles blown
        if (candlesBlown >= 3) {
            setTimeout(() => {
                document.getElementById('final-message').classList.remove('hidden');
                createConfetti(300);
            }, 500);
        }
    }
}

function resetCandles() {
    candlesBlown = 0;
    document.querySelectorAll('.candle').forEach(candle => {
        candle.classList.remove('blown');
    });
    document.getElementById('final-message').classList.add('hidden');
}

// CONFETTI SYSTEM
function createConfetti(amount = 100) {
    const canvas = document.getElementById('confetti-canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const confetti = [];
    const colors = ['#ff6b8b', '#a882dd', '#4CAF50', '#FFC107', '#2196F3'];
    
    // Create confetti particles
    for (let i = 0; i < amount; i++) {
        confetti.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            r: Math.random() * 10 + 5,
            d: Math.random() * amount + 10,
            color: colors[Math.floor(Math.random() * colors.length)],
            tilt: Math.floor(Math.random() * 10) - 10,
            tiltAngleIncremental: Math.random() * 0.07 + 0.05,
            tiltAngle: 0
        });
    }
    
    // Animation loop
    function drawConfetti() {
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
        
        // Continue animation if there are still particles
        if (confetti.length > 0) {
            requestAnimationFrame(drawConfetti);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }
    
    drawConfetti();
}

// Handle window resize
window.addEventListener('resize', () => {
    const canvas = document.getElementById('confetti-canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// Add shake animation to CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
        20%, 40%, 60%, 80% { transform: translateX(10px); }
    }
    
    .correct-answer {
        color: #4CAF50;
        font-weight: bold;
        margin-top: 10px;
    }
    
    .wrong-answer {
        color: #ff6b8b;
        margin-top: 10px;
    }
`;
document.head.appendChild(style);
