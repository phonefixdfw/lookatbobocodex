# Deploy Look at Bobo

Use Node 22 or newer to build the static web root.

```sh
npm ci
npm run build
npm run dev
```

Open the URL shown by the dev server. For production, serve the contents of `dist/` over HTTPS with the correct JavaScript and manifest MIME types. Relative asset paths support a domain root or a project path such as `/lookatbobocodex/`. The home screen shows the first eight characters of the running build's fingerprint. The full fingerprint appears when hovering over the label. Deploy the entire `dist/` tree, including its `release/` directory, so a new home page loads the matching game modules and styles.

## GitHub Pages

The Pages workflow runs the full gate for pull requests and `main`. On successful pushes to `main`, it uploads and deploys that build's `dist/`. In repository Settings → Pages, the publishing source is GitHub Actions.

To attach a custom domain, set it in Settings → Pages, add the required DNS records at the domain provider, and enforce HTTPS after GitHub provisions the certificate. [GitHub Pages custom domains](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)

On iPhone or iPad, open the HTTPS URL in Safari, choose Share → Add to Home Screen, and open the new icon to play in standalone mode.

## URL controls

| Query | Effect |
| --- | --- |
| `seed=N` | Replay a seeded spawn order and vacuum phase |
| `gate=off` | Freeze capture time and force seed 11 |
| `quality=low` | Cheaper rendering path |
| `cull=off` | Disable room and frustum culling |
| `touch=on\|off` | Override touch input detection |
| `patriot=on\|off` | Force MAGA Bobo on the second encounter or disable the variant |
| `music=off` | Disable the bardcore track |
| `roomba=off` | Disable the vacuum and its ride |
| `lap=on\|off\|N` | Enable, disable, or choose an encounter index of two or later |
| `stamp=on` | Show seed, draw calls, and spot ID |
| `test=on` | Enable test controls and bypass leaderboard writes |

Use `?` before the first option and `&` between additional options.
