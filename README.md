# The Villa · A game of Traitors

A free, mobile-friendly party game for **12–14 friends**, designed around 13 players. One shared phone deals roles, protects private turns with player PINs, counts votes, conducts secret murders and runs the finale. No host sits out.

## Publish on GitHub Pages — no access token needed

Do this in your normal, signed-in GitHub browser. Use a personal account you are permitted to use. No paid plan or custom domain is needed for this public repository.

1. Open **https://github.com/new**.
2. Name the repository **traitors-villa**. Choose **Public**, turn on **Add README**, and click **Create repository**.
3. Open the new repository. Choose **Add file → Upload files**.
4. Unzip the download. Open the **traitors-villa** folder. Drag the files **inside that folder** into GitHub. `index.html`, `app.mjs`, `engine.mjs`, `storage.mjs`, `styles.css`, `sw.js`, the manifest and the three icon files must all be at the repository's top level. Upload the files, not the ZIP and not a folder nested inside another folder.
5. Choose **Commit changes** to save them to the `main` branch. If your account requires a pull request, merge it into `main` before proceeding.
6. Open **Settings → Pages**. Under **Build and deployment**, select **Deploy from a branch**. Choose **main** and **/ (root)**, then **Save**.
7. Wait for the Pages deployment to finish. GitHub says publication can take up to ten minutes. Open the link shown in **Settings → Pages**. It will usually look like `https://YOUR-USERNAME.github.io/traitors-villa/`.
8. Open that **website link** on your phone. The GitHub repository page itself is not the game.

If GitHub reports that `traitors-villa` already exists, use `traitors-villa-party` or another unused name. All game asset paths are relative, so either project name works.

GitHub reference: [Pages setup](https://docs.github.com/en/pages/quickstart) · [Uploading files](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository).

The public repository contains reusable game code and instructions only. **Do not upload player role notes, exported game backups, PINs, access tokens or other personal files.** Actual names, roles and votes are created on the phone and are not sent to GitHub by the game. GitHub still receives ordinary requests for the website files.

## Before the party

- Use Safari on iPhone or a modern Chrome browser on Android. JavaScript and browser storage must be enabled. Open the HTTPS Pages website, not a local-file preview.
- Optional: add the site to your home screen **before** setting up the real game. On iPhone, use **Share → Add to Home Screen**. On Android, use the browser's **Add to Home screen / Install** option. Continue using that same browser or installed app; they can have separate saves.
- Tap **Try a rehearsal**. It uses 13 fictional guests and PIN `1234` for everyone. You can fill practice ballots automatically and try the complete flow. Rehearsal roles are randomized too.
- Wait for **Saved for offline play**. Then turn on airplane mode, close and reopen the same game window, and check that it resumes. After this check, turn your connection back on if wanted.
- Check privacy by opening a role and switching away from the browser. The role should disappear when you return.
- Finish or clear the rehearsal through **Game controls → Start a new game** before entering real names. The clear operation requires typing `RESET`.
- Bring a power bank, paper slips, pens, a bowl and prize chocolates. Set normal phone alarms for gatherings. Browser timers are only on-screen guides and can be suspended in the background.

## Play

1. Enter 12–14 unique names, a start time and a 4, 4½ or 5-hour schedule. The 5-hour option is the relaxed default.
2. Pass the phone privately. Each person selects their own name, chooses a 4-digit PIN and accepts their role. Three random players are Traitors; they see their fellow Traitors' names.
3. Each player privately writes their role and PIN on a folded backup slip. Keep it hidden.
4. Follow the on-screen missions, breaks and discussions. Anyone can operate public controls; there is no privileged host account.
5. All survivors enter their PIN for private ballots. After everyone submits, gather the group and reveal the result.
6. Regular banishments reveal roles. Murders target Innocents. Eliminated players join Ghost Club and still play every mission.
7. In the finale, everyone privately chooses END or BANISH. One BANISH keeps the game going. Final departures hide their roles. The game ends on unanimous END or with two survivors. Surviving Traitors take the pot if any remain; otherwise surviving Innocents share it.

Complete rules are available in the app's **Rules** tab. Player withdrawals, pauses, schedule extensions and public PIN resets are in **Game controls**.

This edition uses permanent eliminations, not suspicion points or the earlier proposed group census. There are no shields, recruitment or role switches. Majority/parity does not itself trigger a Traitor win. A random draw resolves a tied runoff; a random choice among tied murder targets resolves a split Traitor decision. Random results are saved before being displayed.

## Backups and interruptions

- Progress is saved after every accepted action, with a second local copy and corruption checks. Results are displayed only after the primary save succeeds.
- Local browser storage is not a substitute for a backup: clearing browser data, private browsing, device loss or some storage policies can remove it.
- Between rounds, choose **Game controls → Save encrypted backup**. Use a password of at least eight characters. Save the file somewhere reachable from a spare phone, and retain the password privately. Backups use AES-GCM encryption with a password-derived key. There is no password-recovery service.
- On a spare phone, open the same Pages site and choose **Restore a saved game**. Pick the file and enter its backup password. Verify the public checkpoint with the group.
- A backup reflects its export time. Restoring an older copy cannot undo information people saw later. If the backup is behind the live game, use paper to finish instead of replaying outcomes. The app blocks importing an older revision over a newer save of the same game.
- **Paper fallback:** use the folded role slips and the last public player list. Hold simultaneous written banishment votes. During murders, all survivors submit identical folded slips: Innocents write `0`, Traitors write one living Innocent's player number. Shuffle, ignore zeros, choose the most frequent target, and draw randomly if tied. Follow the same round count and finale rules.
- A player who forgets their PIN can reset it with themselves and a witness present. This is logged publicly. There is no silent organizer override or master role-view screen.

## Limits worth knowing

- This is **one shared-device game**. Opening the link on multiple phones creates separate games. There is no online multiplayer synchronization.
- PINs and hiding screens protect against accidental peeking. An owner using developer tools could inspect local game data. This is an honour-system party tool, not an anti-cheating or high-stakes wagering system.
- Most current browsers prevent a second tab from controlling the same game using a browser lock. Saves also check for stale revisions. Keep one window active regardless.
- Do not update the website halfway through a real game. A waiting offline update does not deliberately replace an active game.
- Everyone can play without a host, but players still need to pass the phone, protect the screen, and agree when to continue.
- The 13-player five-hour schedule starts with 75 minutes before the first elimination. Catching all three Traitors can end it after around four hours. Shorter schedule choices, advancing early or withdrawals can shorten that further.

## Files

`index.html` is the entry point. The game uses plain browser JavaScript modules, CSS, a web manifest and an offline service worker. There are no package installations, build commands, paid APIs, external fonts, analytics or third-party runtime scripts.

An unofficial fan-made party adaptation. Not affiliated with Prime Video, The Traitors or their producers. Version 1.0.0.
