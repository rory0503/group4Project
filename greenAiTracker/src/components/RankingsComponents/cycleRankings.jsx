import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ModelTable from "../ModelTable";
import { DEFAULT_TOKEN_SCALE_ID } from "../../lib/tokenScale";

// How many models to show on each page
const PAGE_SIZE = 20;

// Handles the page logic: which page we're on and which models to show
// resetKey: when this value changes, we jump back to page 1
function usePagination(items, pageSize = PAGE_SIZE, resetKey) {
  const [page, setPage] = useState(1);

  // Go back to page 1 whenever the reset key changes
  useEffect(() => {
    setPage(1);
  }, [resetKey]);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(page, totalPages);

  const start = (currentPage - 1) * pageSize;
  const pageItems = items.slice(start, start + pageSize);

  // Cycle functions
  // next/prev are clamped so they can never go past the first or last page
  const next = () => setPage(Math.min(currentPage + 1, totalPages));
  const prev = () => setPage(Math.max(currentPage - 1, 1));
  const goTo = (n) => setPage(Math.min(Math.max(n, 1), totalPages));

  return { pageItems, currentPage, totalPages, start, next, prev, goTo };
}

// Wraps ModelTable with pagination
export default function CycleModelTable({
  models,
  selectedId,
  sort,
  onSort,
  tokenScaleId = DEFAULT_TOKEN_SCALE_ID,
}) {
  // Move the selected model to the front without changing its rank
  const pinnedModels = useMemo(() => {
    const selected = models.find((m) => m.id === selectedId);

    if (!selected) return models;

    return [
      selected,
      ...models.filter((m) => m.id !== selectedId),
    ];
  }, [models, selectedId]);

  // Paginate the pinned list
  const {
    pageItems,
    currentPage,
    totalPages,
    start,
    next,
    prev,
  } = usePagination(
    pinnedModels,
    PAGE_SIZE,
    selectedId
  );

  return (
    <div>
      {/* Display the current page of models */}
      <ModelTable
        models={pageItems}
        selectedId={selectedId}
        sort={sort}
        onSort={onSort}
        showRank
        tokenScaleId={tokenScaleId}
      />

      {/* Page controls */}
      <nav className="pagination" aria-label="Table pages">
        <span className="pagination-info">
          Showing{" "}
          {models.length === 0 ? 0 : start + 1}
          –
          {start + pageItems.length} of {models.length}
        </span>

        <div className="pagination-controls">
          <button
            type="button"
            className="pagination-btn"
            onClick={prev}
            disabled={currentPage === 1}
            aria-label="Previous page"
          >
            <ChevronLeft className="icon icon-sm" />
          </button>

          <span className="pagination-page">
            Page {currentPage} of {totalPages}
          </span>

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