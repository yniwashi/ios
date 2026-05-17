# iOS Ambulance App Repository

<!--
CHANGELOG (2026-05-17):
- Create iOS repo README draft for `yniwashi/ios`.
- Document package structure, deployment paths, helper dependencies, and local testing workflow.
-->

This repository hosts the iOS Ambulance App static website served from:

```text
https://ios.niwashibase.com
```

GitHub repository:

```text
https://github.com/yniwashi/ios
```

The app is a static HTML/CSS/JavaScript site. There is no build step.

## Repository Structure

```text
ios/
  index.html
  ambulance/
  cpr/
  install/
  helpers/
  docs/
  CNAME
  robots.txt
  .nojekyll
  splash.png
```

## Packages

```text
/
```

Root splash/session entry. Installed App users are routed to `/ambulance/` after session setup.

```text
/ambulance/
```

Main Ambulance App shell, router, search, tools, document viewers, shared helper preload/cache modules, and assets.

```text
/cpr/
```

Standalone CPR timer package with audio cues, session logging, retrieve/export behavior, and its own modal/history handling.

```text
/install/
```

Install/profile guide package with the configuration profile and installation images/video.

```text
/helpers/
```

Local helper pages and Shortcuts manifest files. Shared document/helper JSON used by the app is hosted on `docs.niwashibase.com`, not this local folder.

## Hosting And Gate

`ios.niwashibase.com` is served by GitHub Pages and protected by the production Cloudflare Worker for gated App routes.

Protected routes include:

```text
/ambulance/
/cpr/
```

The root `index.html` checks installed App display mode, requests/validates the `wc` session cookie through Worker endpoints, shows the splash, then redirects to `/ambulance/`.

## External Docs And Helper Data

The iOS app reads shared documents and helper JSON from:

```text
https://docs.niwashibase.com
```

Important helper URLs:

```js
urlIndex: "https://docs.niwashibase.com/helpers/cpg_index.json"
urlSopIndex: "https://docs.niwashibase.com/helpers/sop_index.json"
urlCpmIndex: "https://docs.niwashibase.com/helpers/cpm_index.json"
urlFlowcharts: "https://docs.niwashibase.com/helpers/flowcharts.json"
urlFormulary: "https://docs.niwashibase.com/helpers/formulary.json"
urlWebsites: "https://docs.niwashibase.com/helpers/websites.json"
```

Important viewer bases:

```js
urlPageBase: "https://docs.niwashibase.com/viewer/web/?file=/docs/cpg-81w9d1f.pdf#page="
urlSopPageBase: "https://docs.niwashibase.com/viewer/web/?file=/docs/sop-101qq9f2w.pdf#page="
urlCpmPageBase: "https://docs.niwashibase.com/viewer/web/?file=/docs/cpm-202e9d33q.pdf#page="
```

Website icons are hosted under:

```text
https://docs.niwashibase.com/website-icons/
```

## Helper Cache Behavior

The app preloads shared helper data when it opens and stores it locally for up to 7 days. It refreshes helpers in the background when the app opens.

Current shared cache modules:

```text
ambulance/search_data.js
ambulance/websites_data.js
```

If helper freshness must be forced after a major helper change, bump the relevant cache key in the matching data module.

## Development Workflow

No package install or build command is required.

Local LAN test command:

```text
cd /d "E:\Code Assist\Apps - Work\iOS Projects\iOS App"
npx --yes http-server@14 -p 3000 -a 0.0.0.0 -c-1
```

Open locally:

```text
http://127.0.0.1:3000/ambulance/
```

Use the LAN IP shown by the server to test on iPhone.

The `-c-1` flag disables caching and is important when testing changed JavaScript modules or helper behavior.

## Deployment Notes

Copy changed files directly into the GitHub repository structure and let GitHub Pages deploy from `main`.

When JavaScript assets need a fresh module load for all users, bump:

```js
APP_VERSION
```

in:

```text
ambulance/index.html
```

## Testing Checklist

After app changes, test:

- root splash/session redirect
- `/ambulance/` loads in the App
- home navigation to tools
- browser Back behavior for tool panels
- global search results
- CPG/SOP/CPM PDF opening and Back behavior
- Websites search, category filters, icons, Open and Share buttons
- CPR timer sounds, controls, log retrieval, and export/share behavior
- install page profile download flow
- light/dark theme readability
