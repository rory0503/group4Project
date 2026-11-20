import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ModelTable from "../ModelTable";
import {
  T,
  useTranslatedText,
} from "../../context/TranslationContext";

const PAGE_SIZE = 20;

function usePagination(items, pageSize = PAGE_SIZE, resetKey) {
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [resetKey]);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const pageItems = items.slice(start, start + pageSize);

  const next = () => setPage(Math.min(currentPage + 1, totalPages));
  const prev = () => setPage(Math.max(currentPage - 1, 1));
  const goTo = (n) =>
    setPage(Math.min(Math.max(n, 1), totalPages));

  return {
    pageItems,
    currentPage,
    totalPages,
    start,
    next,
    prev,
    goTo,
  };
}

export default function CycleModelTable({
  models,
  selectedId,
  sort,
  onSort,
}) {
  const pinnedModels = useMemo(() => {
    const selected = models.find((m) => m.id === selectedId);

    if (!selected) return models;

    return [
      selected,
      ...models.filter((m) => m.id !== selectedId),
    ];
  }, [models, selectedId]);

  const {
    pageItems,
    currentPage,
    totalPages,
    start,
    next,
    prev,
  } = usePagination(pinnedModels, PAGE_SIZE, selectedId);

  // Translated pagination accessibility labels
  const tablePagesLabel = useTranslatedText("Table pages");
  const previousPageLabel = useTranslatedText("Previous page");
  const nextPageLabel = useTranslatedText("Next page");

  return (
    <div>
      <ModelTable
        models={pageItems}
        selectedId={selectedId}
        sort={sort}
        onSort={onSort}
        showRank
      />

      <nav
        className="pagination"
        aria-label={tablePagesLabel}
      >
        <span className="pagination-info">
          <T>Showing</T>{" "}
          {models.length === 0 ? 0 : start + 1}
          –{start + pageItems.length}{" "}
          <T>of</T> {models.length}
        </span>

        <div className="pagination-controls">
          <button
            type="button"
            className="pagination-btn"
            onClick={prev}
            disabled={currentPage === 1}
            aria-label={previousPageLabel}
          >
            <ChevronLeft className="icon icon-sm" />
          </button>

          <span className="pagination-page">
            <T>Page</T> {currentPage} <T>of</T> {totalPages}
          </span>

          <button
            type="button"
            className="pagination-btn"
            onClick={next}
            disabled={currentPage === totalPages}
            aria-label={nextPageLabel}
          >
            <ChevronRight className="icon icon-sm" />
          </button>
        </div>
      </nav>
    </div>
  );
}
