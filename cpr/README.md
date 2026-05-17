# CPR Package

<!--
CHANGELOG (2026-05-17):
- Create CPR package README draft for `yniwashi/ios/cpr`.
- Document CPR timer purpose, files, audio assets, state/logging behavior, and manual testing notes.
-->

This folder contains the standalone CPR Timer used by the iOS Ambulance App.

Live route:

```text
https://ios.niwashibase.com/cpr/
```

Repository path:

```text
cpr/
```

## Main Files

```text
cpr/index.html
```

Standalone CPR timer page. It includes its own HTML, CSS, and JavaScript.

Audio assets:

```text
adr4.wav
beat.wav
cpr90.wav
cpr120.wav
pause.wav
rosc.wav
start.wav
stop.wav
total20.wav
```

## Purpose

The CPR package provides a focused resuscitation timer with:

- total CPR timer
- cycle timer
- adrenaline timer
- shock/amiodarone/DSD event buttons
- ROSC/Stop handling
- WAAFELSS quick access buttons
- log capture
- retrieve saved draft/log behavior
- PDF export/share behavior
- theme controls
- mute controls

## App Relationship

The main Ambulance package links to this route as a standalone page rather than loading it as a tool module.

The protected production route is:

```text
/cpr/
```

Keep this route stable unless the Worker and main app links are updated.

## Audio Notes

Audio files are local to the `cpr/` folder. If replacing audio:

- keep filenames stable when possible
- keep file sizes reasonable
- test iPhone audio playback after a user gesture
- test mute/unmute behavior

## State And Logs

The CPR page has local state and log/retrieve behavior. Any change to session state, export, or modal code should be tested carefully because iOS backgrounding and App lifecycle behavior can affect timers and saved data.

## Back And Modal Behavior

The CPR package has its own modal/history behavior. Keep Back behavior stable when editing:

- logs modal
- draft detail view
- retrieve log flow
- navigation away from CPR

## Manual Testing Checklist

After changing CPR:

- Start/Pause cycle timer
- Start/Pause adrenaline timer
- total CPR timer increments correctly
- audio cues play when expected
- mute prevents cues
- shock/amiodarone/DSD buttons log events
- ROSC saves/ends correctly
- Stop saves/ends correctly
- Retrieve Log opens saved draft/log
- Delete Log and Delete All work with confirmation
- Export PDF/share works on iPhone
- Back closes logs modal before leaving
- portrait and landscape layouts remain usable
- light/dark theme readability is acceptable
