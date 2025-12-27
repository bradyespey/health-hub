import { DashboardGrid } from '@/components/dashboard/DashboardGrid';
import { PageNotes } from '@/components/dashboard/TextCard';

const Index = () => {
  return (
    <div>
      <DashboardGrid />
      <div className="mx-auto w-full max-w-6xl">
        <PageNotes
          page="all"
          title="Notes"
          description="Notes from all sections (dashboard + subpages)"
        />
      </div>
    </div>
  );
};

export default Index;
