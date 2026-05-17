# Ambulance Package

<!--
CHANGELOG (2026-05-17):
- Merge the full iOS webapp update guide into this package README and remove the standalone guide dependency.
- Add ASSET_VERSION cache refresh workflow for app-owned JavaScript updates.
- Create Ambulance package README draft for `yniwashi/ios/ambulance`.
- Document app shell, routing, tools, search/helper cache modules, and manual testing notes.
-->

This folder contains the main Ambulance App experience.

Live route:

```text
https://ios.niwashibase.com/ambulance/
```

Repository path:

```text
ambulance/
```

## Main Files

```text
ambulance/index.html
```

Main app shell. It owns:

- theme handling
- Terms gate
- Shortcuts Mode UI
- What's New modal
- home-screen sections
- global search
- tool panel router
- Back/swipe behavior
- module preloading
- helper warmup

```text
ambulance/tools/
```

Plain JavaScript tool modules. Each tool should keep this pattern:

```js
export async function run(root) {
  // render tool UI into root
}
```

```text
ambulance/search_core.js
```

Shared weighted search engine used by global search, CPG Wizard, and SOP search.

```text
ambulance/search_data.js
```

Shared helper loader/cache for CPG, SOP, CPM, flowcharts, and formulary data.

```text
ambulance/websites_data.js
```

Shared helper loader/cache for remote Websites data and website icon warmup.

## App Code Cache Refresh Guide

`ambulance/index.html` owns two version keys:

```js
const APP_VERSION = "v0.3";
const ASSET_VERSION = "asset-YYYYMMDD-N";
```

`APP_VERSION` is visible to users. `ASSET_VERSION` is hidden and should be bumped whenever app-owned JavaScript changes are uploaded.

Recommended `ASSET_VERSION` format:

```text
asset-20260517-1
asset-20260517-2
asset-20260518-1
```

Use the date plus a counter for multiple uploads on the same day.

Covered app-owned JavaScript:

```text
ambulance/search_core.js
ambulance/search_data.js
ambulance/websites_data.js
ambulance/tools/*.js
```

Release checklist:

1. Edit the app files.
2. Update the dated changelog at the top of every changed file.
3. Bump `ASSET_VERSION` in `ambulance/index.html`.
4. Upload `ambulance/index.html`.
5. Upload every changed JavaScript file.
6. Open the Ambulance App, fully close it from the app switcher, then reopen it.
7. Test the changed tool or search behavior.

The app builds JavaScript URLs like:

```text
/ambulance/tools/websites.js?ver=asset-20260517-1
```

When `ASSET_VERSION` changes, the URL changes:

```text
/ambulance/tools/websites.js?ver=asset-20260518-1
```

The browser treats that as a different file and fetches the new JavaScript instead of reusing the old cached copy.

`ASSET_VERSION` does not control:

```text
docs.niwashibase.com viewer files
docs.niwashibase.com helper JSON cache inside the app
PDF files
website icon image cache
audio/image files unless their URLs are versioned separately
```

For helper JSON such as `websites.json`, `cpg_index.json`, `sop_index.json`, or `cpm_index.json`, upload the helper to the docs host. The iOS app keeps helper data for up to 7 days and refreshes in the background when the app opens.

Do not change the Cloudflare Worker gate for normal app code updates. The update fix is handled by `ASSET_VERSION`, not by changing the session cookie, `/session`, `/cookie-check`, or install redirect logic.

## Tools

Current tool modules include:

```text
ap_peds.js
ccp_peds.js
caretools.js
cpg_wizard.js
estweight.js
flowcharts.js
formulary.js
gcs.js
map.js
meds_calculator.js
overtime.js
rbs.js
sat.js
sop.js
ventilator_settings.js
waafels.js
websites.js
westley.js
```

The app shell dynamically imports tools from:

```js
./tools/${actionId}.js?ver=${ASSET_VERSION}
```

Bump `ASSET_VERSION` in `ambulance/index.html` when deployed app JavaScript needs a forced fresh module load.

## Routing

The app uses hash routing:

```text
#tool=<actionId>
```

Some tools may add tool-specific query params to the hash. Preserve Back behavior when adding or editing tools.

## Global Search

Global search is powered by:

```text
search_core.js
search_data.js
```

It searches:

- app features
- CPG index
- SOP index
- CPM index
- flowcharts
- formulary

It supports document-number intent such as:

```text
CPG 4.1
SOP 1.2
CPM 2.17
```

Current helper sources:

```text
https://docs.niwashibase.com/helpers/cpg_index.json
https://docs.niwashibase.com/helpers/sop_index.json
https://docs.niwashibase.com/helpers/cpm_index.json
https://docs.niwashibase.com/helpers/flowcharts.json
https://docs.niwashibase.com/helpers/formulary.json
```

Search helper data is cached locally for up to 7 days and refreshed in the background.

## PDF Viewer Links

Current document page bases:

```js
urlPageBase: "https://docs.niwashibase.com/viewer/web/?file=/docs/cpg-81w9d1f.pdf#page="
urlSopPageBase: "https://docs.niwashibase.com/viewer/web/?file=/docs/sop-101qq9f2w.pdf#page="
urlCpmPageBase: "https://docs.niwashibase.com/viewer/web/?file=/docs/cpm-202e9d33q.pdf#page="
```

PDF viewers are opened in App modals with Back handling. Test Back after any viewer or routing change.

## Websites Tool

The Websites tool loads shared remote data from:

```text
https://docs.niwashibase.com/helpers/websites.json
```

Website icons are loaded from:

```text
https://docs.niwashibase.com/website-icons/
```

Behavior:

- hides entries with `enabled: false`
- treats missing `enabled` as visible
- requires `title` and `url`
- displays an alphabetical list
- supports category filter chips
- supports search by title, subtitle, category, and URL
- opens or shares/copies only the URL
- falls back to a letter tile if an icon fails

Websites helper data is cached locally for up to 7 days and refreshed in the background.

## UI And Coding Notes

- Use plain HTML, CSS, and JavaScript.
- Keep CSS scoped to each tool where possible.
- Use 16px or larger input text to avoid iOS focus zoom.
- Keep buttons/touch targets easy to tap.
- Preserve light/dark theme variables.
- Prefer existing app patterns over new abstractions.
- Add a dated changelog entry at the top of each file you edit.

## Manual Testing Checklist

After changing this package, test:

- home sections render
- Shortcuts Mode toggle behavior
- global search and result opening
- CPG/SOP/CPM document search queries
- CPG/SOP/formulary/flowchart PDF modal Back behavior
- Websites search/filter/open/share/icon behavior
- tool panel Back button
- swipe-back behavior
- light/dark readability
- iPhone Safari/App focus behavior
