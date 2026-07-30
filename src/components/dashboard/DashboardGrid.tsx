import { ReadinessPanel } from './ReadinessPanel';
import { NutritionPanel } from './NutritionPanel';
import { HydrationPanel } from './HydrationPanel';
import { TrainingPanel } from './TrainingPanel';
import { HabitsPanel } from './HabitsPanel';
import { MilestoneProgressPanel } from './MilestoneProgressPanel';
import { LongTermGoalCard } from './LongTermGoalCard';
import { ChallengeCard } from './ChallengeCard';
import { Mission185Card } from './Mission185Card';
import { ScratchOffPrizesCard } from './ScratchOffPrizesCard';
import { useAuth } from '@/contexts/AuthContext';

export function DashboardGrid() {
  const { user } = useAuth();
  const goalsRowClass = user ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : 'grid grid-cols-1 gap-6';

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      {/* Habits + Milestone */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HabitsPanel />
        <MilestoneProgressPanel />
      </div>

      {/* Readiness and Nutrition */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReadinessPanel />
        <NutritionPanel />
      </div>

      {/* Hydration and Training */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HydrationPanel />
        <TrainingPanel />
      </div>

      {/* Goals cards (from Goals page) */}
      <div className={goalsRowClass}>
        <LongTermGoalCard />
        <ChallengeCard />
      </div>
      <div className={goalsRowClass}>
        <Mission185Card />
        <ScratchOffPrizesCard />
      </div>
    </div>
  );
}