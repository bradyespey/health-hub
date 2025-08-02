import { ReadinessPanel } from '@/components/dashboard/ReadinessPanel';
import { NutritionPanel } from '@/components/dashboard/NutritionPanel';
import { HydrationPanel } from '@/components/dashboard/HydrationPanel';
import { TrainingPanel } from '@/components/dashboard/TrainingPanel';
import { HabitsPanel } from '@/components/dashboard/HabitsPanel';
import { MilestonesPanel } from '@/components/dashboard/MilestonesPanel';

const Index = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <ReadinessPanel />
      </div>
      <div>
        <HydrationPanel />
      </div>
      <div>
        <NutritionPanel />
      </div>
      <div>
        <TrainingPanel />
      </div>
      <div className="lg:col-span-2">
        <HabitsPanel />
      </div>
      <div>
        <MilestonesPanel />
      </div>
    </div>
  );
};

export default Index;
