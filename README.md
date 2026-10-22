# Ovnivirus

Sitio estático para GitHub Pages. Los ocho tracks aparecen en
`assets/audio/tracks.json` y se sirven desde la GitHub Release `audio-v1`;
los WAV se mantienen fuera del historial Git del sitio.

## Publicar en GitHub Pages

El repositorio es público y la web está preparada para desplegarse desde GitHub Actions.
Después de subir el contenido de esta carpeta a la rama `main`:

1. Abre **Settings → Pages** y configura **Build and deployment → Source** como **GitHub Actions**.
2. Abre **Actions** y comprueba la ejecución de **Deploy website to GitHub Pages**.
3. Comparte `https://opsynatra08-art.github.io/Ovnivirus-site/` cuando el despliegue figure como completado.

El ZIP del Free Pack se abre desde el enlace de TeraBox compartido por Ovnivirus. La
página requiere marcar la confirmación de seguimiento en SoundCloud, Facebook e
Instagram antes de habilitar el enlace; una página estática no puede verificar follows.

## Publicar o actualizar los tracks

En **Releases**, crea o actualiza la release `audio-v1` y adjunta cada WAV usando
exactamente el nombre de archivo listado en `assets/audio/tracks.json`. Cada asset debe
ser menor de 2 GiB. No subas los WAV dentro del historial Git del sitio.

El ZIP original mide aproximadamente 122 MB; permanece fuera del repositorio y del
historial público del código.
