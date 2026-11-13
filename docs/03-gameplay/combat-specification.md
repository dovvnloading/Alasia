# Combat specification — readable, physical, ruthless

**ID:** SYS-001 · **Status:** WORKING / combat hypotheses · **Depends on:** FND-001, WRL-001 · **Version:** 0.1

## 1. What the player should feel

A strong Alasia fight is a **continuous conversation with momentum**: enemies commit, the ground telegraphs stress, the worker acts decisively, and a visible consequence follows within a small number of frames. It should have the threat density and immediate satisfaction expected of a top-down ARPG while avoiding both static cooldown rotations and indistinguishable particle explosions.

**Combat is not a geology exam.** The strain law creates *tactical verbs*, not a required physics puzzle for every ordinary enemy. Players must kill, stagger, push, reroute and reposition instinctively after a short introduction.

## 2. Five gameplay contracts

**S1 — Immediate agency.** Movement response is crisp; attacks have short, purposeful preparation and visible contact. Only clearly authored heavy commitments should prevent dodging. Avoid long uninterruptible animations as a substitute for difficulty.

**S2 — Fair, heavy contact.** A successful strike gives consistent hitstop, material-specific sound, reaction and frame-appropriate shake. No invisible damage zones. Heavy enemy attacks can punish poor positioning but must announce location and timing through shape and motion, not only hue.

**S3 — Terrain matters.** Players can see where a brace can seat, which surface carries a sounding pulse, and where a line can be tied. The environment provides opportunities, never arbitrary skill failure. Exposed water, loose mud and firm stone change options under authored rules.

**S4 — Offense and defense share a loop.** Defense creates offensive opportunity; good attack timing can interrupt or redirect threats. Resource gains come from meaningful player actions, not idle waiting.

**S5 — Density without visual collapse.** Core enemies must remain legible in groups; telegraphs, silhouettes, VFX and sound have a strict priority order. If more enemies make the screen unreadable, reduce density before reducing player information.

## 3. Input and camera — initial hypothesis

**Default prototype:** WASD movement + free cursor aim, left mouse basic, right mouse signature / contextual secondary, 1–4 actives, Space universal evade, one recovery consumable. Skill slots are provisional; the mapping is a usability test, not a clone of any game's HUD. Actions support remapping and hold/toggle where appropriate.

**Release-level evaluation:** click-to-move and controller parity must be tested with all three class geometries. Do not promise parity without prototypes. A user must not need a high-precision mouse flick merely to attach a line or counter a readable attack. No skill may be fundamentally unusable on controller.

**Camera:** slightly perspective-compressed top-down 3D view; initial camera elevation around 55–60° above the ground plane, limited smoothing, consistent combat scale, no cinematic pans while danger continues. Walls between camera and actor fade/occlude predictably; projectiles and tells remain visible. Zoom is bounded so encounters and performance stay controlled.

**Navigation:** player intent takes priority over decorative collisions. Stairs, door lips and tiny props do not snag movement. Any movement-assist pathfinding uses collision-sized agents, not screen-space shortcuts through walls.

## 4. Core state machine (proposed for graybox)

**Actor states:** locomotion, windup, active, recovery, evade, stagger, downed, interacting. Each attack has documented input buffer, dodge-cancel policy, hit windows, collision query, impact impulse, hitstop and effect envelope. A skill owns its costs when it *commits*, not merely when the key was brushed.

**Input buffering:** short window for next legal move, designed to preserve intent under 60 Hz ticks and animation. An avoidable cue during a long animation must be survivable by policy or encounter placement, never resolved with an arbitrary hidden immunity rule.

**Provisional feel ranges (not balance commitments):**

| Dimension | Candidate range | What will be measured |
| --- | --- | --- |
| Common basic windup | ~90–220 ms | Whether first contact feels immediate under real browser input latency |
| Heavy commitment | ~250–500 ms | Clear payoff and genuinely cancellable boundaries |
| Standard dodge travel | ~2.5–4 m over ~250–400 ms | Can break target pressure without trivializing spacing |
| Trash enemy major telegraph | ~400–850 ms | Different shapes, enemy densities and accessibility settings |
| Early trash time-to-defeat | ~0.6–2.0 s for practiced player | Rhythm and readability, not artificial health inflation |
| Field-profession setup action | Usually under 1 s for a useful first effect | Avoid “place three devices before playing” syndrome |

These are **prototype ranges**, not dates or requirements to ship a particular number. Professional animation, latency and balance playtests will decide final values.

**Universal evade:** short, deliberate invulnerability/guard-break windows may exist but must be measured; evading is not unlimited. Enemies track *commit positions* for heavy attacks so a fair dodge is meaningful. No player class requires voluntarily eating damage to generate its resource.

## 5. Damage, status and stagger: simple core, expressive edges

**Candidate damage families:** **Impact** (blunt contact/displacement), **Shear** (cuts, fissures, broken lines), **Resonance** (timed transfer through connected material). These describe behavior and defense interactions rather than a rainbow of magic elements. Status states derive from physical consequences: **Unseated** (lost footing), **Bound** (limited movement through a line), **Fractured** (temporary armor vulnerability), **Out of Phase** (exposed timing opening). No arbitrary poison/frost/shock list on day one.

**Poise:** enemies have a stagger budget with per-ability contribution and recovery; large enemies cannot be infinitely disabled by precise Sounder hits or Linewright pulls. Small enemies react strongly to clear class fantasy. Boss vulnerability is earned by mechanic timing, not permanently chained CC.

**Hit reliability:** collision uses intent-centered sweeps and clear projected footprints. Any miss must correspond to visible position/cover. Projectile ownership and path are authoritative to simulation, not inferred from a VFX particle. Line-of-sight rules documented per skill; environment never grants free global reach.

**Enemy teams:** a mob composition can include a pressure mover, a lane defender and an interrupt threat. Challenge emerges from complementary behaviors, not raw health or overlapping unreadable telegraphs.

## 6. Combat rhythm and pacing

**Exploration beat:** sparse environmental danger, small fights, optional signs of earlier labor and disaster. **Engagement beat:** dense groups and fast class loop. **Decision beat:** a new shape or enemy telegraph that changes strategy. **Pressure beat:** escalating hazard or formation under a known rule. **Release beat:** room to inspect tangible aftermath and collect meaningful loot.

A combat room should teach one interaction before combining it with another. For the opening Orren district, introduction order: **movement and basic strike → dodge from broad directional threat → class resource loop → first terrain affordance → mixed formation → South Cut cyclic hazard**. Story dialogue does not interrupt while the player is resolving a dangerous active encounter.

## 7. Readability and screen-space budget

Priority when the scene is crowded:
1. **Player silhouette, footing, health-critical reaction and dodge path.**
2. **Active enemy damage footprints and nearest lethal tells.**
3. **Class-owned anchors, reading marks or lines that change decisions.**
4. **Enemy states and target selection.**
5. **Cosmetic particles, weather haze, ambient sparks and non-critical splashes.**

Use different shapes and rhythms for damage forms (wedge, ring, line, ground crack) so color blindness does not erase the warning. Design a high-contrast accessibility mode that preserves mood through geometry and value. Weather never hides a telegraph; occluding masonry gets a controlled transparency pass.

**Screen effect caps (to test):** limit concurrent high-alpha effects, aggressively pool short-lived meshes, cap debris and exposure changes per hit. Camera shake intensity is adjustable or disabled; hit confirmation survives without it. Boss audio and important warnings must have protected channels/ducking priority.

## 8. Combat accessibility without deleting challenge

- Full key remap, options for hold/toggle on charge, dodging and target lock where suitable.
- Timing-assist window enlarges Sounder response cues while retaining physical mechanics; no audio-only timing check.
- Optional aim support for line anchors and controller; preview lines before commit.
- Subtitle and caption equivalents for critical sound events, separate from narrative subtitle choices.
- Reduced flash, vignette and camera shake, and scalable text/HUD independent of render resolution.
- User-facing options specify tradeoffs; no moral judgment about assists.

## 9. Encounter instrumentation

For every graybox session capture: effective inputs to active frame, number of attacks dropped to recovery, successful dodges after tell, enemy kills per minute, time with no meaningful action, mean/peak concurrent foes, player damage causes, ability-use distribution, line targeting error rate, and player-reported clarity. Privacy-minded local telemetry only until a data policy exists.

**Stop condition:** if subjects cannot distinguish class resources or if “I don't know why I got hit” remains common, no additional combat content ships. Rework cues and collision first.

## 10. References and non-identity

PoE and Diablo III/IV define *genre expectations*—fast pace, crisp contact, loot-driven builds and dense dark environments. Alasia must not reproduce their protected UI layout, animation signatures, class silhouettes, skill names, monsters or quest structure. Our differentiating center is **force and responsibility**—with control schemes designed for speed, not copied interfaces.

Linked systems: [starter classes](starter-classes.md), [enemies and loot](enemies-loot-and-progression.md), [technical architecture](../05-engineering/technical-architecture.md), [presentation](../04-presentation/visual-and-audio-direction.md).