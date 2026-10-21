'use client';

import { CircleX, Loader2, PhoneCall } from 'lucide-react';
import { useMeta } from '@/shared/api/meta';
import type { OpportunityDetail } from '@/shared/api/types';
import { AttentionBadge } from '@/shared/components/attention-badge';
import { FinalStageBadge } from '@/shared/components/final-stage-badge';
import { LossReasonDialog } from '@/shared/components/loss-reason-dialog';
import { Money } from '@/shared/components/money';
import { MoveToMenu } from '@/shared/components/move-to-menu';
import { useStageMoveFlow } from '@/shared/hooks/use-stage-move-flow';
import { formatCalendarDate, formatDaysWithoutContact } from '@/shared/lib/format';
import { stageLabel } from '@/shared/lib/labels';
import { Button } from '@/shared/ui/button';
import { DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { useRegisterContactAction } from '@/shared/hooks/use-register-contact-action';
import { StageHistory } from './stage-history';

type OpportunityDetailViewProps = { opportunity: OpportunityDetail };

export function OpportunityDetailView({ opportunity }: OpportunityDetailViewProps) {
  const { data: meta } = useMeta();
  const { requestMove, lossDialog } = useStageMoveFlow();
  const registerContact = useRegisterContactAction();
  const canBeLost = opportunity.allowedTransitions.includes('PERDIDA');

  return (
    <div className="grid gap-5">
      <DialogHeader>
        <p className="font-data text-xs font-medium text-muted-foreground">{opportunity.code}</p>
        <DialogTitle>{opportunity.company}</DialogTitle>
        <DialogDescription>
          {stageLabel(meta, opportunity.stage)} · {opportunity.seller.name}
        </DialogDescription>
      </DialogHeader>

      {(opportunity.attention.needsAttention || opportunity.isFinal) && (
        <section aria-label="Alertas" className="grid gap-2">
          <AttentionBadge reasons={opportunity.attention.reasons} mode="all" />
          <div>
            <FinalStageBadge {...opportunity} />
          </div>
        </section>
      )}

      {!opportunity.isFinal && (
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => registerContact.run(opportunity)}
            disabled={registerContact.isPending}
            className="max-sm:h-11"
          >
            {registerContact.isPending ? (
              <Loader2 className="animate-spin" aria-hidden />
            ) : (
              <PhoneCall aria-hidden />
            )}
            {registerContact.isPending ? 'Registrando…' : 'Registrar contato'}
          </Button>
          <MoveToMenu
            opportunity={opportunity}
            onMove={(toStage) => requestMove(opportunity, toStage)}
            size="default"
            className="max-sm:h-11"
          />
          {canBeLost && (
            <Button
              variant="outline"
              onClick={() => requestMove(opportunity, 'PERDIDA')}
              className="text-destructive max-sm:h-11"
            >
              <CircleX aria-hidden />
              Marcar como perdida
            </Button>
          )}
        </div>
      )}

      <section aria-labelledby="detail-commercial" className="grid gap-2">
        <h3 id="detail-commercial" className="text-sm font-semibold">
          Dados comerciais
        </h3>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
          <Field label="Valor estimado">
            <Money value={opportunity.estimatedValue} />
          </Field>
          <Field label="Último contato">
            <DateValue date={opportunity.lastContactDate} />
            {opportunity.daysWithoutContact !== null && (
              <span className="block text-xs text-muted-foreground">
                {formatDaysWithoutContact(opportunity.daysWithoutContact)}
              </span>
            )}
          </Field>
          <Field label="Validade da proposta">
            <DateValue date={opportunity.proposalValidUntil} />
          </Field>
          <Field label="Data do evento">
            <DateValue date={opportunity.eventDate} />
          </Field>
          <Field label="Vendedor">{opportunity.seller.name}</Field>
          <Field label="Etapa">{stageLabel(meta, opportunity.stage)}</Field>
        </dl>
      </section>

      <section aria-labelledby="detail-items" className="grid gap-2">
        <h3 id="detail-items" className="text-sm font-semibold">
          Itens
        </h3>
        {opportunity.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum item informado.</p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {opportunity.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-2 px-3 py-2 text-sm">
                <span>{item.product}</span>
                <span className="font-data tabular-nums text-muted-foreground">
                  {item.quantity} un.
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="detail-history" className="grid gap-2">
        <h3 id="detail-history" className="text-sm font-semibold">
          Histórico de etapas
        </h3>
        <StageHistory history={opportunity.history} />
      </section>

      <LossReasonDialog {...lossDialog} />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function DateValue({ date }: { date: string | null }) {
  if (date === null) return <span className="text-muted-foreground">Não informada</span>;
  return <span className="font-data tabular-nums">{formatCalendarDate(date)}</span>;
}
