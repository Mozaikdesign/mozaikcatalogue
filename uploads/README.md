# Mozaik Showroom Catalogue — handoff (21 Oct 2026)

Read this before changing anything. It is written for whoever continues the project, and for their Claude.

## 1. What this is
- A tablet catalogue for the Mozaik Design retail team (Istanbul and Ankara showrooms). Staff use it to show products to customers.
- It is one self-contained file: `site/index.html`, about 3.3 MB. There is no build step and no server.
- It is bilingual (TR/EN) and shows **no prices**.
- Live: https://mozaikdesign.github.io/mozaikcatalogue/
- Preview: https://mozaikdesign.github.io/mozaikcatalogue/preview/ (currently the same build as live)
- Repo: https://github.com/Mozaikdesign/mozaikcatalogue
  - GitHub account: **Mozaikdesign**.
  - Pages serves branch `main`, root folder.
  - `index.html` is the live site; `preview/index.html` is the test copy.
  - Ask Balamir to add you as a collaborator.
- Contents: 1,739 products from 13 brands. 1,477 are live and 262 are archived.

## 2. What is in this package
| Path | What |
|---|---|
| `site/index.html` | The current live file. This is the source of truth: edit it, then upload it. |
| `exports/Mozaik_Catalogue.xlsx`, `.csv` | The 1,477 live pieces, one row each. Includes brand, designer, year, category, comfort dims, materials, TR/EN copy, and links to the brand page, the catalogue page and the main image. |
| `feedback/Katalog_feedback.pdf` | The retail team's feedback: products to remove. It was applied as the archive. |
| `work/` | Every script and data file used to build the catalogue. It mirrors `/tmp/claude-0/` on the original machine; the scripts use absolute paths there. |
| `work/nb/` | Seven new brands, added 12 Oct: raw scrapes `mzk_*.json`, normalised `n_*.json`, TR/EN copy `copy_*.json`, `scripts/norm.py`, `build.py`, test `t_nb.js`. |
| `work/arch/` | The archive feature: `build.py` (one-off patch that added it) and `archive_ids.json`. |
| `work/xl/` | The Excel/CSV export: `dump.js` reads the catalogue data out of `index.html` into `all.json`; `build_xlsx.py` writes the Excel and CSV files. |
| `work/bb2 cas2 ff2 max gr ed2 sw` | Build scripts and data for the first six brands, plus fabric swatches (`sw`). |
| `work/*.js` | Playwright regression tests (`fulltest.js`, `chk.js`, `sorttest.js`, `swtest.js`…). `fake.jpg` stands in for brand images in tests. |

**To re-run a script unchanged**, copy `work/` to `/tmp/claude-0/`. Otherwise, edit the path constants at the top of each script.

**A copy of `site/index.html` must also be at `/mnt/user-data/outputs/mozaik-catalogue/index.html`.** The build scripts read and write that path. This includes `nb/build.py`, `xl/dump.js` and the brand scripts in `work/`.

## 3. How `index.html` works (data lives in JS constants)
| Constant | Holds |
|---|---|
| `PRODUCTS` | One object per piece: `{ id, brand, name, designer, year, cat, tags, story{tr,en}, config{tr,en}, covers{tr,en}, dims?{tr,en} }`. |
| `MEDIA` | `{ id: { photos:[urls], drawings:[urls] } }`. The first photo is the card image; drawings appear as "technical drawing" slides. |
| `COMFORT` | `{ id: [seatH, null, backH, depth, width] }` in cm. Values may be ranges like `"99–170"`. Sofa comfort tiles come from this. |
| `ARCHIVE_BASE` | Array of archived product ids. These are hidden from the catalogue and shown under Arşiv. |
| `BRANDS` | The order of the brand chips. Add a new brand here. |
| `SWD` / `FIN` | Fabric and finish swatches. They live between the `/* SWATCH-DATA */` markers. |
| `T` | All UI strings, TR and EN. |
| `CATS`, `CHIPS` | The 4 categories and their filter chips. |

Rules for `PRODUCTS`:
- `cat` is one of `sofas | armchairs | chairs | tables`.
- `tags[0]` is the card label and must be a valid key:
  - sofas: `modular | classic | lounge | compact`, plus `outdoor`
  - armchairs and chairs: `indoor | outdoor`
  - tables: `[dining|side, indoor|outdoor]`
- Ids carry a brand prefix:

| Prefix | Brand |
|---|---|
| none, `bb-` | B&B Italia |
| `mx-` | Maxalto |
| `cas2-` or plain | Cassina |
| `ff-`, `ff2-` | Flexform |
| `ed-` | Edra |
| `gr-` | Gallotti&Radice |
| `pm-` | Promemoria |
| `ac-` | Acerbis |
| `md-` | MDF Italia |
| `cc-` | Ceccotti Collezioni |
| `fc-` | Fendi Casa |
| `kn-` | Knoll |
| `hg-` | Henge |

Image URLs point straight at the brands' own CDNs (hotlinked), using `referrerPolicy="no-referrer"`. `shots()` builds the image sizes:
- Shopify (Fendi Casa) gets `&width=`.
- Other URLs with a query string are used as they are.

Marker blocks used by the build scripts. Re-running a build replaces its own block.
- `MAX-START/END` and `MAX-MEDIA`: Maxalto
- `NB-START/END` and `NB-MEDIA`: the 7 new brands
- `GR-MEDIA`: Gallotti&Radice
- `BB2-MEDIA`, `CAS2-MEDIA`, `FF2-MEDIA`, `ED2-MEDIA`: the other original brands

## 4. Common tasks
**Archive or restore products for everyone**
1. Edit the `ARCHIVE_BASE` array: add or remove ids.
2. Publish (step 5 below).

In-app archiving (the Arşiv link, "Arşive al", "Geri al") is saved only on that device, in localStorage `mz-arch`. The Arşiv page's "Bu cihazdaki değişiklikleri kopyala" button exports that device's changes. Bake them into `ARCHIVE_BASE`.

**Edit a product's text or photos**
1. Find its id. It is the URL hash when the product is open in the catalogue, e.g. `#fc-soho-sofa`.
2. Edit its entry in `PRODUCTS` and/or `MEDIA`.

**Add products or a brand**
1. Collect the data. Section 6 explains how.
2. Normalise it to the shape of `work/nb/n_*.json`: `key, brand, name, designer, year, cat, tags, io, desc, photos, drawings, dimtext, url`.
3. Write the TR/EN copy. It was done with sub-agents, about 60 items per batch, using the prompt in `work/nb/copy_prompt.txt`. Output shape: `{key:{story{tr,en},config{tr,en},covers{tr,en},tags}}`.
4. Insert the products into `PRODUCTS` and `MEDIA`, add the brand to `BRANDS`, and add comfort dims to `COMFORT`. `work/nb/build.py` is a working template.
5. Test (below), then publish.

**Test before publishing**
- Use Playwright with Chromium. See `work/nb/t_nb.js` and `work/fulltest.js`.
- Open every product, check that there are no page errors, and check that mobile (390 px) has no horizontal overflow.
- Image hosts are routed to `fake.jpg` in tests. Note that `fulltest.js` checks old per-brand counts and will report count mismatches; those are expected.

**Publish (GitHub Pages)**
1. Upload `index.html` to `preview/` first (GitHub → Add file → Upload files → Commit) and check the preview link.
2. Then upload the same file to the repo root.
3. Pages redeploys in about 1 minute.
4. Add `?v=N` to the URL to bypass the cache.

Upload notes for Claude in Chrome:
- `file_upload` only accepts files under `/mnt/user-data/uploads`. Stage the file from the user's computer first.
- Use a real click on "Commit changes", not a JS `.click()`. Wait about 20 seconds after uploading before committing.

**Excel/CSV export**
1. `node work/xl/dump.js`, which reads `/mnt/user-data/outputs/mozaik-catalogue/index.html`.
2. `python3 work/xl/build_xlsx.py`.
3. Recalculate with the xlsx skill's `recalc.py`. The Summary sheet uses COUNTIFS formulas.

## 5. Open items
1. **Retail feedback "add" part.** The PDF only listed removals. Get the list of items the team wants added.
   - The Gallotti&Radice, Edra and Flexform lists in the PDF had no "remove" heading. They were treated as removals because every item on them was in the catalogue.
   - Ask the sales rep to confirm. They have been emailed the Excel to test against.
2. **Custom domain.** Balamir will buy one. Then set it in repo Settings → Pages → Custom domain and add the DNS records: 4 A records to GitHub Pages IPs, or a CNAME to `mozaikdesign.github.io`.
3. **Sofa comfort dims.** These are missing for Promemoria, MDF Italia, Ceccotti, Fendi Casa and Acerbis.
   - The official drawings are already in `MEDIA.drawings` for Promemoria and MDF. Read them to fill `COMFORT`.
   - Ceccotti technical sheet PDFs are in `work/nb/n_ceccotti.json` (`docs`).
4. **Brand product-page links** are missing for Gallotti&Radice and Edra (129 rows in the Excel).
5. **Missing designers and years.**
   - Henge: no designers on its site.
   - Some Fendi Casa and Acerbis pieces have no designer.
   - Promemoria, Ceccotti, Fendi Casa and Henge publish no years.
6. **Acerbis Litt** cover image is broken. Remove the first photo in `MEDIA["ac-litt-low-tables"]`.
7. **Knoll** comes from knoll-int.com (Europe, which is what applies to orders from Turkey). knoll.com (US) lists more products.

## 6. How the data was collected (keep doing it this way)
- **Only the brands' official websites, and the full collection** — not just what the online shop sells. Balamir wants everything that can be ordered.
- **Never bypass bot checks, Cloudflare or CAPTCHAs.**
- The cloud sandbox cannot reach the brand sites. Collection ran in Balamir's Chrome through the Claude in Chrome extension:
  1. Open a **new tab per brand** on that site's `/robots.txt`. It is a plain page with no router scripts, so a download works.
  2. Run a same-origin `fetch()` crawler there: listing pages → product pages → name, designer, year, description, images, drawings, documents.
  3. Save one JSON file with an `<a download>`. It lands in `Downloads`; move it to `Downloads\mzk_tmp`.
  4. Stage it into the sandbox and normalise it.
- Chrome blocks a second automatic download from the same tab. That is why you need a fresh tab per download.
- What worked per site:
  - **WordPress REST:** Acerbis (`/wp-json/wp/v2/prodotti`) and Henge (`/wp-json/wp/v2/product`).
  - **Shopify** `products.json`: Fendi Casa.
  - **HTML listings:** Promemoria (`.products__subcategory`), MDF (`?page=N`), Ceccotti (`/page/N/`), Knoll (`/home/by-category/...` "view all" pages).
  - See the crawlers' logic in `work/nb/scripts/norm.py` and the raw `mzk_*.json` files.

## 7. Balamir's preferences
- Keep replies short. Ask one question at a time. Prefer action over questions ("you check and do it").
- No prices on the public link. Any currency shown is Turkish Lira (₺).
- Interactive, SaaS-style, tablet-first UI. Comprehensive data.
- Don't touch his personal files in Downloads. Only `mozaikcatalogue/` and `mzk_tmp/` are project folders.
- Deletions need his permission.
