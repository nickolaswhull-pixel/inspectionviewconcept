import { useLayoutEffect, useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import { getDraftIssues, useInspectionStore } from "../store/inspectionStore";
import { useReviewSummary } from "../selectors/checklist";

const STATUS_LABELS = {
  draft: "Draft",
  launched: "Launched",
  coordinatorReview: "In Review",
  completed: "Completed",
} as const;

function findLabel(options: Array<{ id: string; label: string }>, id: string) {
  return options.find((option) => option.id === id)?.label ?? "Not set";
}

export function WorkflowBar() {
  const barRef = useRef<HTMLElement | null>(null);
  const { status, details, buildingOptions, templateOptions, launchInspection, beginReview, completeInspection } =
    useInspectionStore(
      useShallow((state) => ({
        status: state.status,
        details: state.details,
        buildingOptions: state.buildingOptions,
        templateOptions: state.templateOptions,
        launchInspection: state.launchInspection,
        beginReview: state.beginReview,
        completeInspection: state.completeInspection,
      })),
    );
  const summary = useReviewSummary();
  const draftIssues = getDraftIssues(details);
  const canLaunch = draftIssues.length === 0;
  const canComplete = status === "coordinatorReview" && summary.remainingReviewCount === 0;
  const buildingLabel = findLabel(buildingOptions, details.buildingId);
  const locationLabel = details.location.trim() || "Not set";
  const templateLabel = findLabel(templateOptions, details.templateId);

  useLayoutEffect(() => {
    const element = barRef.current;
    if (!element) {
      return;
    }

    const root = document.documentElement;
    const updateHeight = () => {
      root.style.setProperty("--status-strip-height", `${element.offsetHeight}px`);
    };

    updateHeight();

    const observer = new ResizeObserver(() => {
      updateHeight();
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <header ref={barRef} className="status-strip">
      <div className="status-strip-main">
        <div className="status-strip-copy">
          <div className="status-heading-row">
            <div className="status-heading-copy">
              <h1>
                {buildingLabel} - {locationLabel} ({templateLabel})
              </h1>
              <span className={`status-chip ${status}`}>{STATUS_LABELS[status]}</span>
            </div>

            <div className="status-primary-action">
              {status === "draft" && (
                <button
                  className="action-button primary"
                  type="button"
                  onClick={launchInspection}
                  disabled={!canLaunch}
                >
                  Launch Inspection
                </button>
              )}

              {status === "launched" && (
                <button className="action-button primary" type="button" onClick={beginReview}>
                  Begin Review
                </button>
              )}

              {status === "coordinatorReview" && (
                <button
                  className="action-button primary"
                  type="button"
                  onClick={completeInspection}
                  disabled={!canComplete}
                >
                  Complete Inspection
                </button>
              )}

              {status === "completed" && (
                <button className="action-button subdued" type="button" disabled>
                  Inspection Complete
                </button>
              )}
            </div>
          </div>

          {status === "draft" && draftIssues.length > 0 && (
            <p className="status-inline-alert">
              {draftIssues.length} setup item{draftIssues.length === 1 ? "" : "s"} still need attention before launch:{" "}
              {draftIssues.join(", ")}.
            </p>
          )}
          {status === "coordinatorReview" && !canComplete && (
            <p className="status-inline-alert">
              Review all remaining new citations before completing the inspection.
            </p>
          )}
        </div>

        <div className="status-strip-side">
          <div className="status-metrics">
            <article className="status-metric">
              <span className="summary-label">Citations</span>
              <strong>{summary.totalCitations}</strong>
            </article>
            <article className="status-metric">
              <span className="summary-label">Open Requests</span>
              <strong>-</strong>
            </article>
            <article className="status-metric">
              <span className="summary-label">Closed Requests</span>
              <strong>-</strong>
            </article>
          </div>
        </div>
      </div>
    </header>
  );
}
