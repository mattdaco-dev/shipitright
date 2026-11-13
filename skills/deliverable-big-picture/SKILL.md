---
name: deliverable-big-picture
description: Produces or updates the "Big picture" deliverable of a ShipItRight project, event storming style (timeline of events by phase and by flow, pivotal events, actors, external systems, hotspots, opportunities), as an HTML page from the template. Use in phase P1, when the BA opens the analysis from the validated framing, or when the big picture must be corrected after an analysis workstream or feedback.
allowed-tools:
  - "Bash(node ${CLAUDE_PLUGIN_ROOT}/team/scripts/*)"
  - "Read(/${CLAUDE_PLUGIN_ROOT}/**)"
---

# Deliverable: big picture

The big picture tells the domain **in the order things happen**, flow by flow, in the words of the
business. It shows at a glance the full journey, who acts, which systems take part and where the grey
areas are. It is the shared map of P1: the analysis workstreams attach to it, the story map draws its
backbone from it, the Architect reads the domain boundaries in it.

Format: big picture event storming (Brandolini), with lanes per flow and events in the first person.

- **Author**: BA. **Contributors**: PO (rules and trade-offs), UX (usage), Architect (external
  systems).
- **Phase**: P1, opening the analysis. Goes through gate **G1** with the other specs deliverables.
- **File**: `docs/10-analysis/big-picture.html`.
- **Template**: [`template.html`](template.html), to copy then fill. Copying means reading
  `${CLAUDE_PLUGIN_ROOT}/skills/deliverable-big-picture/template.html` with Read, then writing it to
  its place in the project with Write.

## Goals

- A shared understanding of the domain end to end, the same for every role.
- Surface early what we do not know (hotspots), while it is still cheap.
- A common language: the glossary terms, word for word.
- Show the irreversible moments (pivotal events) and the handovers between actors.

It is neither a spec, nor a data model, nor a sequence of screens.

## Inputs

- `docs/00-framing/framing.html`: vision, personas, scope, known business rules, glossary, open
  questions. It is the main source.
- `.team/questions/`: questions already asked and answers of the PO.
- The workstream analyses of `docs/10-analysis/` if they already exist (update).

## Running the workshop solo

An event storming is usually done by several people in front of a wall. Here the BA runs it alone, in
successive passes. Each pass has its purpose.

1. **Events in bulk.** List everything that happens in the domain, **in the first person and in the
   past tense**, from the point of view of the one who lives it: "I booked the room", "I received the
   cancellation". An automatic reaction has "Application" as its actor: "I checked that no booking
   overlaps". No technical verb ("I inserted a row"), no screen ("I clicked Confirm"). Aim wide,
   failures and what will fall out of scope included.
2. **Flows.** Group the events into **lanes**, one per flow or scenario that reads in one go
   ("one-off booking", "recurring booking", "room inventory management"). What is seen but excluded
   goes to an "Out of scope" lane (named in the project language), also declared in `data-lanes-out`
   to be greyed.
3. **Chronology and phases.** Order each lane in time, then cut the whole into **phases** (4 to 7).
   Within a phase, `data-t` gives the moment: two simultaneous events of two lanes have the same
   `data-t`.
4. **Pivotal events.** Spot the events that change the state of the domain irreversibly or that hand
   over to another actor. A pivotal event **closes its phase**.
5. **Actors and systems.** Under each event: the actor (persona of the framing), then the external
   system if there is one.
6. **Hotspots and opportunities.** Wherever there is a question, a conflict between two rules or a
   risk, put a hotspot under the event concerned. Each hotspot that needs an answer from the business
   becomes a question `Q-xxx` in `.team/questions/`, and the sticky cites its id as a link to that
   file. An improvement idea becomes an opportunity.
7. **Arrows.** They are automatic from one event to the next of its lane, within a phase. Break the
   chain on alternatives (`data-flow="end"` on the column), and draw the links between lanes by hand
   (`data-links`, see the comment of the template).

What the framing does not say stays a hotspot. We do not invent an event to fill a gap.

## Content

| Section | Level | What we expect |
|---|---|---|
| Goals and scope | required | goals of the big picture, "we look at" and "we do not look at". No reminder of the vision: a link to the framing |
| Legend | required | already in the template, to keep as is |
| Event timeline | required | phases, lanes per flow, one column per moment (event, actor, system, hotspot, opportunity), pivotal events, out of scope lane if useful |
| Pivotal events | required | the 3 to 6 pivotal events, with what changes after them and who takes over |
| Actors and external systems | required | each actor tied to a persona (`PER-xx`, as a link), each external system with its role. No system: write it |
| Hotspots | required | questions, conflicts, risks, each with its phase and its `Q-xxx` if asked to the PO. Empty list: write it |
| Opportunities | recommended | improvement ideas, with their phase and the expected value |

No commands, policies or read models: they belong to process level event storming, and the rules are
set in the functional design. No candidate contexts either: the Architect cuts the domains in P3,
from the lanes and pivotal events of the timeline.

## Quality rules

- **An event is a lived fact, in the first person.** "I booked the room", not "Book a room" (that is
  an intention) nor "Form validated" (that is a screen).
- **Glossary terms are used word for word.** A new term goes to the glossary through the PO.
- **One sticky, one idea.** An event that contains "and" is cut in two.
- **Each hotspot is traceable**: either it cites a `Q-xxx`, or it says why it is not raised (known
  risk, simple point of attention, outside the MVP).
- **Actors are roles**, those of the personas of the framing, never people.
- **The timeline stays readable**: 3 to 4 moments per phase and per lane, 6 to 12 events per phase.
  Beyond that, cut the phase in two.

## What follows from it

- **Story map** (`deliverable-story-map`): the phases give the activities of the backbone, the events
  triggered by an actor give the user tasks, the opportunities candidate stories.
- **Analysis workstreams** (`deliverable-analysis`): the PO often cuts the workstreams by phase, by
  lane or by cluster of hotspots.
- **Functional design**: the pivotal events and the reactions of the "Application" become business
  rules `BR-xx`.
- **Architect**: the lanes, the pivotal events and the external systems prepare the split into
  domains and the flows of the macro design.

## Delivering

1. Copy the template, replace `PROJECT_NAME`, fill each section, delete the examples.
2. Create the questions `Q-xxx` of the hotspots in `.team/questions/` (field `blocking` filled).
3. Check: `node ${CLAUDE_PLUGIN_ROOT}/team/scripts/check-deliverable.mjs docs/10-analysis/big-picture.html`.
4. Open the page in a browser: a column with a red outline flags a `data-lane` missing from
   `data-lanes`.
5. Report: path of the file, phases and lanes chosen, number of hotspots and questions created.
