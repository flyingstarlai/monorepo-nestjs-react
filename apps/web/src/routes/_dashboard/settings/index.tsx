import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_dashboard/settings/')({
  beforeLoad: async () => {
    throw redirect({
      to: '/settings/profile',
    });
  },
});
