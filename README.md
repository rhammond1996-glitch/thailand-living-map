# Thailand / Living Map 🇹🇭

A **free, mobile-first, shared map** for our January 2027 Bangkok and Chiang Mai trip. Powered by **GitHub Pages** (public website), **Google Sheets** (one destination database), Leaflet and OpenStreetMap.


## Design studio — three live visual treatments

[Open design comparison](https://rhammond1996-glitch.github.io/thailand-living-map/designs.html).

- **Print Club** — `?design=print`: poster typography, acid lime, cobalt, orange, warm paper. Default for a new visitor.
- **Soft Signal** — `?design=soft`: soft lavender, peach, periwinkle, rounded bento cards.
- **Type Lab** — `?design=type`: black and white with lime, grid-aligned, high-contrast lettering.

These are visual themes of **the same interactive app**, not separately deployed copies. The selected treatment is saved to that browser's `localStorage`; using an explicit URL parameter overrides the saved choice. To test the itinerary inside a theme, append `&view=itinerary` to a theme URL. Keep the stylesheet order `styles.css` → `trip.css` → `design-system.css`. The former two hold functional and itinerary styles; the last implements visual variants. No place data was changed by the design study.

## Where everything lives

- **App source:** this repository; edits to `main` automatically republish the GitHub Pages website once Pages is enabled.
- **Master places:** [Google Sheet](https://docs.google.com/spreadsheets/d/1IBkBs5BBwmalgLfNBYnEakbKVt-Lw4kYu7VIDcxyjx4/edit) → **places** tab (lowercase).
- **Initial bundled snapshot:** [places.json](./places.json), copied from the Sheet (52 locations, 50 coordinates). Used as a fallback only if the Sheet cannot be accessed.
- **Map URL after GitHub Pages setup:** https://rhammond1996-glitch.github.io/thailand-living-map/

### Required one-time steps

**1. Enable GitHub Pages**

Repository → **Settings → Pages → Build and deployment**. Choose **Deploy from a branch**, Branch `main`, Folder `/(root)`, then **Save**. After the deployment runs successfully, open the map URL above. If you have a TinyURL pointing to the old Google Apps Script app, update its destination to the new GitHub Pages address (or create a new short link).

**2. Allow the website to read the destination tab**

In the linked Google Sheet, open **File → Share → Publish to web**. In the publication options choose the **places** tab (not the entire document). Publish and confirm. This makes the published tab publicly readable, so it must contain **only information you are comfortable sharing online**. The app only reads the first 13 columns and never writes to the Sheet.

The browser uses the Google Sheets Visualization feed (`gviz/tq`) for the selected tab. If the browser reports **Saved snapshot** instead of **Live · Google Sheets**, the live feed is inaccessible: verify that the tab is publicly published or shared with `Anyone with the link → Viewer`, then refresh. Publishing and link-sharing are different options, and availability can vary by account. Never make the Sheet editable by the public.

**3. Test the update flow**

Add a test destination to the Sheet with a unique `id`, `name`, `city`, `categories`, `location_type`, `address`, `highlights`, `priority`, and `status`. The map checks for updates each minute while open. Latitude/longitude can be added later; unpinned entries still appear in the places list. Delete the test row afterward.

### Adaptive Chiang Mai itinerary (November 2026)

- **Explore** keeps the complete Bangkok and Chiang Mai category-filtered map, existing favorites and the Google Sheets feed.
- **Itinerary** adds four selectable Chiang Mai day routes (January 13–16 draft), numbered primary pins and dashed *schematic* connections. Small pale dots indicate mapped alternative places within a user-selected straight-line radius (1, 3, 7 or 20 km), including locations already earmarked for a different day.
- Add a nearby alternative to today's route, skip an existing stop or reset the draft. Route changes are stored in browser `localStorage` on the current device; they do **not** write to the shared Sheet or sync across phones. Sharing `?view=itinerary&day=2` opens the original public route/day; not a copy of personal edits.
- New attraction pins live in [`trip-data.js`](./trip-data.js) and are merged into Explore as additional categories. Duplicate IDs from the Google Sheet take precedence; the original Sheet remains authoritative for its rows. Unchecked map coordinates are marked as approximate, and travel labels are planning estimates, not live routes.
- The Bo Sang festival dates are expected January 15–17, pending confirmation. **January 16 Day 4 conflicts with the planned international departure**; all four days are an intentionally overfull idea board until flights and the final Chiang Mai dates are fixed.
- Interface lives in `trip-itinerary.js` and `trip.css`. Existing `app.js`, original data, and categories remain in place.

## Future updates

For **destination changes**, ChatGPT can edit the linked Google Sheet through the connected Google Drive integration when asked. Data changes do **not** require a GitHub code commit or redeployment.

For **interface changes**, ChatGPT can commit new code through the connected GitHub integration. GitHub Pages then builds and deploys the updated website; the map URL stays the same.

**Important:** Future ChatGPT conversations still need access to the same linked Google Sheet and repository to perform writes. Updates must be verified, not merely described. The app does not update itself just because a destination was mentioned in chat.

### Data format (existing Sheet)

Headers, in this order:

`id,name,city,categories,location_type,address,highlights,price_note,priority,status,lat,lng,verification`

- Valid `city`: Bangkok, Chiang Mai.
- Separate multiple categories with `|`: e.g. `Fragrances|Independent fashion`.
- Categories: Fragrances, Independent fashion, Designer replicas, Vintage, Jewelry & artisan, Creative districts, Gay Nightlife, Underground & Raves, Bangkok Art Biennale, Art & design, plus Chiang Mai itinerary categories.
- `priority`: Top, High or Medium (normal/blank also works).
- `status`: Saved (or any non-hidden value); `hidden` and `archived` are excluded.
- Coordinates are decimal latitude/longitude; blanks are supported.

Do not import `places.json` or the original CSV back over your existing Sheet: the Sheet is the **source of truth**.

### Privacy and limitations

- This is a **public** site; do not store private travel details (hotel room numbers, friends' contact details, passports, codes) in published place data.
- The map requests location **only** after a visitor taps the locate button and does not transmit their coordinates to Google Sheets or GitHub. The device/browser and external map tile service have their own network/privacy behaviors.
- Leaflet / OpenStreetMap tiles need internet access and are not guaranteed offline. For directions use the Google Maps link.
- The shared Sheet must be accessible for **live** updates. When it isn't, the site uses the bundled snapshot rather than showing an empty map. The snapshot itself changes only when a code commit updates `places.json`.
- Some pins represent a mall, neighborhood or market rather than an exact storefront. Verify before visiting.
- The old Google Apps Script deployment is left intact. This repository is a separate new public frontend.

### Bangkok Art Biennale 2026–27 locations (November 22, 2026)

- The Google Sheet now marks all **11 official Bangkok Art Biennale 2026–27 venues** under `Bangkok Art Biennale`. `CentralWorld` is an existing shopping pin with an additional category, not a duplicate. Another ten venue pins were added with art and nearby-architecture tags. Dates: 29 October 2026–28 February 2027.
- Three extra venues — Jim Thompson Art Center, BANGKOK CITYCITY GALLERY, and 100 Tonson Foundation — are independent art-space bookmarks (`Art & design`), **not** confirmed BAB main venues. Check January programming before visiting.
- The `Biennale` filter and its graphic starburst stamp are part of Explore. Existing Chiang Mai day routes and nearby-alternative behavior are untouched; Bangkok itinerary days have not yet been scheduled.
- Official 2026 venue list: https://www.bkkartbiennale.com/venues (the lower route section of this page still contains 2024 itinerary information).

### Enriched destination dossiers (November 22, 2026)

Every map marker and destination row now opens a responsive, theme-aware full destination card (mobile sheet / desktop overlay). The card shows a photo or generated typographic fallback, visiting facts, directions, favorites and three contextual tabs: Photos; Stores, Artists, Artworks, Highlights, Finds, Explore or similar based on place type; and About. CentralWorld includes an eight-stop fragrance/fashion directory with location notes; Wat Pho includes 8 artworks, 5 participating artists, official exhibition viewing time and transit details from the 2026 visitor guide. Other biennale venues and selected markets, fragrances and festival locations have curated fields in `place-profiles.js`.

The venue UI lives in `place-cards.js` and `place-cards.css`, while `place-profiles.js` is the optional enrichment layer keyed by existing place IDs. All unprofiled records gracefully derive factual field notes from the Sheet or itinerary data. Wikimedia/Wikipedia APIs may supply freely licensed venue images at runtime; the card links to original photo attribution, never copies artwork pictures from the biennale's website, and displays a designed fallback when photographs are unavailable. Store floors and opening hours are planning aids and should be rechecked before the trip. Changes to these editorial profiles are GitHub source edits, unlike base place coordinates or labels which remain in Google Sheets.
