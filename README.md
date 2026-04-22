# Who's Left?

A 2-player peer-to-peer web game board inspired by Guess Who.

- Players talk on Discord, not inside the app.
- The app is only a synced board.
- Networking uses `WebRTC DataChannel`.
- Signaling is manual via copy/paste offer and answer.
- The app is fully static and can be hosted on `GitHub Pages`.

## Files

- `index.html`: app shell
- `styles.css`: styling and responsive layout
- `app.js`: game logic, UI rendering, WebRTC logic, and message protocol

## Features

- `20` Bollywood celebrity tiles
- Shared randomized board layout using a host-generated seed
- Full local board with eliminate/restore interactions
- Local-only secret marker
- Opponent mini-board with masked cards and flipped backs
- Remaining counts for both players
- `Undo`, `Resync`, and `Reset`
- Reset starts a new round with a new shuffle

## Photos

Celebrity photos are bundled locally under `assets/photos/` and are resolved in `app.js` from each character `id`.

- Cards load `./assets/photos/<id>.jpg` for each celebrity.
- If a local image fails to load, cards fall back to initials and gradient placeholders.

This keeps the app fully static and removes any internet dependency for images.

## Run Locally

Serve the folder over `localhost`.

### Python

```bash
py -m http.server 8000
```

If `py` is unavailable:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

Do not rely on `file://`.

## How To Play

### Host

1. Open the app.
2. Click `Create Offer`.
3. Copy the signal from `Your Signal`.
4. Send it to the other player.
5. Paste their answer into `Remote Signal`.
6. Click `Accept Answer`.

### Joiner

1. Open the app.
2. Paste the host's offer into `Remote Signal`.
3. Click `Create Answer`.
4. Copy the generated signal from `Your Signal`.
5. Send it back to the host.

### During the round

1. Click a card to eliminate or restore it.
2. Use `Mark Secret` to mark your private chosen celebrity.
3. Watch the opponent mini-board flip matching positions as they eliminate tiles.
4. Use `Undo` to revert your latest elimination change.
5. Use `Resync` if the two boards drift.
6. Use `Reset` to start a fresh round with a new shuffle.

## Deploy To GitHub Pages

1. Push this repo to GitHub.
2. Open the repo on GitHub.
3. Go to `Settings > Pages`.
4. Under `Build and deployment`, set:
   - `Source`: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/ (root)`
5. Save.
6. Open the generated Pages URL once deployment finishes.

## Notes

- The app uses public STUN servers from Google for WebRTC ICE discovery.
- The app does not use a backend, database, or authentication.
- The app does not send the local secret pick.
- The opponent mini-board only shows positions, not celebrity identities.
