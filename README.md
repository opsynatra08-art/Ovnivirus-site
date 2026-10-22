# Ovnivirus

Static website for GitHub Pages. The eight tracks are listed in
`assets/audio/tracks.json` and served from the `audio-v1` GitHub Release. The WAV files
are kept out of the website's Git history.

## Publish with GitHub Pages

The repository is public and the site deploys through GitHub Actions. After uploading the
contents of this folder to the `main` branch:

1. Open **Settings → Pages** and set **Build and deployment → Source** to **GitHub Actions**.
2. Check the **Actions** tab for a successful **Deploy static content to Pages** run.
3. Share `https://opsynatra08-art.github.io/Ovnivirus-site/` once the deployment completes.

The Free Pack opens using the TeraBox link provided by Ovnivirus. Visitors must confirm
that they follow the SoundCloud, Facebook, and Instagram accounts before the download
link is enabled. A static website cannot verify follows automatically.

## Publish or update tracks

In **Releases**, create or update the `audio-v1` release and attach each WAV using the
exact filename listed in `assets/audio/tracks.json`. Each release asset must be under
2 GiB. Do not add WAV files to the website's Git history.

The original ZIP is about 122 MB; it stays outside the repository and public code history.
