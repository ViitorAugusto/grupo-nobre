'use client';

import { AlertCircle, Loader2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import type { InputLossReason, LossReasonMeta } from '@/shared/api/types';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Label } from '@/shared/ui/label';
import { RadioGroup, RadioGroupItem } from '@/shared/ui/radio-group';
import { Textarea } from '@/shared/ui/textarea';

type LossReasonDialogProps = {
  open: boolean;
  opportunityCode: string;
  reasons: LossReasonMeta[];
  pending: boolean;
  error: string | null;
  onConfirm: (reason: InputLossReason, text: string | undefined) => void;
  onCancel: () => void;
};

export function LossReasonDialog(props: LossReasonDialogProps) {
  return (
    <Dialog open={props.open} onOpenChange={(open) => !open && !props.pending && props.onCancel()}>
      <DialogContent>{props.open && <LossReasonForm {...props} />}</DialogContent>
    </Dialog>
  );
}

function LossReasonForm({
  opportunityCode,
  reasons,
  pending,
  error,
  onConfirm,
  onCancel,
}: LossReasonDialogProps) {
  const [reason, setReason] = useState<InputLossReason | ''>('');
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const selected = reasons.find((item) => item.code === reason);
  const missingReason = reason === '';
  const missingText = selected?.requiresText === true && text.trim() === '';

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (missingReason || missingText) return;
    onConfirm(reason as InputLossReason, text.trim() === '' ? undefined : text.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
      <DialogHeader>
        <DialogTitle>Marcar como perdida</DialogTitle>
        <DialogDescription>
          Qual o motivo da perda de <span className="font-data">{opportunityCode}</span>?
        </DialogDescription>
      </DialogHeader>

      <RadioGroup
        value={reason}
        onValueChange={(value) => setReason(value as InputLossReason)}
        aria-label="Motivo da perda"
        aria-invalid={submitted && missingReason}
        disabled={pending}
      >
        {reasons.map((item) => (
          <Label key={item.code} className="min-h-9 cursor-pointer font-normal">
            <RadioGroupItem value={item.code} />
            {item.label}
          </Label>
        ))}
      </RadioGroup>
      {submitted && missingReason && <p className="text-xs text-destructive">Escolha um motivo.</p>}

      {selected?.requiresText && (
        <div className="grid gap-2">
          <Label htmlFor="loss-reason-text">Descreva o motivo</Label>
          <Textarea
            id="loss-reason-text"
            value={text}
            maxLength={500}
            onChange={(event) => setText(event.target.value)}
            aria-invalid={submitted && missingText}
            disabled={pending}
            autoFocus
          />
          {submitted && missingText && (
            <p className="text-xs text-destructive">
              Descreva o motivo ao escolher &quot;{selected.label}&quot;.
            </p>
          )}
        </div>
      )}

      {error && (
        <p role="alert" className="flex items-center gap-1.5 text-xs text-destructive">
          <AlertCircle className="size-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
          Cancelar
        </Button>
        <Button type="submit" variant="destructive" disabled={pending}>
          {pending && <Loader2 className="animate-spin" aria-hidden />}
          {pending ? 'Marcando…' : 'Marcar como perdida'}
        </Button>
      </DialogFooter>
    </form>
  );
}
