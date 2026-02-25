# dumbdeck-dashboard

A full-featured browser client for [DumbDeck](https://github.com/your-org/dumbdeck-hub). Open it on any phone, tablet, or browser on your local network to trigger keyboard shortcuts on your desktop — and manage your button layout from the built-in admin panel.

## Features

- **Button grid** — tap to fire keyboard shortcuts instantly
- **Admin panel** — add, edit, delete, and drag-to-reorder buttons without touching any config files
- **Live sync** — all connected clients update in real time when config changes
- **Listener status** — shows whether the desktop listener is connected
- **Auto-reconnect** — recovers from hub disconnects automatically

## Screenshots

> Button view (mobile) · Admin panel (drag & drop reorder)

## Requirements

- Node.js 18+
- A running [dumbdeck-hub](https://github.com/your-org/dumbdeck-hub) instance on the same network

## Setup

```bash
npm install
```

Copy the environment file and set the hub address:

```bash
cp .env.example .env
```

`.env`:

```env
VITE_WS_URL=ws://192.168.1.x:3000
```

Replace `192.168.1.x` with the IP of the machine running `dumbdeck-hub`. If running everything on the same machine, `ws://localhost:3000` works.

## Running

```bash
# Development (hot reload)
npm run dev

# Production build
npm run build

# Preview production build locally
npm run preview
```

The dev server starts at `http://localhost:5173` by default.

## Pages

| Path | Description |
|---|---|
| `/` | Button grid — tap buttons to trigger shortcuts |
| `/admin` | Admin panel — manage button config, drag to reorder |

## How it works

Both pages connect to the hub via WebSocket and join the appropriate room (`button_ui` or `admin`). On connect, the hub immediately sends the current config. All changes made in the admin panel are broadcast to every connected client in real time.

```
Browser (this app)
  │
  ├── GET ws://hub-ip:3000    ← join room
  ├── RECV config_loaded      ← initial button config
  ├── SEND trigger_key        ← user taps a button
  ├── SEND update_config      ← admin saves changes
  └── RECV config_updated     ← live config push from hub
```

## Admin Panel

The admin panel (`/admin`) lets you:

- **Add** buttons with a label, keyboard shortcut, and description
- **Edit** any field inline — click the hotkey field and press the actual keys to record a combo
- **Delete** buttons
- **Drag and reorder** buttons (the order is saved to the hub)
- **Save** all changes back to the hub in one click

Changes are local until you press **Save**. An unsaved-changes warning is shown if you have pending edits.

## Key Format

Keys are `+`-separated strings stored in the hub's `config.json`. Examples:

```
ctrl+shift+t
cmd+space
volumeup
playpause
f5
```

Supported modifiers: `ctrl`, `shift`, `alt` / `option`, `cmd` / `meta` / `super` / `win`

See [dumbdeck-hub](https://github.com/your-org/dumbdeck-hub#key-format) for the full key reference.

## Tech Stack

| Library | Purpose |
|---|---|
| React 18 | UI framework |
| TypeScript | Type safety |
| Vite | Build tool |
| Tailwind CSS | Styling |
| React Router v7 | Client-side routing |
| @dnd-kit | Drag-and-drop reordering |
| lucide-react | Icons |

## Project Structure

```
src/
├── pages/
│   ├── ButtonPage.tsx    # Main button grid
│   └── AdminPage.tsx     # Config editor with drag-and-drop
├── components/
│   ├── ButtonTile.tsx    # Single button card
│   ├── AdminButtonCard.tsx  # Editable button card in admin
│   ├── HotkeyInput.tsx   # Keyboard shortcut recorder input
│   └── StatusDot.tsx     # Connection status indicator
├── hooks/
│   └── useSocket.ts      # WebSocket connection + state management
└── types/
    └── index.ts          # Shared TypeScript types
```
