import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ModelTable from "../ModelTable";

// How many models to show on each page
const PAGE_SIZE = 20;

// Handles the page logic: which page we're on and which models to show
function usePagination(items, pageSize = PAGE_SIZE) {
  const [page, setPage] = useState(1); // pages start at 1

  // Total number of pages (always at least 1)
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  // Keep the page in range, e.g. if the list gets shorter after filtering
  const currentPage = Math.min(page, totalPages);

  // Page 1 = items.slice(0, 20), page 2 = items.slice(20, 40), and so on
  const start = (currentPage - 1) * pageSize;
  const pageItems = items.slice(start, start + pageSize);

  // Cycle functions
  const next = () => setPage(Math.min(currentPage + 1, totalPages));
  const prev = () => setPage(Math.max(currentPage - 1, 1));
  const goTo = (n) => setPage(Math.min(Math.max(n, 1), totalPages));

  return { pageItems, currentPage, totalPages, start, next, prev, goTo };
}

export default function CycleModelTable({ models, selectedId, sort, onSort }) {
  const { pageItems, currentPage, totalPages, start, next, prev } = usePagination(models);

  return (
    <div>
      {/* Only the 20 models for the current page go into the table */}
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