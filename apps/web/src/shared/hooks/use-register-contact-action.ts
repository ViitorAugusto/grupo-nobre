'use client';

import { toast } from 'sonner';
import { useRegisterContact } from '@/shared/api/opportunities';

export function useRegisterContactAction() {
  const registerContact = useRegisterContact();

  function run(opportunity: { id: string; code: string }) {
    registerContact.mutate(
      { id: opportunity.id },
      {
        onSuccess: () => toast.success(`Contato registrado em ${opportunity.code}`),
        onError: (error) =>
          toast.error(error.message, {
            action: error.isRetryable
              ? { label: 'Tentar novamente', onClick: () => run(opportunity) }
              : undefined,
          }),
      },
    );
  }

  return {
    run,
    isPending: registerContact.isPending,
    pendingId: registerContact.isPending ? registerContact.variables?.id : undefined,
  };
}
