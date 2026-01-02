let tapCount = 0;
let quizStep = 0;

function goToPage(n) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(`page-${n}`).classList.add('active');

  if (n === 2) startCountdown();
  if (n === 4) startQuiz();
  if (n === 5) startError();
  if (n === 6) startStory();
}

function startCountdown() {
  let num = 5;
  const el = document.getElementById('countdown');
  const interval = setInterval(() => {
    el.textContent = num;
    num--;
    if (num < 0) {
      clearInterval(interval);
      el.textContent = "🎉 Happy Birthday 🎂";
      setTimeout(() => goToPage(3), 1200);
    }
  }, 700);
}

document.getElementById('cake').onclick = () => {
  tapCount++;
  document.getElementById('counter').textContent = `${tapCount} / 10`;
  if (tapCount >= 10) {
    document.getElementById('tapNext').classList.remove('hidden');
  }
};

const quiz = [
  {
    q: "Why is today acting so special?",
    options: ["Monday energy 😐", "Random drama", "Someone’s birthday 😌"]
  },
  {
    q: "What should be illegal today?",
    options: ["Stress", "Studying", "Saying 'act your age'"]
  }
];

function startQuiz() {
  quizStep = 0;
  showQuiz();
}

function showQuiz() {
  const q = quiz[quizStep];
  document.getElementById('quiz-question').textContent = q.q;
  const box = document.getElementById('quiz-options');
  box.innerHTML = "";

  q.options.forEach(opt => {
    const btn = document.createElement("button");
    btn.className = "btn";
    btn.textContent = opt;
    btn.onclick = () => {
      quizStep++;
      if (quizStep < quiz.length) showQuiz();
      else goToPage(5);
    };
    box.appendChild(btn);
  });
}

function startError() {
  setTimeout(() => {
    document.getElementById('error-text').textContent = "Just kidding 😄";
    document.getElementById('error-sub').textContent = "Happy Birthday 🎉";
    setTimeout(() => goToPage(6), 1200);
  }, 1000);
}

function startStory() {
  const lines = [
    "Once upon a time,",
    "today woke up feeling important.",
    "No work.",
    "No stress.",
    "Just cake and vibes."
  ];
  let i = 0;
  const p = document.getElementById('story');
  p.textContent = "";

  const interval = setInterval(() => {
    p.textContent += lines[i] + " ";
    i++;
    if (i >= lines.length) clearInterval(interval);
  }, 500);
}

function buttonPressed() {
  document.getElementById('buttonResult').textContent = "I knew it 😄";
  document.getElementById('lastBtn').classList.remove('hidden');
}
