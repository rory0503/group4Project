import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ModelTable from "../ModelTable";

// How many models to show on each page
const PAGE_SIZE = 20;

// Handles the page logic: which page we're on and which models to show
// resetKey: when this value changes, we jump back to page 1
function usePagination(items, pageSize = PAGE_SIZE, resetKey) {
  const [page, setPage] = useState(1); // pages start at 1

  // Go back to page 1 whenever the reset key changes (e.g. a new model is selected)
  // This makes sure the user sees the pinned model, not whatever page they were on
  useEffect(() => {
    setPage(1);
  }, [resetKey]);

  // Total number of pages (always at least 1, even with an empty list)
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  // Keep the page in range, e.g. if the list gets shorter after filtering
  // (we clamp here instead of calling setPage, so there's no extra re-render)
  const currentPage = Math.min(page, totalPages);

  // Page 1 = items.slice(0, 20), page 2 = items.slice(20, 40), and so on
  // start is also used by the "Showing X–Y" text below
  const start = (currentPage - 1) * pageSize;
  const pageItems = items.slice(start, start + pageSize);

  // Cycle functions
  // next/prev are clamped so they can never go past the first or last page
  const next = () => setPage(Math.min(currentPage + 1, totalPages));
  const prev = () => setPage(Math.max(currentPage - 1, 1));
  // goTo jumps straight to a page number (not used by the buttons yet)
  const goTo = (n) => setPage(Math.min(Math.max(n, 1), totalPages));

  return { pageItems, currentPage, totalPages, start, next, prev, goTo };
}

// Wraps ModelTable with pagination (ModelTable itself stays page-unaware,
// so it can still be reused on the page that only shows 3 models)
export default function CycleModelTable({ models, selectedId, sort, onSort }) {
  // Full list with the selected model moved to the front (ranks are not changed)
  // This happens BEFORE paginating, so a model from page 8 ends up on page 1
  // useMemo means the list is only rebuilt when models or selectedId change
  const pinnedModels = useMemo(() => {
    const selected = models.find((m) => m.id === selectedId);
    if (!selected) return models; // nothing selected, leave the order alone
    return [selected, ...models.filter((m) => m.id !== selectedId)];
  }, [models, selectedId]);

  // Paginate the pinned list, so the selected model always lands on page 1
  // Passing selectedId as the reset key sends the user back to page 1 on a new selection
  const { pageItems, currentPage, totalPages, start, next, prev } = usePagination(
    pinnedModels,
    PAGE_SIZE,
    selectedId
  );

  return (
    <div>
      {/* Only the 20 models for the current page go into the table */}
      {/* showRank displays each model's real rank, so pinned rows keep their original rank */}
      <ModelTable
        models={pageItems}
        selectedId={selectedId}
        sort={sort}
        onSort={onSort}
        showRank
      />

      {/* Page controls */}
      <nav className="pagination" aria-label="Table pages">
        {/* Shows e.g. "Showing 21–40 of 87" */}
        {/* start + 1 is the first row on this page; start + pageItems.length is the last */}
        <span className="pagination-info">
          Showing {models.length === 0 ? 0 : start + 1}–{start + pageItems.length} of {models.length}
        </span>

        <div className="pagination-controls">
          {/* Previous button, disabled on the first page */}
          <button
            type="button"
            className="pagination-btn"
            onClick={prev}
            disabled={currentPage === 1}
            aria-label="Previous page"
          >
            <ChevronLeft className="icon icon-sm" />
          </button>

          {/* Current page number */}
          <span className="pagination-page">
            Page {currentPage} of {totalPages}
          </span>

          {/* Next button, disabled on the last page */}
          <button
            type="button"
            className="pagination-btn"
            onClick={next}
            disabled={currentPage === totalPages}
            aria-label="Next page"
          >
            <ChevronRight className="icon icon-sm" />
          </button>
        </div>
      </nav>
    </div>
  );
}