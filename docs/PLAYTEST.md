# Playtest notes

Run `npm run check` after `npm ci`. Install Playwright Chromium if desktop Chrome is unavailable. The check captures the splash, desktop game, results, phone portrait and landscape, and tablet in the ignored `artifacts/` directory. CI attaches those captures.

- The rule gate covers scoring, time penalties, seed overrides, wins, and local times. It checks both 0.90 m dining routes, every room, vacuum clearance, 800 seeded runs, and three planted faults.
- The browser gate checks real aim hits, front-facing orientation, and at least 25% face visibility from reachable cells for 112 staged cases. It includes the 48 regular Bobo locations, decoy locations, multiple points along the Roomba route, the lap, and the cap. A planted, occluded target fails the same check.
- Scripted bots use collision movement and the center aim ray. They complete regular, decoy, lap, Patriot, and moving encounters, plus a natural Patriot find that wins the game with three points, fireworks, and the ending audio. They verify the exact ending and the leaderboard write guard.
- Capture mode compares PNG bytes with a fixed camera, time, and seed. Fireworks stay fixed for repeatable screenshots. Ten views compare culling on and off across the balcony, hall, and private rooms. A separate walk verifies the hall stays visible through its open doorway. Occlusion checks confirm that the bedroom and bath are hidden from the living room. Stress checks the shared 250 draw cap. Device emulation checks phone portrait and landscape, tablet, the movement joystick, touch aiming, and touch shout.
- Audio checks decode all three samples, schedule the MIDI-note melody, and verify DAG! feedback and paused music.

A run targets roughly ten minutes at an exploratory pace. Scripted timing is accelerated. Physical iOS Home Screen behavior and real-player session length still need device sessions.
