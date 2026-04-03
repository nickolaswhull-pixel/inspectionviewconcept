import { useState } from "react";
import { ChecklistPane } from "./components/ChecklistPane";
import { SetupSummaryBand } from "./components/SetupSidebar";
import { WorkflowBar } from "./components/WorkflowBar";

function App() {
  const [isChecklistFullView, setIsChecklistFullView] = useState(false);

  return (
    <div className={`app-shell${isChecklistFullView ? " checklist-full-view-active" : ""}`}>
      <div className="app-backdrop" />
      {!isChecklistFullView && <WorkflowBar />}
      <main className={`workspace-main${isChecklistFullView ? " checklist-only" : ""}`}>
        {!isChecklistFullView && <SetupSummaryBand />}
        <ChecklistPane
          isFullView={isChecklistFullView}
          onToggleFullView={() => setIsChecklistFullView((value) => !value)}
        />
      </main>
    </div>
  );
}

export default App;
