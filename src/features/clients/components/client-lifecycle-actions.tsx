"use client";

import { Loader2, PauseCircle, PlayCircle, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  useDeleteClientPermanently,
  useSetClientActiveStatus,
} from "../clients.queries";
import { Client } from "../clients.types";

type ClientLifecycleActionsProps = {
  client: Client;
  disabled?: boolean;
};

type PendingAction = "activate" | "deactivate" | "delete" | null;

export function ClientLifecycleActions({
  client,
  disabled = false,
}: ClientLifecycleActionsProps) {
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  const statusMutation = useSetClientActiveStatus();
  const deleteMutation = useDeleteClientPermanently();

  const isPending = statusMutation.isPending || deleteMutation.isPending;
  const isActive = client.isActive !== false;

  function closeDialog() {
    if (isPending) return;
    setPendingAction(null);
  }

  function confirmAction() {
    if (pendingAction === "delete") {
      deleteMutation.mutate(client.id, {
        onSuccess: () => setPendingAction(null),
      });
      return;
    }

    if (pendingAction === "activate" || pendingAction === "deactivate") {
      statusMutation.mutate(
        {
          id: client.id,
          isActive: pendingAction === "activate",
        },
        {
          onSuccess: () => setPendingAction(null),
        },
      );
    }
  }

  return (
    <>
      {isActive ? (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setPendingAction("deactivate")}
          disabled={disabled || isPending}
          className="border-amber-200 text-amber-700 hover:border-amber-300 hover:text-amber-800"
        >
          {statusMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <PauseCircle className="h-4 w-4" />
          )}
          تعطيل
        </Button>
      ) : (
        <>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPendingAction("activate")}
            disabled={disabled || isPending}
            className="border-emerald-200 text-emerald-700 hover:border-emerald-300 hover:text-emerald-800"
          >
            {statusMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <PlayCircle className="h-4 w-4" />
            )}
            تفعيل
          </Button>

          <Button
            size="sm"
            variant="danger"
            onClick={() => setPendingAction("delete")}
            disabled={disabled || isPending}
          >
            {deleteMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            حذف نهائي
          </Button>
        </>
      )}

      <ConfirmDialog
        open={pendingAction === "deactivate"}
        title="تأكيد تعطيل العميل"
        description={`سيتم تعطيل العميل: ${client.name}. لن يتم حذف أي فعالية أو تسجيل، وسيتوقف وصول حسابات العميل فورًا. يمكنك تفعيله لاحقًا.`}
        confirmText="تعطيل العميل"
        variant="gold"
        isLoading={statusMutation.isPending}
        onClose={closeDialog}
        onConfirm={confirmAction}
      />

      <ConfirmDialog
        open={pendingAction === "activate"}
        title="تأكيد تفعيل العميل"
        description={`سيتم تفعيل العميل: ${client.name}. ستتمكن حساباته النشطة من تسجيل الدخول مجددًا.`}
        confirmText="تفعيل العميل"
        variant="success"
        isLoading={statusMutation.isPending}
        onClose={closeDialog}
        onConfirm={confirmAction}
      />

      <ConfirmDialog
        open={pendingAction === "delete"}
        title="حذف العميل نهائيًا"
        description={`سيُحذف سجل العميل: ${client.name} نهائيًا، وستُعطّل حساباته وتُزال بيانات تسجيل دخولها. لا يمكن تنفيذ الحذف إذا كان لدى العميل فعاليات مرتبطة، ولا يمكن التراجع عن العملية.`}
        confirmText="حذف نهائي"
        variant="danger"
        isLoading={deleteMutation.isPending}
        onClose={closeDialog}
        onConfirm={confirmAction}
      />
    </>
  );
}
