// Base variables
let playerScore = 0;
let computerScore = 0;
let clickCount = 0;
let gameMode = '10points';
let adIntervalId = null;
let menuMusicStarted = false;

// Jukebox variables
const songs = [
  {
    audio: 'music/Song.mp3',
    type: 'video',
    media: 'video/Tricky.mp4',
    theme: 'green'
  },
  {
    audio: 'music/Song2.mp3',
    type: 'video',
    media: 'video/Promo.mp4',
    customLoop: true,
    loopEnd: 80,
    theme: 'blue'
  },
  {
    audio: 'music/Song3.mp3',
    type: 'image',
    media: 'img/FNFM.png',
    theme: 'red'
  }
];
let currentSongIndex = 0;

// Mute variables
let isMuted = false;

// Howto music logic
let hasHowtoStartedMusic = false;

// Elements
const menuDiv = document.getElementById('menu');
const gameDiv = document.getElementById('game');
const backBtn = document.getElementById('terugKnop');
const instructionsDiv = document.getElementById('uitleg');
const winImg = document.getElementById('winstFoto');
const loseImg = document.getElementById('verliesFoto');
const drawImg = document.getElementById('drawFoto');
const adOverlay = document.getElementById('adOverlay');
const menuMusic = document.getElementById('menuMusic');
const menuVideo = document.getElementById('menuVideo');
const menuImage = document.getElementById('menuImage');
const jukeboxBtn = document.getElementById('jukebox-btn');
const muteBtn = document.getElementById('mute-btn');
const mediaContainer = document.getElementById('mediaContainer');
const body = document.body;

// For custom loop Song2.mp3
let customLoopTimeout = null;

// Sets the theme of the body based on the current song
function setTheme(theme) {
  body.classList.remove('theme-green', 'theme-blue', 'theme-red');
  switch (theme) {
    case 'green':
      body.classList.add('theme-green');
      break;
    case 'blue':
      body.classList.add('theme-blue');
      break;
    case 'red':
    default:
      body.classList.add('theme-red');
      break;
  }
}

// Switches song and matching media in the menu
function updateMenuMedia() {
  const song = songs[currentSongIndex];
  menuMusic.src = song.audio;
  menuMusic.load();

  if (song.type === 'video') {
    // Stop video, remove old event handlers if any
    menuVideo.pause();
    menuVideo.removeAttribute('src');
    menuVideo.load();

    menuVideo.src = song.media;
    menuVideo.style.display = 'block';
    menuImage.style.display = 'none';

    // Only play when ready, and ignore play errors
    const playVideo = () => {
      menuVideo.play().catch(() => {});
      menuVideo.removeEventListener('canplay', playVideo);
    };
    menuVideo.addEventListener('canplay', playVideo);
    menuVideo.load();
  } else if (song.type === 'image') {
    menuVideo.pause();
    menuVideo.style.display = 'none';
    menuImage.src = song.media;
    menuImage.style.display = 'block';
  }

  setTheme(song.theme);

  if (customLoopTimeout) {
    clearInterval(customLoopTimeout);
    customLoopTimeout = null;
  }
  if (song.customLoop) {
    menuMusic.currentTime = 0;
    menuMusic.play().catch(() => {});
    customLoopTimeout = setInterval(() => {
      if (menuMusic.currentTime >= song.loopEnd) {
        menuMusic.currentTime = 0;
        menuMusic.play().catch(() => {});
      }
    }, 500);
  }
  menuMusic.muted = isMuted;
}

// Starts menu music again, with custom loop if needed
function playMenuMusic() {
  const song = songs[currentSongIndex];
  menuMusic.currentTime = 0;
  menuMusic.play().catch(() => {});
  menuMusicStarted = true;
  menuMusic.muted = isMuted;
  if (song.customLoop) {
    if (customLoopTimeout) clearInterval(customLoopTimeout);
    customLoopTimeout = setInterval(() => {
      if (menuMusic.currentTime >= song.loopEnd) {
        menuMusic.currentTime = 0;
        menuMusic.play().catch(() => {});
      }
    }, 500);
  }
}

// Stops menu music, and any custom loop
function stopMenuMusic() {
  menuMusic.pause();
  menuMusic.currentTime = 0;
  if (customLoopTimeout) {
    clearInterval(customLoopTimeout);
    customLoopTimeout = null;
  }
}

// Jukebox button: next song
jukeboxBtn.addEventListener('click', function () {
  stopMenuMusic();
  currentSongIndex = (currentSongIndex + 1) % songs.length;
  updateMenuMedia();
  playMenuMusic();
});

// Mute or unmute the music and change the icon
muteBtn.addEventListener('click', function () {
  isMuted = !isMuted;
  menuMusic.muted = isMuted;
  muteBtn.src = isMuted ? "img/mute.png" : "img/unmute.png";
});

// Game mode buttons
document.getElementById('btn-10points').addEventListener('click', () => {
  startGame('10points');
});
document.getElementById('btn-endless').addEventListener('click', () => {
  startGame('endless');
});
backBtn.addEventListener('click', backToMenu);

// Starts a game, resets scores, and sets everything up
function startGame(mode) {
  gameMode = mode;
  menuDiv.style.display = 'none';
  gameDiv.style.display = 'block';
  instructionsDiv.style.display = (mode === '10points') ? 'block' : 'none';

  stopMenuMusic();
  setTheme(songs[currentSongIndex].theme);

  playerScore = 0;
  computerScore = 0;
  clickCount = 0;
  updateScores();
  clearChoices();
  hideAllImages();
  deactivateButtons();

  clearAdInterval();
  if (mode === 'endless') {
    adIntervalId = setInterval(() => {
      showAd();
    }, 60000);
  }
  stopEmojiRain();
}

// Returns to the main menu and resets everything
function backToMenu() {
  gameDiv.style.display = 'none';
  menuDiv.style.display = 'block';
  adOverlay.style.display = 'none';
  deactivateButtons();
  clearChoices();
  hideAllImages();
  playerScore = 0;
  computerScore = 0;
  clickCount = 0;
  updateScores();
  clearAdInterval();

  updateMenuMedia();
  playMenuMusic();
  setTheme(songs[currentSongIndex].theme);
  startEmojiRain();
}
window.backToMenu = backToMenu;
window.terugNaarMenu = backToMenu;

// Main game function, processes a turn
function play(playerChoice) {
  if (gameMode === '10points') {
    clickCount++;
    if (clickCount === 10) {
      showAd();
      clickCount = 0;
      return;
    }
  }

  deactivateButtons();
  document.getElementById('btn-' + playerChoice).classList.add('active');

  const options = ['steen', 'papier', 'schaar'];
  const computerChoice = options[Math.floor(Math.random() * 3)];

  hideAllImages();

  let result = '';

  if (playerChoice === computerChoice) {
    result = 'Draw!';
    drawImg.style.display = 'block';
  } else if (
    (playerChoice === 'steen' && computerChoice === 'schaar') ||
    (playerChoice === 'papier' && computerChoice === 'steen') ||
    (playerChoice === 'schaar' && computerChoice === 'papier')
  ) {
    result = 'You win!';
    playerScore++;
    winImg.style.display = 'block';
  } else {
    result = 'You lose!';
    computerScore++;
    loseImg.style.display = 'block';
  }

  document.getElementById('jouwKeuze').innerText = `Your choice: ${playerChoice}`;
  document.getElementById('computerKeuze').innerText = `Computer chose: ${computerChoice}`;
  document.getElementById('resultaat').innerText = `Result: ${result}`;

  updateScores();

  if (gameMode === '10points' && (playerScore === 10 || computerScore === 10)) {
    alert(`${playerScore === 10 ? 'You win the game!' : 'The computer wins the game!'}`);
    playerScore = 0;
    computerScore = 0;
    updateScores();
    hideAllImages();
    deactivateButtons();
  }
}

// Updates the score display in the game
function updateScores() {
  document.getElementById('jijScore').innerText = playerScore;
  document.getElementById('computerScore').innerText = computerScore;
}

// Deactivates all game buttons (removes 'active' class)
function deactivateButtons() {
  document.querySelectorAll('#game button').forEach(btn => btn.classList.remove('active'));
}

// Resets choices and result display
function clearChoices() {
  document.getElementById('jouwKeuze').innerText = 'Your choice: -';
  document.getElementById('computerKeuze').innerText = 'Computer chose: -';
  document.getElementById('resultaat').innerText = 'Result: -';
}

// Hides all result images
function hideAllImages() {
  winImg.style.display = 'none';
  loseImg.style.display = 'none';
  drawImg.style.display = 'none';
}

// Shows the ad overlay
function showAd() {
  adOverlay.style.display = 'flex';
}

// Closes the ad overlay
function closeAd() {
  adOverlay.style.display = 'none';
}

// Stops the ad interval
function clearAdInterval() {
  if (adIntervalId) {
    clearInterval(adIntervalId);
    adIntervalId = null;
  }
}

// Ensure closeAd can be called from HTML
window.closeAd = closeAd;

// HOWTO overlay
document.getElementById('btn-howto').addEventListener('click', () => {
  document.getElementById('howtoOverlay').style.display = 'flex';
});

// Closes the HOWTO overlay and (if needed) restarts the music
function closeHowto() {
  document.getElementById('howtoOverlay').style.display = 'none';
  if (!hasHowtoStartedMusic) {
    updateMenuMedia();
    playMenuMusic();
    hasHowtoStartedMusic = true;
  }
}
window.closeHowto = closeHowto;

// Emoji rain
const emojiChoices = ['🪨', '📄', '✂️'];
const fallingEmojisDiv = document.getElementById('fallingEmojis');

// Spawns a batch of falling emojis in the menu
function spawnFallingEmojis() {
  if (menuDiv.style.display === 'none') return;

  for (let i = 0; i < 69; i++) {
    const emoji = document.createElement('span');
    emoji.className = 'falling-emoji';
    emoji.innerText = emojiChoices[Math.floor(Math.random() * emojiChoices.length)];
    emoji.style.left = `${Math.random() * 98}vw`;
    emoji.style.top = '-3rem';
    emoji.style.fontSize = `${2 + Math.random() * 2}rem`;
    emoji.style.animationDuration = `${2 + Math.random() * 2.5}s`;
    fallingEmojisDiv.appendChild(emoji);

    emoji.addEventListener('animationend', () => {
      emoji.remove();
    });
  }
}

let emojiIntervalId = null;

// Starts the emoji rain animation in the menu
function startEmojiRain() {
  if (emojiIntervalId) return;
  spawnFallingEmojis();
  emojiIntervalId = setInterval(spawnFallingEmojis, 10000);
}

// Stops the emoji rain animation
function stopEmojiRain() {
  clearInterval(emojiIntervalId);
  emojiIntervalId = null;
  if (fallingEmojisDiv) fallingEmojisDiv.innerHTML = '';
}

// When the page loads: set menu media, start music, and emoji rain
window.addEventListener('DOMContentLoaded', () => {
  updateMenuMedia();
  playMenuMusic();
  if (menuDiv.style.display !== 'none') startEmojiRain();
});

// Click sound for all buttons
const clickAudio = new Audio('music/Click.mp3');

function playClickSound() {
  clickAudio.currentTime = 0;
  clickAudio.play();
}

window.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('button, input[type="button"], input[type="submit"]').forEach(btn => {
    btn.addEventListener('click', playClickSound);
  });
});