# CLAUDE.md — Action Items Prototype

This file provides context for AI assistants working in this repository.

## Project Overview

A self-contained UI prototype for an **Action Items** management interface. The entire application lives in a single HTML file (`action-items.html`) with vanilla JavaScript and Tailwind CSS. It demonstrates 10+ variants of the same component for design review and iteration.

**No build tools. No package manager. No framework.**

## Repository Structure

```
playground/
├── action-items.html    # Entire application (HTML + CSS + JS, ~1,243 lines)
├── icons/               # SVG icons and PNG avatar images
│   ├── *.png            # Avatars: axel.png, herbert.png, jimmy.png, john.png
│   ├── icon-*.svg       # Custom icons (plus, trash, calendar, grip-vertical, etc.)
│   └── tabler-icon-*.svg # Tabler icon library assets (status circles, etc.)
└── .vscode/
    └── launch.json      # Browse Lite debug config (launches localhost:3000)
```

## Tech Stack

| Concern | Tool |
|---|---|
| Markup | HTML5 |
| Styling | Tailwind CSS v3 (CDN) |
| Logic | Vanilla ES6 JavaScript |
| Typography | Figtree (Google Fonts CDN) |
| Icons | Inline SVGs + Tabler Icons |

No npm, no bundler, no transpiler. The file runs directly in a browser.

## Running the App

Serve the directory with any static HTTP server on port 3000:

```bash
# Python
python3 -m http.server 3000

# Node (npx)
npx serve . -p 3000

# VS Code: Use Browse Lite extension (pre-configured in .vscode/launch.json)
```

Then open `http://localhost:3000/action-items.html`.

## Data Model

```javascript
// Single shared array — no persistence, resets on page reload
const items = [
  {
    id: string,          // uid() — random alphanumeric
    title: string,
    description: string,
    assignee: string | null,  // "john" | "axel" | "jimmy" | "herbert" | null
    dueDate: string | null,   // Human-readable: "16 Mar 2026"
    status: 'todo' | 'in_progress' | 'done' | 'not_done' | 'blocked'
  }
];
```

## Architecture

The app is a single render loop with no virtual DOM:

1. **State** lives in the `items` array (module-level)
2. **`render()`** is called after every state mutation — it replaces `innerHTML` of each section container
3. **Event delegation** handles clicks on dynamically generated elements
4. **Scroll position** is preserved across re-renders manually

### Key Functions

| Function | Purpose |
|---|---|
| `render()` | Master render — rebuilds all 10 sections |
| `renderDisplayRow(item, variant)` | Read-only row (variants: `tooltip`, `expandable`, `visible`) |
| `renderEditableDropdownRow(item, variant)` | Row with inline pill dropdowns for editing |
| `renderInlinePillRow(item, variant, options)` | Presentable (read-only) pill row |
| `renderEditForm(item)` | Full edit form (title, description, assignee, due date) |
| `renderMyActionItemsPanel()` | Floating sidebar panel |
| `startEdit(id, section)` | Swap row → edit form in place |
| `saveEdit(rowEl, id)` | Read form values → update items → render |
| `removeItem(id)` | Delete from array → render |
| `getDueDateTier(dueDateStr)` | Returns `'grey'` (>14d), `'orange'` (7–14d), or `'red'` (<7d) |
| `moveItemBefore(dragId, targetId)` | Reorder items for drag-and-drop |
| `escapeHtml(s)` | XSS prevention — always use when rendering user input |
| `uid()` | Generates random IDs for new items |

## Sections

The page renders 11 sections, each showing a different UI variant:

| Section | Variant | Description |
|---|---|---|
| 1 | tooltip | Editable rows — assignee/status shown on hover tooltip |
| 2 | expandable | Editable rows — expand to reveal pills |
| 3 | visible | Editable rows — pills always visible |
| 4 | tooltip | Editable rows + dropdown pill editing on click |
| 5 | expandable | Same with expandable pill visibility |
| 6 | visible | Same with always-visible pills |
| 7 | tooltip | Presentable (read-only) — tooltip variant |
| 8 | expandable | Presentable — expandable variant |
| 9 | visible | Presentable — visible variant |
| 10 | (color-coded) | Editable with color-coded due date pills |
| 11 | (table) | Projects and tasks table layout |

## Conventions

### Naming
- **CSS classes**: hyphen-case descriptive names (`action-item-row`, `due-pill-orange`)
- **DOM selectors**: `$` prefix for variables holding elements (`$listTooltip`, `$myItemsToggle`)
- **Data attributes**: `data-section`, `data-id`, `data-assignee`, `data-status`
- **Functions**: camelCase, verb-first (`renderEditForm`, `saveEdit`, `startEdit`)

### DOM Patterns
- Use `escapeHtml()` for all user-generated content rendered into innerHTML
- Preserve scroll position by saving/restoring `scrollTop` before/after `render()`
- Toggle visibility with Tailwind's `hidden` class or custom `.is-visible`
- Close open dropdowns by removing `.is-open` from siblings before opening a new one

### Color Palette
| Token | Hex | Usage |
|---|---|---|
| Background | `#f8f9fb` | Page and card backgrounds |
| Border | `#eaecf0` | Dividers, input borders |
| Text primary | `#404252` | Main content |
| Text secondary | `#777986` | Labels, hints |
| Accent blue | `#2e6fe3` | CTAs, links |
| Error red | `#F62020` | Destructive actions, overdue |
| Warning orange | `#FF9E0D` | Due-soon indicators |

### Due Date Tiers (getDueDateTier)
- **Grey**: more than 14 days away (or no date)
- **Orange**: 7–14 days away
- **Red**: fewer than 7 days away (or overdue)

## Assignees

Four hardcoded users — no backend:

| Key | Display Name | Avatar |
|---|---|---|
| `john` | John Dope | `icons/john.png` |
| `axel` | Axel Rose | `icons/axel.png` |
| `jimmy` | Jimmy Two | `icons/jimmy.png` |
| `herbert` | Herbert Smith | `icons/herbert.png` |

## Development Guidelines for AI Assistants

1. **Keep logic in the appropriate component file.** `action-items.html` is a component catalogue — it lists components, shows each component rendered, and includes an example of its usage in a layout as a subpage. When adding or modifying a component, edit its dedicated file, not the catalogue page itself.
2. **Always call `render()` after mutating `items`.** Forgetting this leaves the UI out of sync.
3. **Use `escapeHtml()` for any user-provided strings** inserted via `innerHTML`.
4. **Preserve scroll position** around `render()` calls that might shift content.
5. **Close sibling dropdowns** before opening a new one to avoid multiple open dropdowns.
6. **Test all 10+ sections** after UI changes — each section renders independently and a change to a shared helper affects all of them.
7. **No persistence** — `items` is in-memory only. Refreshing the page resets to sample data.
8. **Icon assets are in `icons/`** — reference them with relative paths (`icons/icon-plus.svg`).
9. **Tailwind is from CDN** — use utility classes directly; no Tailwind config file exists.
10. **Date format is `"DD Mon YYYY"`** (e.g., `"16 Mar 2026"`) — match this exactly when generating or parsing dates.

## No Tests, No CI

There is no test suite and no CI/CD pipeline. Verification is manual — open the HTML file in a browser and exercise the UI.
