# Implementation Plan: Expense & Budget Visualizer

## Overview

Build a framework-free single-page app in JavaScript: `index.html`, `css/styles.css`, `js/app.js`, with Chart.js loaded from a CDN. Pure logic (validation, formatting, totals, serialization) is written first, then Storage, then the view and controller that wire everything together.

Because the project requires no test setup, every test-related sub-task is optional (`*`). Tests live in a top-level `tests/` folder, never in `js/` or `css/`. The app runs without them.

## Tasks

- [x] 1. Set up project structure
  - [x] 1.1 Create `index.html` at the project root
    - Add `<noscript>` message, header with `#total-balance`, `#banner` (`role="status"`)
    - Add `#input-form` (`novalidate`) with labelled `#item-name` (`maxlength="100"`), `#amount` (`type="text"`, `inputmode="decimal"`), `#category` select (empty placeholder, Food, Transport, Fun), submit button, and an adjacent `.error` span per field
    - Add `#transaction-list` in a scroll container, `#empty-state`, `#spending-chart` canvas, `#chart-message`
    - Add one stylesheet link, the Chart.js CDN script, then one `js/app.js` script tag
    - _Requirements: 1.1, 4.1, 7.1, 7.2, 7.3, 7.6, 8.1, 8.5_

  - [x] 1.2 Create `css/styles.css`
    - Body font 16px or larger, text contrast of at least 4.5:1, balance font at least 1.5x body
    - Single-column responsive layout with no horizontal scroll from 360 to 1920 px; horizontal scroll allowed below 360 px
    - List container with `max-height` and `overflow-y: auto`; `overflow-wrap: anywhere` on item names
    - _Requirements: 2.2, 2.6, 8.1, 8.4, 8.6, 8.7_

  - [x] 1.3 Create `js/app.js` scaffold
    - Define `CATEGORIES`, `STORAGE_KEY`, `MAX_CENTS`, in-memory `transactions` and `chart`
    - Expose pure functions on `window.ExpenseApp` and set `module.exports` when `typeof module !== 'undefined'`
    - _Requirements: 7.1, 7.3_

- [x] 2. Implement pure logic
  - [x] 2.1 Implement `parseAmountToCents` and `validateInput`
    - Trim name, reject empty or over-100-char names, validate category
    - Amount must match `^\d+(\.\d{1,2})?$`; report empty, nonnumeric, nonpositive (including negatives), precision, and range reasons
    - Report all invalid fields at once; return `amountCents` as an exact integer
    - _Requirements: 1.2, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9_


  - [x] 2.4 Implement `formatCurrency`, `sumCents`, `categoryTotals`
    - Format cents with currency symbol, thousands separators, exactly two decimals
    - Sum integer cents; compute per-category cent totals
    - _Requirements: 2.5, 4.2, 4.3, 5.3, 5.4_


  - [x] 2.8 Implement `serialize`, `deserialize`, `generateId`
    - `deserialize` checks array shape, string id, name length 1 to 100, integer in-range `amountCents`, known category; any failure returns `{ ok: false }`
    - `generateId` uses `crypto.randomUUID()` with a timestamp plus counter fallback
    - _Requirements: 6.2, 6.3, 6.7_


- [x] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement state operations and Storage
  - [x] 4.1 Implement pure list helpers `addToList` and `removeFromList`
    - Add puts the new transaction first and keeps the rest in order
    - Remove deletes only the matching id, preserving order of the others
    - _Requirements: 1.2, 2.3, 3.2, 3.3_


  - [x] 4.4 Implement `loadTransactions` and `saveTransactions`
    - Wrap `localStorage` in `try/catch`; load returns `ok`, `empty` (key absent), or `corrupt` (read error, parse or shape failure)
    - Save returns `true` or `false` and never throws
    - Make no network requests
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [x] 5. Implement the view
  - [x] 5.1 Implement `renderList` and `renderTotal`
    - Build entries with `textContent` only: name, formatted amount, category, one `<button type="button">` delete control each
    - Show `#empty-state` only when the list is empty
    - Show total via `formatCurrency`; show 0.00 when empty; show "Maximum displayable balance exceeded" above the max without altering data
    - _Requirements: 2.1, 2.4, 2.5, 2.7, 3.1, 4.2, 4.3, 4.6, 4.8_


  - [x] 5.3 Implement `renderChart`
    - Pie chart of categories with total above 0, fixed distinct colors, legend labels; reuse the instance and call `chart.update()`
    - Hide canvas and show placeholder when no data; show "Chart unavailable" if `Chart` is undefined or construction throws, leaving data unchanged
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_

  - [x] 5.4 Implement `showFormErrors`, `clearFormErrors`, `showBanner`
    - Show an inline error beside each invalid field at once; keep entered values
    - Banner messages for "Saved data could not be loaded" and "Data was not saved"
    - _Requirements: 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 6.3, 6.4_


- [x] 6. Wire the controller
  - [x] 6.1 Implement `render`, `addTransaction`, `deleteTransaction`, and startup
    - On `DOMContentLoaded`: load from Storage, show the banner if corrupt, call `render()`
    - Submit handler: validate, show errors on failure; on success add, save, show not-saved banner if save fails, re-render, clear form (reset category) and errors
    - Delete handler: remove by id, save, re-render list, total, and chart
    - Isolate chart errors so list and total still update
    - _Requirements: 1.2, 1.3, 2.3, 3.2, 3.4, 3.5, 4.4, 4.5, 4.7, 5.5, 5.6, 6.1, 6.2, 6.4, 8.3_



- [x] 7. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional because the project requires no test setup; the app must work by opening `index.html` directly
- Tests use fast-check with Vitest or Jest and live in `tests/`; each property test runs at least 100 iterations and carries the tag `// Feature: expense-budget-visualizer, Property N: ...`
- Browser compatibility, contrast, layout, and load-time checks (Requirements 7.4, 7.5, 8.2, 8.4, 8.6, 8.7) need manual verification
- Each task references specific requirements for traceability

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4"] },
    { "id": 3, "tasks": ["2.5", "2.6", "2.7", "2.8"] },
    { "id": 4, "tasks": ["2.9", "2.10", "4.1"] },
    { "id": 5, "tasks": ["4.2", "4.3", "4.4"] },
    { "id": 6, "tasks": ["5.1"] },
    { "id": 7, "tasks": ["5.2", "5.3"] },
    { "id": 8, "tasks": ["5.4"] },
    { "id": 9, "tasks": ["5.5", "6.1"] },
    { "id": 10, "tasks": ["6.2"] }
  ]
}
```
