import {
  Citation,
  DemoScenarioSeed,
  InspectionDetails,
  InspectorAssignment,
  OptionItem,
  ScenarioOption,
  SeverityLevel,
  TemplateCategory,
  TemplateOption,
  TemplateQuestion,
} from "../types";

type PromptSeed = {
  prompt: string;
  guidance: string;
  severity: SeverityLevel;
};

type CategoryBlueprint = {
  id: string;
  code: string;
  label: string;
  description: string;
  prompts: PromptSeed[];
};

const BUILDINGS: OptionItem[] = [
  { id: "north-tower", label: "North Tower" },
  { id: "operations-campus", label: "Operations Campus" },
  { id: "patient-services", label: "Patient Services Pavilion" },
];

const DEPARTMENTS: OptionItem[] = [
  { id: "dietary", label: "Dietary" },
  { id: "surgery", label: "Surgery" },
  { id: "facilities", label: "Facilities" },
  { id: "environmental", label: "Environmental Services" },
  { id: "laboratory", label: "Laboratory" },
  { id: "pharmacy", label: "Pharmacy" },
  { id: "imaging", label: "Imaging" },
];

const SERVICES: OptionItem[] = [
  { id: "facilities-ops", label: "Facilities Operations" },
  { id: "clinical-ops", label: "Clinical Operations" },
  { id: "dietary-leadership", label: "Dietary Leadership" },
  { id: "infection-prevention", label: "Infection Prevention" },
  { id: "safety-committee", label: "Safety Committee" },
  { id: "environmental-lead", label: "EVS Leadership" },
];

const INSPECTORS: InspectorAssignment[] = [
  { id: "avery", label: "Avery Mason", shift: "Days" },
  { id: "noah", label: "Noah Patel", shift: "Days" },
  { id: "elena", label: "Elena Torres", shift: "Swing" },
  { id: "isaac", label: "Isaac Kim", shift: "Nights" },
];

const NORMAL_LOCATIONS: OptionItem[] = [
  { id: "floor-2", label: "Floor 2" },
  { id: "floor-3", label: "Floor 3" },
  { id: "floor-4", label: "Floor 4" },
  { id: "west-corridor", label: "West Inpatient Corridor" },
  { id: "surgery-clean-core", label: "Surgery Clean Core" },
  { id: "nourishment-room", label: "Nourishment Room" },
];

const SCALE_LOCATIONS: OptionItem[] = [
  { id: "tower-a", label: "Inpatient Tower A" },
  { id: "tower-b", label: "Inpatient Tower B" },
  { id: "support-corridor", label: "Support Corridor" },
  { id: "imaging-prep", label: "Imaging Prep Area" },
  { id: "loading-dock", label: "Loading Dock Vestibule" },
  { id: "central-utility", label: "Central Utility Hall" },
];

const CATEGORY_BLUEPRINTS: CategoryBlueprint[] = [
  {
    id: "egress",
    code: "EGR",
    label: "Means of Egress",
    description: "Exit paths and doors remain usable and visible.",
    prompts: [
      {
        prompt: "Exit signage remains illuminated and visible",
        guidance: "Capture missing or blocked signage from approach paths.",
        severity: "high",
      },
      {
        prompt: "Required egress width is maintained without storage drift",
        guidance: "Watch for carts, bins, and supply staging at pinch points.",
        severity: "high",
      },
      {
        prompt: "Exit doors open freely without hardware delay",
        guidance: "Document panic hardware damage or sticking doors.",
        severity: "high",
      },
    ],
  },
  {
    id: "life-safety",
    code: "LSF",
    label: "Life Safety Features",
    description: "Rated barriers and smoke protections remain intact.",
    prompts: [
      {
        prompt: "Fire-rated penetrations are sealed with approved material",
        guidance: "Note conduit, cable, or abandoned wall openings.",
        severity: "high",
      },
      {
        prompt: "Smoke barrier doors latch and are not wedged open",
        guidance: "Check latch alignment and unapproved hold-open practices.",
        severity: "high",
      },
      {
        prompt: "Ceiling tiles are installed above rated spaces",
        guidance: "Inspect high-traffic areas where tiles are often removed.",
        severity: "medium",
      },
    ],
  },
  {
    id: "hazmat",
    code: "HZM",
    label: "Hazard Communication",
    description: "Chemical handling and storage practices stay compliant.",
    prompts: [
      {
        prompt: "Secondary containers are fully labeled",
        guidance: "Spot-check spray bottles and transfer containers.",
        severity: "medium",
      },
      {
        prompt: "Chemical storage separates incompatible products",
        guidance: "Flag acids, bases, and oxidizers stored together.",
        severity: "high",
      },
      {
        prompt: "Safety data sheet access remains available at the point of use",
        guidance: "Verify staff can quickly access SDS information.",
        severity: "medium",
      },
    ],
  },
  {
    id: "medical-gas",
    code: "MDG",
    label: "Medical Gas Areas",
    description: "Cylinder storage and shutoff access remain compliant.",
    prompts: [
      {
        prompt: "Full and empty cylinders are segregated and secured",
        guidance: "Capture missing chains or mixed storage.",
        severity: "high",
      },
      {
        prompt: "Zone valve signage remains legible and accessible",
        guidance: "Inspect access around valve boxes and signage.",
        severity: "high",
      },
      {
        prompt: "Cylinder storage rooms stay ventilated and orderly",
        guidance: "Note blocked louvers or combustible storage.",
        severity: "medium",
      },
    ],
  },
  {
    id: "equipment",
    code: "EQP",
    label: "Equipment Safety",
    description: "Portable equipment and power use support safe operation.",
    prompts: [
      {
        prompt: "Portable equipment storage avoids sinks and panels",
        guidance: "Check shared alcoves and mobile equipment parking spots.",
        severity: "medium",
      },
      {
        prompt: "Extension cords and power strips are used appropriately",
        guidance: "Flag daisy chains or nonmedical strips in care spaces.",
        severity: "high",
      },
      {
        prompt: "Emergency equipment remains sealed and accessible",
        guidance: "Document blocked access or missing crash cart seals.",
        severity: "medium",
      },
    ],
  },
  {
    id: "infection-control",
    code: "IFC",
    label: "Infection Control",
    description: "Storage separation and hygiene access support infection prevention.",
    prompts: [
      {
        prompt: "Clean and soiled storage remains separated",
        guidance: "Note mixed supply storage in work rooms or corridors.",
        severity: "high",
      },
      {
        prompt: "Hand hygiene stations are stocked and unobstructed",
        guidance: "Capture empty refills or blocked dispensers.",
        severity: "medium",
      },
      {
        prompt: "Ice and nourishment areas are visibly clean",
        guidance: "Document residue or damaged finishes near use points.",
        severity: "medium",
      },
    ],
  },
  {
    id: "documentation",
    code: "DOC",
    label: "Posting and Documentation",
    description: "Required postings and logs remain current and visible.",
    prompts: [
      {
        prompt: "Required permits and inspection logs are available",
        guidance: "Verify dates and approvals are current.",
        severity: "low",
      },
      {
        prompt: "Emergency contact information is current and readable",
        guidance: "Flag outdated names or damaged postings.",
        severity: "low",
      },
      {
        prompt: "Regulatory postings are displayed in expected locations",
        guidance: "Check staff areas and public-facing entry points.",
        severity: "low",
      },
    ],
  },
  {
    id: "kitchen",
    code: "KIT",
    label: "Food Service Areas",
    description: "Food handling spaces stay sanitary and well controlled.",
    prompts: [
      {
        prompt: "Food storage stays off the floor and protected",
        guidance: "Inspect dry storage and receiving areas.",
        severity: "medium",
      },
      {
        prompt: "Temperature logs are complete and in range",
        guidance: "Look for gaps or missing corrective actions.",
        severity: "medium",
      },
      {
        prompt: "Prep surfaces and drain areas are clean and intact",
        guidance: "Document buildup or finish damage near prep zones.",
        severity: "medium",
      },
    ],
  },
  {
    id: "electrical",
    code: "ELE",
    label: "Electrical Safety",
    description: "Panels and powered equipment remain safe and accessible.",
    prompts: [
      {
        prompt: "Electrical panels maintain clear working space",
        guidance: "Capture carts, storage, or missing breaker labels.",
        severity: "high",
      },
      {
        prompt: "Receptacle covers and wall plates are intact",
        guidance: "Note broken covers or exposed wiring.",
        severity: "medium",
      },
      {
        prompt: "Equipment cords show no taped repair or strain damage",
        guidance: "Inspect high-use devices and charging stations.",
        severity: "high",
      },
    ],
  },
  {
    id: "storage",
    code: "STR",
    label: "Storage and Housekeeping",
    description: "Storage stays orderly and below sprinkler clearances.",
    prompts: [
      {
        prompt: "Stored items maintain required sprinkler clearance",
        guidance: "Estimate vertical clearance on crowded shelving.",
        severity: "high",
      },
      {
        prompt: "Supply rooms remain orderly without trip hazards",
        guidance: "Capture overflow or housekeeping breakdowns.",
        severity: "medium",
      },
      {
        prompt: "Linen and disposables remain covered and protected",
        guidance: "Note uncovered product near sinks or traffic.",
        severity: "medium",
      },
    ],
  },
  {
    id: "security",
    code: "SEC",
    label: "Security and Access",
    description: "Controlled spaces maintain expected access restrictions.",
    prompts: [
      {
        prompt: "Restricted access doors close and latch correctly",
        guidance: "Watch for propped doors or taped latches.",
        severity: "high",
      },
      {
        prompt: "Badge-only areas show current access signage",
        guidance: "Note faded or missing visitor instructions.",
        severity: "low",
      },
      {
        prompt: "Medication and sharps storage stays locked",
        guidance: "Capture unsecured cabinets or carts left open.",
        severity: "high",
      },
    ],
  },
  {
    id: "utilities",
    code: "UTL",
    label: "Utility Rooms",
    description: "Utility rooms stay secure and free from unrelated storage.",
    prompts: [
      {
        prompt: "Mechanical and electrical rooms are free from general storage",
        guidance: "Document cardboard buildup or supply staging.",
        severity: "high",
      },
      {
        prompt: "Telecom rooms remain clean and accessible",
        guidance: "Inspect access control and cable housekeeping.",
        severity: "medium",
      },
      {
        prompt: "Utility room doors self-close and stay labeled",
        guidance: "Note damaged closers or missing room signage.",
        severity: "medium",
      },
    ],
  },
];

const AREAS = [
  "in the west inpatient corridor",
  "in the surgery clean core",
  "in the third-floor service alcove",
  "in the loading dock vestibule",
  "in the nourishment room",
  "in the north elevator lobby",
  "in the imaging prep area",
  "in the sterile storage room",
  "in the pharmacy workroom",
  "in the decontamination entry",
  "in the receiving hall",
  "in the cath lab support hall",
];

const NOTE_SNIPPETS = [
  "Repeat observation from prior month rounding.",
  "Issue appears tied to daily staging at shift change.",
  "Area owner requested facilities follow-up before close-out.",
  "Observed during high cart traffic and peak occupancy.",
  "Team requested clarification on department ownership.",
  "Finding captured from two angles for follow-up.",
];

function pad(value: number) {
  return value.toString().padStart(3, "0");
}

function buildQuestions(scenarioId: string, categoryCount: number, perCategory: number) {
  const categoriesById: Record<string, TemplateCategory> = {};
  const categoryOrder: string[] = [];
  const questionsById: Record<string, TemplateQuestion> = {};
  const questionIdsByCategory: Record<string, string[]> = {};
  const questions: TemplateQuestion[] = [];
  let globalIndex = 0;

  CATEGORY_BLUEPRINTS.slice(0, categoryCount).forEach((blueprint, categoryIndex) => {
    const categoryId = `${scenarioId}-${blueprint.id}`;
    categoriesById[categoryId] = {
      id: categoryId,
      label: blueprint.label,
      description: blueprint.description,
    };
    categoryOrder.push(categoryId);
    questionIdsByCategory[categoryId] = [];

    for (let index = 0; index < perCategory; index += 1) {
      const promptSeed = blueprint.prompts[index % blueprint.prompts.length];
      const questionId = `${scenarioId}-question-${pad(globalIndex + 1)}`;
      const question: TemplateQuestion = {
        id: questionId,
        categoryId,
        code: `${blueprint.code}-${scenarioId === "scale" ? 300 + globalIndex : 100 + globalIndex}`,
        prompt: `${promptSeed.prompt} ${AREAS[(globalIndex + index + categoryIndex) % AREAS.length]}.`,
        guidance: promptSeed.guidance,
        severity: promptSeed.severity,
      };
      questions.push(question);
      questionsById[questionId] = question;
      questionIdsByCategory[categoryId].push(questionId);
      globalIndex += 1;
    }
  });

  return { categoriesById, categoryOrder, questionsById, questionIdsByCategory, questions };
}

function buildCitations(
  scenarioId: string,
  questions: TemplateQuestion[],
  count: number,
  locationOptions: OptionItem[],
) {
  const citationsById: Record<string, Citation> = {};
  const citationIdsByQuestionId: Record<string, string[]> = {};

  questions.forEach((question) => {
    citationIdsByQuestionId[question.id] = [];
  });

  for (let index = 0; index < count; index += 1) {
    const question = questions[(index * 5 + Math.floor(index / 3)) % questions.length];
    const department = DEPARTMENTS[index % DEPARTMENTS.length];
    const service = SERVICES[(index * 2 + 1) % SERVICES.length];
    const inspector = INSPECTORS[(index + 1) % INSPECTORS.length];
    const location = locationOptions[index % locationOptions.length];
    const citationId = `${scenarioId}-citation-${pad(index + 1)}`;
    const citation: Citation = {
      id: citationId,
      questionId: question.id,
      label: `${scenarioId === "scale" ? "SC" : "RN"}-${pad(index + 1)}`,
      location: location.label,
      departmentId: department.id,
      responsibleServiceId: service.id,
      notes: NOTE_SNIPPETS[index % NOTE_SNIPPETS.length],
      photos:
        index % 5 === 0
          ? [
              {
                id: `${scenarioId}-photo-${index + 1}`,
                name: `finding-${pad(index + 1)}.jpg`,
                previewUrl: "",
                sizeLabel: "Photo on file",
              },
            ]
          : [],
      submittedByInspectorId: inspector.id,
      reviewState: "new",
      createdAt: `2026-04-${String((index % 20) + 1).padStart(2, "0")}T${String(8 + (index % 8)).padStart(2, "0")}:15:00`,
    };
    citationsById[citationId] = citation;
    citationIdsByQuestionId[question.id].push(citationId);
  }

  return { citationsById, citationIdsByQuestionId };
}

function buildDetails(
  scenarioId: string,
  template: TemplateOption,
  buildingId: string,
  location: string,
  departmentIds: string[],
  inspectorIds: string[],
): InspectionDetails {
  return {
    buildingId,
    location,
    departmentIds,
    inspectorIds,
    inspectionDate: scenarioId === "scale" ? "2026-04-17" : "2026-04-10",
    templateId: template.id,
    notes:
      scenarioId === "scale"
        ? "Large campus sweep focused on high-volume departments and repeat findings."
        : "Focused compliance walkthrough for active patient-support areas.",
  };
}

function buildScenarioSeed(
  scenarioId: string,
  name: string,
  subtitle: string,
  categoryCount: number,
  perCategory: number,
  citationCount: number,
  buildingId: string,
  locationOptions: OptionItem[],
  defaultLocation: string,
  departmentIds: string[],
  inspectorIds: string[],
): DemoScenarioSeed {
  const template: TemplateOption = {
    id: `${scenarioId}-template`,
    label: `${name} Template`,
    description: subtitle,
    questionCount: categoryCount * perCategory,
  };
  const questions = buildQuestions(scenarioId, categoryCount, perCategory);
  const citations = buildCitations(scenarioId, questions.questions, citationCount, locationOptions);

  return {
    id: scenarioId,
    name,
    subtitle,
    buildingOptions: BUILDINGS,
    locationOptions,
    departmentOptions: DEPARTMENTS,
    serviceOptions: SERVICES,
    inspectorOptions: INSPECTORS,
    templateOptions: [template],
    details: buildDetails(
      scenarioId,
      template,
      buildingId,
      defaultLocation,
      departmentIds,
      inspectorIds,
    ),
    categoriesById: questions.categoriesById,
    categoryOrder: questions.categoryOrder,
    questionsById: questions.questionsById,
    questionIdsByCategory: questions.questionIdsByCategory,
    citationsById: citations.citationsById,
    citationIdsByQuestionId: citations.citationIdsByQuestionId,
  };
}

export const DEMO_SCENARIOS: Record<string, DemoScenarioSeed> = {
  normal: buildScenarioSeed(
    "normal",
    "Routine Tower Rounds",
    "Everyday inspection walkthrough for a single building.",
    8,
    6,
    24,
    "north-tower",
    NORMAL_LOCATIONS,
    "Floor 2",
    ["dietary", "facilities", "environmental"],
    ["avery", "noah"],
  ),
  scale: buildScenarioSeed(
    "scale",
    "Campus Scale Review",
    "Performance scenario for heavy question volume and citation density.",
    12,
    19,
    160,
    "operations-campus",
    SCALE_LOCATIONS,
    "Inpatient Tower A",
    ["dietary", "surgery", "facilities", "environmental", "pharmacy", "imaging"],
    ["avery", "noah", "elena"],
  ),
};

export const SCENARIO_OPTIONS: ScenarioOption[] = [
  {
    id: "normal",
    label: DEMO_SCENARIOS.normal.name,
    description: DEMO_SCENARIOS.normal.subtitle,
    questionCount: Object.keys(DEMO_SCENARIOS.normal.questionsById).length,
    citationCount: Object.keys(DEMO_SCENARIOS.normal.citationsById).length,
  },
  {
    id: "scale",
    label: DEMO_SCENARIOS.scale.name,
    description: DEMO_SCENARIOS.scale.subtitle,
    questionCount: Object.keys(DEMO_SCENARIOS.scale.questionsById).length,
    citationCount: Object.keys(DEMO_SCENARIOS.scale.citationsById).length,
  },
];
