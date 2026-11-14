/*
 * ───────────────────────────────────────────────────────────────
 *  EDIT THIS FILE to customise the invitation.
 *  Everything a guest reads (except the WhatsApp preview, which
 *  lives in index.html <head>) comes from here.
 *
 *  Anything in [square brackets] is a placeholder to replace.
 *  Dates use the format  "YYYY-MM-DDTHH:MM:00+05:30"  (IST).
 * ───────────────────────────────────────────────────────────────
 */
window.INVITE = {
  // Colour scheme. All use antique-gold ornaments:
  //   "gulabi"  blush rose & sage (wine names)
  //   "basanti" butter yellow & blush (wine names)
  //   "pista"   pistachio & peach (forest-green names)
  //   "aasmani" powder blue & blush (navy names)
  //   "jamuni"  lavender & pink (royal-purple names)
  //   "firozi"  mint turquoise & peach (teal names)
  //   "kesari"  saffron peach & sage (chestnut names)
  //   "shahi"   ivory & champagne (emerald names)
  theme: "basanti",

  // Illustration shown in the palace arch on the opening screen and,
  // separately, in the WhatsApp preview image. Use "" to hide it.
  // Best as a PNG/WebP with a transparent background, about 400 × 650 px.
  couplePhoto: "assets/couple.webp",

  // Cover page with the swastik: guests tap its four dots (each tap showers
  // roses, marigolds, mogra and lotus) and the doors open onto the invitation.
  // Set to false to skip straight to the invitation.
  cover: true,

  // Ask "Whose side are you from?" (Ladke wale / Ladki wale) in the RSVP form.
  // Set to false to remove that question.
  askSide: false,

  // Flower showers on the opening screen: tapping a name drops that
  // person's flowers; tapping the picture drops both.
  // Kinds: "rose" (red & pink petals), "marigold" (yellow & orange genda),
  //        "mogra" (white jasmine), "lotus" (pink lotus petals)
  flowers: { groom: "lotus", bride: "rose" },

  groom: {
    name: "Harshal",
    fullName: "Harshal",
    parents: "Smt. Nidhi Verma &\nShri Perdeep Kumar Verma",
    // Shown under the groom's name ("grandson of …"). Use "" to hide.
    grandparents: "Late Sh. Satpal Verma &\nLate Smt. Bimla Devi",
  },
  bride: {
    name: "Pooja",
    fullName: "Pooja",
    parents: "Smt. Manisha Verma &\nShri Dinesh Chandra Verma",
    // Shown under the bride's parents ("granddaughter of …"). Use "" to hide.
    grandparents: "Late Sh. Kedar Nath Verma &\nLate Smt. Gulabiya Verma",
  },

  // Wedding muhurat. Drives the big date and the countdown.
  weddingDate: "2026-12-02T16:00:00+05:30",

  // Shown at the top of the invitation card. Use [] to hide it.
  shloka: [
    "वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ।",
    "निर्विघ्नं कुरु मे देव सर्वकार्येषु सर्वदा॥",
  ],

  // The functions, in order. `type` picks the pastel colour of its arch card:
  //   "haldi" (butter yellow), "mehendi" (mint green), "sangeet" (lavender),
  //   "vivah" (blush rose), "reception" (powder blue),
  //   "engagement" (champagne gold), "barat" (peach)
  // `mapUrl`: paste a Google Maps share link. Leave "" to search by address.
  // Keep event names distinct; the Google Sheet counts heads by name.
  events: [
    {
      name: "Engagement",
      type: "engagement",
      start: "2026-12-01T10:00:00+05:30",
      end: "2026-12-01T12:00:00+05:30",
      venue: "Abhinandan Palace, Mopka",
      address: "Bilaspur, Chattisgarh",
      mapUrl: "https://maps.app.goo.gl/Vz53Rop737uh5DsV8",
      note: "Wear something royal",
    },
    {
      name: "Haldi",
      type: "haldi",
      start: "2026-12-01T14:00:00+05:30",
      end: "2026-12-01T16:00:00+05:30",
      venue: "Abhinandan Palace, Mopka",
      address: "Bilaspur, Chattisgarh",
      mapUrl: "https://maps.app.goo.gl/Vz53Rop737uh5DsV8",
      note: "Wear something yellow",
    },
    {
      name: "Sangeet",
      type: "sangeet",
      start: "2026-12-01T19:00:00+05:30",
      end: "2026-12-01T22:00:00+05:30",
      venue: "Abhinandan Palace, Mopka",
      address: "Bilaspur, Chattisgarh",
      mapUrl: "https://maps.app.goo.gl/Vz53Rop737uh5DsV8",
      note: "Wear somthing indo-western",
    },
    {
      name: "Barat",
      type: "barat",
      start: "2026-12-02T10:00:00+05:30",
      venue: "Abhinandan Palace, Mopka",
      address: "Bilaspur, Chattisgarh",
      mapUrl: "https://maps.app.goo.gl/Vz53Rop737uh5DsV8",
      note: "Let's start this new phase of life with the richness of joy, happiness and alot of smiles.",
    },
    {
      name: "Phere",
      type: "vivah",
      start: "2026-12-02T16:00:00+05:30",
      end: "2026-12-02T18:00:00+05:30",
      venue: "Abhinandan Palace, Mopka",
      address: "Bilaspur, Chattisgarh",
      mapUrl: "https://maps.app.goo.gl/Vz53Rop737uh5DsV8",
      note: "Let's start this new phase of life with the richness of joy, happiness and alot of smiles.",
    },
  ],

  // Shown under "Will you join us?". Use "" to hide.
  rsvpBy: "Please reply by 25 November 2026",

  // Family contacts. phone = country code + number, digits only.
  contacts: [
    { name: "Shri Pradeep Verma", relation: "Groom's father", phone: "919086323132" },
    { name: "Smt. Nidhi Verma", relation: "Groom's mother", phone: "917006800850" },
  ],

  hashtag: "#HarshalWedsPooja",
  families: "With love, the Verma family",

  // Family blocks shown side by side between the RSVP and the wishes
  // (like the signature row of a printed card). Each block has a title and
  // its lines. Use familyBlocks: [] to hide the section.
  familyBlocks: [
    { title: "Eagerly Awaiting",     lines: ["Kum. Lalita Rani Verma,", "Shri Sandeep Verma", "& the entire Verma family"] },
    { title: "With Warm Regards",    lines: ["Smt. Nidhi &", "Shri Pradeep Kumar Verma", "Harshita Verma (sister)"] },
    { title: "Eager to Welcome You", lines: ["Shri Satyanarayan Paigwar (maternal grandfather)", "Shri Gaurav Paigwar (maternal uncle)"] },
  ],

  // Wording guests see. Change any line here; keep the quotes and the comma.
  // Write \n inside a line to start a new line exactly there.
  // (Hindi or Marathi is fine too, e.g. weds: "संग".)
  text: {
    // Cover (tap the four dots of the swastik). {n} is replaced by the dots left.
    coverTagline: "Let's start this beautiful journey together",
    coverHint: "Tap the four dots of the swastik to begin",
    coverLeft: "{n} more to go",
    coverDone: "शुभारंभ!",
    coverSkip: "Skip",
    // Opening screen
    ganesh: "॥ श्री गणेशाय नमः ॥",
    shubhVivah: "शुभ विवाह",
    weds: "weds",
    tapHint: "Tap a name or the picture for flowers",
    openButton: "Open invitation",
    // Invitation card
    blessings: "With the blessings of our elders\nand loved ones",
    inviteLine: "invite you, with joy, to bless\nthe marriage of their son",
    with: "with",
    daughterOf: "daughter of",
    grandsonOf: "Loved grandson of",
    granddaughterOf: "Loved granddaughter of",
    // Date. Before the muhurat the clock counts down in days, hours, minutes and
    // seconds; at the muhurat it restarts from zero and counts up the time since
    // the wedding in years, months, days and hours.
    muhurat: "Muhurat at",
    countdownBefore: "Counting down to the muhurat",
    countdownAfter: "Happily married for",
    // RSVP form. {groom} and {bride} are replaced by the names above.
    nameLabel: "Your name",
    phoneLabel: "Phone number",
    phoneHint: "Send again with the same number to update your RSVP.",
    attendLabel: "Will you attend?",
    attendYes: "Yes, we'll be there",
    attendNo: "Sorry, can't make it",
    guestsLabel: "How many people, including you?",
    functionsLabel: "Which functions will you attend?",
    sideLabel: "Whose side are you from?",
    sideGroom: "Ladke wale",
    sideGroomNote: "({groom}'s side)",
    sideBride: "Ladki wale",
    sideBrideNote: "({bride}'s side)",
    sideBoth: "Science side",
    wishLabel: "Your wish for the couple",
    optional: "(optional)",
    showWishLabel: "Show my wish on this page",
    // Messages shown when something in the form is missing
    errName: "Enter your name.",
    errPhone: "Enter a 10-digit mobile number.",
    errAttending: "Choose whether you can attend.",
    errFunctions: "Choose at least one function.",
    errSide: "Choose a side.",
    // Section headings and buttons
    celebrationsTitle: "The celebrations",
    rsvpTitle: "Will you join us?",
    sendButton: "Send RSVP",
    wishesTitle: "Wishes for the couple",
    contactsTitle: "Questions? Call us",
    thanks: "We look forward to celebrating with you",
  },

  // Background music. Starts when a guest taps "Open invitation";
  // the round button at the bottom right pauses and plays it.
  // To use another track: copy an .mp3 into assets/ and write its path here.
  // Keep it under about 2 MB. Use "" for no music.
  //   "assets/shehnai.mp3"    – The Dichotomy of Fame (Rockstar, A.R. Rahman), 2:40
  //   "assets/yaman-loop.mp3" – original Raga Yaman loop made for this invite,
  //                             free to use (fallback if the film track is ever a problem)
  music: "assets/shehnai.mp3",
  musicVolume: 0.6, // 0 to 1

  // Paste the Google Apps Script web-app URL here (README, step 3).
  // While it is "", the form runs in demo mode and saves nothing.
  // >>> REPLACE the text in quotes with YOUR link (copy it from your current
  // >>> config.js on GitHub, or Apps Script > Deploy > Manage deployments).
  rsvpEndpoint: "PASTE_YOUR_WEB_APP_URL_HERE",
};
