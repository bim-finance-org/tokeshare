import DashBoard from '@/components/features/dashboard/DashBoard';
import { requireAuth } from '@/lib/api-utils';
import DashboardLogin from './DashboardLogin';
import SignOutButton from './SignOutButton';

export default async function DashboardPage() {
  const session = await requireAuth();

  if (!session) {
    return <DashboardLogin />;
  }

  return (
    <div>
      <DashBoard />
      <div className="absolute top-4 right-4">
        <SignOutButton />
      </div>
    </div>
  );
}
