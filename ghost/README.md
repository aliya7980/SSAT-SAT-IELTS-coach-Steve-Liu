# HuskyDaddy Ghost Box

Standalone static Halloween sound page at `/ghost/`. No build tools or dependencies.

## Add your audio

All 11 MP3s from `~/Desktop/ghostbox/` have been copied into `ghost/sounds/` using these exact, lowercase filenames. The Desktop originals are unchanged. To replace a sound, use the same destination filename:

| Button / function name | Filename |
| --- | --- |
| Crazy Laugh 1 | `crazy-laugh-1.mp3` |
| Crazy Laugh 2 | `crazy-laugh-2.mp3` |
| Ghost Howl | `ghost-howl.mp3` |
| Ghost Cry | `ghost-cry.mp3` |
| Scream | `scream.mp3` |
| Creepy Whisper | `creepy-whisper.mp3` |
| Sinister Laugh | `sinister-laugh.mp3` |
| Creepy Ghost | `creepy-ghost.mp3` |
| Ghost Cry 2 | `ghost-cry-2.mp3` |
| Female Cry | `female-cry.mp3` |
| Baby Zombie | `baby-zombie.mp3` |

Missing or unsupported files produce an on-page error. These source files were selected by filename:

- `crazy-laugh-1.mp3` ← `tanweraman-ghost-laughter-1-388989.mp3`
- `crazy-laugh-2.mp3` ← `tanweraman-ghost-laughter-3-388991.mp3`
- `ghost-howl.mp3` ← `shut_up_ghost-ghost-voice-halloween-moany-ghost-168411.mp3`
- `ghost-cry.mp3` ← `floraphonic-haunted-ghost-baby-crying-2-184017.mp3`
- `scream.mp3` ← `freesound_community-062740_creepy-ghost-scream-81907.mp3`
- `creepy-whisper.mp3` ← `dragon-studio-i-see-you-creepy-ghost-whisper-401711.mp3`

- `sinister-laugh.mp3` ← `alex_jauk-sinister-laugh-258392.mp3`
- `creepy-ghost.mp3` ← `dragon-studio-creepy-ghost-sound-487677.mp3`
- `ghost-cry-2.mp3` ← `floraphonic-haunted-ghost-baby-crying-4-184018.mp3`
- `female-cry.mp3` ← `alesiadavina-halloween-horror-voice-female-crying-145075.mp3`
- `baby-zombie.mp3` ← `freesound_community-baby-zombie-84856.mp3`

All 11 Desktop MP3s are included in random selection, with one test button per sound.

## Local test

From the website repository root, run `python3 -m http.server 8000`, then open `http://localhost:8000/ghost/`. To test on the iPod, connect it to the same Wi-Fi and open `http://YOUR-COMPUTER-LAN-IP:8000/ghost/`. Allow local network access through your computer firewall if needed. Stop the server with Ctrl+C.

All 11 MP3s are installed. Tap all 11 sound buttons and check the displayed name and audible output. Tap RANDOM SCARE repeatedly: it must not repeat the previous selection, including a manual selection. Switch sounds during playback to check that only one plays. Tap the same manual button twice to check that it restarts. Test STOP SOUND. Temporarily rename a file to check the error message, then restore it.

## After deployment

Publish the `ghost/` folder and your MP3s through the site's existing GitHub Pages workflow. Visit https://huskydaddy.com/ghost/ (the existing CNAME is `www.huskydaddy.com`, so your domain may redirect to https://www.huskydaddy.com/ghost/). This project does not change domain configuration. Check on the actual iPod in Safari as well as a desktop browser. Repeat the tests above and ensure all 11 files load with matching case. Refresh after replacing files; Safari may cache older audio.

## JavaScript and next stage

`playScarySound(name)` accepts a displayed name from the table or a button ID such as `ghost-howl`. It stops the shared HTML5 audio element, loads the chosen MP3 from the beginning, and updates status. `playRandomScarySound()` chooses among all sounds except the last selected one and delegates playback. Promise handling is optional and guarded because older Safari returns nothing from `play()`.

Next stage: an ESP32 infrared sensor detects a visitor, then an agreed communication mechanism calls `playRandomScarySound()`. No polling, networking, or ESP32 communication is implemented here. iOS Safari restricts automatic audio: manual taps are the initial test, and a tap does not guarantee that later remote-triggered file changes will be allowed on every old iOS version. Validate an audio-unlock strategy on the target iPod during ESP32 integration. Keep Safari in the foreground; screen lock and backgrounding can suspend the page. HTTPS-to-local-device networking will also need testing at that stage.
