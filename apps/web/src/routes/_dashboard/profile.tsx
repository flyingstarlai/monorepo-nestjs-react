import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_dashboard/profile')({
  beforeLoad: () => {
    throw redirect({
      to: '/account/profile',
    });
  },
});
