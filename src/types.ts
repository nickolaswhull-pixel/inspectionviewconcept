export type InspectionStatus =
  | "draft"
  | "launched"
  | "coordinatorReview"
  | "completed";

export type SeverityLevel = "low" | "medium" | "high";

export type CitationReviewState = "new" | "adjusted" | "reviewed";

export type CitationPresenceFilter = "all" | "with" | "without";

export interface OptionItem {
  id: string;
  label: string;
  description?: string;
}

export interface InspectorAssignment extends OptionItem {
  shift: string;
}

export interface TemplateOption extends OptionItem {
  questionCount: number;
}

export interface InspectionDetails {
  buildingId: string;
  location: string;
  departmentIds: string[];
  inspectorIds: string[];
  inspectionDate: string;
  templateId: string;
  notes: string;
}

export interface TemplateCategory {
  id: string;
  label: string;
  description: string;
}

export interface TemplateQuestion {
  id: string;
  categoryId: string;
  code: string;
  prompt: string;
  guidance: string;
  severity: SeverityLevel;
}

export interface CitationPhoto {
  id: string;
  name: string;
  previewUrl: string;
  sizeLabel: string;
}

export interface Citation {
  id: string;
  questionId: string;
  label: string;
  location: string;
  departmentId: string;
  responsibleServiceId: string;
  notes: string;
  photos: CitationPhoto[];
  submittedByInspectorId: string;
  reviewState: CitationReviewState;
  createdAt: string;
}

export interface InspectionFilters {
  search: string;
  categoryId: string;
  citationPresence: CitationPresenceFilter;
  reviewState: CitationReviewState | "all";
  departmentId: string;
  serviceId: string;
}

export interface ReviewSummary {
  totalQuestions: number;
  citedQuestions: number;
  totalCitations: number;
  remainingReviewCount: number;
  adjustedCount: number;
  reviewedCount: number;
}

export interface CitationEditorPayload {
  citationId?: string;
  questionId: string;
  location: string;
  departmentId: string;
  responsibleServiceId: string;
  notes: string;
  photos: CitationPhoto[];
}

export interface DemoScenarioSeed {
  id: string;
  name: string;
  subtitle: string;
  buildingOptions: OptionItem[];
  locationOptions: OptionItem[];
  departmentOptions: OptionItem[];
  serviceOptions: OptionItem[];
  inspectorOptions: InspectorAssignment[];
  templateOptions: TemplateOption[];
  details: InspectionDetails;
  categoriesById: Record<string, TemplateCategory>;
  categoryOrder: string[];
  questionsById: Record<string, TemplateQuestion>;
  questionIdsByCategory: Record<string, string[]>;
  citationsById: Record<string, Citation>;
  citationIdsByQuestionId: Record<string, string[]>;
}

export interface ScenarioOption {
  id: string;
  label: string;
  description: string;
  questionCount: number;
  citationCount: number;
}
