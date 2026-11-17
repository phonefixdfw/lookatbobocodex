# Handoff

1. Fetch `origin/main` and start a feature issue and branch. Merge the current `origin/main` into the branch before opening its PR. Use ordinary pushes.
2. Run `npm ci`, `npm run build`, and `npm run dev` for a preview. Run `npm run check` before release.
3. Make room and spawn changes in [layout.js](../app/game/layout.js). Update the [floor plan](FLOOR-PLAN.md) and run `node scripts/floor-plan.mjs`. Add any new spot to the real aim and reachability checks.
4. Inspect the PNGs and workflow results. Use the [deploy guide](DEPLOY.md) to verify the published root, manifest, and service worker.
5. The voice assets are checked in with their generation code. To regenerate them on macOS, run `scripts/voice.sh` with the Samantha voice, `say`, `afconvert`, and Python 3 available.

[Rules](../app/game/rules.js) handle time, score, seeded bags, and local records. [Scene](../app/game/scene.js) handles the camera, rendering, culling, and aim. [Main](../app/game/main.js) manages browser inputs, UI, and the clock.
