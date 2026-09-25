/* Plain ES5-style JavaScript. Future sensor code can call either public function. */
var scarySounds = [
  { name: 'Crazy Laugh 1', id: 'crazy-laugh-1', file: 'crazy-laugh-1.mp3' },
  { name: 'Crazy Laugh 2', id: 'crazy-laugh-2', file: 'crazy-laugh-2.mp3' },
  { name: 'Ghost Howl', id: 'ghost-howl', file: 'ghost-howl.mp3' },
  { name: 'Ghost Cry', id: 'ghost-cry', file: 'ghost-cry.mp3' },
  { name: 'Scream', id: 'scream', file: 'scream.mp3' },
  { name: 'Creepy Whisper', id: 'creepy-whisper', file: 'creepy-whisper.mp3' },
  { name: 'Sinister Laugh', id: 'sinister-laugh', file: 'sinister-laugh.mp3' },
  { name: 'Creepy Ghost', id: 'creepy-ghost', file: 'creepy-ghost.mp3' },
  { name: 'Ghost Cry 2', id: 'ghost-cry-2', file: 'ghost-cry-2.mp3' },
  { name: 'Female Cry', id: 'female-cry', file: 'female-cry.mp3' },
  { name: 'Baby Zombie', id: 'baby-zombie', file: 'baby-zombie.mp3' }
];
var scaryAudio = document.getElementById('scary-audio');
var soundStatus = document.getElementById('sound-status');
var lastScarySoundIndex = -1;
var activeScarySound = 'Crazy Laugh 1';
var playbackRequest = 0;

function setSoundStatus(message) {
  /* text nodes work on older Safari versions, too. */
  while (soundStatus.firstChild) {
    soundStatus.removeChild(soundStatus.firstChild);
  }
  soundStatus.appendChild(document.createTextNode(message));
}

function stopScarySound() {
  playbackRequest += 1;
  activeScarySound = '';
  scaryAudio.pause();
  try { scaryAudio.currentTime = 0; } catch (ignore) {}
  setSoundStatus('Stopped. Choose a sound.');
}

function playScarySound(name) {
  var i;
  var selected = -1;
  var request;
  var result;
  for (i = 0; i < scarySounds.length; i += 1) {
    if (scarySounds[i].name === name || scarySounds[i].id === name) {
      selected = i;
      break;
    }
  }
  if (selected === -1) {
    setSoundStatus('Unknown sound. Choose a sound button.');
    return;
  }
  stopScarySound();
  request = playbackRequest;
  lastScarySoundIndex = selected;
  activeScarySound = scarySounds[selected].name;
  setSoundStatus('Loading: ' + activeScarySound);
  /* Reload the shared audio element to start at the beginning, even on repeats. */
  scaryAudio.src = 'sounds/' + scarySounds[selected].file;
  document.getElementById('direct-sound').href = scaryAudio.src;
  try {
    scaryAudio.load();
    /* Keep play() directly inside the tap handler for old iOS Safari. */
    result = scaryAudio.play();
    /* Old Safari returns nothing; newer browsers may return a Promise. */
    if (result && typeof result.then === 'function') {
      result.then(function () {}, function (error) {
        if (request !== playbackRequest) { return; }
        if (error && error.name === 'NotAllowedError') {
          setSoundStatus('Safari needs a tap. Tap a sound button to play.');
        } else {
          setSoundStatus('Cannot play ' + activeScarySound + '. Check the MP3 in sounds/.');
        }
      });
    }
  } catch (error) {
    setSoundStatus('Cannot play ' + activeScarySound + '. Tap Play in the player below, or open the sound directly.');
  }
}

function playRandomScarySound() {
  var choice;
  /* Draw from all other slots and skip the last selection: no retry loop needed. */
  if (lastScarySoundIndex < 0) {
    choice = Math.floor(Math.random() * scarySounds.length);
  } else {
    choice = Math.floor(Math.random() * (scarySounds.length - 1));
    if (choice >= lastScarySoundIndex) { choice += 1; }
  }
  playScarySound(scarySounds[choice].name);
}

scaryAudio.onplaying = function () {
  /* Native controls can start the initial sound or resume after Stop. */
  if (lastScarySoundIndex < 0) { lastScarySoundIndex = 0; }
  activeScarySound = scarySounds[lastScarySoundIndex].name;
  if (activeScarySound) {
    setSoundStatus('Playing: ' + activeScarySound);
  }
};
scaryAudio.onended = function () {
  if (activeScarySound) { setSoundStatus('Finished: ' + activeScarySound); }
};
scaryAudio.onerror = function () {
  if (activeScarySound) {
    var code = scaryAudio.error ? scaryAudio.error.code : 0;
    var reason = 'Audio could not load';
    if (code === 1) { reason = 'Audio loading was interrupted'; }
    if (code === 2) { reason = 'Audio network error'; }
    if (code === 3) { reason = 'Safari could not decode this MP3'; }
    if (code === 4) { reason = 'Safari could not load or support this MP3'; }
    setSoundStatus(reason + ' (code ' + code + '): ' + activeScarySound + '. Try Open selected sound directly.');
  }
};
document.getElementById('random-scare').onclick = playRandomScarySound;
document.getElementById('stop-sound').onclick = stopScarySound;
(function () {
  var i;
  function bindSound(sound) {
    document.getElementById(sound.id).onclick = function () {
      playScarySound(sound.name);
    };
  }
  for (i = 0; i < scarySounds.length; i += 1) { bindSound(scarySounds[i]); }
}());
