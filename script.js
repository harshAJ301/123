function startCountdown() {
  let num = 5;
  const el = document.getElementById('countdown');

  const interval = setInterval(() => {
    el.textContent = num;
    num--;
    if (num < 0) {
      clearInterval(interval);
      el.textContent = "🎉 Happy Birthday 🎂";
      setTimeout(() => goToPage(3), 2000);
    }
  }, 900);
}
