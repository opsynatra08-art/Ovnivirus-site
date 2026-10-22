# Ovnivirus

Static website for GitHub Pages. The eight tracks are listed in
`assets/audio/tracks.json` and served from the `audio-v1` GitHub Release. The WAV files
are kept out of the website's Git history.

## Featured complete collection

The homepage prominently features the complete Ovnivirus psychedelic sound collection
and links to its Gumroad checkout: `https://ovnivirus7.gumroad.com/l/sfakj`. The product
page lists 200+ sounds, Serum and Vital presets, Ableton racks, WAV samples, drums,
kicks, bass, and leads. The current listed price is €40; Gumroad may display a localized
price at checkout. Product gallery images are loaded from the public Gumroad product page.

## Publish with GitHub Pages

The repository is public and the site deploys through GitHub Actions. After uploading the
contents of this folder to the `main` branch:

1. Open **Settings → Pages** and set **Build and deployment → Source** to **GitHub Actions**.
2. Check the **Actions** tab for a successful **Deploy static content to Pages** run.
3. Share `https://opsynatra08-art.github.io/Ovnivirus-site/` once the deployment completes.

Visitors must confirm their SoundCloud, Facebook, and Instagram follows and provide
their name and email before requesting the Free Pack. Follows are self-confirmed; the
website cannot verify them automatically. The download Worker sends a report to
`ovnivirus107@gmail.com` only after it has streamed the complete ZIP. It cannot verify
that the visitor saved or extracted the file.

## Configure Free Pack downloads

The website itself is static, so the download form requires a Cloudflare Worker, a D1
database, an R2 bucket, and a Resend account. Do not put API keys or the ZIP in the Git
repository.

1. Create Cloudflare and Resend accounts. In Resend, verify a sender domain or use its
   onboarding sender for delivery to the verified account email.
2. Open a terminal in `worker` and run `npx wrangler login`.
3. Create the storage resources:

   ```powershell
   npx wrangler r2 bucket create ovnivirus-free-pack
   npx wrangler d1 create ovnivirus-downloads
   ```

   Copy the database ID from the D1 output into `database_id` in `wrangler.toml`, then
   initialize the database:

   ```powershell
   npx wrangler d1 execute ovnivirus-downloads --remote --file=./schema.sql
   ```

4. Upload the ZIP from the workspace folder next to `pagina-artista`:

   ```powershell
   npx wrangler r2 object put ovnivirus-free-pack/sample-pack-free.zip --file="..\..\sample pack free.zip" --remote
   ```

5. Add the Resend API key as a Cloudflare secret. Run this from `worker`; paste the key
   only into the hidden terminal prompt, never into source code or chat:

   ```powershell
   npx wrangler secret put RESEND_API_KEY
   ```

6. Deploy the Worker:

   ```powershell
   npx wrangler deploy
   ```

7. Copy the deployed `workers.dev` URL into the `download-api` meta tag in `index.html`.
   Push the website update to `main` so GitHub Pages deploys the connected form. Keep
   `ALLOWED_ORIGIN` set to `https://opsynatra08-art.github.io`.

The Resend onboarding sender is restricted to the verified owner address. If using a
custom sender, set `REPORT_FROM` in `wrangler.toml` to an address on a domain verified
in Resend. Contact details for incomplete downloads are deleted when their link expires.
For completed downloads, the Worker clears contact details after successful email
delivery; failed reports are retried and any remaining records are removed after 30 days.
The email report itself remains in the recipient inbox. Follows and a visitor's decision
to save or extract the ZIP cannot be independently verified by this flow.

## Publish or update tracks

In **Releases**, create or update the `audio-v1` release and attach each WAV using the
exact filename listed in `assets/audio/tracks.json`. Each release asset must be under
2 GiB. Do not add WAV files to the website's Git history.

The original ZIP is about 122 MB; it stays outside the repository and public code history.
