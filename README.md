# THE UNRELIABLE ART CRITIC (LIVING PET & DUAL THEME EDITION)
### A Playful, Tactile Art Toy with an Expressive Character & Day/Night Mode

An interactive digital art toy featuring a living critic creature, real-time image analysis, Day/Night gallery modes, successive-click personality escalation, and a 7-click secret Easter egg.

---

## 1. Visual Identity & Dual Mode

The application uses standard CSS variables for seamless switching between **Day Mode** and **Night Mode**:

### Day Mode
- `--bg: #F7F6F2` (Soft studio paper)
- `--panel: #FFFFFF` (Clean card surface)
- `--text: #171717` (Deep ink)
- `--muted: #737373` (Graphite)
- `--border: #252525` (Thin crisp outline)
- `--accent: #D71920` (Blood red)
- `--bubble: #FFFFFF` (Speech bubble)

### Night Mode
- `--bg: #111111` (Deep gallery darkness)
- `--panel: #1A1A1A` (Charcoal surface)
- `--text: #F5F5F5` (Off-white text)
- `--muted: #A0A0A0` (Muted grey)
- `--border: #3A3A3A` (Dark border)
- `--accent: #FF343B` (Vivid red glow)
- `--bubble: #222222` (Dark speech bubble)

Switching themes updates the entire website instantly via a 250ms smooth transition, persists in browser `localStorage` (`CRITIC_THEME`), and respects the operating system's color scheme on the first visit.

---

## 2. The Living Critic Character

### The 14 Expressive States + Secret Easter Egg
1. **IDLE:** Calm, gentle rhythmic breathing, polite eyes, cursor tracking.
2. **CURIOUS:** Eyes widened, head tilted by ~6°, raised pupil, small round mouth.
3. **HAPPY:** Curved smiling cat eyes (`^ ^`), gentle bounce, cute blush marks.
4. **IMPRESSED:** Sparkling star eyes, red blush lines, starry pupils.
5. **SUSPICIOUS:** Narrowed slanted eyes, one raised skeptic eyebrow, squiggly skeptical mouth.
6. **CONFUSED:** Head tilted opposite, pupils misaligned, floating question mark `?`.
7. **OFFENDED:** Head turned away, puffed up recoil, disdainful pout, sweat mark.
8. **ANGRY:** Inward angled sharp eyebrows, narrow fierce eyes, steam puff.
9. **EMBARRASSED:** Lowered bashful pupils, prominent red blush lines, shy mouth.
10. **SLEEPY:** Heavy droopy eyelids, relaxed breathing, tiny floating `z z` bubbles.
11. **SHOCKED:** Wide round eyes, tiny dot pupils, dropped open mouth, exclamation mark `!`.
12. **UNHINGED:** Chaotic asymmetrical pupils (one huge, one tiny), jagged mouth, dramatic tilt.
13. **PROUD:** Chest puffed, straightened posture, confident smirk, closed haughty eyes.
14. **SNEAKY:** Lowered eyelids, pupils glancing sideways, crafty slight grin.
15. **EASTER_EGG:** Frozen posture, pupils locked forward, glowing red eyes, cosmic monocle flare.

### Cursor & Idle Interactions
- **Pupil Tracking:** Pupils track the cursor smoothly within the eye boundaries.
- **Head Tilt:** Subtle head tilt towards the cursor direction.
- **Hover:** Entering the character area triggers `CURIOUS` (*"Oh? You noticed me."*).
- **Idle Sleep:** After 18 seconds of inactivity, the critic nods off into `SLEEPY`. Returning wakes him up!

---

## 3. Successive Clicks & The 7-Click Secret Easter Egg

Clicking the character repeatedly escalates his reaction:
- **Click 1:** `SHOCKED` → `HAPPY` (*"Oh. Hello."*)
- **Click 2:** `SUSPICIOUS` (*"Do you need something?"*)
- **Click 3:** `OFFENDED` (*"I am trying to look professional."*)
- **Click 4:** `OFFENDED` (recoil) (*"IS THIS AN INTERROGATION?"*)
- **Click 5:** `UNHINGED` (*"THE RECTANGLE KNOWS WHAT YOU DID."*)
- **Click 6:** `SNEAKY` (*"You are getting suspiciously persistent."*)
- **Click 7:** **THE SECRET EASTER EGG:**
  - Character freezes.
  - Pupils slowly lock forward.
  - Speech bubble displays: *"YOU WERE NOT SUPPOSED TO FIND THAT."*
  - Character switches to `EASTER_EGG` with glowing red pupils and play a cosmic mystery chime.
  - Resets click count after sequence so it can be rediscovered.
- An 8-second inactivity timer resets the consecutive click counter.
- Keyboard accessible via `Enter` or `Space` on the character.

---

## 4. Website Event Reactions

The critic actively reacts to studio events:
- **Image uploaded:** `CURIOUS` (*"SHOW ME."*)
- **Artwork submitted:** `CONFUSED` → `IMPRESSED` or `SUSPICIOUS` based on score (*"Unfortunately, I respect this."* or *"We need to discuss your margins."*)
- **Design defended:** `CONFUSED` → `IMPRESSED` if valid (*"That is... annoyingly reasonable."*)
- **Critic challenged:** `OFFENDED` or `SHOCKED`
- **Redesign requested:** `CONFUSED` (*"Let us restructure."*)
- **Brutal truth requested:** `PROUD` (*"Unfiltered reality."*)
- **Artwork cleared:** `CURIOUS` (*"The stage is empty. Bring me something bold!"*)
- **Theme switched to Night:** `SLEEPY` (*"Ah. My natural habitat."*)
- **Theme switched to Day:** `HAPPY` (*"Good morning. I have opinions."*)

---

## 5. Strict Zero-Scroll Viewport Layout

- Main interface fits entirely in `100dvh` / `100vh`.
- Zero page-level scrolling.
- Compact 3 columns:
  - **Left:** Living Character Pet, speech bubble, stage progression dots, poke button.
  - **Centre:** Artwork studio, drag & drop, sample chips, original aspect ratio preview (zero filters).
  - **Right:** Verdict score stamp out of 10, first impression, 4 category chips (`COMPOSITION`, `COLOUR`, `TYPE`, `CONCEPT`), active feedback card, red `UNRELIABLE OPINION` card, and expand dossier modal trigger.
  - **Bottom:** 4 compact actions (`[ DEFEND ]`, `[ REDESIGN ]`, `[ CHALLENGE ]`, `[ BRUTAL TRUTH ]`).

---

## 6. How to Run

```bash
# Start Vite development server
npm run dev

# Or build for production
npm run build
```
The server runs at **`http://127.0.0.1:5173`**.
