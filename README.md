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

### Unified destination cards (November 26, 2026)

Every marker opens the same compact, mobile-first location card. The visual order is **place name + category/city → swipeable photo carousel → brief, destination-first description → visible highlights → one "Open in Maps" chooser button**. There are no Photos, Highlights or Plan sub-tabs, no repeated directions/reviews buttons, and no lengthy itinerary or transit notes in location cards. The chooser offers **Apple Maps** and **Google Maps** on every device. Either option uses a universal HTTPS map link to open the named mapping app when supported, or a web map otherwise; it does not detect installed apps or force a default.

- **Place descriptions and highlights:** `place-editorial.js` contains 76 manually curated, concise descriptions and short highlight lists, keyed by place ID. No itinerary references, timing advice, or travel guidance should be inserted into those cards.
- **Card presentation:** `place-cards.js` renders the content, retains favorites and photo swipe/lightbox behavior, and opens a small accessible map-app picker on click. The picker uses `https://maps.apple.com/?q=...` for Apple Maps and `https://www.google.com/maps/search/?api=1&query=...` for Google Maps, preserving each location's name and address. The picker supports dismissal and keyboard focus, and does not save a preference. `card-clean.css` styles the unified card and chooser for mobile and desktop.
- **Source imagery:** `venue-research.js` holds selectively sourced images; landmark cards can also use Wikimedia/Wikipedia results. Image credit links remain beneath the carousel. A curated photograph is not automatically licensed for reuse; verify attribution, permission and hotlink suitability. Missing/broken photos fall back to the designed location poster.
- **Metadata and legacy profiles:** `place-profiles.js` retains historical visit notes and detail records, but these are not rendered in the compact card. Google Sheets and `trip-data.js` still own the underlying place pins, location labels, itinerary routes and map coordinates.
- **CentralWorld reference:** keep a concise summary and a visible selection of fragrance/fashion highlight labels, alongside a photo carousel and one Maps CTA. Apply this information hierarchy consistently across venues.

### Floating Discover overlay & compact map area (November 22, 2026)

- **Map-first layout:** the permanent mobile bottom drawer and swipe-to-expand state have been removed. Explore and Itinerary both keep the map at full available height. The browsing list is a floating, scrollable, dismissible Discover / Route card.
- **Header entry:** the former Share button is now Discover (or Route while in itinerary mode). The panel opens from the top-right header and can be closed with its X, Escape, or by tapping the darkened map. The focus is moved to the close control on opening and restored when explicitly dismissing it.
- **City selector:** All / Bangkok / Chiang Mai live inside Discover. On the map, a single small badge shows the selected area and reopens the dialog. The area badge hides in itinerary mode in favor of the numbered day selector. Location selection still controls the underlying map's place search and bounds.
- **Destination cards:** tapping a marker or destination row opens the enriched venue card and closes Discover, so the two overlays never compete. On mobile the venue card now extends nearly to the bottom of the screen, instead of reserving an empty band for the removed drawer.
- **Styling:** implemented through `discover-overlay.css` after the existing theme and venue-card styles; preserves Print Club, Soft Signal and Type Lab variants. The Google Sheet, places data, favorites storage keys and Chiang Mai flexible route logic are unchanged.
