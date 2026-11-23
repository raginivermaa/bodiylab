# Bodiy Lab by V2U Healthcare

The Bodiy Lab website: research-backed beauty and wellness devices for your at-home ritual.

## Pages

| File | Page |
| --- | --- |
| `index.html` | Home |
| `led-mask.html` | LED Light Therapy Mask (live product, $349) |
| `red-light-helmet.html` | Red Light Helmet (coming soon, placeholder pricing and specs) |
| `v-sculpt.html` | V Sculpt ultrasound device (coming soon, placeholder) |
| `about.html` | About V2U Healthcare |

Every page has the sidebar menu (LED Light Therapy → LED Mask, Red Light Helmet; Ultrasound → V Sculpt; About V2U Healthcare) and adapts to phone screens.

## How it's built

Plain HTML, CSS and JavaScript, with no build step and no dependencies.

- Each page keeps its markup inside `<template id="page-template">`, with inline styles.
- A small script at the bottom of each page (`class Component extends DCLogic`) holds the interactive bits: colour picker, FAQs, sidebar menu, waitlist forms, prices.
- `assets/js/page.js` renders the template and updates it when something changes.
- Images, logos and favicons are in `assets/img/`.

### Editing

- **Copy:** edit the text directly inside the page's `<template>`.
- **Prices:** in `led-mask.html` and `red-light-helmet.html`, change the defaults in `renderVals()` (e.g. `this.props.price ?? '$349'`).
- **Product photos:** replace the files in `assets/img/` and keep the same names, or update the paths in the page.
- **Mobile layout:** the `@media (max-width: 760px)` rules in each page's `<style>` block.

## Preview locally

Open `index.html` in a browser, or run a local server:

```
python3 -m http.server 8000
```

then visit http://localhost:8000.

## Publish with GitHub Pages

Settings → Pages → Build and deployment → Source: **Deploy from a branch**, Branch: **main**, folder **/ (root)**. The site will be live at `https://raginivermaa.github.io/bodiylab/` a minute or two later.

## Before launch

- Helmet and V Sculpt pages contain bracketed placeholders (specs, copy) to replace with confirmed details.
- Before/after photos on the LED Mask page are placeholders.
- "Add to bag" and waitlist forms are front-end only; connect them to your store and email tool.
- Product claims are written as cosmetic. Have regulatory claims (e.g. clearance or certification wording) checked before launch.
