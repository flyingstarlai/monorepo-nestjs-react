import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_dashboard/admin/templates/$id/')({
  loader: ({ params }) => {
    const { id } = params;
    // Redirect old route URLs to new edit route
    throw redirect({
      to: '/admin/templates/$id/edit',
      params: { id },
    });
  },
});