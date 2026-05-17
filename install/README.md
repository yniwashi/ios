# Install Package

<!--
CHANGELOG (2026-05-17):
- Create Install package README draft for `yniwashi/ios/install`.
- Document install guide files, mobileconfig profile, media assets, and manual testing notes.
-->

This folder contains the iOS Ambulance App install/profile guide.

Live route:

```text
https://ios.niwashibase.com/install/
```

Repository path:

```text
install/
```

## Main Files

```text
install/index.html
```

Install guide page with Open Graph metadata, install instructions, demo video, and profile download button.

```text
install/AmbulanceApp.mobileconfig
```

Configuration profile offered for download through the install flow.

```text
install/images/
```

Install guide images, logo, poster, and step screenshots.

## Download Flow

The main download link currently points through the Worker-tracked route:

```text
/install/dl?file=AmbulanceApp.mobileconfig&v=1
```

Keep this route stable unless Worker download tracking is updated.

The Worker makes `/install/` non-cacheable and tracks profile downloads.

## Content Guidelines

When editing the install page:

- keep the primary download CTA clear
- keep step screenshots synchronized with current iOS behavior
- use Safari/iPhone wording where relevant
- keep Open Graph image paths valid
- avoid changing the mobileconfig filename unless routing/tracking is updated

## Assets

Current expected image assets include:

```text
install/images/logo.png
install/images/demo-poster.jpeg
install/images/step2.png
install/images/step3.png
install/images/step4.png
install/images/step5.png
install/images/step6.png
install/images/step7.png
install/images/step8.png
install/images/step9.png
install/images/step10.png
install/images/step11.png
```

Open Graph image path used by the page:

```text
/install/images/og/ambulance-install-1200x630.png
```

If this asset is missing or renamed, update the metadata before publishing.

## Manual Testing Checklist

After changing install files:

- open `/install/` on iPhone Safari
- confirm logo and screenshots load
- confirm demo poster/video loads or fails gracefully
- tap Download Ambulance App
- confirm profile download prompt appears
- confirm `/install/dl?file=AmbulanceApp.mobileconfig&v=1` works
- verify Open Graph preview if sharing the link
- verify light/dark readability
