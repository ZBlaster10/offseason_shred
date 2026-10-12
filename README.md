# Offseason Shred 🏂

A personalized snowboard home-training app. On first open it asks six questions (days per week, equipment, fitness level, goals, session length, season start). It then builds a periodized program and coaches you through each workout with timers, audio cues and an animated rider. It runs as a website on your own domain, installs as a PWA, and wraps into Android/iOS apps with Capacitor.

## Features

- **Personalized plan.** 1–3 sessions a week, built from about 100 snowboard-specific exercises.
  - Filtered by the equipment you own (kettlebell, dumbbells, suspension straps, bands, balance board, jump rope, foam roller).
  - Scaled by fitness level: timers, reps, rest and which variations you get.
  - Balanced across your goals: strength, aerobic & power, mobility & core.
- **Season periodization.** Foundation → Strength → Power, timed so you peak the week before your first day on snow. Every 4th week is lighter. In-season maintenance kicks in after the date. Choosing "Not sure" cycles 4-week blocks instead.
- **Adapts to you.**
  - "Too easy / too hard" feedback after each session nudges the intensity.
  - Any exercise can be swapped for an alternative that fits the same slot and your gear.
  - All parameters can be edited at any time. The plan rebuilds from the current week, and history and streak are kept.
- **Workout player.**
  - Animated character for every exercise, with left/right mirroring for one-sided moves.
  - Countdown ring or rep target, rest screens with an "up next" preview, and 3-2-1 beeps.
  - Optional voice coach, screen wake-lock, haptics, and keyboard shortcuts (Space, ←, →).
  - Resumes after a reload.
- **Weekly streak.** A week counts when you hit your target (a session counts at ≥80% completion). Every 4 completed weeks earns a freeze that automatically saves a missed week.
- **Optional account.** Sign in with Google or email to back up the plan, history and streak, and use them on any device.
- **Responsive.**
  - Bottom tabs on phones and a side rail on desktop.
  - A two-column player in landscape and a compact layout for phones held sideways.
  - Light and dark themes.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # engine + streak unit tests
npm run build      # production build in dist/
npm run preview    # serve the production build (PWA enabled)
```

In dev mode, `/dev/animations` shows every exercise animation in a grid for QA. Add `?q=squat,plank&cols=4&still` to filter, set the column count, or freeze the frames.

## How the plan is built

| File | What it does |
|---|---|
| `src/data/exercises.ts` | Exercise library: slots, equipment, difficulty, cues, "why it helps your riding", animation clip, source |
| `src/engine/phases.ts` | Season date → phase, week in phase, lighter weeks, progression |
| `src/engine/dosage.ts` | Level × phase × feedback → work/rest seconds, reps, holds |
| `src/engine/generatePlan.ts` | Profile + week → sessions. Picks exercises per slot (seeded, so a week is stable but varies week to week) and fits rounds and rests so each session lands within ±10% of the chosen length |
| `src/engine/timeline.ts` | Session → flat list of player steps |
| `src/engine/streak.ts` | Weekly streak, freezes, "at risk" detection |

The plan is derived data: only your answers, swaps, feedback, history and settings are stored. They're always kept in `localStorage`. Signed-in users also sync them to Firebase (see below).

## Accounts & sync

Accounts are optional. Without one, everything stays on the device, as before. Signing in (Google or email/password) backs up the plan, history, streak and settings, and syncs them across devices.

| File | What it does |
|---|---|
| `src/sync/merge.ts` | Pure merge/diff logic (unit-tested). Remote history is a map keyed by session id, so two devices can't overwrite each other's workouts |
| `src/sync/cloud.ts` | Auth, plus the live sync between the store and the `users/{uid}` Firestore doc. Lazy-loaded after first paint |
| `src/features/account/` | Sign-in sheet and the Profile → Account card |
| `firestore.rules` | Each user can read and write only their own doc |

- On first sign-in, data from this device is merged into the account. The account's settings win, and workouts are combined.
- An in-progress workout stays on the device it was started on.
- Signing out clears the device; the account keeps everything.
- With no Firebase config, the account UI is hidden and the app runs device-only.

### Firebase setup (one time, free plan)
1. Go to [console.firebase.google.com](https://console.firebase.google.com) and add a project. Analytics isn't needed.
2. **Build → Authentication → Get started.** Enable **Google** and **Email/Password**. Then go to **Settings → Authorized domains** and add `<your-username>.github.io`.
3. **Build → Firestore Database → Create database.** Choose production mode and a region near you. Under **Rules**, paste [`firestore.rules`](firestore.rules) and click Publish.
4. Open **Project settings → Your apps** and add a **Web app**. Copy `apiKey`, `authDomain`, `projectId` and `appId`.
5. For local dev, copy `.env.example` to `.env.local` and fill them in.

## Put it on GitHub Pages

`.github/workflows/deploy.yml` tests, builds and deploys on every push to `main`. It sets the base path to `/<repo>/` automatically and adds a `404.html` so deep links work.

1. Create a **public** GitHub repo and push this folder to `main`.
2. Go to **Settings → Pages** and set Source to **GitHub Actions**.
3. Go to **Settings → Secrets and variables → Actions → Variables** and add `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID` and `VITE_FIREBASE_APP_ID`. Firebase web config is public by design; the Firestore rules protect the data.
4. Re-run the workflow (**Actions → Deploy to GitHub Pages → Run workflow**). The app goes live at `https://<your-username>.github.io/<repo>/`.

Friends open the URL and can "Add to Home Screen" (iOS Safari) or "Install app" (Chrome/Android) for a full-screen, offline-capable app.

Exercise sources:
- Snowboard Addiction × Jeremy Watkins, 24-min workout
- Mobility Duo's two DPT-designed snowboard workouts
- Burton's injury-prevention series
- General snowboard dryland research

Links are on the Profile → About screen.

### Other hosts

The build output is a static site, so any static host works. A SPA fallback is already included for Netlify and Cloudflare Pages (`public/_redirects`) and for Vercel (`vercel.json`). Use `npm run build` with `dist` as the output directory, set the four `VITE_FIREBASE_*` environment variables, and add the host's domain to Firebase's authorized domains.

## Android & iOS apps (Capacitor)

The Capacitor config is in `capacitor.config.ts` (`appId: com.offseasonshred.app`). Change the `appId` to your own reverse-domain id before publishing.

```bash
# Android: needs Android Studio
npm install @capacitor/android
npx cap add android
npm run cap:android     # builds, syncs and opens Android Studio

# iOS: needs a Mac with Xcode
npm install @capacitor/ios
npx cap add ios
npm run cap:ios
```

Native builds use `@capacitor-community/keep-awake` (screen stays on during workouts) and `@capacitor/haptics`. Both are already wired in and only load on native. For store icons and splash screens, `@capacitor/assets` can generate every size from `public/favicon.svg`.

## Customizing

- **Exercises.** Add or edit entries in `src/data/exercises.ts`. Each entry needs a `clip` that exists in `src/animation/clips/*`. A unit test fails if every slot loses its bodyweight beginner option.
- **Animations.** Poses are joint angles or IK targets on a small 2D rig (`src/animation/rig.ts`). Clips are keyframe lists. Check them at `/dev/animations`.
- **Photos.** Replace files in `src/assets/photos/` and keep `CREDITS.md` up to date.
- **Colors and fonts.** CSS tokens are at the top of `src/styles/index.css`, in light and dark variants.

## Credits

Photos from Unsplash (see `src/assets/photos/CREDITS.md`). Not medical advice: stop any exercise that hurts, and check with a professional if you're injured.
