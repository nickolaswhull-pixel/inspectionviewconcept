import { create } from "zustand";
import {
  Citation,
  CitationEditorPayload,
  CitationPhoto,
  DemoScenarioSeed,
  InspectionDetails,
  InspectionFilters,
  InspectionStatus,
} from "../types";
import { DEMO_SCENARIOS } from "../data/scenarios";

const DEFAULT_FILTERS: InspectionFilters = {
  search: "",
  categoryId: "all",
  citationPresence: "all",
  reviewState: "all",
  departmentId: "all",
  serviceId: "all",
};

type CitationSnapshot = Pick<
  Citation,
  "location" | "departmentId" | "responsibleServiceId" | "notes"
> & {
  photoNames: string[];
};

type InlineCitationMode = "idle" | "create" | "edit";

type CitationDraft = Omit<CitationEditorPayload, "citationId"> & {
  citationId?: string;
};

type InlineCitationSession = {
  mode: InlineCitationMode;
  questionId: string | null;
  citationId: string | null;
  draft: CitationDraft | null;
};

type InspectionStoreState = {
  activeDatasetId: string;
  status: InspectionStatus;
  details: InspectionDetails;
  buildingOptions: DemoScenarioSeed["buildingOptions"];
  locationOptions: DemoScenarioSeed["locationOptions"];
  departmentOptions: DemoScenarioSeed["departmentOptions"];
  serviceOptions: DemoScenarioSeed["serviceOptions"];
  inspectorOptions: DemoScenarioSeed["inspectorOptions"];
  templateOptions: DemoScenarioSeed["templateOptions"];
  categoriesById: DemoScenarioSeed["categoriesById"];
  categoryOrder: string[];
  questionsById: DemoScenarioSeed["questionsById"];
  questionIdsByCategory: DemoScenarioSeed["questionIdsByCategory"];
  citationsById: Record<string, Citation>;
  citationIdsByQuestionId: Record<string, string[]>;
  originalCitationsById: Record<string, CitationSnapshot>;
  filters: InspectionFilters;
  inlineCitationSession: InlineCitationSession;
  nextCitationSequence: number;
};

type InspectionStoreActions = {
  loadDataset: (datasetId: string) => void;
  resetDataset: () => void;
  updateDetail: <K extends keyof InspectionDetails>(
    field: K,
    value: InspectionDetails[K],
  ) => void;
  toggleDepartment: (departmentId: string) => void;
  toggleInspector: (inspectorId: string) => void;
  setFilter: <K extends keyof InspectionFilters>(
    key: K,
    value: InspectionFilters[K],
  ) => void;
  clearFilters: () => void;
  launchInspection: () => void;
  beginReview: () => void;
  completeInspection: () => void;
  startEditingCitation: (citationId: string) => void;
  startCreatingCitation: (questionId: string) => void;
  updateCitationDraft: (patch: Partial<CitationDraft>) => void;
  appendCitationDraftPhotos: (photos: CitationPhoto[]) => void;
  removeCitationDraftPhoto: (photoId: string) => void;
  cancelCitationEditing: () => void;
  saveCitation: (payload: CitationEditorPayload) => void;
  removeCitation: (citationId: string) => void;
  markCitationReviewed: (citationId: string) => void;
};

export type InspectionStore = InspectionStoreState & InspectionStoreActions;

function snapshotCitation(citation: Citation): CitationSnapshot {
  return {
    location: citation.location,
    departmentId: citation.departmentId,
    responsibleServiceId: citation.responsibleServiceId,
    notes: citation.notes,
    photoNames: citation.photos.map((photo) => photo.name),
  };
}

function cloneScenario(seed: DemoScenarioSeed) {
  return {
    activeDatasetId: seed.id,
    status: "draft" as InspectionStatus,
    details: {
      ...seed.details,
      departmentIds: [...seed.details.departmentIds],
      inspectorIds: [...seed.details.inspectorIds],
    },
    buildingOptions: seed.buildingOptions.map((item) => ({ ...item })),
    locationOptions: seed.locationOptions.map((item) => ({ ...item })),
    departmentOptions: seed.departmentOptions.map((item) => ({ ...item })),
    serviceOptions: seed.serviceOptions.map((item) => ({ ...item })),
    inspectorOptions: seed.inspectorOptions.map((item) => ({ ...item })),
    templateOptions: seed.templateOptions.map((item) => ({ ...item })),
    categoriesById: Object.fromEntries(
      Object.entries(seed.categoriesById).map(([key, value]) => [key, { ...value }]),
    ),
    categoryOrder: [...seed.categoryOrder],
    questionsById: Object.fromEntries(
      Object.entries(seed.questionsById).map(([key, value]) => [key, { ...value }]),
    ),
    questionIdsByCategory: Object.fromEntries(
      Object.entries(seed.questionIdsByCategory).map(([key, value]) => [key, [...value]]),
    ),
    citationsById: Object.fromEntries(
      Object.entries(seed.citationsById).map(([key, value]) => [
        key,
        {
          ...value,
          photos: value.photos.map((photo) => ({ ...photo })),
        },
      ]),
    ),
    citationIdsByQuestionId: Object.fromEntries(
      Object.entries(seed.citationIdsByQuestionId).map(([key, value]) => [key, [...value]]),
    ),
  };
}

function revokeLocalPhotos(citationsById: Record<string, Citation>) {
  Object.values(citationsById).forEach((citation) => {
    citation.photos.forEach((photo) => {
      if (photo.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(photo.previewUrl);
      }
    });
  });
}

function getRequiredFieldIssues(details: InspectionDetails) {
  const issues: string[] = [];
  if (!details.buildingId) issues.push("building");
  if (!details.location.trim()) issues.push("location");
  if (!details.departmentIds.length) issues.push("department selection");
  if (!details.inspectorIds.length) issues.push("inspector assignment");
  if (!details.inspectionDate) issues.push("inspection date");
  if (!details.templateId) issues.push("template");
  return issues;
}

function hasCitationChanged(payload: CitationEditorPayload, baseline?: CitationSnapshot) {
  if (!baseline) {
    return true;
  }

  const photoNames = payload.photos.map((photo) => photo.name);

  return (
    baseline.location !== payload.location ||
    baseline.departmentId !== payload.departmentId ||
    baseline.responsibleServiceId !== payload.responsibleServiceId ||
    baseline.notes !== payload.notes ||
    baseline.photoNames.join("|") !== photoNames.join("|")
  );
}

function createEmptyInlineCitationSession(): InlineCitationSession {
  return {
    mode: "idle",
    questionId: null,
    citationId: null,
    draft: null,
  };
}

function buildDraftFromInput(input: {
  questionId: string;
  citationId?: string;
  location?: string;
  departmentId?: string;
  responsibleServiceId?: string;
  notes?: string;
  photos?: CitationPhoto[];
}): CitationDraft {
  return {
    citationId: input.citationId,
    questionId: input.questionId,
    location: input.location ?? "",
    departmentId: input.departmentId ?? "",
    responsibleServiceId: input.responsibleServiceId ?? "",
    notes: input.notes ?? "",
    photos: input.photos ?? [],
  };
}

function buildDraftFromCitation(citation: Citation): CitationDraft {
  return buildDraftFromInput({
    citationId: citation.id,
    questionId: citation.questionId,
    location: citation.location,
    departmentId: citation.departmentId,
    responsibleServiceId: citation.responsibleServiceId,
    notes: citation.notes,
    photos: citation.photos.map((photo) => ({ ...photo })),
  });
}

function createInitialState() {
  const seed = cloneScenario(DEMO_SCENARIOS.normal);
  return {
    ...seed,
    filters: { ...DEFAULT_FILTERS },
    inlineCitationSession: createEmptyInlineCitationSession(),
    originalCitationsById: Object.fromEntries(
      Object.values(seed.citationsById).map((citation) => [citation.id, snapshotCitation(citation)]),
    ),
    nextCitationSequence: Object.keys(seed.citationsById).length + 1,
  };
}

export const useInspectionStore = create<InspectionStore>((set, get) => ({
  ...createInitialState(),

  loadDataset: (datasetId) => {
    const seedBase = DEMO_SCENARIOS[datasetId];
    if (!seedBase) {
      return;
    }

    revokeLocalPhotos(get().citationsById);
    const seed = cloneScenario(seedBase);

    set({
      ...seed,
      filters: { ...DEFAULT_FILTERS },
      inlineCitationSession: createEmptyInlineCitationSession(),
      originalCitationsById: Object.fromEntries(
        Object.values(seed.citationsById).map((citation) => [citation.id, snapshotCitation(citation)]),
      ),
      nextCitationSequence: Object.keys(seed.citationsById).length + 1,
    });
  },

  resetDataset: () => {
    get().loadDataset(get().activeDatasetId);
  },

  updateDetail: (field, value) => {
    set((state) => ({
      details: {
        ...state.details,
        [field]: value,
      },
    }));
  },

  toggleDepartment: (departmentId) => {
    set((state) => {
      const exists = state.details.departmentIds.includes(departmentId);
      return {
        details: {
          ...state.details,
          departmentIds: exists
            ? state.details.departmentIds.filter((item) => item !== departmentId)
            : [...state.details.departmentIds, departmentId],
        },
      };
    });
  },

  toggleInspector: (inspectorId) => {
    set((state) => {
      const exists = state.details.inspectorIds.includes(inspectorId);
      return {
        details: {
          ...state.details,
          inspectorIds: exists
            ? state.details.inspectorIds.filter((item) => item !== inspectorId)
            : [...state.details.inspectorIds, inspectorId],
        },
      };
    });
  },

  setFilter: (key, value) => {
    set((state) => ({
      filters: {
        ...state.filters,
        [key]: value,
      },
    }));
  },

  clearFilters: () => {
    set({
      filters: { ...DEFAULT_FILTERS },
    });
  },

  launchInspection: () => {
    if (getRequiredFieldIssues(get().details).length) {
      return;
    }

    set({
      status: "launched",
      inlineCitationSession: createEmptyInlineCitationSession(),
    });
  },

  beginReview: () => {
    if (get().status !== "launched") {
      return;
    }

    set({
      status: "coordinatorReview",
    });
  },

  completeInspection: () => {
    const state = get();
    if (state.status !== "coordinatorReview") {
      return;
    }

    const remaining = Object.values(state.citationsById).some(
      (citation) => citation.reviewState === "new",
    );

    if (remaining) {
      return;
    }

    set({
      status: "completed",
      inlineCitationSession: createEmptyInlineCitationSession(),
    });
  },

  startEditingCitation: (citationId) => {
    const citation = get().citationsById[citationId];
    if (!citation) {
      return;
    }

    set({
      inlineCitationSession: {
        mode: "edit",
        questionId: citation.questionId,
        citationId,
        draft: buildDraftFromCitation(citation),
      },
    });
  },

  startCreatingCitation: (questionId) => {
    const state = get();
    set({
      inlineCitationSession: {
        mode: "create",
        questionId,
        citationId: null,
        draft: buildDraftFromInput({
          questionId,
          location: state.details.location || state.locationOptions[0]?.label || "",
          departmentId: state.details.departmentIds[0] ?? state.departmentOptions[0]?.id ?? "",
          responsibleServiceId: state.serviceOptions[0]?.id ?? "",
        }),
      },
    });
  },

  updateCitationDraft: (patch) => {
    set((state) => {
      const currentDraft = state.inlineCitationSession.draft;
      if (!currentDraft) {
        return {};
      }

      return {
        inlineCitationSession: {
          ...state.inlineCitationSession,
          draft: {
            ...currentDraft,
            ...patch,
          },
        },
      };
    });
  },

  appendCitationDraftPhotos: (photos) => {
    if (!photos.length) {
      return;
    }

    set((state) => {
      const currentDraft = state.inlineCitationSession.draft;
      if (!currentDraft) {
        return {};
      }

      return {
        inlineCitationSession: {
          ...state.inlineCitationSession,
          draft: {
            ...currentDraft,
            photos: [...currentDraft.photos, ...photos],
          },
        },
      };
    });
  },

  removeCitationDraftPhoto: (photoId) => {
    set((state) => {
      const currentDraft = state.inlineCitationSession.draft;
      if (!currentDraft) {
        return {};
      }

      return {
        inlineCitationSession: {
          ...state.inlineCitationSession,
          draft: {
            ...currentDraft,
            photos: currentDraft.photos.filter((photo) => photo.id !== photoId),
          },
        },
      };
    });
  },

  cancelCitationEditing: () => {
    set({
      inlineCitationSession: createEmptyInlineCitationSession(),
    });
  },

  saveCitation: (payload) => {
    set((state) => {
      const existing = payload.citationId ? state.citationsById[payload.citationId] : undefined;
      const isCoordinatorReview = state.status === "coordinatorReview";
      const citationId =
        payload.citationId ??
        `${state.activeDatasetId}-citation-${String(state.nextCitationSequence).padStart(3, "0")}`;
      const label =
        existing?.label ??
        `${state.activeDatasetId === "scale" ? "SC" : "RN"}-${String(state.nextCitationSequence).padStart(3, "0")}`;
      const changed = hasCitationChanged(
        payload,
        payload.citationId ? state.originalCitationsById[payload.citationId] : undefined,
      );
      const reviewState = existing
        ? changed
          ? isCoordinatorReview
            ? "adjusted"
            : existing.reviewState
          : existing.reviewState
        : "new";

      if (existing) {
        const retainedPhotoIds = new Set(payload.photos.map((photo) => photo.id));
        existing.photos.forEach((photo) => {
          if (photo.previewUrl.startsWith("blob:") && !retainedPhotoIds.has(photo.id)) {
            URL.revokeObjectURL(photo.previewUrl);
          }
        });
      }

      const nextCitation: Citation = {
        id: citationId,
        questionId: payload.questionId,
        label,
        location: payload.location.trim(),
        departmentId: payload.departmentId,
        responsibleServiceId: payload.responsibleServiceId,
        notes: payload.notes.trim(),
        photos: payload.photos,
        submittedByInspectorId:
          existing?.submittedByInspectorId ??
          state.details.inspectorIds[0] ??
          state.inspectorOptions[0].id,
        reviewState,
        createdAt: existing?.createdAt ?? new Date().toISOString(),
      };

      const nextCitationIds =
        existing === undefined
          ? [...(state.citationIdsByQuestionId[payload.questionId] ?? []), citationId]
          : state.citationIdsByQuestionId[payload.questionId] ?? [];

      return {
        citationsById: {
          ...state.citationsById,
          [citationId]: nextCitation,
        },
        citationIdsByQuestionId: {
          ...state.citationIdsByQuestionId,
          [payload.questionId]: nextCitationIds,
        },
        inlineCitationSession: {
          mode: "edit" as InlineCitationMode,
          questionId: payload.questionId,
          citationId,
          draft: buildDraftFromCitation(nextCitation),
        },
        nextCitationSequence: existing ? state.nextCitationSequence : state.nextCitationSequence + 1,
      };
    });
  },

  removeCitation: (citationId) => {
    set((state) => {
      const citation = state.citationsById[citationId];
      if (!citation) {
        return {};
      }

      citation.photos.forEach((photo) => {
        if (photo.previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(photo.previewUrl);
        }
      });

      const nextCitations = { ...state.citationsById };
      delete nextCitations[citationId];

      const isActiveCitation = state.inlineCitationSession.citationId === citationId;

      return {
        citationsById: nextCitations,
        citationIdsByQuestionId: {
          ...state.citationIdsByQuestionId,
          [citation.questionId]: (state.citationIdsByQuestionId[citation.questionId] ?? []).filter(
            (id) => id !== citationId,
          ),
        },
        inlineCitationSession: isActiveCitation
          ? createEmptyInlineCitationSession()
          : state.inlineCitationSession,
      };
    });
  },

  markCitationReviewed: (citationId) => {
    set((state) => {
      const citation = state.citationsById[citationId];
      if (!citation || citation.reviewState !== "new") {
        return {};
      }

      const isActiveCitation = state.inlineCitationSession.citationId === citationId;
      const nextCitation = {
        ...citation,
        reviewState: "reviewed" as const,
      };

      return {
        citationsById: {
          ...state.citationsById,
          [citationId]: nextCitation,
        },
        inlineCitationSession: isActiveCitation
          ? {
              ...state.inlineCitationSession,
              draft: state.inlineCitationSession.draft
                ? buildDraftFromCitation(nextCitation)
                : state.inlineCitationSession.draft,
            }
          : state.inlineCitationSession,
      };
    });
  },
}));

export function getDraftIssues(details: InspectionDetails) {
  return getRequiredFieldIssues(details);
}
