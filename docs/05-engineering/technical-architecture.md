# Technical architecture and feasibility plan — Three.js web ARPG

**ID:** ENG-001 · **Status:** WORKING / architecture hypothesis · **Version:** 0.1

**This is a design specification. No engine, dependencies, runtime, shaders or server have been created yet.** Choose technology by measured evidence. Browser AAA quality is a constrained production engineering problem, not a matter of importing Three.js and adding particle effects.

## 1. Target and initial architecture decisions

- **Target first:** modern desktop browsers on keyboard/mouse; design for controller evaluation and accessibility. Mobile is **not** implicitly supported by “web-based.”
- **Form first:** authored, single-player, local save. Networking, accounts, co-op, live multiplayer inventory and cloud synchronization are deferred; they complicate determinism, security and production.
- **Language/build hypothesis:** TypeScript + Vite for web app and tooling; Three.js owns rendering but **not gameplay truth**. UI layer may use accessible DOM components; choose framework after input/menu spike, not from fashion.
- **Renderer baseline:** Three.js **WebGLRenderer** on WebGL2-compatible devices as the conservative first baseline; investigate **WebGPURenderer** through an abstraction. Three.js documents its WebGL2 fallback and notes WebGPURenderer is still experimental, while maintaining WebGLRenderer for pure WebGL2 applications. Do not mix incompatible custom shader/post-processing paths without planning.
- **Physics:** simulation needs deterministic high-level hit/collision rules; use simple actor shapes, authored collision and spatial queries first. Evaluate Rapier WASM for rigid bodies **only after** performance/feature testing, not as a prerequisite for combat.

Official research basis (reviewed Nov 2026): [Three.js WebGPURenderer guide](https://threejs.org/manual/pages/webgpurenderer), [InstancedMesh docs](https://threejs.org/docs/pages/InstancedMesh.html), [Rapier JavaScript determinism](https://rapier.rs/docs/user_guides/javascript/determinism/), [MDN Web Audio/autoplay](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay).

## 2. Logical boundaries

| Module | Owns | Must not own |
| --- | --- | --- |
| **Input adapter** | Keyboard, pointer, controller, remapping, buffered intentions | Damage, movement truth, UI hardcoded key labels |
| **Simulation core** | Fixed tick world state, actor state machines, skill rules, collision queries, damage, AI decisions, quest transitions, seeded randomness | Three.js Object3D state, DOM event timing, unversioned asset paths |
| **Render adapter** | Camera, scene graph, animation presentation, effects, interpolation, light/material strategy | Authority for hits, resources or quests |
| **Audio director** | User-unlocked audio context, spatial/priority mixing, captions event links | Gameplay-only timing secrets |
| **Content layer** | Typed islands, regions, enemy definitions, skills, gear, encounters, quests, evidence graph, localized text | Arbitrary code execution from designer data |
| **Persistence** | Versioned saves, migration, backups, recovery at safe states | Raw browser localStorage as unvalidated single source of truth |
| **Tools/CI** | Content validation, authored collision/export checks, visual regressions, perf test harnesses | Narrative canon written only into scripts |

**Golden rule:** a simulation hit happens because a skill's query intersects a target at tick N. The rendered blade, dust and sound *depict* that fact. The renderer cannot independently kill an enemy or decide whether a gap is passable.

## 3. Conceptual repository layout (future; not created now)

    apps/
      client/           # web entrypoint, input, DOM UI, render adapters
      server/           # OPTIONAL, only if online features are approved
    packages/
      game-core/        # fixed-step simulation, collision & combat rules
      game-content/     # typed source data + validation + localization
      game-tools/       # conversion, profiling, test scenarios
    assets/
      source/           # owned source files and license/provenance manifest
      optimized/        # reproducible browser-ready generated artifacts
    docs/               # current source of design truth

Do not generate scaffolding for optional services at this stage. The smallest later proof is an actor, one enemy, one surface, one hit and a deterministic replay.

## 4. Time, events and game state

**Fixed update hypothesis:** 60 Hz simulation; variable-rate rendering interpolates between authoritative snapshots. The accumulator caps catch-up work to prevent unbounded spirals on slow tabs. Browser visibility suspension pauses responsibly, rather than turning a hidden game into an uncontrolled physics burst.

**Actions:** timestamp/buffer user intention, validate state, commit costs and generate gameplay events (e.g., ReceiveImpact, SetBrace, RecordReading, LinkNode, ApplyDamage, AwardSalvage, QuestEvidenceFound). Events carry tick and instance IDs. Presentation subscribes and can coalesce cosmetic effects.

**State graph:** actor locomotion/attack/recovery/evade, skill cooldown and resource, target ownership, enemy AI, interactive props, quest/evidence flags and persisted world choices. The same game rule has **one** implementation; quest scripts must not manually apply combat damage to bypass rules.

**Replays:** record initial world seed/version + ordered player inputs and key nondeterministic external events. A replay must reproduce logical outcomes before networked play or expensive balancing automation. Determinism depends on exact simulation inputs/versions; do not assume any physics library magically makes arbitrary JS, scheduling and effects deterministic.

## 5. Geometry, collisions and the three profession mechanics

**Author collision in gameplay space:** use a top-down navigable surface with height layers where needed. Movement against level geometry uses swept capsules/circles and simple elevation transitions. Enemy crowds use spatial partitioning and local separation; don't simulate 100 expensive full rigid-body stacks.

**Shorer:** two placed brace nodes, optional triangle/edge rules computed from world-space positions and valid footing masks. Catch events test facing plus impact timing; area effects use deterministic geometry sweeps. No actual re-meshing of entire terrain for every hit.

**Sounder:** pre-authored enemy attack phases drive window tags; reading state is per target with expiry and clear visual annotation. Ground-connected pulses traverse a bounded graph of surface segments; not arbitrary flood-fill through a full high-poly landscape.

**Linewright:** temporary graph with at most three nodes and two edges (provisional), edge length and obstacle occlusion queries, capped force transfers and deterministic line-break events. The visible cable is sampled/smoothed render geometry; **gameplay collision is a simple line/capsule query**, not a continuously simulated rope. Prioritize sub-second target selection and controller affordances.

**Why this matters:** all three classes are at risk of overloading a browser if their visual metaphors are simulated literally. Use exact tactical geometry at low cost and authored presentation for the spectacle.

## 6. Content pipeline and story truth in data

**World schema** has island/region IDs, adjacency, ferry routes, elevation tiers, sill route edges, donor/receiver allocations, civic owner, quest dependencies and documented evidence IDs.

**Skill schema** records profession, target shape, allowed terrain, costs, interrupt windows, hit frames, damage family, poise effects, linked VFX/audio event IDs and accessibility cue. No “everything as a bespoke script” dependency.

**Quest schema** includes trigger conditions, actor knowledge requirements, physical route, objective verbs, evidence acquisition, state changes, failure/resume, localization and consequence. A content validator rejects missing evidence or a quest requiring an unreached world flag.

**Item schema** includes implement/fitting family, behavior modifier tags, provenance, drop source, rarity rules and repair recipe. Validate mutually exclusive modifications; prevent damage-transfer recursion.

**Assets:** authored meshes/rigs in reproducible glTF pipeline; evaluate KTX2 texture compression, mesh optimization and LODs. Source art and exported runtime assets are separate. Artist tooling and format version choices need a technical spike and import budget.

**Data format choice:** type-safe JSON/TypeScript source with runtime schema validation, versioned content IDs. Prefer boring, auditable definitions to a bespoke visual node editor before there are real designers.

## 7. Rendering and visual density

- Test forward lighting with high-quality baked/static contributions and limited dynamic key lights, measured against black slate/wet masonry.
- Prototype one character with attack animation, one crowd family, one fog/weather mode and one critical VFX layer *before* committing a full art style.
- InstancedMesh/batching for repeated props and compatible repeated enemy parts; cull off-screen areas, cap pixel ratio and alpha overdraw, use LOD, atlas textures and pooled particles where beneficial.
- Avoid dozens of transparent screen-filling emitters competing with enemy telegraphs.
- Class VFX geometry is screen-space audited: a Linewright line and a Sounder reading must survive fog, tone mapping and occlusion.
- Use profiler frames under dense combat, not quiet showroom stills. A per-frame CPU/GPU budget and draw-call count must be measured in each target browser.
- Validate color space, tone mapping and material behavior per chosen renderer. WebGPU node/TSL materials are not automatically interchangeable with ShaderMaterial or legacy EffectComposer paths.

## 8. Proposed quality/performance test matrix — not achieved benchmarks

**Tier A:** typical mid-range modern desktop at 1920×1080, 60 Hz, baseline quality. **Hypothesis:** p95 full frame <= 16.7 ms during a repeatable 30–50 enemy benchmark; p99 <= 33 ms. **Tier B:** integrated-GPU desktop/laptop at 1366×768, reduced effects; target stable 30 Hz with legible tells. Exact hardware models and supported browser versions must be recorded before numbers are meaningful.

**Interaction:** track input-to-first-feedback latency; aim to keep p95 under ~100 ms on Tier A under representative load. **Memory:** record peak GPU/CPU memory and asset download on cold cache; define enforceable caps after an actual build. **Loads:** prototype staged asset loading with visible progress, predictable retry, and no giant compulsory up-front package. **Accessibility:** measure UI at smaller displays and zoom levels.

**Benchmark scene requirements:** same seed and player input replay, moving enemy pack, mixed materials, dense collision, three class effects, camera occlusion, rain, inventory overlay and a boss stroke. Report average **and** p95/p99, stutters, memory and browser differences. No claims based solely on Chrome desktop screenshots.

## 9. Browser-specific operational requirements

**Audio:** browsers commonly gate audible Web Audio playback until user interaction; initialize/activate on a clear Start/Resume action, and support mute, mix controls, audio-device disruption and captions. Do not assume automatic music on page load.

**Persistence:** versioned local save in IndexedDB (candidate) with safe-point checkpoint and explicit export/import for testing. Validate schema and handle quota failures, private mode and corrupted records. Confirm user data policy before any telemetry or account service. Single-player save protection does not require pretending a client can be made tamper-proof.

**Resilience:** page visibility pause, loss and restoration of rendering context, failed asset fetches, network drops during initial loads, resizable viewport, browser refresh, focus loss in combat, and deterministic resume where possible. This is necessary for quality at any rendering scale.

**Accessibility:** keyboard navigable menus, screen-readable text where possible, controller focus cues, remappable gameplay controls, non-color-only warnings, reduced motion and captioned critical mechanics. Do not pack all crucial information into the GPU canvas when accessible DOM can carry it.

## 10. Practical technical considerations

| Risk | Earliest proof / falsification | Fall-back if poor |
| --- | --- | --- |
| 3D density breaks frame budget | 40-enemy benchmark with all three class effects and wet stone | Reduce concurrent actors, reuse animation rigs, make VFX less transparent |
| Dynamic rope graph feels fiddly | Linewright 3-node / 2-edge controller and mouse drill | Simplify to one automatically suggested link, preserve connect/redistribute verb |
| Sounder reads feel like a QTE | Silent/low-VFX test on real enemy tells | Widen windows, add passive imperfect readings, simplify per-target UI |
| Shorer is passive | Player session with no setup requirement and moving mob | Increase attack-generated load and brace mobility |
| Visual style unreadable at low exposure | Grayscale combat captures in fog and at half res | Increase character separation and cue geometry, not generic bloom |
| WebGPURenderer compatibility differs | Renderer spike in specific target browsers | Keep WebGLRenderer baseline and preserve adapter |
| Core sim tied to frame rate | Replay same encounter at 30/60/144 Hz presentation | Fix timestep/event authority before feature work |
| Saved progress lost in browser | Quota, refresh, migration and context loss test | Explicit export and safe recovery flow |
| Third-party art/license uncertainty | Track provenance for any imported asset | Replace asset / commission original; retain docs and owned code only |

## 11. From fiction to a working Three.js scene

When we start development, build an Orren space that can be navigated at a locked combat scale, with a controllable character, one enemy with readable attacks, and clear hit and dodge feedback. Give each profession one genuinely different interactive move. From there, add the South Cut fault, the gauge mystery, Tessa and the ferry, saving the world as a consistent playable state and not just a set of effects.

The code should grow alongside the design, not wait for a separate approval system. Measure browser responsiveness and adjust how assets, crowds and effects are rendered as the project becomes real. The [development outline](../06-production/development-outline.md) stays short and practical.
