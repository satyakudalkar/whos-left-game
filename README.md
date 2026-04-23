# Who's Left?

A 2-player peer-to-peer companion board game for Discord calls. Inspired by Guess Who, where players track their Bollywood grid while the other player sees only masked card positions.

**[Live Demo](https://satyakudalkar.github.io/whos-left-game/)**

---

## Features

- **Multiple Game Modes**: Bollywood Celebrities, TV Shows (72 characters), Marvel (57 characters), The Office, Clash of Clans
- **Independent Board Layouts**: Each player sees their cards in different positions to prevent deduction
- **Turn-Based Elimination**: Characters can only be un-eliminated on the same turn they were eliminated
- **Secret Selection**: Private turn to choose your secret character without opponent knowing
- **Real-time Sync**: Changes sync instantly via WebRTC DataChannel
- **Fully Static**: No backend, database, or authentication required
- **Mobile Friendly**: Responsive design works on all screen sizes

---

## How It Works

1. **Host** creates an offer (WebRTC connection signal)
2. **Joiner** pastes the offer, creates an answer, and sends it back
3. **Host** accepts the answer and connects
4. **Host** selects a game mode and clicks "Start Game"
5. Both players see their boards, choose secrets, and play!

Players communicate via Discord while the app handles:
- Board synchronization
- Turn tracking
- Elimination updates
- Guess validation

---

## Quick Start

### Run Locally

```bash
# Using Python
py -m http.server 8000

# Or using Node.js
npx serve .

# Or using PHP
php -S localhost:8000
```

Then open: **http://localhost:8000**

### Host Setup (Player 1)

1. Open the app
2. Connect with Player 2 (see connection guide below)
3. Select a game mode from the dropdown
4. Click **Start Game**
5. Wait for Player 2 to select their secret
6. Choose your secret character (first two turns are for secret selection)
7. Ask questions and eliminate characters to narrow down the opponent's secret
8. Make a **Guess** when you're confident

### Joiner Setup (Player 2)

1. Open the app
2. Paste Player 1's offer and create an answer
3. Send the answer back to Player 1
4. Wait for connection and secret selection
5. Choose your secret character
6. Answer questions and watch the opponent's mini-board

---

## Manual Signaling Guide

The app uses WebRTC for peer-to-peer connections. Since there's no signaling server, players exchange connection signals manually.

### Step-by-Step Connection

#### Host (Creates Offer)

1. Click **Create Offer** button
2. The offer signal is auto-copied to your clipboard
3. Send this text to Player 2 via Discord, WhatsApp, or any messaging app

#### Joiner (Creates Answer)

1. Paste Player 1's offer into the **Remote Signal** text area
2. Click **Create Answer** button
3. The answer signal is auto-copied to your clipboard
4. Send this text back to Player 1

#### Host (Accepts Answer)

1. Paste Player 2's answer into the **Remote Signal** text area
2. Click **Accept Answer** button
3. Wait for the connection to establish (green "Connected" status)

### Pro Tips

- **Auto-Copy**: The app automatically copies offers and answers to your clipboard
- **WhatsApp Quick Send**: Use the "Send to WhatsApp" buttons for instant sharing
- **Paste Button**: Click the paste button or use Ctrl+V to paste signals
- **Reconnecting**: If disconnected, exchange new offers/answers to reconnect

---

## Game Rules

### Objective
Guess your opponent's secret character before they guess yours.

### Setup Phase (2 turns)
1. Host chooses their secret first
2. Joiner chooses their secret
3. Game begins automatically

### Play Phase
- **Questioner** (Host goes first): Can eliminate/restore characters and ask questions
- **Answerer**: Board is hidden, only sees opponent's mini-board

### Passing Control
- Click **Pass Turn** to let the other player ask questions
- You can only un-eliminate characters during your own turn

### Winning
- Make a **Guess** when you think you know the opponent's secret
- Correct guess = You Win
- Incorrect guess = Opponent Wins

### Reset
- Only the host can reset the game
- Reset starts a new round with a new board shuffle

---

## Game Modes

| Mode | Characters | Description |
|------|-----------|-------------|
| **Bollywood Celebrities** | 25 | Hindi film stars |
| **TV Shows** | 72 | Characters from Friends, The Office, Game of Thrones, Stranger Things, and more |
| **Marvel** | 57 | Marvel Cinematic Universe characters |
| **The Office US** | 25 | Dunder Mifflin employees |
| **Clash of Clans** | 40 | COC troops and characters |

Each game randomly selects 25 characters from the pool for the board.

---

## Technical Details

### Architecture
- **Frontend**: Vanilla JavaScript (ES6), HTML5, CSS3
- **Networking**: WebRTC DataChannel
- **Signaling**: Manual copy/paste (no server required)
- **Hosting**: Static files deployable on GitHub Pages

### Files
| File | Purpose |
|------|---------|
| `index.html` | App shell structure |
| `styles.css` | Styling and responsive layout |
| `app.js` | Game logic, UI rendering, WebRTC |
| `modes.js` | Game mode definitions and character data |
| `constants.js` | DOM references and message types |
| `utils.js` | Utility functions |

### Photos
Character photos are bundled locally under `assets/photos/`. If a photo fails to load, the card displays initials with a gradient background.

---

## Deploy To GitHub Pages

1. Fork or push this repo to GitHub
2. Go to **Settings > Pages**
3. Under "Build and deployment":
   - Source: **Deploy from a branch**
   - Branch: **main** (root)
4. Save and wait for deployment
5. Your app will be live at: `https://<username>.github.io/whos-left-game/`

---

## Privacy

- **No Data Storage**: Nothing is stored on any server
- **Peer-to-Peer**: All communication happens directly between players
- **No Tracking**: No analytics, cookies, or third-party services
- **Local Secrets**: Your secret character is never transmitted to the opponent

---

## License

MIT License - Feel free to use, modify, and distribute.

---

## Contributing

Contributions welcome! Please feel free to submit issues or pull requests.

1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Submit a pull request