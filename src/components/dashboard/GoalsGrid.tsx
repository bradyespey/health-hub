import { LongTermGoalCard } from './LongTermGoalCard';
import { ChallengeCard } from './ChallengeCard';
import { Mission185Card } from './Mission185Card';
import { ScratchOffPrizesCard } from './ScratchOffPrizesCard';
import { PageNotes } from './TextCard';

export function GoalsGrid() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LongTermGoalCard />
        <ChallengeCard />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Mission185Card />
        <ScratchOffPrizesCard />
      </div>
      <PageNotes page="goals" />
    </div>
  );
}
