const trackList = document.querySelector("#track-list");
const searchInput = document.querySelector("#track-search");
const bpmFilter = document.querySelector("#bpm-filter");
const emptyState = document.querySelector("#empty-state");
const emptyTitle = document.querySelector("#empty-title");
const emptyHint = document.querySelector("#empty-hint");
const audio = document.querySelector("#audio-player");
const playerTitle = document.querySelector("#player-title");
const playerArtist = document.querySelector("#player-artist");
const playToggle = document.querySelector("#play-toggle");
const previousButton = document.querySelector("#previous-track");
const nextButton = document.querySelector("#next-track");
const progress = document.querySelector("#progress");
const currentTime = document.querySelector("#current-time");
const duration = document.querySelector("#duration");
const followConfirmations = [...document.querySelectorAll(".follow-confirmation")];
const downloadLink = document.querySelector("#download-link");
const downloadStatus = document.querySelector("#download-status");

let tracks = [];
let currentTrackIndex = -1;

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainingSeconds}`;
}

function renderTracks() {
  const query = searchInput.value.trim().toLocaleLowerCase("en");
  const selectedBpm = bpmFilter.value;
  const visibleTracks = tracks
    .map((track, index) => ({ ...track, index }))
    .filter((track) => {
      const matchesSearch = `${track.title} ${track.artist}`.toLocaleLowerCase("en").includes(query);
      const matchesBpm = selectedBpm === "all" || track.bpm === Number(selectedBpm);
      return matchesSearch && matchesBpm;
    });

  trackList.replaceChildren();
  emptyState.hidden = visibleTracks.length > 0;
  if (tracks.length && !visibleTracks.length) {
    emptyTitle.textContent = "No tracks match those filters.";
    emptyHint.textContent = "Try another search or select a different BPM.";
  }

  for (const track of visibleTracks) {
    const row = document.createElement("div");
    row.className = "track-row";
    if (track.index === currentTrackIndex) row.classList.add("is-playing");

    const number = document.createElement("span");
    number.className = "track-number";
    number.textContent = String(track.index + 1).padStart(2, "0");

    const info = document.createElement("div");
    info.className = "track-info";

    const title = document.createElement("span");
    title.className = "track-name";
    title.textContent = track.title;

    const artist = document.createElement("span");
    artist.className = "track-artist";
    artist.textContent = track.bpm ? `${track.artist} · ${track.bpm} BPM` : track.artist;
    info.append(title, artist);

    const button = document.createElement("button");
    button.className = "track-play";
    button.type = "button";
    button.setAttribute("aria-label", `Play ${track.title} by ${track.artist}`);
    button.textContent = track.index === currentTrackIndex && !audio.paused ? "Ⅱ" : "▶";
    button.disabled = !track.url;
    if (!track.url) button.title = "Audio playback will be available once the release is published.";
    if (track.index === currentTrackIndex) button.classList.add("is-current");
    button.addEventListener("click", () => {
      if (track.index === currentTrackIndex && !audio.paused) {
        audio.pause();
      } else if (track.index === currentTrackIndex) {
        playAudio();
      } else {
        loadTrack(track.index, true);
      }
    });

    row.append(number, info, button);
    trackList.append(row);
  }
}

function loadTrack(index, shouldPlay) {
  const track = tracks[index];
  if (!track) return;
  if (!track.url) {
    playerArtist.textContent = "Publish the files in the GitHub release to enable audio.";
    return;
  }

  currentTrackIndex = index;
  audio.src = track.url;
  playerTitle.textContent = track.title;
  playerArtist.textContent = track.artist.toUpperCase();
  playToggle.disabled = false;
  progress.disabled = true;
  progress.value = "0";
  currentTime.textContent = "0:00";
  duration.textContent = "0:00";
  renderTracks();

  if (shouldPlay) playAudio();
}

function playAudio() {
  audio.play().catch((error) => {
    if (error.name === "AbortError") return;
    playerArtist.textContent = "Could not start the selected audio.";
  });
}

function playAdjacentTrack(direction) {
  if (!tracks.length) return;
  const nextIndex = currentTrackIndex < 0
    ? (direction > 0 ? 0 : tracks.length - 1)
    : (currentTrackIndex + direction + tracks.length) % tracks.length;
  loadTrack(nextIndex, true);
}

function configurePlayer() {
  playToggle.disabled = tracks.length === 0;
  previousButton.disabled = tracks.length === 0;
  nextButton.disabled = tracks.length === 0;
  emptyState.hidden = tracks.length > 0;
}

function updateDownloadAccess() {
  const allConfirmed = followConfirmations.every((checkbox) => checkbox.checked);
  downloadLink.classList.toggle("is-locked", !allConfirmed);
  downloadLink.setAttribute("aria-disabled", String(!allConfirmed));
  downloadLink.tabIndex = allConfirmed ? 0 : -1;
  downloadLink.innerHTML = allConfirmed
    ? "Open Free Pack <span aria-hidden=\"true\">↗</span>"
    : "Unlock Free Pack <span aria-hidden=\"true\">↓</span>";
  downloadStatus.textContent = allConfirmed
    ? "You're all set! Open the TeraBox link to download the pack."
    : "Confirm that you follow all three accounts to unlock the pack download.";
}

async function loadTracks() {
  const response = await fetch("assets/audio/tracks.json");
  if (!response.ok) throw new Error(`Could not load the track list (${response.status}).`);

  const manifest = await response.json();
  const repoParts = manifest.repository.split("/");
  const repositoryConfigured = repoParts.length === 2
    && repoParts.every((part) => part && !part.startsWith("REPLACE_"));
  const releaseBase = repositoryConfigured
    ? `https://github.com/${manifest.repository}/releases/download/${encodeURIComponent(manifest.releaseTag)}`
    : null;
  tracks = manifest.tracks.map((track) => ({
    ...track,
    url: releaseBase ? `${releaseBase}/${encodeURIComponent(track.file)}` : null,
  }));

  const bpms = [...new Set(tracks.map((track) => track.bpm).filter(Number.isFinite))]
    .sort((left, right) => left - right);
  for (const bpm of bpms) {
    const option = document.createElement("option");
    option.value = String(bpm);
    option.textContent = `${bpm} BPM`;
    bpmFilter.append(option);
  }

  if (!repositoryConfigured) {
    playerArtist.textContent = "Finish setting up the GitHub repository and release to enable audio.";
    configurePlayer();
    renderTracks();
    return;
  }

  if (!tracks.length) {
    emptyTitle.textContent = "No music has been published yet.";
    emptyHint.textContent = "Tracks will appear here after they are added to the GitHub release.";
  }

  configurePlayer();
  renderTracks();
}

searchInput.addEventListener("input", renderTracks);
bpmFilter.addEventListener("change", renderTracks);
playToggle.addEventListener("click", () => {
  if (currentTrackIndex < 0) {
    loadTrack(0, true);
  } else if (audio.paused) {
    playAudio();
  } else {
    audio.pause();
  }
});
previousButton.addEventListener("click", () => playAdjacentTrack(-1));
nextButton.addEventListener("click", () => playAdjacentTrack(1));

audio.addEventListener("play", () => {
  const track = tracks[currentTrackIndex];
  if (track) {
    playerTitle.textContent = track.title;
    playerArtist.textContent = track.artist.toUpperCase();
  }
  playToggle.textContent = "Ⅱ";
  playToggle.setAttribute("aria-label", "Pause");
  renderTracks();
});
audio.addEventListener("pause", () => {
  playToggle.textContent = "▶";
  playToggle.setAttribute("aria-label", "Play");
  renderTracks();
});
audio.addEventListener("loadedmetadata", () => {
  duration.textContent = formatTime(audio.duration);
  progress.disabled = !Number.isFinite(audio.duration);
});
audio.addEventListener("timeupdate", () => {
  currentTime.textContent = formatTime(audio.currentTime);
  if (Number.isFinite(audio.duration) && audio.duration > 0) {
    progress.value = String((audio.currentTime / audio.duration) * 100);
  }
});
audio.addEventListener("ended", () => playAdjacentTrack(1));
audio.addEventListener("error", () => {
  playerTitle.textContent = "Could not play this track";
  playerArtist.textContent = "Check that the audio file is published in the GitHub release.";
});
progress.addEventListener("input", () => {
  if (Number.isFinite(audio.duration)) {
    audio.currentTime = (Number(progress.value) / 100) * audio.duration;
  }
});

for (const checkbox of followConfirmations) {
  checkbox.addEventListener("change", updateDownloadAccess);
}

downloadLink.addEventListener("click", (event) => {
  if (downloadLink.getAttribute("aria-disabled") === "true") event.preventDefault();
});

configurePlayer();
renderTracks();
updateDownloadAccess();
loadTracks().catch((error) => {
  emptyTitle.textContent = "Could not load the music.";
  emptyHint.textContent = error.message;
  emptyState.hidden = false;
});
