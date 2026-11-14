# Alasia: Lost Isles

*A dark, story-driven, top-down action RPG for the web.*

Two offline browser games share the Inner Sound. **Soundings** is the playable combat and progression slice. **Market Steps** follows the landing inspection, Ada’s crossing and the terms the island crews accept. The full campaign and its Three.js production remain in development.

## Play Soundings

Download the repository ZIP from **Code → Download ZIP**, extract it, and open [studies/soundings.html](studies/soundings.html). Take the **Gauge Steps** contract to learn the first fight. The Workshop lets you change profession before departure. Mouse, keyboard, touch controls and standard gamepad bindings are included. Progress saves in the same browser when local storage is available. Serving the folder over a local HTTP server also works.

| Profession | First useful move |
| --- | --- |
| Shorer | Seat a foot beneath a marked enemy stroke. Catch the load, then send it back through the pack. |
| Sounder | Read a target as it commits. Strike its recovery with True Return. |
| Linewright | Hook a pursuer and lay a guide. Pull the cable across the next enemy and snap it. |

Gauge Steps, South Cut and the Outer Sill have different packs, hazards, bosses and fitting patterns. Move through fallen bridle plates and seamglass chips to bring back extra salvage. A clear pays XP, salvage and a fitting or duplicate parts. At level 3 each profession unlocks a second technique that changes how its signature lands. The workshop can commission a chosen stamp after its site is cleared. Clear two different sites to open the next grade. Clear all three at grade VI to earn the Standing Watch Collar.

The collar opens **Deep Watches**. Carry one build and its remaining health across three sites with paired conditions. At each camp choose repairs or stronger attacks for the rest of the expedition. Completing a depth rotates its itinerary and opens the next of six depths. The highest depth and site clear times are saved. A recalled crew can retry the same conditions. Regular contracts remain available between expeditions.

## The premise

The islands of Alasia keep their grain ports above the tide by transferring the strain into another shore. Forty-one years ago the Board of Sills used inhabited **Sere** to hold up Verran’s harbor. Its families kept receiving tax bills after the island vanished from the public chart. Now a field-worker signs off on a ferry landing at **Orren** and finds their stamp on the order that lowered the island beneath it. When the order surfaces, the worker can warn the departing launch or ring the bell in time to save Bela’s rye from the rain.

The story is about survival purchased at someone else's expense, the memories that official charts cannot erase, and the people who must live with the consequences of a new decision. It is *not* a chosen-one prophecy or an invasion by a generic ancient evil.

**Experience:** swift, impactful combat; a dark medieval-to-early-mechanistic maritime world; distinct specialist classes; consequential characters; equipment that changes how players fight. Diablo III, Diablo IV and Path of Exile inform the combat pace, functional loot, build choices and return trips to harder encounters. Alasia’s tools, people and working shores give those systems their identity.

## Explore the Inner Sound

Open the [playable world atlas](docs/01-world/playable-world-atlas.md) for the basin chart, six illustrated shore plans and close-ups of Gauge Steps, South Cut and the Outer Sill. Each district follows the ground players can cross and what changes on their way back.

## Play Market Steps

On GitHub, choose **Code → Download ZIP**, extract it and open [studies/market-steps.html](studies/market-steps.html) in a browser. It runs offline. At Low Quay, decide what leaves under your stamp. Cross the exposed market with Ada Sen to recover a passage tally, then decide when to warn the crews and which settlement to carry into effect. At the end, take a service contract in Soundings. The affected households and the location of the working winch follow the settlement you signed. Use the action buttons with a pointer or Tab and Enter.

For the opening on Orren, read [The long board](docs/03-gameplay/orren-field-sequence.md). For the working settlements across the Sound, read [Three landings in the Inner Sound](docs/01-world/island-life.md).

## The foundation — organized by discipline

| Area | Read |
| --- | --- |
| **Creative direction** | [World and story identity](docs/00-foundation/creative-constitution.md) · [Working glossary](docs/00-foundation/glossary.md) |
| **World** | [Physical premise](docs/01-world/seed-and-laws.md) · [Places and people](docs/01-world/atlas-and-societies.md) · [History](docs/01-world/history-and-daily-life.md) · [Routes and connections](docs/01-world/network-and-route-map.md) |
| **Story** | [Three-act campaign treatment](docs/02-narrative/campaign-spine.md) · [Character arcs](docs/02-narrative/cast-and-arcs.md) · [Scenes, quests and dialogue](docs/02-narrative/writing-and-quest-standards.md) |
| **Gameplay** | [Combat direction](docs/03-gameplay/combat-specification.md) · [Shorer, Sounder and Linewright](docs/03-gameplay/starter-classes.md) · [Enemies, loot and progression](docs/03-gameplay/enemies-loot-and-progression.md) |
| **Art and sound** | [Visual and audio direction](docs/04-presentation/visual-and-audio-direction.md) |
| **Development** | [Three.js architecture](docs/05-engineering/technical-architecture.md) · [Development outline](docs/06-production/development-outline.md) |

## Working approach

Write and build from the **seed outward**. Keep geography, history, social structure, enemy ecology and classes connected to things that actually happened in the world. Favor a smaller number of distinctive, fully realized places and mechanics over an ever-expanding inventory of names. Challenge tired language, derivative designs and easy plot devices by improving them in the work itself.

The first playable area is envisioned on **Orren**: Low Quay, Gauge Steps, Reedward and South Cut. It provides a concrete place to express the world and test the combat, without treating the rest of the narrative as a bureaucratic dependency.

The existing repository [LICENSE](LICENSE) is AGPL-3.0; music, art, fonts, commissioned work and other assets will need appropriate rights. No third-party game assets or UI designs are to be copied.

Run the model regressions with `node --test studies/*.test.cjs`. The repository workflow checks the offline entry points and browser controls as well. Soundings uses Canvas 2D and original synthesized effects. The full campaign, streaming 3D environments, production animation and final audio are still in development.
