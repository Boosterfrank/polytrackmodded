// Deployment settings for this PolyModLoader build. index.html loads this file before the game.
window.polyModLoaderConfig = {
  // Base URL of the backend proxy that forwards leaderboard, profile and multiplayer traffic to
  // PolyTrack's backend (see proxy/worker.js), e.g. "https://polytrack-backend-proxy.you.workers.dev/".
  // Leave it empty to auto-detect a proxy at ./api/ (Cloudflare Pages deployments) and otherwise
  // talk to PolyTrack's official backend directly.
  backendUrl: "",
};
