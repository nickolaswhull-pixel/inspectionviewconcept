import { useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { getDraftIssues, useInspectionStore } from "../store/inspectionStore";
import { InspectionDetails, OptionItem } from "../types";

type SetupDialogKind = "site" | "scope" | "team" | "notes" | null;

function copyDetails(details: InspectionDetails): InspectionDetails {
  return {
    ...details,
    departmentIds: [...details.departmentIds],
    inspectorIds: [...details.inspectorIds],
  };
}

function findLabel(options: OptionItem[], id: string) {
  return options.find((option) => option.id === id)?.label ?? "Not set";
}

function selectedLabels(ids: string[], options: OptionItem[]) {
  return ids
    .map((id) => options.find((option) => option.id === id)?.label)
    .filter((label): label is string => Boolean(label));
}

function toggleSelection(collection: string[], id: string) {
  return collection.includes(id)
    ? collection.filter((item) => item !== id)
    : [...collection, id];
}

function SetupDialog({
  kind,
  draft,
  readOnly,
  buildingOptions,
  locationOptions,
  departmentOptions,
  inspectorOptions,
  templateOptions,
  departmentSearch,
  inspectorSearch,
  setDepartmentSearch,
  setInspectorSearch,
  onChange,
  onClose,
  onSave,
}: {
  kind: Exclude<SetupDialogKind, null>;
  draft: InspectionDetails;
  readOnly: boolean;
  buildingOptions: OptionItem[];
  locationOptions: OptionItem[];
  departmentOptions: OptionItem[];
  inspectorOptions: Array<OptionItem & { shift?: string }>;
  templateOptions: OptionItem[];
  departmentSearch: string;
  inspectorSearch: string;
  setDepartmentSearch: (value: string) => void;
  setInspectorSearch: (value: string) => void;
  onChange: (details: InspectionDetails) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const filteredDepartments = departmentOptions.filter((option) =>
    option.label.toLowerCase().includes(departmentSearch.trim().toLowerCase()),
  );
  const filteredInspectors = inspectorOptions.filter((option) =>
    option.label.toLowerCase().includes(inspectorSearch.trim().toLowerCase()),
  );
  const titles = {
    site: "Edit site details",
    scope: "Edit inspection scope",
    team: "Edit assigned inspectors",
    notes: "Edit inspection notes",
  } as const;

  return (
    <div className="modal-shell" role="dialog" aria-modal="true" aria-labelledby="setup-dialog-title">
      <button className="modal-backdrop" type="button" onClick={onClose} aria-label="Close dialog" />
      <section className="modal-panel">
        <div className="modal-header">
          <div>
            <p className="eyebrow">Inspection Setup</p>
            <h2 id="setup-dialog-title">{titles[kind]}</h2>
          </div>
          <button className="ghost-button" type="button" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="modal-content">
          {kind === "site" && (
            <>
              <div className="field-group">
                <label className="field-label" htmlFor="dialog-building">
                  Building
                </label>
                <select
                  id="dialog-building"
                  className="field-input"
                  value={draft.buildingId}
                  onChange={(event) => onChange({ ...draft, buildingId: event.target.value })}
                  disabled={readOnly}
                >
                  <option value="">Select building</option>
                  {buildingOptions.map((building) => (
                    <option key={building.id} value={building.id}>
                      {building.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field-group">
                <label className="field-label" htmlFor="dialog-location">
                  Location
                </label>
                <select
                  id="dialog-location"
                  className="field-input"
                  value={draft.location}
                  onChange={(event) => onChange({ ...draft, location: event.target.value })}
                  disabled={readOnly}
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
                <label className="field-label" htmlFor="dialog-date">
                  Inspection Date
                </label>
                <input
                  id="dialog-date"
                  className="field-input"
                  type="date"
                  value={draft.inspectionDate}
                  onChange={(event) => onChange({ ...draft, inspectionDate: event.target.value })}
                  disabled={readOnly}
                />
              </div>
            </>
          )}

          {kind === "scope" && (
            <>
              <div className="field-group">
                <label className="field-label" htmlFor="dialog-template">
                  Template
                </label>
                <select
                  id="dialog-template"
                  className="field-input"
                  value={draft.templateId}
                  onChange={(event) => onChange({ ...draft, templateId: event.target.value })}
                  disabled={readOnly}
                >
                  <option value="">Select template</option>
                  {templateOptions.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field-group">
                <label className="field-label" htmlFor="dialog-department-search">
                  Departments
                </label>
                <input
                  id="dialog-department-search"
                  className="field-input"
                  type="search"
                  value={departmentSearch}
                  onChange={(event) => setDepartmentSearch(event.target.value)}
                  placeholder="Search departments"
                  disabled={readOnly}
                />
              </div>

              <div className="modal-selection-list">
                {filteredDepartments.map((department) => {
                  const checked = draft.departmentIds.includes(department.id);
                  return (
                    <label
                      key={department.id}
                      className={`choice-row${checked ? " checked" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          onChange({
                            ...draft,
                            departmentIds: toggleSelection(draft.departmentIds, department.id),
                          })
                        }
                        disabled={readOnly}
                      />
                      <span>{department.label}</span>
                    </label>
                  );
                })}
              </div>
            </>
          )}

          {kind === "team" && (
            <>
              <div className="field-group">
                <label className="field-label" htmlFor="dialog-inspector-search">
                  Inspectors
                </label>
                <input
                  id="dialog-inspector-search"
                  className="field-input"
                  type="search"
                  value={inspectorSearch}
                  onChange={(event) => setInspectorSearch(event.target.value)}
                  placeholder="Search inspectors"
                  disabled={readOnly}
                />
              </div>

              <div className="modal-selection-list">
                {filteredInspectors.map((inspector) => {
                  const checked = draft.inspectorIds.includes(inspector.id);
                  return (
                    <label
                      key={inspector.id}
                      className={`choice-row${checked ? " checked" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          onChange({
                            ...draft,
                            inspectorIds: toggleSelection(draft.inspectorIds, inspector.id),
                          })
                        }
                        disabled={readOnly}
                      />
                      <span>
                        {inspector.label}
                        {"shift" in inspector && inspector.shift ? ` - ${inspector.shift}` : ""}
                      </span>
                    </label>
                  );
                })}
              </div>
            </>
          )}

          {kind === "notes" && (
            <div className="field-group">
              <label className="field-label" htmlFor="dialog-notes">
                Notes
              </label>
              <textarea
                id="dialog-notes"
                className="field-input notes-area"
                value={draft.notes}
                onChange={(event) => onChange({ ...draft, notes: event.target.value })}
                disabled={readOnly}
              />
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button className="ghost-button" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="action-button primary" type="button" onClick={onSave} disabled={readOnly}>
            Save Changes
          </button>
        </div>
      </section>
    </div>
  );
}

export function SetupSummaryBand() {
  const {
    status,
    details,
    buildingOptions,
    locationOptions,
    departmentOptions,
    inspectorOptions,
    templateOptions,
    resetDataset,
    updateDetail,
  } = useInspectionStore(
    useShallow((state) => ({
      status: state.status,
      details: state.details,
      buildingOptions: state.buildingOptions,
      locationOptions: state.locationOptions,
      departmentOptions: state.departmentOptions,
      inspectorOptions: state.inspectorOptions,
      templateOptions: state.templateOptions,
      resetDataset: state.resetDataset,
      updateDetail: state.updateDetail,
    })),
  );
  const [dialogKind, setDialogKind] = useState<SetupDialogKind>(null);
  const [dialogDraft, setDialogDraft] = useState<InspectionDetails | null>(null);
  const [departmentSearch, setDepartmentSearch] = useState("");
  const [inspectorSearch, setInspectorSearch] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);

  const draftIssues = useMemo(() => new Set(getDraftIssues(details)), [details]);
  const readOnly = status === "completed";
  const buildingLabel = findLabel(buildingOptions, details.buildingId);
  const templateLabel = findLabel(templateOptions, details.templateId);
  const departmentLabels = selectedLabels(details.departmentIds, departmentOptions);
  const inspectorLabels = selectedLabels(details.inspectorIds, inspectorOptions);
  const collapsedSummary = [buildingLabel, details.location || "Location not set", templateLabel]
    .filter(Boolean)
    .join(" - ");

  function openDialog(kind: Exclude<SetupDialogKind, null>) {
    setDialogKind(kind);
    setDialogDraft(copyDetails(details));
    setDepartmentSearch("");
    setInspectorSearch("");
  }

  function closeDialog() {
    setDialogKind(null);
    setDialogDraft(null);
    setDepartmentSearch("");
    setInspectorSearch("");
  }

  function saveDialog() {
    if (!dialogDraft) {
      return;
    }

    updateDetail("buildingId", dialogDraft.buildingId);
    updateDetail("location", dialogDraft.location);
    updateDetail("inspectionDate", dialogDraft.inspectionDate);
    updateDetail("templateId", dialogDraft.templateId);
    updateDetail("departmentIds", dialogDraft.departmentIds);
    updateDetail("inspectorIds", dialogDraft.inspectorIds);
    updateDetail("notes", dialogDraft.notes);
    closeDialog();
  }

  return (
    <>
      <section className={`panel setup-summary-band${isCollapsed ? " collapsed" : ""}`}>
        <div className="setup-summary-header">
          <div>
            <h2>Inspection Details</h2>
          </div>

          <div className="setup-utility-cluster">
            <button
              className="ghost-button"
              type="button"
              onClick={() => setIsCollapsed((value) => !value)}
            >
              {isCollapsed ? "Expand" : "Collapse"}
            </button>
            <button className="ghost-button" type="button" onClick={resetDataset}>
              Reset Demo
            </button>
          </div>
        </div>

        {isCollapsed ? (
          <div className="setup-summary-collapsed">
            <p className="setup-collapsed-copy">{collapsedSummary}</p>
            <div className="setup-collapsed-meta">
              <span>{details.inspectionDate || "Date not set"}</span>
              <span>{departmentLabels.length} department{departmentLabels.length === 1 ? "" : "s"}</span>
              <span>{inspectorLabels.length} inspector{inspectorLabels.length === 1 ? "" : "s"}</span>
            </div>
          </div>
        ) : (
          <div className="setup-summary-grid">
            <article
              className={`setup-summary-card${
                draftIssues.has("building") || draftIssues.has("location") || draftIssues.has("inspection date")
                  ? " attention"
                  : ""
              }`}
            >
              <div className="setup-card-topline">
                <div>
                  <p className="setup-card-label">Site</p>
                  <h3>Building, location, and date</h3>
                </div>
                <button className="mini-button" type="button" onClick={() => openDialog("site")} disabled={readOnly}>
                  Edit
                </button>
              </div>
              <dl className="setup-card-values">
                <div>
                  <dt>Building</dt>
                  <dd>{buildingLabel}</dd>
                </div>
                <div>
                  <dt>Location</dt>
                  <dd>{details.location || "Not set"}</dd>
                </div>
                <div>
                  <dt>Date</dt>
                  <dd>{details.inspectionDate || "Not set"}</dd>
                </div>
              </dl>
            </article>

            <article
              className={`setup-summary-card${
                draftIssues.has("template") || draftIssues.has("department selection") ? " attention" : ""
              }`}
            >
              <div className="setup-card-topline">
                <div>
                  <p className="setup-card-label">Scope</p>
                  <h3>Template and departments</h3>
                </div>
                <button className="mini-button" type="button" onClick={() => openDialog("scope")} disabled={readOnly}>
                  Edit
                </button>
              </div>
              <dl className="setup-card-values">
                <div>
                  <dt>Template</dt>
                  <dd>{templateLabel}</dd>
                </div>
                <div>
                  <dt>Departments</dt>
                  <dd>
                    {departmentLabels.length > 0 ? (
                      <span className="summary-chip-list">
                        {departmentLabels.map((label) => (
                          <span key={label} className="summary-chip">
                            {label}
                          </span>
                        ))}
                      </span>
                    ) : (
                      "None selected"
                    )}
                  </dd>
                </div>
              </dl>
            </article>

            <article
              className={`setup-summary-card${
                draftIssues.has("inspector assignment") ? " attention" : ""
              }`}
            >
              <div className="setup-card-topline">
                <div>
                  <p className="setup-card-label">Team</p>
                  <h3>Assigned inspectors</h3>
                </div>
                <button className="mini-button" type="button" onClick={() => openDialog("team")} disabled={readOnly}>
                  Edit
                </button>
              </div>
              <div className="summary-chip-list">
                {inspectorLabels.length > 0 ? (
                  inspectorLabels.map((label) => (
                    <span key={label} className="summary-chip">
                      {label}
                    </span>
                  ))
                ) : (
                  <span className="muted-meta">No inspectors assigned</span>
                )}
              </div>
            </article>

            <article className="setup-summary-card notes-card">
              <div className="setup-card-topline">
                <div>
                  <p className="setup-card-label">Notes</p>
                  <h3>Inspection notes</h3>
                </div>
                <button className="mini-button" type="button" onClick={() => openDialog("notes")} disabled={readOnly}>
                  Edit
                </button>
              </div>
              <p className="notes-preview">
                {details.notes || "Add coordinator notes, context, or special instructions for the inspection."}
              </p>
            </article>
          </div>
        )}
      </section>

      {dialogKind !== null && dialogDraft !== null && (
        <SetupDialog
          kind={dialogKind}
          draft={dialogDraft}
          readOnly={readOnly}
          buildingOptions={buildingOptions}
          locationOptions={locationOptions}
          departmentOptions={departmentOptions}
          inspectorOptions={inspectorOptions}
          templateOptions={templateOptions}
          departmentSearch={departmentSearch}
          inspectorSearch={inspectorSearch}
          setDepartmentSearch={setDepartmentSearch}
          setInspectorSearch={setInspectorSearch}
          onChange={setDialogDraft}
          onClose={closeDialog}
          onSave={saveDialog}
        />
      )}
    </>
  );
}
