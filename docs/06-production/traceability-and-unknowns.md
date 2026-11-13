# Traceability, open questions and internal consistency controls

**ID:** PRD-003 · **Status:** WORKING · **Version:** 0.1

This is the living bridge between an interesting pitch and an implementable, testable game. **Every major claim needs a source, downstream consequence, and falsification test.** Status words are intentionally conservative.

## 1. Requirement-to-proof matrix

| Seed / contract | World consequence | Story consequence | Gameplay / art / engineering consequence | Acceptance evidence |
| --- | --- | --- | --- | --- |
| **R-02 Account balances** | Verran's protected lift has named donors Anset → Sere → Orren | Winter Allocation, Third Column, public final plan | Routing map; readable stress-state props; validated load graph in content | A new reader can identify a donor and receiver for every permanent lift |
| **R-03 No arbitrary distance** | Fitted routes cross specific straits; ferries cross channels | Travel and proof acquisition must follow usable boat routes | Linewright max edge, valid Sounder substrate, level collision | World route diagram matches beat sheet and gameplay distance constraints |
| **R-04 Finite capacity** | Anset and Sere no longer usable; collars fracture | Orren emergency is not optional | Equipment failure, VFX stress cues, Shorer Counterload limits | No lore scene or skill generates limitless force |
| **C-02 Geography before content** | Keld quarry; Orren fields; Verran harbor; Selwick outer bar | Every island causes a necessary story beat | Four visual grammars and route-aware authored levels | Remove-any-island test has a specific irreparable story/economy gap |
| **C-03 Human institutions** | Board's food and maintenance incentives | Eran and Iven culpable in different periods | Civilian scenes, mixed worker opposition, public evidence folio | At least one costly choice per lead visible through play |
| **C-05 Distinct professions** | Workers use common fitted craft with different duties | Unified protagonist without chosen-one origin | Shorer geometry, Sounder timing, Linewright graph | Blind tests separate three decisions independent of art |
| **C-06 Combat legibility** | Failure threats have physical tells | South Cut and Sixth Jack are explainable hazards | Animation/audio timing, VFX priority, 60Hz core and benchmarks | Most failures are attributable to a cue in recorded combat |
| **Pillar P3 Build verbs** | Workshops, repair economy and provenance | Item rewards tied to work and people | Fittings alter behavior at cost, content schemas | New item changes a player decision, not just a stat |
| **Player consequence** | Marginal settlement vs lower harbor release | Two coherent documented emergency plans | World-state save, visual overlays, bounded quest outcomes | Ending/epilogue scenes differ in material and social effects |
| **Visual autonomy** | Structural repair signatures on each island | Art shows whose ground was protected | No copied branded UI/characters; original cues | Silhouette and rights review at G3 |

## 2. Open questions — must be resolved at a gate

| ID | Priority / deadline gate | Question and why it matters | Current safe assumption | Responsible review role |
| --- | --- | --- | --- | --- |
| **O-01** | **P0 / G0** | What precisely is the observable **field-scale force** source and cap? Without it class action contradicts the world law. | Impacts, surface pulses and small stored tool tension; no spontaneous creation | Combat + world |
| **O-02** | **P0 / G0** | Can mapped undersea donor routes reach Orren/Sere without unexplained connections? | Fixed, costly, maintained collars through Selwick trunk and Sound seams; scale map needed | World + level |
| **O-03** | **P0 / G0** | Does each of the two final plans retain a **feasible** safe operation with a real cost? | Both require repaired fittings, crews and evacuation; no free restoration | Narrative + world + engineering |
| **O-04** | **P0 / G0** | Which character's knowledge makes each Act I/II fact discoverable without exposition? | Tessa boats, Iven gauges, Ada claims, Keld fitting records, Eran authorizations | Narrative |
| **O-05** | **P0 / G0** | What first-release and platform scope is actually authorized? | Desktop single-player, web, three starter professions; other ambitions deferred | Owner + production |
| **O-06** | **P0 / G1** | Can all three profession loops be fun with no art and under one second setup? | Not proven; prototype independently | Combat + UX |
| **O-07** | **P0 / G1** | Can the frame, input and save architecture handle dense combat in real browsers? | WebGLRenderer baseline and 60Hz sim candidate; benchmark required | Engineering |
| **O-08** | **P0 / before importing art/code** | Are license, contributor, trademark, brand comparison and asset rights understood? | Existing AGPL-3.0 file; **no** permission assumed for external images, music or models | Owner + legal/rights |
| **O-09** | **P1 / G2** | How many seconds and beats does the player need to learn the gauge mystery? | Prologue + Act I in one authored Orren route | Narrative + UX |
| **O-10** | **P1 / G2** | Are Orren's local distances, tide windows, safe routes and level shapes coherent? | Four adjacent districts and a reachable service cut | World + level |
| **O-11** | **P1 / G2** | What is the minimum viable loot/build expression without grind? | Tool + fittings + small authored pool | Systems + UX |
| **O-12** | **P1 / G3** | Are proposed place, person, species, class names sufficiently distinct and clear? | All except title provisional; editorial collision audit not legal clearance | Narrative + creative + rights |
| **O-13** | **P1 / G3** | Does the dark look survive grayscale/small-screen enemy legibility tests? | value-based palette, low-particle control priority | Art + accessibility |
| **O-14** | **P1 / G3** | Can the Sixth Jack encounter be played fast without a class-specific puzzle bypass? | Six numbered mechanisms, all classes use shared interactions | Combat + level + engineering |
| **O-15** | **P2 / post-G3** | Would co-op, item trading or a procedural endgame reinforce the core game? | No first-slice work on any | Owner + production |

No one may mark an item **resolved** without linking the artifact/test and updating dependent docs.

## 3. World-story consistency checks (run on each major draft)

**Time:** Y-94 Anset Trials → Y-76 Board charter → Y-41 Winter Allocation → Y-7 Orren covert draw → Y0 South Cut failure. Eran is approximately 77 at Y0, adult but not the sole governor at Y-41; Iven's involvement concerns Y-7, not the older decision; Ada was a teenager at Sere's loss.

**Geography:** Keld northwest high supplier; Verran north-central receiving harbor; Orren southwest fertile donor; Selwick eastern stormwall/control; Anset east-southeast old test; Sere southern settled shelf. All crossings are by plausible ferry/service routes and all long strain transfers require fixed connections.

**Economy:** Orren makes food, Keld makes fittings, Verran stores/distributes, Selwick controls tideworks and needs imported food. A proposed destruction of Verran's dock must be acknowledged in Orren's supplies too.

**Evidentiary chain:** Gauge steps (land drop) → South Cut (opened donor valve) → Keld (batch mark) → Sere (inhabited) → Verran (signed concealed donor) → Selwick (operational alternatives). The player learns *different facts* at every stop.

**People:** the public has always known land could settle; many did not know the Board knowingly chose inhabited donors. Sere survivors were vocal; people are not magically made to forget. Civil employees can resist the player without being evil.

**Mechanics:** field force acts locally and cannot move whole islands. Linewright moves through finite visible lines, Shorer relocates brace feet, Sounder reads and answers a moving target. All classes can defeat the same boss without time magic.

**Ending:** the Sere dead remain dead, displaced claims remain active, neither plan produces free restoration. The official register gains a public donor field and accountability.

## 4. Documentation coverage and authorship states

| Layer | Currently written | Missing before approval |
| --- | --- | --- |
| Creative / governance | Constitution, decisions, glossary, critique | External cold read; owner’s locked-versus-working choices |
| World | Seed and laws, atlas, chronology, route/load map | To-scale elevation and fitted-route model, food-chain audit |
| Narrative | 3-act treatment, cast, quest/dialogue standards | Complete scene list, sample scripts, knowledge grid, localized voice test |
| Gameplay | Combat, three profession kits, enemies/loot | Graybox interactions, item-behavior prototype, real enemy timing data |
| Presentation | Visual/audio grammar, scene briefs, UI concepts | Original concept artwork, animation tests, HUD mock and mix |
| Engineering | Architecture hypothesis and benchmark test plan | Test hardware matrix, renderer spike, save/replay implementation |
| Production | Gate plan, critique, traceability | Resourcing, estimates based on accepted scope, legal sign-off |

**Documentation = available for discussion, not proven ready for production.** Do not misread full coverage as completed game design.

## 5. Format of a follow-up task

- **Title / owner / priority / target gate:**
- **Source decision or requirement ID:**
- **One-sentence hypothesis to test:**
- **Smallest artifact or playable experiment:**
- **What success/failure looks like:**
- **Which other documents change on success/failure:**
- **Link to evidence / reviewer verdict:**

Do not create “Add ten new monsters” or “Build Act II” tasks while P0 proof is unresolved. Keep the work traceable, reversible and candid.

## 6. Definition of “no slop” for this repo

A contribution is **not accepted** because it uses many proper nouns, is atmospheric, cites other games, or says “AAA.” It needs **necessity**, **specific human consequence**, **new playable decisions**, **readability**, **independent critical review**, and **production feasibility**. Every contradiction or unearned phrase is a design defect worth fixing before scale.