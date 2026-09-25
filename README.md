# The Villa — a game of Traitors

A free, unofficial party adaptation for 12–14 friends (ideal: 13). One shared phone runs the game; nobody has to be the host. Version 2 removes missions, points and side activities and introduces a dark cinematic design and timer alerts.

## The whole game in a minute

1. **Get a role.** Three random Traitors; everyone else is Innocent. Each person privately sets a four-digit PIN and accepts their role. Traitors see their teammates.
2. **Enjoy the party.** Talk, listen, make alliances. There are no tasks to complete between rounds.
3. **The Circle of Shaq.** Surviving players discuss, then pass the phone and vote privately. The person with the most votes is banished and reveals their role.
4. **The murder.** Every survivor takes a private turn. Traitors choose an Innocent; Innocents pick an ignored decoy. Only the Traitor choices decide the victim. The app announces the murder.
5. **Repeat for four Circles, then play the final fire.** Everyone privately chooses END or BANISH. Unanimous END finishes; any BANISH causes another vote. Final departures keep their roles secret. At two survivors, the game ends automatically.
6. **Reveal the winners.** If any Traitors survive, the surviving Traitors win. Otherwise, the surviving Innocents win. Catching all three Traitors before the finale ends the game immediately.

Eliminated players are permanently out. They can enjoy the party or watch quietly. No voting, hints, advice or revealing other players’ secrets. There are no side activities, extra tasks or duties for them.

This is inspired by the Indian Prime Video show, with house rules needed for a host-free shared phone. The show includes missions; this edition deliberately omits them at the organiser’s request. Murder votes, automatic tie draws and a fixed schedule are party adaptations, not a claim to reproduce every TV rule. No recruitment, shields or role changes.

## A relaxed five-hour evening

Example: start at **3:30 pm**, aim to finish at **8:30 pm**.

| Time | What happens |
|---|---|
| 3:30–3:45 | Secret roles and PINs |
| 3:45–4:45 | Party time and conversations |
| 4:45–5:05 | Circle 1, banishment and murder |
| 5:05–6:00 | Party time |
| 6:00–6:20 | Circle 2, banishment and murder |
| 6:20–7:15 | Party time |
| 7:15–7:35 | Circle 3, banishment and murder |
| 7:35–7:50 | Short party break |
| 7:50–8:10 | Circle 4, banishment and murder |
| 8:10–8:30 | Final fire and reveal |

The app can scale the schedule to four or four-and-a-half hours. Circle slots include discussion, phone passing, voting and the murder. Discussion has a ten-minute countdown (two minutes in the finale); voting takes however long the group needs. There is no forced vote deadline.

These are planned times, not a guaranteed duration. Early wins, withdrawals or advancing early can shorten the game. Extra final votes, pauses or slow rounds can extend it. The group taps Continue when ready. Timers never submit ballots, reveal roles or eliminate anyone.

## Voting details

- No self-voting. Each survivor gets one sealed ballot.
- Most votes decides a banishment. A tie triggers one runoff, with all survivors voting between tied names. A second tie is settled by a saved random draw.
- For murders, Traitors can choose only surviving Innocents. The most Traitor votes decides the victim; a tie is randomly resolved. Individual night choices are never published.
- With 13 players and no early ending, four banishments plus four murders leave five finalists. With five or fewer survivors after an earlier murder, the finale begins then.
- Final banishments stay secret, even if the last Traitor leaves. Players keep deciding END or BANISH until unanimous END or two survivors remain. Equal numbers of Traitors and Innocents do not automatically end this adaptation.
- A sealed choice and a revealed result cannot be undone.

## Timer sound and notifications

On a countdown, tap **Enable sound**, listen to the test chime, and adjust the phone’s media volume. The sound must be enabled again after a full reload. **Alert settings** also offers notification permission/testing and an optional **Keep screen awake** button.

| Phone state | What to expect |
|---|---|
| Page visible, sound enabled | A short chime and on-screen alert when the countdown expires. |
| Notifications allowed, page still executing | The app also requests a browser notification. Device settings control how it appears and sounds. |
| Page minimized, phone locked, or browser suspended | No reliable scheduled alert. The countdown catches up when you return. |
| Page closed | No timer code runs; this edition cannot send a push message. |

**Set an ordinary Clock alarm for the gathering time if you leave or lock the phone.** The game displays the time to use. Update the Clock alarm yourself if you pause or extend the game. It is separate from the website.

Keep-screen-awake works only while the page is visible, where the browser supports it. Battery saver or the operating system can refuse it. It cannot prevent you manually locking the phone. Notifications and sound may be affected by silent mode, Focus/Do Not Disturb, volume and browser settings.

On iPhone/iPad, web notifications require a supported version of iOS/iPadOS (16.4 or later) and a web app added to the Home Screen. Install before the real game and rehearse in that same app; browser and installed-app storage can differ. Adding to the Home Screen does not create a background timer service.

This static GitHub Pages edition has no push subscription or server-side scheduler. Reliable attempts at delivery to a suspended app would need a separate push sender/scheduler and internet connectivity, plus notification permission. Even true push cannot force custom alarm sounds or override Focus and silent settings.

Alerts contain no names, roles, choices or results. Expiration only reminds you to gather. Refreshing does not repeat an already recorded alert. If optional alert storage is unavailable, deduplication still works for the current open page, but a reload may repeat the reminder.

Sources: [Apple/WebKit: Web Push on iOS](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/), [MDN: background page behaviour](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API), [MDN: notification options](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/showNotification), [web.dev: Web Push protocol](https://web.dev/articles/push-notifications-web-push-protocol).

## Use it on GitHub Pages

Upload the files inside this folder to a public repository, with `index.html` at its top level. In **Settings → Pages**, choose **Deploy from a branch → main → / (root)** and save. Open the HTTPS website link shown there.

There is no app store, paid account, access token, build command or server setup. Opening the link on another phone creates a separate game; phones do not synchronize. Use one shared phone all evening.

### Updating an existing copy

Upload all the new files to replace the old files in the same repository. Also include the new `alerts.mjs`, `update.html` and `update.mjs` files. Wait until GitHub Pages finishes publishing.

Close other tabs or home-screen windows for the game. In the browser/app where you play, open `update.html` in the same website folder and tap **Check & load the update**. This updates the offline cache without clearing your saved game. It refuses to replace a version while another game window is open. Future updates can also be reached through **••• → Check for app update**.

Version 1 saves and encrypted backups migrate to the simplified schedule. Role assignments, PINs, votes, results and scheduled Circle times are retained. Old mission/break pairs become party breaks. Any already-recorded mission events remain in the historical record, but points no longer affect the game.

## Rehearse on the actual phone

1. Open **Try a rehearsal**. Every practice PIN is **1234**. Practice ballots can be filled automatically.
2. Enable sound, listen to it and test notifications if you want them. Check the volume and Focus settings yourself.
3. Wait for **Saved for offline play**, switch to airplane mode, then close and reopen the same browser tab or home-screen app. Confirm the right checkpoint returns.
4. Open a private role, switch apps, and return: the private screen should be locked.
5. Practice a Circle and a murder. Keep a power bank nearby.
6. Use **••• → Start a new game**, type **RESET**, then enter the real players’ names.

## Saved games and exceptions

Progress saves on this phone before a choice/result is displayed, with a second local recovery copy. Do not use private browsing, clear website data, or switch between browsers during the game. Clearing storage removes this phone’s game.

**••• → Save encrypted backup** downloads a password-protected checkpoint. Keep it privately where a spare phone can reach it. It captures that moment, not later turns. Never upload backups to the public repository. A stale backup from the same game is blocked in a browser that already has newer progress. A replacement phone cannot know what happened after its backup; compare the checkpoint with the group before continuing.

Forgotten PIN? Use **Reset a player’s PIN** with that person and a witness present. The reset appears in the public history. Someone must leave? Use **Player needs to leave** between ballots. Their role is revealed during regular play and hidden during the finale. A withdrawal can shorten the game.

PINs prevent casual accidental peeking, not a determined owner inspecting their own device’s stored data. There is no public master-role screen during play. Folded role slips and paper ballots are an optional fallback if the phone fails; an eliminated player does not have to become the host.

## Validation

Checked in mobile-sized Chrome and the Safari/WebKit browser engine: full game flow, private screen hiding, offline reload, backups, duplicate taps, PIN recovery, withdrawal and layout widths from 320 to 1280 pixels. The rules tests include 300 simulated complete games, plus migration from the original save format.

Alert checks cover real browser audio initialization, deadline catch-up, duplicate prevention, pause/extension, refresh and denied permissions. OS notification delivery is simulated in automated tests; audible volume, lock-screen behaviour and settings must still be checked on your physical phone. The version-1-to-version-2 cache update is tested separately.

Unofficial fan project. Not affiliated with Prime Video, The Traitors or Netflix. The cinematic artwork and styling are original; no Netflix logos or show artwork are included.
