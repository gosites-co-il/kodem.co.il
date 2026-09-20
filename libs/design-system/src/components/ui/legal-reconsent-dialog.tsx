'use client';

import * as React from 'react';
import { Button } from './button';
import { Checkbox } from './checkbox';
import { Label } from './label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog';

export type LegalReconsentDialogProps = {
  open: boolean;
  title: string;
  version: string;
  summary: string;
  documentHref: string;
  documentLinkLabel?: string;
  checkboxLabel?: string;
  confirmLabel?: string;
  onConfirm: () => void | Promise<void>;
  onOpenChange?: (open: boolean) => void;
  busy?: boolean;
};

export function LegalReconsentDialog({
  open,
  title,
  version,
  summary,
  documentHref,
  documentLinkLabel = 'קרא את התנאים',
  checkboxLabel = 'קראתי ואני מסכים/ה לתנאים המעודכנים',
  confirmLabel = 'אישור והמשך',
  onConfirm,
  onOpenChange,
  busy = false,
}: LegalReconsentDialogProps) {
  const [accepted, setAccepted] = React.useState(false);

  React.useEffect(() => {
    if (open) setAccepted(false);
  }, [open, title, version]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dir="rtl"
        className="sm:max-w-md [&>button]:hidden"
        onPointerDownOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
      >
        <DialogHeader className="text-right sm:text-right">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="text-right leading-relaxed">
            {summary}
            <span className="mt-2 block text-foreground">
              גרסה {version} זמינה לקריאה.
            </span>
          </DialogDescription>
        </DialogHeader>

        <a
          href={documentHref}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-medium text-foreground underline underline-offset-4"
        >
          {documentLinkLabel}
        </a>

        <div className="flex items-start gap-3">
          <Checkbox
            id="legal-reconsent"
            checked={accepted}
            onCheckedChange={(value) => setAccepted(value === true)}
          />
          <Label
            htmlFor="legal-reconsent"
            className="cursor-pointer text-sm leading-relaxed font-normal"
          >
            {checkboxLabel}
          </Label>
        </div>

        <DialogFooter className="sm:justify-start">
          <Button
            type="button"
            disabled={!accepted || busy}
            onClick={() => void onConfirm()}
            className="w-full sm:w-auto"
          >
            {busy ? 'שומר…' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
