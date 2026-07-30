import { LongTermGoalCard } from './LongTermGoalCard';
import { ChallengeCard } from './ChallengeCard';
import { Mission185Card } from './Mission185Card';
import { ScratchOffPrizesCard } from './ScratchOffPrizesCard';
import { PageNotes } from './TextCard';
import { useAuth } from '@/contexts/AuthContext';

export function GoalsGrid() {
  const { user } = useAuth();
  const rowClass = user ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : 'grid grid-cols-1 gap-6';

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className={rowClass}>
        <LongTermGoalCard />
        <ChallengeCard />
      </div>
      <div className={rowClass}>
        <Mission185Card />
        <ScratchOffPrizesCard />
      </div>
      <PageNotes page="goals" />
    </div>
  );
}
