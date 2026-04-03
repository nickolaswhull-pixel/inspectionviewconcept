import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useInspectionStore } from "../store/inspectionStore";
import { Citation, ReviewSummary } from "../types";

export type ChecklistRow =
  | {
      kind: "category";
      id: string;
      categoryId: string;
      questionCount: number;
      citationCount: number;
    }
  | {
      kind: "question";
      id: string;
      categoryId: string;
      questionId: string;
      visibleCitationIds: string[];
      hasAnyCitation: boolean;
    };

export interface ChecklistViewModel {
  rows: ChecklistRow[];
  jumpOptions: Array<{
    categoryId: string;
    label: string;
    rowIndex: number;
  }>;
  visibleQuestionCount: number;
}

function citationMatchesSearch(citation: Citation, query: string) {
  if (!query) {
    return true;
  }

  return [
    citation.label,
    citation.location,
    citation.notes,
    citation.departmentId,
    citation.responsibleServiceId,
  ]
    .join(" ")
    .toLowerCase()
    .includes(query);
}

export function useChecklistViewModel(): ChecklistViewModel {
  const store = useInspectionStore(
    useShallow((state) => ({
      filters: state.filters,
      categoryOrder: state.categoryOrder,
      categoriesById: state.categoriesById,
      questionsById: state.questionsById,
      questionIdsByCategory: state.questionIdsByCategory,
      citationIdsByQuestionId: state.citationIdsByQuestionId,
      citationsById: state.citationsById,
    })),
  );

  return useMemo(() => {
    const rows: ChecklistRow[] = [];
    const jumpOptions: ChecklistViewModel["jumpOptions"] = [];
    const query = store.filters.search.trim().toLowerCase();
    let visibleQuestionCount = 0;

    store.categoryOrder.forEach((categoryId) => {
      if (store.filters.categoryId !== "all" && store.filters.categoryId !== categoryId) {
        return;
      }

      const questionRows: ChecklistRow[] = [];
      let citationCount = 0;

      (store.questionIdsByCategory[categoryId] ?? []).forEach((questionId) => {
        const question = store.questionsById[questionId];
        if (!question) {
          return;
        }

        const allCitationIds = store.citationIdsByQuestionId[questionId] ?? [];
        const hasAnyCitation = allCitationIds.length > 0;
        const questionMatches =
          !query ||
          question.prompt.toLowerCase().includes(query) ||
          question.code.toLowerCase().includes(query) ||
          question.guidance.toLowerCase().includes(query) ||
          store.categoriesById[categoryId].label.toLowerCase().includes(query);

        const filteredCitationIds = allCitationIds.filter((citationId) => {
          const citation = store.citationsById[citationId];
          if (!citation) {
            return false;
          }
          if (
            store.filters.reviewState !== "all" &&
            citation.reviewState !== store.filters.reviewState
          ) {
            return false;
          }
          if (
            store.filters.departmentId !== "all" &&
            citation.departmentId !== store.filters.departmentId
          ) {
            return false;
          }
          if (
            store.filters.serviceId !== "all" &&
            citation.responsibleServiceId !== store.filters.serviceId
          ) {
            return false;
          }
          return true;
        });

        const searchMatchedCitationIds = filteredCitationIds.filter((citationId) =>
          citationMatchesSearch(store.citationsById[citationId], query),
        );

        if (store.filters.citationPresence === "with" && !hasAnyCitation) {
          return;
        }
        if (store.filters.citationPresence === "without" && hasAnyCitation) {
          return;
        }

        const hasCitationSpecificFilter =
          store.filters.reviewState !== "all" ||
          store.filters.departmentId !== "all" ||
          store.filters.serviceId !== "all";

        if (hasCitationSpecificFilter && !filteredCitationIds.length) {
          return;
        }

        if (query && !questionMatches && !searchMatchedCitationIds.length) {
          return;
        }

        const visibleCitationIds =
          query && !questionMatches ? searchMatchedCitationIds : filteredCitationIds;

        citationCount += visibleCitationIds.length;
        visibleQuestionCount += 1;
        questionRows.push({
          kind: "question",
          id: questionId,
          categoryId,
          questionId,
          visibleCitationIds,
          hasAnyCitation,
        });
      });

      if (!questionRows.length) {
        return;
      }

      jumpOptions.push({
        categoryId,
        label: store.categoriesById[categoryId].label,
        rowIndex: rows.length,
      });

      rows.push({
        kind: "category",
        id: `${categoryId}-header`,
        categoryId,
        questionCount: questionRows.length,
        citationCount,
      });
      rows.push(...questionRows);
    });

    return {
      rows,
      jumpOptions,
      visibleQuestionCount,
    };
  }, [store]);
}

export function useReviewSummary(): ReviewSummary {
  const { questionIdsByCategory, citationIdsByQuestionId, citationsById } =
    useInspectionStore(
      useShallow((state) => ({
        questionIdsByCategory: state.questionIdsByCategory,
        citationIdsByQuestionId: state.citationIdsByQuestionId,
        citationsById: state.citationsById,
      })),
    );

  return useMemo(() => {
    const totalQuestions = Object.values(questionIdsByCategory).reduce(
      (sum, ids) => sum + ids.length,
      0,
    );

    const totalCitations = Object.keys(citationsById).length;
    const citedQuestions = Object.values(citationIdsByQuestionId).filter((ids) => ids.length > 0).length;
    let remainingReviewCount = 0;
    let adjustedCount = 0;
    let reviewedCount = 0;

    Object.values(citationsById).forEach((citation) => {
      if (citation.reviewState === "new") {
        remainingReviewCount += 1;
      }
      if (citation.reviewState === "adjusted") {
        adjustedCount += 1;
      }
      if (citation.reviewState === "reviewed") {
        reviewedCount += 1;
      }
    });

    return {
      totalQuestions,
      citedQuestions,
      totalCitations,
      remainingReviewCount,
      adjustedCount,
      reviewedCount,
    };
  }, [citationIdsByQuestionId, citationsById, questionIdsByCategory]);
}
