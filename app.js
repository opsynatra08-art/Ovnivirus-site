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
  const query = searchInput.value.trim().toLocaleLowerCase("es");
  const selectedBpm = bpmFilter.value;
  const visibleTracks = tracks
    .map((track, index) => ({ ...track, index }))
    .filter((track) => {
      const matchesSearch = `${track.title} ${track.artist}`.toLocaleLowerCase("es").includes(query);
      const matchesBpm = selectedBpm === "all" || track.bpm === Number(selectedBpm);
      return matchesSearch && matchesBpm;
    });

  trackList.replaceChildren();
  emptyState.hidden = visibleTracks.length > 0;
  if (tracks.length && !visibleTracks.length) {
    emptyTitle.textContent = "No hay tracks con esos filtros.";
    emptyHint.textContent = "Prueba con otra búsqueda o selecciona otro BPM.";
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
    button.setAttribute("aria-label", `Reproducir ${track.title} de ${track.artist}`);
    button.textContent = track.index === currentTrackIndex && !audio.paused ? "Ⅱ" : "▶";
    button.disabled = !track.url;
    if (!track.url) button.title = "La descarga del audio se habilitará al publicar el repositorio.";
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
    playerArtist.textContent = "Publica los archivos en la Release de GitHub para activar el audio.";
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
    playerArtist.textContent = "No se pudo iniciar el audio seleccionado.";
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
    ? "Abrir Free Pack <span aria-hidden=\"true\">↗</span>"
    : "Desbloquea el Free Pack <span aria-hidden=\"true\">↓</span>";
  downloadStatus.textContent = allConfirmed
    ? "¡Listo! Abre el enlace de TeraBox para descargar el pack."
    : "Confirma que sigues las tres cuentas para abrir la descarga del pack.";
}

async function loadTracks() {
  const response = await fetch("assets/audio/tracks.json");
  if (!response.ok) throw new Error(`No se pudo cargar la lista de pistas (${response.status}).`);

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
    playerArtist.textContent = "Termina de configurar el repositorio y la Release de GitHub.";
    configurePlayer();
    renderTracks();
    return;
  }

  if (!tracks.length) {
    emptyTitle.textContent = "Aún no hay música publicada.";
    emptyHint.textContent = "Los tracks aparecerán aquí cuando se añadan a la Release de GitHub.";
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
  playToggle.setAttribute("aria-label", "Pausar");
  renderTracks();
});
audio.addEventListener("pause", () => {
  playToggle.textContent = "▶";
  playToggle.setAttribute("aria-label", "Reproducir");
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
  playerTitle.textContent = "No se pudo reproducir el audio";
  playerArtist.textContent = "Comprueba que el archivo esté publicado en la Release de GitHub.";
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
  emptyTitle.textContent = "No se pudo cargar la música.";
  emptyHint.textContent = error.message;
  emptyState.hidden = false;
});
