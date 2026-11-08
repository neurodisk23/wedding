# Harshal & Pooja: wedding invitation site

A one-page invitation for Wednesday, 2 December 2026. Guests open it from a WhatsApp link, read the invitation and the function details, then send an RSVP and a wish. RSVPs land in a Google Sheet that you own.

- **Hosting:** GitHub Pages (free)
- **RSVPs and wishes:** Google Sheet with Apps Script (free)
- **Download size:** about 0.4 MB to open, so it loads quickly on mobile data. The 1.9 MB shehnai track loads only when a guest taps **Open invitation**.

## What's in the folder

| File | What it is | Do you edit it? |
|---|---|---|
| `config.js` | Colour scheme, illustration, names, parents, functions, venues, contacts, hashtag, music, Sheet link | **Yes**: almost every change goes here |
| `index.html` | Page structure and the WhatsApp preview tags | Once, for the preview link (step 5) |
| `css/style.css` | Colours, fonts and layout | Only to restyle |
| `js/main.js` | Countdown, RSVP form and wishes wall | No |
| `js/toran.js` | Draws the rose-and-mogra toran (and the flowers and bells used in the jhalars) | No |
| `js/ornaments.js` | Draws the palace arch, jhalar frills, date medallion and palace skyline | No |
| `js/effects.js` | Swinging bells and flower showers | No |
| `assets/couple.webp` | Your couple illustration (background removed) | Replace to change it |
| `assets/shehnai.mp3` | Background music: *The Dichotomy of Fame* (Rockstar), 2:40, volume-levelled | Replace to change it |
| `assets/yaman-loop.mp3` | Spare music: an original Raga Yaman loop made for this invite (46 s) | No |
| `assets/*.svg` | Gold frame, kalash, lotus, divider, jaali pattern | No |
| `apps-script/Code.gs` | The Google Sheet backend | Only if you rename functions |
| `assets/og-image.jpg` | WhatsApp preview picture (1200 × 630, 138 KB) | Remake it if names, date or picture change |
| `tools/og.html` | Source for the preview picture | No |

---

## 1. Preview on your computer

Open a terminal in this folder and run:

```
python -m http.server 8000
```

Then open http://localhost:8000. Until you finish step 3, the form runs in **demo mode**: it shows the thank-you message but saves nothing.

## 2. Fill in the details

Open `config.js` and replace everything in `[square brackets]`: parents' names, Pooja's surname, venues, addresses, contact numbers and timings. To check you've caught them all, search the file for `[`; there should be no results.

- **Functions:** add, remove or reorder entries in `events`. Colours available: `haldi`, `mehendi`, `sangeet`, `vivah`, `reception`.
- **Maps:** in Google Maps, tap Share on the venue and paste the link into `mapUrl`.
- **Phone numbers:** write them as `91` followed by the number, digits only (e.g. `919876543210`).
- **Colour scheme:** set `theme` to one of eight royal pastels, all with the same antique-gold ornaments:

  | `theme` | Background | Names and buttons |
  |---|---|---|
  | `"gulabi"` (default) | blush rose & sage | wine |
  | `"basanti"` | butter yellow & blush | wine |
  | `"pista"` | pistachio & peach | forest green |
  | `"aasmani"` | powder blue & blush | navy |
  | `"jamuni"` | lavender & pink | royal purple |
  | `"firozi"` | mint turquoise & peach | teal |
  | `"kesari"` | saffron peach & sage | chestnut |
  | `"shahi"` | ivory & champagne | emerald |

  If you change the scheme, also remake the WhatsApp preview image (see `tools/og.html`) so it matches.
- **Cover page:** guests first see a red swastik in a gold mandala with its four dots left open. Each tap fills a dot with red and showers roses, marigolds, mogra and lotus. After the fourth dot the music starts and the palace doors open onto the invitation. There's a small **Skip** link for anyone who can't manage the taps. Change the tagline and hints in `text` (`coverTagline`, `coverHint`, `coverLeft`, `coverDone`, `coverSkip`), or set `cover: false` to turn the cover off.
- **Text sizes on the invitation card:** in `css/style.css`, find **TEXT SIZES** (search for it) and change the numbers: `--size-blessings`, `--size-parents`, `--size-invite-line`, `--size-names`, `--size-with`, `--size-shloka`. Smaller number = smaller text.
- **Line breaks:** in any line of `text` (and in the parents' names), write `\n` where a new line should start, e.g. `"Smt. Nidhi Verma &\nShri Perdeep Kumar Verma"`.
- **Two pages:** after the cover, guests see the opening page (names, garland, picture). The invitation card, date, functions, RSVP and everything else appear only when they press **Open invitation**. The phone's Back button returns to the opening page.
- **Countdown, then "married for":** until the muhurat (`weddingDate`) the clock counts down in days, hours, minutes and seconds under the label *Counting down to the muhurat*. At the muhurat it resets to zero, showers flowers if a guest has the page open, and counts up in **years, months, days and hours** under *Happily married for*. Change the labels with `countdownBefore` and `countdownAfter` in `text`.
- **Grandparents:** `grandparents` under `groom` and `bride` in `config.js` adds a "grandson of …" line under Harshal and a "granddaughter of …" line under Pooja's parents. Use `""` to hide either.
- **Text sizes on the invitation card:** at the top of the *Invitation card* section in `css/style.css` there is a block of `--size-…` lines (blessings, parents, invite line, names, with, grandparents). Change a number, save, and press Ctrl + Shift + R. Write `\n` inside any of those lines in `config.js` to break it exactly where you want.
- **Wording:** every phrase guests see (the tap hint, *weds*, *Open invitation*, the invitation lines, section headings, button labels, and all RSVP form questions, choices and error messages) is in the `text: { … }` block of `config.js`. Change the words inside the quotes, keep the quotes and the comma, then save and refresh. Hindi or Marathi works too.
- **Flower showers:** on the opening screen, tapping Harshal's name drops rose petals and tapping Pooja's drops marigolds; tapping the picture drops both. Change them with `flowers: { groom: "rose", bride: "marigold" }`. The choices are `"rose"` (red and pink petals), `"marigold"` (yellow and orange genda), `"mogra"` (white jasmine) and `"lotus"` (pink lotus petals).
- **Bells and jhalars:** the toran, the jhalar frills (a scalloped zari border with mirror work and hanging bells, mogra-and-rose strands, silk latkans and pearls) on the invitation card, date section, every function card, the RSVP card and the contacts card, plus the three bells inside each function card's arch, all swing. On each function card a pair of parrots and two peacocks perch on the frill and rock gently with it when guests scroll or touch the screen. There's nothing to set up.
- **Illustration:** `couplePhoto` points to `assets/couple.webp`. To use a different picture, save it as a PNG or WebP with a transparent background, about 400 × 650 px, put it in `assets/`, and change the path. Use `""` to hide it.

## 3. Connect the Google Sheet (RSVPs and wishes)

1. Go to https://sheets.new and name the sheet *Harshal & Pooja RSVPs*.
2. Open **Extensions → Apps Script**, delete the sample code and paste in all of `apps-script/Code.gs`. Press **Ctrl + S** to save.
3. In the function menu at the top, choose `setup` and press **Run**.
   - Google asks for permission. Choose your account, then **Advanced → Go to (project name)**, then **Allow**. This is your own script, so it's safe.
   - Running it creates two tabs: **RSVPs** and **Summary**.
4. Click **Deploy → New deployment**. Click the gear icon and choose **Web app**, then set:
   - **Execute as:** Me
   - **Who has access:** Anyone

   Press **Deploy** and copy the **Web app URL** (it ends in `/exec`).
5. Paste that URL into `config.js` as `rsvpEndpoint: "https://script.google.com/macros/s/…/exec"`.
6. Send a test RSVP from the site and check that a row appears in the **RSVPs** tab, then delete the test row.

### Using the Sheet

- **Summary tab:** families and people coming to each function, which is the headcount your caterer and decorator need.
- **Same phone number:** if a guest sends again with the same number, their existing row is updated rather than duplicated.
- **Wishes wall:** untick **Show on wall** to hide a wish. The site picks up the change within a minute.
- **Email alerts:** to get an email for every RSVP, put your address in `NOTIFY_EMAIL` at the top of `Code.gs`. Then publish the change (see the next point).
- **Editing `Code.gs` later:** publish each change with **Deploy → Manage deployments → pencil icon → Version: New version → Deploy**. The URL stays the same.

## 4. Put it on GitHub Pages

1. Sign in at https://github.com and click **New repository**. Name it `wedding`, set it to **Public** and click **Create repository**.
2. Click **uploading an existing file**. Drag in **everything inside** this folder (not the folder itself), then click **Commit changes**.
3. Go to **Settings → Pages**. Under *Build and deployment*, choose **Source: Deploy from a branch** and **Branch: main / (root)**, then click **Save**.
4. Wait 1–2 minutes and refresh the page. Your site address appears at the top: `https://USERNAME.github.io/wedding/`

**Making changes later:** open the file on GitHub, click the pencil icon, edit, then **Commit changes**. The live site updates within about a minute.

> Free GitHub Pages sites come from public repositories, so anyone can read these files, including the phone numbers in `config.js`. Guest RSVPs are never in the repository; they live only in your Google Sheet.

## 5. Make the WhatsApp preview work

WhatsApp doesn't run the page's JavaScript; it only reads the tags at the top of `index.html`.

1. In `index.html`, replace `USERNAME` and `REPO` in the two lines below with your values (e.g. `harshal.github.io/wedding`):
   ```html
   <meta property="og:url" content="https://USERNAME.github.io/REPO/">
   <meta property="og:image" content="https://USERNAME.github.io/REPO/assets/og-image.jpg">
   ```
2. Commit, wait a minute, then paste the link into WhatsApp's *Message yourself* chat. Wait for the preview card to appear before you press send.
3. If an old or blank preview appears, WhatsApp is showing a cached copy. Add `?v=2` to the end of the link.

## 6. Personal links for each family

Add `?to=` with the family's name, using `+` for spaces:

```
https://USERNAME.github.io/wedding/?to=Sharma+family
```

The opening screen then reads *"Dear Sharma family,"*.

## 7. Music

The site plays **The Dichotomy of Fame** (A.R. Rahman, from *Rockstar*, with shehnai by Balesh): `music: "assets/shehnai.mp3"` in `config.js`. It has been volume-levelled for background listening, with a gentle fade at the start and end, and it loops.

Phones only allow music after a tap, so it fades in when the guest fills the fourth swastik dot (or taps **Open invitation**). The round button at the bottom right pauses and plays it.

> **Copyright:** this is a commercial film track, and the site is public. For a personal wedding invite a problem is unlikely, but the rights holder could ask GitHub to remove the file. If that happens, change one line to `music: "assets/yaman-loop.mp3"`, an original track made for this invite that is free to use.

**To use other music:** put an `.mp3` (ideally under 2 MB) in `assets/` and set `music: "assets/your-file.mp3"`. Set `musicVolume` between `0` and `1` (default `0.6`). Use `music: ""` for no music; the button then disappears.

## Launch checklist

- [ ] Searching `config.js` for `[` finds nothing
- [ ] 3 test RSVPs (one *Yes*, one *No*, one sent again from the same number) give 2 rows, and the Summary counts are right
- [ ] Test rows deleted
- [ ] WhatsApp preview shows the picture and title on one Android phone and one iPhone
- [ ] The link opens and the form sends from inside WhatsApp, on both Wi-Fi and mobile data
- [ ] Map and call buttons open the right venue and number
- [ ] Invites sent at least 3 weeks before the wedding (by 11 November)
- [ ] Reminder sent on 22 November to families who haven't replied (compare the Sheet with your guest list)

## Credits

Fonts: Amita and Tiro Devanagari Hindi, used under the SIL Open Font License (licences in `assets/fonts/`).
