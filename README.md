# PolyModLoader – PolyRanked edition

A fork of [PolyModLoader](https://git.polymodloader.com/polytrackmods/PolyModLoader) (the community mod loader for [PolyTrack](https://www.crazygames.com/game/polytrack) 0.6.3) that comes with [PolyRanked](https://github.com/boosterfrank/polymultiplayer) installed and opens the garage instead of the tutorial on first launch.

**Disclaimer: the PolyModLoader team is only responsible for the files in `src/` and their compiled versions, the rest is part of / modified files from [PolyTrack](https://www.crazygames.com/game/polytrack).**

[PolyModLoader wiki](https://wiki.polymodloader.com) | [PolyTrack Discord Server](https://discord.gg/g5Tr6Ysfh7) | [PolyTrack modding Discord server](https://discord.gg/gnzREXYHGf)

## What is different from upstream

- **PolyRanked is installed automatically.** Every new player's mod list starts with PML Core and PolyRanked (`https://cdn.polymodloader.com/gh/boosterfrank/polymultiplayer/main`, latest version for PolyTrack 0.6.3), exactly as if the URL had been added through *Mods > Add*. A player who already had a mod list gets PolyRanked added once; removing it through the mod library sticks, and clearing the mod list brings it back. A mod this build used to bundle (PolyCup) is removed from profiles where it had been added automatically. The bundled mods are listed in `BUNDLED_MODS` in `src/PolyModLoader.ts`; pin a version there instead of `latest` if every player must run one exact build.
- **Garage instead of the tutorial.** PolyTrack drops new players into the tutorial track on first launch. This build opens the garage instead and marks the tutorial as completed, so later launches go straight to the main menu.
- **Backend proxy for leaderboards and multiplayer.** PolyTrack's backend (`vps.kodub.com`) only answers requests whose `Origin` header is one of the game's own origins. The desktop app handles that by rewriting the header (`electron/main.js`). A web build on another domain cannot, so this fork looks for a same-origin proxy at `./api/` when the page loads and, if it answers, routes leaderboard, profile and multiplayer-signaling traffic (including the signaling WebSockets) through it. `functions/api/[[path]].js` is that proxy as a Cloudflare Pages Function. Without a proxy the game talks to the official backend directly, which works on the desktop app and on origins kodub allows.

Everything else (mod library, settings, keybinds, mixin API, desktop packaging) is unchanged from upstream.

## Hosting the web version

### Cloudflare Pages (recommended: multiplayer and leaderboards work)

1. In the Cloudflare dashboard open *Workers & Pages → Create → Pages → Connect to Git* and pick this repository.
2. Leave the build command empty and set the build output directory to `/`.
3. Deploy. The function in `functions/api/[[path]].js` is published together with the site, and PolyModLoader detects it on its own.

The proxy only forwards paths below `/v6/` of the official backend and rewrites the `Origin` header to the one the PolyModLoader desktop app uses. Set the `POLYTRACK_ORIGIN` environment variable on the Pages project to send a different origin. It forwards the game's own requests only; kodub's [terms](https://www.kodub.com/terms/polytrack) still apply, so do not point automated tools at it.

### GitHub Pages + Cloudflare Worker

GitHub Pages serves the static files and a Worker does the proxying:

1. Deploy the Worker in `proxy/` (`cd proxy && npx wrangler deploy`, or *Workers & Pages → Create → Workers → Connect to Git* with root directory `proxy`). It is reachable at `https://polytrack-backend-proxy.<your-subdomain>.workers.dev/`.
2. Put that URL into `pml-config.js`:

   ```js
   window.polyModLoaderConfig = { backendUrl: "https://polytrack-backend-proxy.<your-subdomain>.workers.dev/" };
   ```

3. Enable *Settings → Pages → Source: GitHub Actions*; `.github/workflows/pages.yml` publishes the repository's default branch on every push (or run it manually for any branch).

`proxy/worker.js` is the same proxy as the Pages Function in Worker form; set the `POLYTRACK_ORIGIN` variable in `proxy/wrangler.toml` to change the Origin it sends. Without a configured proxy, GitHub Pages cannot run server code, so multiplayer and leaderboards only work if kodub's backend accepts your origin.

### Anywhere else

Any static web server works; for local development run `npm install` and `npm run dev` (serves the folder on port 8080). A configured `backendUrl` in `pml-config.js` is used as is; when it is empty, PolyModLoader probes `./api/` and uses it if the response carries `X-PolyTrack-Proxy: 1`, and otherwise talks to the official backend.

## Desktop app

Unchanged from upstream: `npm install`, then `npm run start-app` to run or `npm run package-win`, `package-mac`, `package-linux` to build. The desktop app always uses the official backend directly.

## Playing PolyRanked

A **Ranked** button appears next to *Multiplayer* in the main menu (shortcut F7). Open *Settings* inside it, enter the address of a PolyRanked server and save, then pick a queue. Ranked requires vanilla physics, so no loaded mod may touch the physics. See the [PolyRanked README](https://github.com/boosterfrank/polymultiplayer#readme) for the match formats and the server.

## Development

The loader lives in `src/PolyModLoader.ts` and `src/PolyTypes.ts`. After `npm install`, compile with

```sh
cd src && npx tsc
```

which writes `PolyModLoader.js`, `PolyTypes.js` and the `.d.ts` files to the repository root. Commit the compiled files together with the TypeScript changes.
