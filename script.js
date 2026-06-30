/**
 * ============================================
 * DIGITAL FLOWERS - SIMPLIFIED WORKING VERSION
 * ============================================
 */

// ============================================
// STATE
// ============================================
let flowerCount = 2229;
let seedCount = 31;
let isPinching = false;
let isWaving = false;
let lastPinchTime = 0;
let lastWaveTime = 0;

// ============================================
// DOM REFERENCES
// ============================================
const video = document.getElementById('camera-feed');
const handCanvas = document.getElementById('hand-canvas');
const ctx = handCanvas.getContext('2d');
const loadingScreen = document.getElementById('loading-screen');
const beginScreen = document.getElementById('begin-screen');
const beginButton = document.getElementById('begin-button');
const actionHint = document.getElementById('action-hint');

// ============================================
// RESIZE CANVAS
// ============================================
function resizeCanvas() {
    handCanvas.width = window.innerWidth;
    handCanvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// ============================================
// LOADING & BEGIN FLOW
// ============================================
function hideLoading() {
    loadingScreen.classList.add('hidden');
    setTimeout(() => {
        loadingScreen.style.display = 'none';
        beginScreen.classList.add('visible');
    }, 500);
}

// After 2 seconds, show begin button
setTimeout(hideLoading, 2000);

beginButton.addEventListener('click', () => {
    beginScreen.classList.remove('visible');
    beginScreen.style.display = 'none';
    startCamera();
});

// ============================================
// START CAMERA
// ============================================
async function startCamera() {
    try {
        actionHint.textContent = '✦ starting camera... ✦';
        
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { 
                facingMode: 'user',
                width: { ideal: 640 },
                height: { ideal: 480 }
            }
        });
        
        video.srcObject = stream;
        await video.play();
        
        actionHint.textContent = '✦ loading hand tracking... ✦';
        
        // Initialize MediaPipe
        const hands = new Hands({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
            }
        });
        
        hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 1,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });
        
        hands.onResults((results) => {
            onHandResults(results);
        });
        
        const camera = new Camera(video, {
            onFrame: async () => {
                try {
                    await hands.send({ image: video });
                } catch (e) {
                    // Silently handle frame errors
                }
            },
            width: 640,
            height: 480
        });
        
        await camera.start();
        
        actionHint.textContent = '✦ show your hand to the camera ✦';
        actionHint.style.color = 'rgba(255,255,255,0.6)';
        
        console.log('✅ Hand tracking started successfully!');
        
    } catch (error) {
        console.error('❌ Camera error:', error);
        actionHint.textContent = '❌ camera access denied • refresh and try again';
        actionHint.style.color = '#ff6b9d';
        
        // Show retry button
        const retryBtn = document.createElement('button');
        retryBtn.textContent = '✦ retry ✦';
        retryBtn.style.cssText = `
            position: fixed;
            bottom: 120px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 100;
            padding: 14px 40px;
            background: rgba(255,255,255,0.1);
            border: 1px solid rgba(255,255,255,0.2);
            border-radius: 40px;
            color: white;
            font-size: 1rem;
            letter-spacing: 0.15em;
            cursor: pointer;
            transition: all 0.3s ease;
        `;
        document.body.appendChild(retryBtn);
        retryBtn.addEventListener('click', () => {
            retryBtn.remove();
            startCamera();
        });
    }
}

// ============================================
// HAND RESULTS HANDLER
// ============================================
function onHandResults(results) {
    // Clear canvas
    ctx.clearRect(0, 0, handCanvas.width, handCanvas.height);
    
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        
        // Draw hand
        drawHand(landmarks);
        
        // Process gestures
        processGestures(landmarks);
        
        // Update action hint
        actionHint.textContent = '✦ hand detected • try pinch or wave ✦';
        actionHint.style.color = 'rgba(255,255,255,0.8)';
        
    } else {
        actionHint.textContent = '✦ show your hand to the camera ✦';
        actionHint.style.color = 'rgba(255,255,255,0.4)';
    }
}

// ============================================
// DRAW HAND FUNCTION
// ============================================
function drawHand(landmarks) {
    const w = handCanvas.width;
    const h = handCanvas.height;
    
    // Hand connections
    const connections = [
        [0,1],[1,2],[2,3],[3,4],
        [0,5],[5,6],[6,7],[7,8],
        [0,9],[9,10],[10,11],[11,12],
        [0,13],[13,14],[14,15],[15,16],
        [0,17],[17,18],[18,19],[19,20],
        [5,9],[9,13],[13,17]
    ];
    
    // Draw connections
    connections.forEach(([i, j]) => {
        const p1 = landmarks[i];
        const p2 = landmarks[j];
        
        ctx.beginPath();
        ctx.moveTo(p1.x * w, p1.y * h);
        ctx.lineTo(p2.x * w, p2.y * h);
        ctx.strokeStyle = 'rgba(247, 212, 74, 0.3)';
        ctx.lineWidth = 2;
        ctx.shadowColor = 'rgba(247, 212, 74, 0.1)';
        ctx.shadowBlur = 10;
        ctx.stroke();
    });
    
    ctx.shadowBlur = 0;
    
    // Draw landmarks
    const colors = ['#f7d44a', '#ff6b9d', '#a855f7', '#3b82f6', '#06b6d4'];
    landmarks.forEach((landmark, index) => {
        const x = landmark.x * w;
        const y = landmark.y * h;
        const color = colors[Math.floor(index / 4) % colors.length];
        
        // Glow
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, 15);
        gradient.addColorStop(0, color + '60');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // Core dot
        ctx.shadowColor = color;
        ctx.shadowBlur = 15;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    });
    
    // Pinch indicator
    if (isPinching) {
        const thumb = landmarks[4];
        const index = landmarks[8];
        const cx = (thumb.x + index.x) / 2 * w;
        const cy = (thumb.y + index.y) / 2 * h;
        
        ctx.strokeStyle = 'rgba(247, 212, 74, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, 30, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.strokeStyle = 'rgba(255, 107, 157, 0.15)';
        ctx.beginPath();
        ctx.arc(cx, cy, 50, 0, Math.PI * 2);
        ctx.stroke();
    }
}

// ============================================
// GESTURE PROCESSING
// ============================================
function processGestures(landmarks) {
    const thumb = landmarks[4];
    const index = landmarks[8];
    const now = Date.now();
    
    // Calculate distance between thumb and index
    const distance = Math.sqrt(
        Math.pow(thumb.x - index.x, 2) +
        Math.pow(thumb.y - index.y, 2) +
        Math.pow(thumb.z - index.z, 2)
    );
    
    const currentlyPinching = distance < 0.04;
    
    // Pinch detected
    if (currentlyPinching && !isPinching && (now - lastPinchTime > 500)) {
        onPinch();
        lastPinchTime = now;
    }
    isPinching = currentlyPinching;
    
    // Wave detection
    let heights = [];
    for (let i = 5; i < 21; i += 4) {
        heights.push(landmarks[i].y);
    }
    const waveHeight = Math.max(...heights) - Math.min(...heights);
    const currentlyWaving = waveHeight > 0.12;
    
    if (currentlyWaving && !isWaving && (now - lastWaveTime > 1000)) {
        onWave();
        lastWaveTime = now;
    }
    isWaving = currentlyWaving;
}

// ============================================
// PINCH ACTION
// ============================================
function onPinch() {
    seedCount++;
    flowerCount++;
    
    document.getElementById('seed-counter').textContent = seedCount.toLocaleString();
    document.getElementById('flower-counter').textContent = flowerCount.toLocaleString();
    
    actionHint.textContent = '✦ flower planted ✦';
    actionHint.style.color = '#f7d44a';
    setTimeout(() => {
        actionHint.textContent = '✦ pinch to plant a flower ✦';
        actionHint.style.color = 'rgba(255,255,255,0.6)';
    }, 1500);
    
    createBurst('#f7d44a');
}

// ============================================
// WAVE ACTION
// ============================================
function onWave() {
    actionHint.textContent = '✦ butterflies dancing ✦';
    actionHint.style.color = '#ff6b9d';
    setTimeout(() => {
        actionHint.textContent = '✦ wave to attract butterflies ✦';
        actionHint.style.color = 'rgba(255,255,255,0.6)';
    }, 1500);
    
    createBurst('#ff6b9d');
}

// ============================================
// BURST EFFECT
// ============================================
function createBurst(color) {
    const colors = ['#f7d44a', '#ff6b9d', '#a855f7', '#3b82f6', '#06b6d4'];
    const x = window.innerWidth / 2;
    const y = window.innerHeight / 2;
    const count = 20;
    
    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        const angle = Math.random() * Math.PI * 2;
        const distance = 40 + Math.random() * 100;
        const size = 4 + Math.random() * 8;
        const duration = 700 + Math.random() * 500;
        
        particle.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            width: ${size}px;
            height: ${size}px;
            border-radius: 50%;
            background: ${colors[Math.floor(Math.random() * colors.length)]};
            pointer-events: none;
            z-index: 50;
            opacity: 0.9;
            transform: translate(0, 0) scale(1);
            transition: all ${duration}ms cubic-bezier(0.34, 1.56, 0.64, 1);
        `;
        document.body.appendChild(particle);
        
        requestAnimationFrame(() => {
            const dx = Math.cos(angle) * distance;
            const dy = Math.sin(angle) * distance - 50;
            particle.style.transform = `translate(${dx}px, ${dy}px) scale(0)`;
            particle.style.opacity = '0';
        });
        
        setTimeout(() => particle.remove(), duration + 100);
    }
}

// ============================================
// COUNTER ANIMATION
// ============================================
function animateCounter(elementId, target) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    let current = 0;
    const duration = 3000;
    const startTime = Date.now();
    
    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = Math.floor(eased * target);
        
        element.textContent = value.toLocaleString();
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    }
    animate();
}

// Start counter animations
setTimeout(() => {
    animateCounter('flower-counter', 2229);
    animateCounter('seed-counter', 31);
}, 1000);

console.log('🌸 Digital Flowers ready!');
console.log('✦ Show your hand to the camera ✦');
