# PolyModLoader – PolyCup edition

A fork of [PolyModLoader](https://git.polymodloader.com/polytrackmods/PolyModLoader) (the community mod loader for [PolyTrack](https://www.crazygames.com/game/polytrack) 0.6.3) that comes with [PolyCup](https://github.com/Prawnfoot05/PolyCup) installed and opens the garage instead of the tutorial on first launch.

**Disclaimer: the PolyModLoader team is only responsible for the files in `src/` and their compiled versions, the rest is part of / modified files from [PolyTrack](https://www.crazygames.com/game/polytrack).**

[PolyModLoader wiki](https://wiki.polymodloader.com) | [PolyTrack Discord Server](https://discord.gg/g5Tr6Ysfh7) | [PolyTrack modding Discord server](https://discord.gg/gnzREXYHGf)

## What is different from upstream

- **PolyCup is installed automatically.** Every new player's mod list starts with PML Core and PolyCup (`https://cdn.polymodloader.com/gh/Prawnfoot05/PolyCup/main/dist`, latest version for PolyTrack 0.6.3), exactly as if the URL had been added through *Mods > Add*. A player who already had a mod list gets PolyCup added once; removing it through the mod library sticks, and clearing the mod list brings it back. The bundled mods are listed in `BUNDLED_MODS` in `src/PolyModLoader.ts`; pin a version there instead of `latest` if every player of an event must run one exact PolyCup build.
- **Garage instead of the tutorial.** PolyTrack drops new players into the tutorial track on first launch. This build opens the garage instead and marks the tutorial as completed, so later launches go straight to the main menu.
- **Backend proxy for leaderboards and multiplayer.** PolyTrack's backend (`vps.kodub.com`) only answers requests whose `Origin` header is one of the game's own origins. The desktop app handles that by rewriting the header (`electron/main.js`). A web build on another domain cannot, so this fork looks for a same-origin proxy at `./api/` when the page loads and, if it answers, routes leaderboard, profile and multiplayer-signaling traffic (including the signaling WebSockets) through it. `functions/api/[[path]].js` is that proxy as a Cloudflare Pages Function. Without a proxy the game talks to the official backend directly, which works on the desktop app and on origins kodub allows.

Everything else (mod library, settings, keybinds, mixin API, desktop packaging) is unchanged from upstream.

## Hosting the web version

### Cloudflare Pages (recommended: multiplayer and leaderboards work)

1. In the Cloudflare dashboard open *Workers & Pages → Create → Pages → Connect to Git* and pick this repository.
2. Leave the build command empty and set the build output directory to `/`.
3. Deploy. The function in `functions/api/[[path]].js` is published together with the site, and PolyModLoader detects it on its own.

The proxy only forwards paths below `/v6/` of the official backend and rewrites the `Origin` header to the one the PolyModLoader desktop app uses. Set the `POLYTRACK_ORIGIN` environment variable on the Pages project to send a different origin. It forwards the game's own requests only; kodub's [terms](https://www.kodub.com/terms/polytrack) still apply, so do not point automated tools at it.

### GitHub Pages (static only)

Enable *Settings → Pages → Source: GitHub Actions*. `.github/workflows/pages.yml` publishes the `main` branch (or run it manually). GitHub Pages cannot run the proxy, so multiplayer and leaderboards only work there if kodub's backend accepts your origin.

### Anywhere else

Any static web server works; for local development run `npm install` and `npm run dev` (serves the folder on port 8080). To use a proxy hosted somewhere else, define the backend URL before `main.bundle.js` loads, for example with an inline script in `index.html`:

```html
<script>window.polyModLoaderConfig = { backendUrl: "https://your-proxy.example.com/" };</script>
```

The proxy must answer `GET <backendUrl>` with status 204 and the header `X-PolyTrack-Proxy: 1` to be auto-detected at `./api/`; an explicitly configured URL is used without that probe.

## Desktop app

Unchanged from upstream: `npm install`, then `npm run start-app` to run or `npm run package-win`, `package-mac`, `package-linux` to build. The desktop app always uses the official backend directly.

## Playing PolyCup

Host a multiplayer lobby (*Multiplayer → Host*), then open PolyCup with the trophy button in the toolbar or **F8**. Create a cup, share the lobby code, and let the other racers join. All players and spectators need the same PolyCup version; this build keeps PolyCup on the latest release, which PolyCup's own version check enforces when someone joins. See the [PolyCup README](https://github.com/Prawnfoot05/PolyCup#readme) for the rules and controls.

## Development

The loader lives in `src/PolyModLoader.ts` and `src/PolyTypes.ts`. After `npm install`, compile with

```sh
cd src && npx tsc
```

which writes `PolyModLoader.js`, `PolyTypes.js` and the `.d.ts` files to the repository root. Commit the compiled files together with the TypeScript changes.
