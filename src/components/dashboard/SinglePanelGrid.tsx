import { ReadinessPanel } from './ReadinessPanel';
import { NutritionPanel } from './NutritionPanel';
import { HydrationPanel } from './HydrationPanel';
import { TrainingPanel } from './TrainingPanel';
import { HabitsPanel } from './HabitsPanel';
import { GoalsPanel } from './GoalsPanel';
import { PageNotes } from './TextCard';

const panelComponents = {
  readiness: ReadinessPanel,
  nutrition: NutritionPanel,
  hydration: HydrationPanel,
  training: TrainingPanel,
  habits: HabitsPanel,
  milestones: GoalsPanel,
};

interface SinglePanelGridProps {
  panelId: string;
}

export function SinglePanelGrid({ panelId }: SinglePanelGridProps) {
  const PanelComponent = panelComponents[panelId as keyof typeof panelComponents];
  if (!PanelComponent) {
    console.warn(`Panel component not found for id: ${panelId}`);
    return (
      <div className="mx-auto w-full max-w-6xl">
        <div className="text-center text-red-500 py-8">
          Panel component not found for id: {panelId}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <PanelComponent />
      <PageNotes page={panelId} />
    </div>
  );
}
