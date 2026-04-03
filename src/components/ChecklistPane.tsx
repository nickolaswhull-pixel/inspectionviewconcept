import {
  useEffect,
  startTransition,
  useDeferredValue,
  useMemo,
  useRef,
  useState,
} from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useShallow } from "zustand/react/shallow";
import { useChecklistViewModel } from "../selectors/checklist";
import { useInspectionStore } from "../store/inspectionStore";
import { QuestionRow } from "./QuestionRow";

export function ChecklistPane({
  isFullView,
  onToggleFullView,
}: {
  isFullView: boolean;
  onToggleFullView: () => void;
}) {
  const {
    filters,
    categoryOrder,
    categoriesById,
    departmentOptions,
    serviceOptions,
    inlineEditorMode,
    inlineEditorQuestionId,
    inlineEditorCitationId,
    inlineEditorPhotoCount,
    setFilter,
    clearFilters,
  } = useInspectionStore(
    useShallow((state) => ({
      filters: state.filters,
      categoryOrder: state.categoryOrder,
      categoriesById: state.categoriesById,
      departmentOptions: state.departmentOptions,
      serviceOptions: state.serviceOptions,
      inlineEditorMode: state.inlineCitationSession.mode,
      inlineEditorQuestionId: state.inlineCitationSession.questionId,
      inlineEditorCitationId: state.inlineCitationSession.citationId,
      inlineEditorPhotoCount: state.inlineCitationSession.draft?.photos.length ?? 0,
      setFilter: state.setFilter,
      clearFilters: state.clearFilters,
    })),
  );
  const { rows, jumpOptions, visibleQuestionCount } = useChecklistViewModel();
  const parentRef = useRef<HTMLDivElement | null>(null);
  const [searchText, setSearchText] = useState(filters.search);
  const [jumpTarget, setJumpTarget] = useState("");
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [scrollOffset, setScrollOffset] = useState(0);
  const deferredSearch = useDeferredValue(searchText);

  useEffect(() => {
    setSearchText(filters.search);
  }, [filters.search]);

  useEffect(() => {
    if (deferredSearch === filters.search) {
      return;
    }

    startTransition(() => {
      setFilter("search", deferredSearch);
    });
  }, [deferredSearch, filters.search, setFilter]);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => (rows[index]?.kind === "category" ? 42 : 232),
    overscan: 10,
  });

  useEffect(() => {
    rowVirtualizer.measure();
  }, [
    rowVirtualizer,
    rows.length,
    inlineEditorMode,
    inlineEditorQuestionId,
    inlineEditorCitationId,
    inlineEditorPhotoCount,
  ]);

  const virtualItems = rowVirtualizer.getVirtualItems();
  const topVisibleItem =
    virtualItems.find((item) => item.end > scrollOffset + 1) ?? virtualItems[0] ?? null;
  const topVisibleRowIndex = topVisibleItem?.index ?? 0;
  const currentCategoryState = useMemo(() => {
    if (!rows.length) {
      return null;
    }

    let resolvedCategoryIndex = 0;
    let resolvedCategoryRow = rows[0].kind === "category" ? rows[0] : null;

    for (let index = Math.min(topVisibleRowIndex, rows.length - 1); index >= 0; index -= 1) {
      const row = rows[index];
      if (row?.kind === "category") {
        resolvedCategoryIndex = index;
        resolvedCategoryRow = row;
        break;
      }
    }

    if (!resolvedCategoryRow || resolvedCategoryRow.kind !== "category") {
      return null;
    }

    let nextCategoryIndex: number | null = null;
    for (let index = resolvedCategoryIndex + 1; index < rows.length; index += 1) {
      if (rows[index]?.kind === "category") {
        nextCategoryIndex = index;
        break;
      }
    }

    const nextCategoryVirtual = virtualItems.find((item) => item.index === nextCategoryIndex);

    return {
      index: resolvedCategoryIndex,
      row: resolvedCategoryRow,
      label: categoriesById[resolvedCategoryRow.categoryId].label,
    };
  }, [categoriesById, rowVirtualizer, rows, topVisibleRowIndex, virtualItems]);

  const currentCategoryLabel = currentCategoryState?.label ?? "No category selected";

  const extraFilterCount = [
    filters.reviewState !== "all",
    filters.departmentId !== "all",
    filters.serviceId !== "all",
  ].filter(Boolean).length;

  const anyFilterActive =
    filters.search.trim().length > 0 ||
    filters.categoryId !== "all" ||
    filters.citationPresence !== "all" ||
    filters.reviewState !== "all" ||
    filters.departmentId !== "all" ||
    filters.serviceId !== "all";

  function renderCategoryHeader(
    row: Extract<(typeof rows)[number], { kind: "category" }>,
    rowIndex: number,
    options?: { placeholder?: boolean },
  ) {
    const citationLabel = `${row.citationCount} Citation${row.citationCount === 1 ? "" : "s"}`;

    return (
      <div
        data-category-index={rowIndex}
        className={`category-header${options?.placeholder ? " category-header-placeholder" : ""}`}
      >
        <strong>{categoriesById[row.categoryId].label}</strong>
        <div className="category-header-meta">
          <span>{citationLabel}</span>
        </div>
      </div>
    );
  }

  return (
    <section className={`panel checklist-panel${isFullView ? " full-view" : ""}`}>
      <div className="checklist-sticky-shell">
        <div className="checklist-header-row">
          <div className="checklist-title-block">
            <button className="ghost-button" type="button" onClick={onToggleFullView}>
              {isFullView ? "Exit Full View" : "Full View"}
            </button>
          </div>
          <div className="checklist-heading-copy">
            <p className="eyebrow">Checklist Review</p>
            <h2>Deficiency Questions</h2>
          </div>
          <div className="checklist-header-meta">
            <span>{visibleQuestionCount} visible questions</span>
            <span>Current category: {currentCategoryLabel}</span>
          </div>
        </div>

        <div className="filter-rail">
          <label className="toolbar-search compact-search">
            <span className="sr-only">Search questions and citations</span>
            <input
              className="field-input compact"
              type="search"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Search questions or findings"
            />
          </label>

          <select
            className="field-input compact filter-select"
            value={filters.categoryId}
            onChange={(event) =>
              startTransition(() => setFilter("categoryId", event.target.value))
            }
          >
            <option value="all">All categories</option>
            {categoryOrder.map((categoryId) => (
              <option key={categoryId} value={categoryId}>
                {categoriesById[categoryId].label}
              </option>
            ))}
          </select>

          <select
            className="field-input compact filter-select"
            value={filters.citationPresence}
            onChange={(event) =>
              startTransition(() =>
                setFilter("citationPresence", event.target.value as typeof filters.citationPresence),
              )
            }
          >
            <option value="all">All findings</option>
            <option value="with">With citations</option>
            <option value="without">Without citations</option>
          </select>

          <button
            className={`ghost-button filter-button${showMoreFilters ? " active" : ""}`}
            type="button"
            onClick={() => setShowMoreFilters((value) => !value)}
          >
            More Filters{extraFilterCount > 0 ? ` (${extraFilterCount})` : ""}
          </button>

          <select
            className="field-input compact filter-select"
            value={jumpTarget}
            onChange={(event) => {
              const nextTarget = event.target.value;
              setJumpTarget(nextTarget);
              const jump = jumpOptions.find((option) => option.categoryId === nextTarget);
              if (!jump) {
                return;
              }
              rowVirtualizer.scrollToIndex(jump.rowIndex, { align: "start" });
            }}
          >
            <option value="">Jump to category</option>
            {jumpOptions.map((option) => (
              <option key={option.categoryId} value={option.categoryId}>
                {option.label}
              </option>
            ))}
          </select>

          {anyFilterActive && (
            <button className="ghost-button" type="button" onClick={clearFilters}>
              Clear
            </button>
          )}
        </div>

        {showMoreFilters && (
          <div className="filter-popover">
            <div className="filter-popover-grid">
              <div className="field-group">
                <label className="field-label" htmlFor="review-filter">
                  Review State
                </label>
                <select
                  id="review-filter"
                  className="field-input compact"
                  value={filters.reviewState}
                  onChange={(event) =>
                    startTransition(() =>
                      setFilter("reviewState", event.target.value as typeof filters.reviewState),
                    )
                  }
                >
                  <option value="all">All review states</option>
                  <option value="new">New</option>
                  <option value="adjusted">Adjusted</option>
                  <option value="reviewed">Reviewed</option>
                </select>
              </div>

              <div className="field-group">
                <label className="field-label" htmlFor="department-filter">
                  Department
                </label>
                <select
                  id="department-filter"
                  className="field-input compact"
                  value={filters.departmentId}
                  onChange={(event) =>
                    startTransition(() => setFilter("departmentId", event.target.value))
                  }
                >
                  <option value="all">All departments</option>
                  {departmentOptions.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field-group">
                <label className="field-label" htmlFor="service-filter">
                  Responsible Service
                </label>
                <select
                  id="service-filter"
                  className="field-input compact"
                  value={filters.serviceId}
                  onChange={(event) =>
                    startTransition(() => setFilter("serviceId", event.target.value))
                  }
                >
                  <option value="all">All services</option>
                  {serviceOptions.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      <div
        ref={parentRef}
        className="checklist-scroll-region"
        onScroll={(event) => setScrollOffset(event.currentTarget.scrollTop)}
      >
        {rows.length === 0 && (
          <div className="empty-state-panel">
            <h3>No questions match the current filters.</h3>
            <p>Clear one or more filters to bring the checklist back into view.</p>
          </div>
        )}

        {rows.length > 0 && (
          <div
            className="virtualizer-canvas"
            style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
          >
            {virtualItems.map((virtualRow) => {
              const row = rows[virtualRow.index];
              return (
                <div
                  key={virtualRow.key}
                  ref={rowVirtualizer.measureElement}
                  data-index={virtualRow.index}
                  className={`virtual-row ${row.kind}${
                    row.kind === "question" && inlineEditorQuestionId === row.questionId ? " active-row" : ""
                  }`}
                  style={{ transform: `translateY(${virtualRow.start}px)` }}
                >
                  {row.kind === "category" ? (
                    renderCategoryHeader(row, virtualRow.index, {
                      placeholder: false,
                    })
                  ) : (
                    <QuestionRow
                      questionId={row.questionId}
                      visibleCitationIds={row.visibleCitationIds}
                      hasAnyCitation={row.hasAnyCitation}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
