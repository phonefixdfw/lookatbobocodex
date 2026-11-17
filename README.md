# Look at Bobo!

[Play Look at Bobo on GitHub Pages](https://phonefixdfw.github.io/lookatbobocodex/)

A cozy, first-person cat hunt in a procedural Three.js apartment. Find the black-and-white cat with the white bib and forehead dash. Aim and shout to earn ten points. The bigger black cat with white feet will cost you a point and add five seconds.

| Action | Desktop | Phone or tablet |
| --- | --- | --- |
| Move | WASD or arrows | Left joystick |
| Aim | Move the mouse | Drag a finger across the scene |
| Shout | Left-click or Space | **LOOK AT BOBO!** button |
| Pause | Esc or P | Pause button |
| Settings | O or the pause menu | Settings in the pause menu |

## Local build

```sh
npm ci
npm run build
npm run dev
```

`npm run check` runs the build, gameplay gates, static crawl, and automated Chrome playtests. Install Playwright Chromium with `npx playwright install chromium` if desktop Chrome is unavailable. Add `?quality=low` to the URL for a lighter rendering path.

- [Floor plan and measurements](docs/FLOOR-PLAN.md)
- [Character notes](docs/CHARACTERS.md) and [art direction](docs/ART-STYLE.md)
- [Playtest notes](docs/PLAYTEST.md)
- [Deployment and URL controls](docs/DEPLOY.md)
- [Handoff](docs/HANDOFF.md)
