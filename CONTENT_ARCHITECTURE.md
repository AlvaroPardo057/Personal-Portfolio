# Portfolio content architecture

The existing Three.js scene, six objects, colors, proximity panels and guide are preserved. Content is rendered as native HTML inside the existing CSS3D panels.

| Section ID  | Object ID     | Section   |
| ----------- | ------------- | --------- |
| `about-me`  | `f1`          | About Me  |
| `interests` | `power-plant` | Interests |
| `projects`  | `library`     | Projects  |
| `education` | `notebook`    | Education |
| `contact`   | `phone`       | Contact   |
| `hobbies`   | `bike`        | Hobbies   |

## Where to edit

- `src/portfolio-data.js`: all section copy, content entities, groups, related sections, guide summaries and keywords.
- `src/section-components.js`: reusable quote, topic list, card, metadata, image, external-link and related-navigation components.
- `src/station-experiences.js`: complete station compositions: interactive circuit stops, reactor controls, project shelves, facing education pages, summit hobbies and a contact screen. Content is drawn from the existing section/entity data.
- `src/station-experiences.css`: scene-specific palettes, geometry and spatial layouts.
- `src/living-station-scenes.js`: illustrated cycling terrain and reactor control-room artwork. Cycling labels use the same summit coordinates as the terrain; the cyclist follows its curved road. No elevation figures or personal facts are inferred.
- `src/station-life.css`: animation and material refinements for cycling and Interests only, with reduced-motion styling.
- `src/park-planting.js`: additive tree groves and flower borders. Existing station background buildings, water and mountains are preserved. Tree trunks are registered with navigation and the planting is batched by material.
- `src/content.js`: the adapter between sections and the scene's original object IDs, positions and palette.
- `src/style.css`: distinctive station silhouettes, content layouts and responsive styling using the site's shared palette.
- `src/panel-layout.js`: fits floating panels within the viewport around the existing header and controls.

## Data hierarchy

A section has a stable `id`, an `objectId`, `title`, `subtitle`, `introduction`, `groups`, `relatedSectionIds`, `displayOrder` and `visible` flag. Optional section `images` and `links` use the same format as entity media.

A group has a stable `id`, a heading, a `layout` (`stack`, `list`, `tiles` or `route`), an ordered array of `entityIds`, `displayOrder` and `visible` flag. Empty groups are omitted automatically. `tiles` arranges list items as a compact grid; `route` keeps a semantic list while styling its items as connected stops.

Entities are stored by ID in `portfolioEntities`. The `entity()` helper supplies empty optional fields. Supported entity types are `quote`, `topic`, `project`, `education`, `contact` and `paragraph`. Cards render `title`, `subtitle`, `description`, `category`, `date` or `period`, optional images and external links. Quotes add `text` and `attribution`; projects can add `status`. `relatedIds` records relationships between entities, while `relatedSectionIds` creates visitor navigation.

Use string values for dates and periods, and add them only when supplied. Images require `src` and meaningful `alt` text. Links have an `id`, `title`, `url`, optional `newTab` flag, ordering and visibility. External links accept HTTP, HTTPS and email URLs; new tabs use `noopener noreferrer`.

## Adding content

1. Add an entity to `portfolioEntities` with a unique, descriptive ID.
2. Include that ID in the relevant group's `entityIds`.
3. Set `displayOrder` to position it and `visible: false` to keep it unpublished.

For example, a reserved project entry can be authored as:

```js
'future-project': entity('future-project', 'project', {
  title: '[Placeholder: project title]',
  description: '[Not provided]',
  isPlaceholder: true,
  visible: false,
  displayOrder: 20,
}),
```

No component changes are needed to add more entries, descriptions, dates, images or links. To add another supported content group, list its entity IDs in the section's `groups`. Hidden entities and groups do not render; hidden sections are excluded from the scene and discovery count. A placeholder deliberately made visible is labeled as a placeholder.

## Interaction

“Keep exploring” buttons ask the existing guide to lead visitors to a related station. Object IDs and the demo reply contract remain unchanged. The guide routes keywords to the new section meanings, including AI → Interests, startup → Projects and mechanical engineering → Education.

The notebook's existing device-local note remains available in a collapsed learning-note area. The smartphone retains its screen-wake action alongside the supplied LinkedIn link. No personal data is sent to a backend by these components.

All visitor copy is in English. The only qualifications and project status displayed are those supplied by the owner; no employment history, dates, skills, outcomes or contact channels are inferred.
