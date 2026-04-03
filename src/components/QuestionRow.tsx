import { ChangeEvent, memo, useEffect, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useInspectionStore } from "../store/inspectionStore";

type QuestionRowProps = {
  questionId: string;
  visibleCitationIds: string[];
  hasAnyCitation: boolean;
};

function createId(prefix: string) {
  return globalThis.crypto?.randomUUID?.() ?? `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function formatFileSize(size: number) {
  if (size > 1_000_000) return `${(size / 1_000_000).toFixed(1)} MB`;
  if (size > 1_000) return `${(size / 1_000).toFixed(0)} KB`;
  return `${size} B`;
}

function findLabel(options: Array<{ id: string; label: string }>, id: string) {
  return options.find((option) => option.id === id)?.label ?? "Not set";
}

function formatCreatedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M9 3h6l1 2h4v2H4V5h4l1-2Zm1 7h2v8h-2v-8Zm4 0h2v8h-2v-8ZM7 10h2v8H7v-8Zm-1 10h12l1-13H5l1 13Z"
        fill="currentColor"
      />
    </svg>
  );
}

const CitationInlineCard = memo(function CitationInlineCard({
  citationId,
  questionId,
  mode,
}: {
  citationId?: string;
  questionId: string;
  mode: "create" | "edit";
}) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const actionMenuRef = useRef<HTMLDivElement | null>(null);
  const {
    citation,
    questionPrompt,
    draft,
    isActive,
    canModify,
    canReview,
    departmentLabel,
    serviceLabel,
    inspectorLabel,
    locationOptions,
    departmentOptions,
    serviceOptions,
    startEditingCitation,
    updateCitationDraft,
    appendCitationDraftPhotos,
    removeCitationDraftPhoto,
    cancelCitationEditing,
    saveCitation,
    removeCitation,
    markCitationReviewed,
  } = useInspectionStore(
    useShallow((state) => {
      const inlineSession = state.inlineCitationSession;
      const nextCitation = citationId ? state.citationsById[citationId] : undefined;
      const activeForCard =
        mode === "create"
          ? inlineSession.mode === "create" && inlineSession.questionId === questionId
          : inlineSession.mode === "edit" && inlineSession.citationId === citationId;
      const activeDraft = activeForCard ? inlineSession.draft : null;
      const currentDepartmentId = activeDraft?.departmentId ?? nextCitation?.departmentId ?? "";
      const currentServiceId =
        activeDraft?.responsibleServiceId ?? nextCitation?.responsibleServiceId ?? "";
      const currentInspectorId = nextCitation?.submittedByInspectorId ?? "";

      return {
        citation: nextCitation,
        questionPrompt: state.questionsById[questionId]?.prompt ?? "",
        draft: activeDraft,
        isActive: activeForCard,
        canModify: state.status !== "completed",
        canReview: state.status === "coordinatorReview",
        departmentLabel: findLabel(state.departmentOptions, currentDepartmentId),
        serviceLabel: findLabel(state.serviceOptions, currentServiceId),
        inspectorLabel: findLabel(state.inspectorOptions, currentInspectorId),
        locationOptions: state.locationOptions,
        departmentOptions: state.departmentOptions,
        serviceOptions: state.serviceOptions,
        startEditingCitation: state.startEditingCitation,
        updateCitationDraft: state.updateCitationDraft,
        appendCitationDraftPhotos: state.appendCitationDraftPhotos,
        removeCitationDraftPhoto: state.removeCitationDraftPhoto,
        cancelCitationEditing: state.cancelCitationEditing,
        saveCitation: state.saveCitation,
        removeCitation: state.removeCitation,
        markCitationReviewed: state.markCitationReviewed,
      };
    }),
  );

  if (mode === "edit" && !citation) {
    return null;
  }

  const currentLocation = draft?.location ?? citation?.location ?? "";
  const currentDepartmentId = draft?.departmentId ?? citation?.departmentId ?? "";
  const currentServiceId = draft?.responsibleServiceId ?? citation?.responsibleServiceId ?? "";
  const currentNotes = draft?.notes ?? citation?.notes ?? "";
  const currentPhotos = draft?.photos ?? citation?.photos ?? [];
  const leadPhoto = currentPhotos[0];
  const photoCount = currentPhotos.length;
  const canSave =
    canModify &&
    draft !== null &&
    draft.location.trim().length > 0 &&
    draft.departmentId.length > 0 &&
    draft.responsibleServiceId.length > 0;
  const reviewState = citation?.reviewState ?? "neutral";
  const notesPreview = citation?.notes.trim() ?? "";
  const createdAtLabel = citation ? formatCreatedAt(citation.createdAt) : "Unsaved citation";
  const topActionLabel = isActive ? null : canModify ? "Edit" : "View";
  const showReviewBadge = citation?.reviewState === "adjusted" || citation?.reviewState === "reviewed";
  const currentPhoto = currentPhotos[viewerIndex] ?? currentPhotos[0];

  useEffect(() => {
    if (!showActionMenu) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!actionMenuRef.current?.contains(event.target as Node)) {
        setShowActionMenu(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [showActionMenu]);

  function handlePhotoSelection(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) {
      return;
    }

    appendCitationDraftPhotos(
      files.map((file) => ({
        id: createId("photo"),
        name: file.name,
        previewUrl: URL.createObjectURL(file),
        sizeLabel: formatFileSize(file.size),
      })),
    );
    event.target.value = "";
  }

  function openPhotoViewer(index = 0) {
    if (!currentPhotos.length) {
      return;
    }

    setViewerIndex(index);
    setViewerOpen(true);
  }

  function showNextPhoto(step: number) {
    setViewerIndex((current) => {
      const next = current + step;
      if (next < 0) {
        return currentPhotos.length - 1;
      }
      if (next >= currentPhotos.length) {
        return 0;
      }
      return next;
    });
  }

  return (
    <>
      <article className={`citation-card${isActive ? " active" : ""}${mode === "create" ? " draft" : ""}`}>
        <div className="citation-card-shell">
          <div className="citation-card-media">
            {leadPhoto ? (
              <button
                className="citation-photo-button"
                type="button"
                onClick={() => openPhotoViewer(0)}
                aria-label={`Open photo viewer for ${photoCount} attached photo${photoCount === 1 ? "" : "s"}`}
              >
                {leadPhoto.previewUrl ? (
                  <img src={leadPhoto.previewUrl} alt={leadPhoto.name} />
                ) : (
                  <div className="citation-photo-fallback">Seeded photo</div>
                )}
                <span className="citation-photo-count-badge">{photoCount}</span>
              </button>
            ) : (
              <div className="citation-photo-fallback empty">No photo</div>
            )}
          </div>

          <div className="citation-card-main">
            <div className="citation-card-topline">
              <div className="citation-card-labels">
                <strong>{citation ? `Submitted by ${inspectorLabel}` : "New Citation"}</strong>
                {showReviewBadge && (
                  <span className={`status-badge ${reviewState}`}>{citation?.reviewState}</span>
                )}
              </div>

              <div className="citation-card-actions">
                {topActionLabel && citation && (
                  <button
                    className="mini-button"
                    type="button"
                    onClick={() => {
                      setShowActionMenu(false);
                      startEditingCitation(citation.id);
                    }}
                  >
                    {topActionLabel}
                  </button>
                )}

                {citation && (
                  <div ref={actionMenuRef} className="citation-action-menu-shell">
                    <button
                      className="mini-button icon-button"
                      type="button"
                      aria-haspopup="menu"
                      aria-expanded={showActionMenu}
                      aria-label="Open citation actions"
                      onClick={() => setShowActionMenu((value) => !value)}
                    >
                      ⚙
                    </button>

                    {showActionMenu && (
                      <div className="citation-action-menu" role="menu">
                        <button
                          className="citation-action-item"
                          type="button"
                          role="menuitem"
                          onClick={() => setShowActionMenu(false)}
                        >
                          Add Work Order
                        </button>
                        <button
                          className="citation-action-item"
                          type="button"
                          role="menuitem"
                          onClick={() => setShowActionMenu(false)}
                        >
                          Add Action Plan
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {citation && canModify && (
                  <button
                    className="mini-button icon-button danger-icon-button"
                    type="button"
                    aria-label="Remove citation"
                    onClick={() => {
                      setShowActionMenu(false);
                      removeCitation(citation.id);
                    }}
                  >
                    <TrashIcon />
                  </button>
                )}
              </div>
            </div>

            <div className="citation-card-meta">
              {citation ? <span>{createdAtLabel}</span> : <span>Question: {questionPrompt}</span>}
            </div>

            {isActive ? (
              <>
                <div className="citation-inline-fields">
                  <div className="field-group">
                    <label className="field-label" htmlFor={`citation-location-${citation?.id ?? questionId}`}>
                      Location
                    </label>
                    <select
                      id={`citation-location-${citation?.id ?? questionId}`}
                      className="field-input compact"
                      value={currentLocation}
                      onChange={(event) => updateCitationDraft({ location: event.target.value })}
                      disabled={!canModify}
                    >
                      <option value="">Select location</option>
                      {locationOptions.map((location) => (
                        <option key={location.id} value={location.label}>
                          {location.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="field-group">
                    <label className="field-label" htmlFor={`citation-department-${citation?.id ?? questionId}`}>
                      Department
                    </label>
                    <select
                      id={`citation-department-${citation?.id ?? questionId}`}
                      className="field-input compact"
                      value={currentDepartmentId}
                      onChange={(event) => updateCitationDraft({ departmentId: event.target.value })}
                      disabled={!canModify}
                    >
                      <option value="">Select department</option>
                      {departmentOptions.map((department) => (
                        <option key={department.id} value={department.id}>
                          {department.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="field-group">
                    <label className="field-label" htmlFor={`citation-service-${citation?.id ?? questionId}`}>
                      Responsible Service
                    </label>
                    <select
                      id={`citation-service-${citation?.id ?? questionId}`}
                      className="field-input compact"
                      value={currentServiceId}
                      onChange={(event) =>
                        updateCitationDraft({ responsibleServiceId: event.target.value })
                      }
                      disabled={!canModify}
                    >
                      <option value="">Select service</option>
                      {serviceOptions.map((service) => (
                        <option key={service.id} value={service.id}>
                          {service.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="field-group">
                  <label className="field-label" htmlFor={`citation-notes-${citation?.id ?? questionId}`}>
                    Notes
                  </label>
                  <textarea
                    id={`citation-notes-${citation?.id ?? questionId}`}
                    className="field-input notes-area compact"
                    value={currentNotes}
                    onChange={(event) => updateCitationDraft({ notes: event.target.value })}
                    disabled={!canModify}
                  />
                </div>

                <div className="field-group">
                  <div className="section-heading">
                    <h4>Photos</h4>
                    {canModify && (
                      <label className="upload-button">
                        <input type="file" accept="image/*" multiple onChange={handlePhotoSelection} />
                        Add Photos
                      </label>
                    )}
                  </div>

                  <div className="citation-photo-grid">
                    {currentPhotos.length === 0 && (
                      <div className="photo-placeholder">No photos attached to this citation yet.</div>
                    )}
                    {currentPhotos.map((photo, index) => (
                      <article key={photo.id} className="photo-card compact">
                        <button
                          className="citation-gallery-button"
                          type="button"
                          onClick={() => openPhotoViewer(index)}
                        >
                          {photo.previewUrl ? (
                            <img src={photo.previewUrl} alt={photo.name} />
                          ) : (
                            <div className="photo-fallback">Seeded photo</div>
                          )}
                        </button>
                        <div className="photo-meta">
                          <strong>{photo.name}</strong>
                          <span>{photo.sizeLabel}</span>
                        </div>
                        {canModify && (
                          <button
                            className="mini-button danger"
                            type="button"
                            onClick={() => removeCitationDraftPhoto(photo.id)}
                          >
                            Remove
                          </button>
                        )}
                      </article>
                    ))}
                  </div>
                </div>

                <div className="citation-editor-actions">
                  <button className="ghost-button" type="button" onClick={cancelCitationEditing}>
                    {canModify ? "Cancel" : "Close"}
                  </button>

                  {citation && canReview && citation.reviewState === "new" && (
                    <button
                      className="mini-button success"
                      type="button"
                      onClick={() => {
                        if (draft) {
                          saveCitation(draft);
                        }
                        markCitationReviewed(citation.id);
                      }}
                    >
                      {canModify ? "Save & Review" : "Review"}
                    </button>
                  )}

                  {canModify && draft && (
                    <button
                      className="action-button primary"
                      type="button"
                      disabled={!canSave}
                      onClick={() => saveCitation(draft)}
                    >
                      {citation ? "Save Changes" : "Create Citation"}
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="citation-summary-grid">
                  <div className="citation-summary-field">
                    <span className="summary-label">Location</span>
                    <strong>{citation?.location || "Not set"}</strong>
                  </div>
                  <div className="citation-summary-field">
                    <span className="summary-label">Department</span>
                    <strong>{departmentLabel}</strong>
                  </div>
                  <div className="citation-summary-field">
                    <span className="summary-label">Service</span>
                    <strong>{serviceLabel}</strong>
                  </div>
                </div>
                {notesPreview && <p className="citation-card-notes">{notesPreview}</p>}
              </>
            )}
          </div>
        </div>
      </article>

      {viewerOpen && currentPhoto && (
        <div className="modal-shell" role="dialog" aria-modal="true" aria-labelledby={`photo-viewer-${questionId}`}>
          <button className="modal-backdrop" type="button" onClick={() => setViewerOpen(false)} aria-label="Close photo viewer" />
          <section className="modal-panel photo-viewer-panel">
            <div className="modal-header">
              <div>
                <p className="eyebrow">Citation Photo</p>
                <h2 id={`photo-viewer-${questionId}`}>{currentPhoto.name}</h2>
              </div>
              <button className="ghost-button" type="button" onClick={() => setViewerOpen(false)}>
                Close
              </button>
            </div>

            <div className="modal-content photo-viewer-content">
              <div className="photo-viewer-stage">
                {currentPhoto.previewUrl ? (
                  <img src={currentPhoto.previewUrl} alt={currentPhoto.name} />
                ) : (
                  <div className="photo-viewer-fallback">Seeded photo preview</div>
                )}
              </div>

              <div className="photo-viewer-toolbar">
                <span className="muted-meta">
                  Photo {viewerIndex + 1} of {currentPhotos.length}
                </span>
                {currentPhotos.length > 1 && (
                  <div className="photo-viewer-nav">
                    <button className="mini-button" type="button" onClick={() => showNextPhoto(-1)}>
                      Previous
                    </button>
                    <button className="mini-button" type="button" onClick={() => showNextPhoto(1)}>
                      Next
                    </button>
                  </div>
                )}
              </div>

              {currentPhotos.length > 1 && (
                <div className="photo-viewer-strip">
                  {currentPhotos.map((photo, index) => (
                    <button
                      key={photo.id}
                      className={`photo-viewer-thumb${viewerIndex === index ? " active" : ""}`}
                      type="button"
                      onClick={() => setViewerIndex(index)}
                    >
                      {photo.previewUrl ? (
                        <img src={photo.previewUrl} alt={photo.name} />
                      ) : (
                        <div className="photo-fallback">Seeded</div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
});

export const QuestionRow = memo(function QuestionRow({
  questionId,
  visibleCitationIds,
  hasAnyCitation,
}: QuestionRowProps) {
  const {
    question,
    totalCitationCount,
    newCount,
    adjustedCount,
    reviewedCount,
    canAddCitation,
    isActiveQuestion,
    isCreatingHere,
    startCreatingCitation,
  } = useInspectionStore(
    useShallow((state) => {
      const nextQuestion = state.questionsById[questionId];
      const allCitationIds = state.citationIdsByQuestionId[questionId] ?? [];
      let newCountValue = 0;
      let adjustedCountValue = 0;
      let reviewedCountValue = 0;

      allCitationIds.forEach((citationId) => {
        const citation = state.citationsById[citationId];
        if (!citation) {
          return;
        }
        if (citation.reviewState === "new") newCountValue += 1;
        if (citation.reviewState === "adjusted") adjustedCountValue += 1;
        if (citation.reviewState === "reviewed") reviewedCountValue += 1;
      });

      return {
        question: nextQuestion,
        totalCitationCount: allCitationIds.length,
        newCount: newCountValue,
        adjustedCount: adjustedCountValue,
        reviewedCount: reviewedCountValue,
        canAddCitation: state.status !== "completed",
        isActiveQuestion:
          state.inlineCitationSession.mode !== "idle" &&
          state.inlineCitationSession.questionId === questionId,
        isCreatingHere:
          state.inlineCitationSession.mode === "create" &&
          state.inlineCitationSession.questionId === questionId,
        startCreatingCitation: state.startCreatingCitation,
      };
    }),
  );

  if (!question) {
    return null;
  }

  const showCitationList = visibleCitationIds.length > 0 || isCreatingHere;

  return (
    <article
      className={`question-row${totalCitationCount > 0 || isCreatingHere ? " has-citations" : ""}${
        isActiveQuestion ? " editing" : ""
      }`}
    >
      <div className="question-row-header">
        <div className="question-identifiers">
          <span className="code-chip">{question.code}</span>
          <span className="muted-meta">{totalCitationCount} findings</span>
        </div>

        <div className="question-row-actions">
          {newCount > 0 && <span className="status-badge new">{newCount} new</span>}
          {adjustedCount > 0 && <span className="status-badge adjusted">{adjustedCount} adjusted</span>}
          {reviewedCount > 0 && <span className="status-badge reviewed">{reviewedCount} reviewed</span>}
          <button
            className="mini-button"
            type="button"
            onClick={() => startCreatingCitation(question.id)}
            disabled={!canAddCitation}
          >
            Add Citation
          </button>
        </div>
      </div>

      <div className="question-copy">
        <h3>{question.prompt}</h3>
        <p>{question.guidance}</p>
      </div>

      {showCitationList && (
        <div className="citation-list">
          {isCreatingHere && (
            <CitationInlineCard
              key={`${question.id}-draft`}
              questionId={question.id}
              mode="create"
            />
          )}

          {visibleCitationIds.map((citationId) => (
            <CitationInlineCard
              key={citationId}
              citationId={citationId}
              questionId={question.id}
              mode="edit"
            />
          ))}
        </div>
      )}

      {!isCreatingHere && visibleCitationIds.length === 0 && hasAnyCitation && (
        <div className="row-empty-state">Findings exist for this question, but the current filters hide them.</div>
      )}

      {!isCreatingHere && visibleCitationIds.length === 0 && !hasAnyCitation && (
        <div className="row-empty-state">No citations have been logged for this question yet.</div>
      )}
    </article>
  );
});
