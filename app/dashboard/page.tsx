import DashBoard from '@/components/features/dashboard/DashBoard';
import { requireAuth } from '@/lib/api-utils';
import DashboardLogin from './DashboardLogin';

export default async function DashboardPage() {
  const session = await requireAuth();

  if (!session) {
    return <DashboardLogin />;
  }

  // Sign-out lives in the console hero, not floated over the page.
  return <DashBoard />;
}
