# Thailand / Living Map 🇹🇭

A **free, mobile-first, shared map** for our January 2027 Bangkok and Chiang Mai trip. Powered by **GitHub Pages** (public website), **Google Sheets** (one destination database), Leaflet and OpenStreetMap.

## Where everything lives

- **App source:** this repository; edits to `main` automatically republish the GitHub Pages website once Pages is enabled.
- **Master places:** [Google Sheet](https://docs.google.com/spreadsheets/d/1IBkBs5BBwmalgLfNBYnEakbKVt-Lw4kYu7VIDcxyjx4/edit) → **places** tab (lowercase).
- **Initial bundled snapshot:** [places.json](./places.json), copied from the Sheet (35 locations, 33 coordinates). Used as a fallback only if the Sheet cannot be accessed.
- **Map URL after GitHub Pages setup:** https://rhammond1996-glitch.github.io/thailand-living-map/

### Required one-time steps

**1. Enable GitHub Pages**

Repository → **Settings → Pages → Build and deployment**. Choose **Deploy from a branch**, Branch `main`, Folder `/(root)`, then **Save**. After the deployment runs successfully, open the map URL above. If you have a TinyURL pointing to the old Google Apps Script app, update its destination to the new GitHub Pages address (or create a new short link).

**2. Allow the website to read the destination tab**

In the linked Google Sheet, open **File → Share → Publish to web**. In the publication options choose the **places** tab (not the entire document). Publish and confirm. This makes the published tab publicly readable, so it must contain **only information you are comfortable sharing online**. The app only reads the first 13 columns and never writes to the Sheet.

The browser uses the Google Sheets Visualization feed (`gviz/tq`) for the selected tab. If the browser reports **Saved snapshot** instead of **Live · Google Sheets**, the live feed is inaccessible: verify that the tab is publicly published or shared with `Anyone with the link → Viewer`, then refresh. Publishing and link-sharing are different options, and availability can vary by account. Never make the Sheet editable by the public.

**3. Test the update flow**

Add a test destination to the Sheet with a unique `id`, `name`, `city`, `categories`, `location_type`, `address`, `highlights`, `priority`, and `status`. The map checks for updates each minute while open. Latitude/longitude can be added later; unpinned entries still appear in the places list. Delete the test row afterward.

### Future updates

For **destination changes**, ChatGPT can edit the linked Google Sheet through the connected Google Drive integration when asked. Data changes do **not** require a GitHub code commit or redeployment.

For **interface changes**, ChatGPT can commit new code through the connected GitHub integration. GitHub Pages then builds and deploys the updated website; the map URL stays the same.

**Important:** Future ChatGPT conversations still need access to the same linked Google Sheet and repository to perform writes. Updates must be verified, not merely described. The app does not update itself just because a destination was mentioned in chat.

### Data format (existing Sheet)

Headers, in this order:

`id,name,city,categories,location_type,address,highlights,price_note,priority,status,lat,lng,verification`

- Valid `city`: Bangkok, Chiang Mai.
- Separate multiple categories with `|`: e.g. `Fragrances|Independent fashion`.
- Categories: Fragrances, Independent fashion, Designer replicas, Vintage, Jewelry & artisan, Creative districts, Gay Nightlife.
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
