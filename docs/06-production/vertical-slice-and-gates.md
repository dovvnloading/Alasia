# Production roadmap and quality gates — proof before scale

**ID:** PRD-001 · **Status:** WORKING · **Version:** 0.1

**Production position:** We have a detailed design hypothesis, not a shipped game and not yet validated AAA quality. The plan deliberately separates **creative approval**, **mechanical proof**, **authored graybox**, **production-quality presentation**, and **full campaign scale-up**. A project that cannot fund an entire premium ARPG must shrink content, *not hide failures behind a bigger map*.

## 1. Preproduction contract

**Build quality vertically before expanding horizontally.** The first fully developed place is the **Orren Low Quay → Gauge Steps → Reedward → South Cut** sequence, ending in a repaired-but-not-saved harbor and the Keld casting-mark hook. It should contain the game's narrative promise, a dangerous but understandable encounter, the first class loop and a taste of meaningful salvage. No offshore continents, faction wars, ancient pantheons or hundreds of procedural maps.

**Preproduction output:** one consistent story/evidence model, three viable class graybox briefs, a camera/input/renderer risk plan, a singular original art language, and named stop/go gates. **No code for now.**

## 2. Gates, owners and evidence

| Gate | Phase | Required evidence | Stop condition |
| --- | --- | --- | --- |
| **G0** | Documentation approval / concept validation | Physical law audit, map/civic dependency audit, timeline, complete Act I beat sheet, three distinct prototype hypotheses, critical risk/rights register, prioritized P0 decisions | Story can be reduced to “evil machine does bad thing,” classes are only reskinned archetypes, or no viable first slice |
| **G1** | Playable graybox proof | Fixed-step actor + one enemy, three class resource loops with no art advantage, functional input/dodge/hit feedback, deterministic scripted test, initial frame benchmarks | The professions are not different in player decisions, target selection fails, core feedback is mushy, or basic browser performance is unsuitable |
| **G2** | Authored Orren functional slice | 20–35 minutes *target to test*, all four local districts, Tessa and early Iven beats, one civilian rescue, physical evidence, 3–4 enemy roles, South Cut mechanical encounter, save/reload, inventory sample | The story hook only works in text, combat is unreadable, quests don't affect each other, or gameplay breaks on refresh |
| **G3** | Polished presentation slice | Original high-quality hero/creature rigs, full animation and audio priority, mood/lighting, polished UI, performance/UX/accessibility passes, provenance for all assets, dialogue edit and VO feasibility | It looks derivative, cannot sustain density with readable VFX, lacks necessary craft specialists, or suffers unaccepted performance debt |
| **G4** | Campaign production approval | G3 accepted, Act II/III blocking approved, all cast arcs/evidence verified, branching state budget, production team and costed content plan | Narrative scope or asset burden exceeds demonstrated team capability |
| **G5** | Alpha / beta / release readiness (future) | Content complete, systems balance, supported-browser QA, error/recovery, localization, accessibility, licensing and legal sign-off, external testing | Failures in save integrity, readability, rights, performance, storytelling logic or core quality |

**Gate status at creation: G0 NOT PASSED.** Documents have not yet been owner-reviewed, the classes are not tested, and performance is unmeasured. Passing G0 means *permission to experiment with code*, not a claim of final story approval.

## 3. G0 review packet — docs first

The reviewer should receive:
- [Creative constitution](../00-foundation/creative-constitution.md) with exactly what is locked and what is speculative.
- [World law](../01-world/seed-and-laws.md), [atlas](../01-world/atlas-and-societies.md), [chronology](../01-world/history-and-daily-life.md), [connected schematic](../01-world/network-and-route-map.md).
- [Campaign](../02-narrative/campaign-spine.md) and [cast](../02-narrative/cast-and-arcs.md) with a scene-by-scene account of who knows what and why evidence survives.
- [Combat](../03-gameplay/combat-specification.md), [professions](../03-gameplay/starter-classes.md), [enemies/loot](../03-gameplay/enemies-loot-and-progression.md) with a one-minute action description for each.
- [Art](../04-presentation/visual-and-audio-direction.md) and [engineering](../05-engineering/technical-architecture.md) as testable approaches, not technical promises.
- [Critique](critique-register.md) and [traceability](traceability-and-unknowns.md) with explicit unresolved problems and rejected low-quality ideas.

**G0 acceptance:** in an independent read, the plot's key consequences follow from known rules; a critic can explain the economic incentive of every standing island; every main character has a costly choice; three classes are distinguishable *without* visuals; every new noun has a justification; rejected names remain logged; no licensing or platform claim is unsupported. Reviewer changes are captured through the decision register.

## 4. G1 experimental work order — after approval

**Test 1: Feel.** Gray capsules and blocks, one attack, one dodge, hitstop, readable attack footprint, input buffer and same-game replay at different render frame rates. Evaluate “why did I get hit?” complaints before adding more AI.

**Test 2: Three class verbs.** Shorer catches and returns under moving pressure; Sounder earns a read and times an answer with both sound on/off; Linewright sets a moving connection and snaps it with mouse and controller-style input. Test each in 30-second immediate play, 3-minute practice and the same adversary drill. Track confusion, setup downtime, difference in movement patterns and rate of meaningful actions.

**Test 3: Crowd.** One Bridleshell-like fast charger, a tougher shell front, a crack-emergence hazard and a machine stroke. Run all three class loops against the same wave. If the mechanics are still not fun at placeholder fidelity, more art will not fix them.

**Test 4: Browser viability.** Prove deterministic basic combat, memory, frame pacing, input reliability and save/reload. Select minimum supported hardware based on facts, not a slogan.

**G1 decision:** **retain / revise / replace** each profession independently. A name's charm cannot rescue a dull class.

## 5. G2 single-slice content budget, not a fake release plan

**One route, four contiguous authored districts:**
- **Low Quay:** 5–7-minute player arrival/rescue hypothesis, Boat League manifest, first salvage.
- **Gauge Steps:** 4–6-minute mystery/first tell/terrain tutorial.
- **Reedward:** 5–8-minute mixed enemies and save-point/short optional rescue.
- **South Cut:** 7–12-minute pressure mechanics, crew conflict, first apparatus encounter and evidence.
- **Return:** 2–4-minute consequence and next objective. *Durations are hypotheses and may be revised by playtest.*

A player who skips optional material still understands the physical problem and finds the next lead. One optional side quest may show the evacuation ledger; avoid baking ten unrelated quests into the slice.

**Functional acceptance:**
1. A fresh player notices **land movement vs sea rise** before a cutscene tells them.
2. First class action feels distinctive in under 60 seconds of combat after an appropriate introduction.
3. At least one failed collar mechanically changes an arena in a predictable way.
4. Tessa's boat count has consequences in the playable scene, not only subtitles.
5. The final device cannot be destroyed as an obvious free win.
6. The maker's mark motivates travel to Keld.
7. Save/reload resumes safely at every major milestone.
8. Provisional performance matrix is measured in *combat*.

## 6. G3 quality bar with actual disciplines

**Visual:** original silhouette language, readable dark value structure, distinct wet stone / brass / seamglass materials, no borrowed game assets. **Animation:** class-specific anticipation, contact, recoveries and locomotion blending at gameplay speed. **Audio:** authored attack layers and priority mix; critical cues captioned. **Narrative:** revised, recorded where justified; silent beats authored; no expository wall blocking control. **UI:** readable class resource feedback, tooltip clarity, accessibility controls. **Engineering:** repeatable benchmark, robust browser focus/saves/loading, error handling. **Design:** player agency and challenge survive unfamiliar external testers.

**Do not pass G3 on screenshots alone.** A 30-second recorded full-speed fight with ordinary gear, captions and reduced VFX must still communicate every dangerous event.

## 7. Roles and review responsibilities (staffing not assumed)

| Function | Required accountability | Cross-review partner |
| --- | --- | --- |
| Creative lead / game director | Pillars, scope cuts, originality and overall cohesion | Narrative + combat |
| Narrative lead / editor | Plot logic, scripts, arcs, subtext, evidence ledger | World/system design |
| Combat systems designer | Feel, profession loops, difficulty and build identity | Engineering + QA |
| World/level designer | Spatial logic, quests, environment affordances | Narrative + art |
| Technical lead | Runtime, browser budgets, build, saves and tooling | Combat + technical art |
| Art director / character/tech artist | Distinctive visual grammar, rigs, material/VFX budgets | Combat + engineering |
| Audio director | Class feel, atmosphere, mixing and caption sync | Narrative + accessibility |
| QA / accessibility review | Repeatable tests, input parity, regressions, legibility | All disciplines |
| Rights/production reviewer | Budget, contributor terms, asset/license provenance | Project owner |

This is a **responsibility map**, not a claim that a team has been hired. A small team needs external specialists or narrower content; one person cannot reasonably deliver all premium animation, audio, character art, UI, writing, engineering and QA at once to a AAA bar.

## 8. Risk register (first pass)

| Severity | Risk | Leading indicator | Mitigation / decision |
| --- | --- | --- | --- |
| **Critical** | Class mechanics only novel on paper | All three played as ordinary damage rotations in blind tests | Prototype verbs before full content; replace failed loop |
| **Critical** | “Dark ARPG” becomes a branded visual clone | Reviewers identify a specific game's UI/enemy/class silhouette | Rework original presentation; restrict inspiration to genre-level targets |
| **Critical** | Web performance fails at combat density | VFX transparency and animation dominate frame | Benchmark at G1, budget every effect, reduce quantity |
| **High** | Story is a contrived morality play | No rational alternative or victims are passive | Ration/harbor math, named witnesses, role-specific POV edits |
| **High** | World physics contradiction | Combat power exceeds large-scale law, or donor forgotten | Central content schemas and causal continuity review |
| **High** | Loss of save state or browser focus | Reload breaks quest or line graph | Versioned checkpoints, deterministic reset and crash tests |
| **High** | Legal/licensing uncertainty | Assets/third-party code added without provenance | Hold asset import; inspect AGPL and all licenses with counsel |
| **High** | Content scope outruns polish | New zones while Orren loop unproven | Gate stops, fewer zones, depth-first budget |
| **Medium** | Targeting burdens Linewright | More input misses than intended acts | Auto-suggest valid endpoints, preview line, reduce nodes if needed |
| **Medium** | Sounder frustrates accessibility | Timing requires hearing or tiny signals | Shape/timing alternatives, widened windows and user testing |

## 9. Sequence of next tasks, not calendar promises

**Now:** review and revise G0 docs; commission/prepare a topological/scale map; run story chronology and noun uniqueness audits; agree on target browser/hardware; define G1 class test scripts and a resource-loop balance harness.

**Then, only after G0:** implement neutral graybox and proof loops, not full art. **Only after G1:** integrate a playable authored Orren slice. **Only after G2:** spend on full-fidelity art/VO and expensive expansion. No timeline or headcount estimates are credible until the responsible roles, asset pipeline and accepted slice specifications are known.

**Core production rule:** When time or budget tightens, reduce *number* of monsters, islands, quest branches and items first. Never silently waive readability, authorship, coherence, accessibility, technical reliability or legal provenance.