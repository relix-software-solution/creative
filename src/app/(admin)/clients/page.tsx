"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Building2,
  Edit,
  Loader2,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useClients,
  useCreateClient,
  useDeleteClient,
  useUpdateClient,
} from "@/features/clients/clients.queries";
import {
  ClientFormValues,
  clientSchema,
} from "@/features/clients/clients.schema";
import { Client } from "@/features/clients/clients.types";
import { toast } from "sonner";

type PendingAction = "create" | "update" | "delete" | null;

export default function ClientsPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [pendingValues, setPendingValues] = useState<ClientFormValues | null>(
    null,
  );

  const params = useMemo(
    () => ({
      page,
      limit: 20,
      search: search || undefined,
    }),
    [page, search],
  );

  const clientsQuery = useClients(params);
  const createClientMutation = useCreateClient();
  const updateClientMutation = useUpdateClient();
  const deleteClientMutation = useDeleteClient();

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: "",
      contactName: "",
      contactPhone: "",
      contactEmail: "",
      notes: "",
    },
  });

  const clients = clientsQuery.data?.items ?? [];
  const total = clientsQuery.data?.total ?? clients.length;
  const totalPages = clientsQuery.data?.totalPages ?? 1;

  const isSubmitting =
    createClientMutation.isPending ||
    updateClientMutation.isPending ||
    deleteClientMutation.isPending;

  function openCreateModal() {
    setSelectedClient(null);
    form.reset({
      name: "",
      contactName: "",
      contactPhone: "",
      contactEmail: "",
      notes: "",
    });
    setFormModalOpen(true);
  }

  function openEditModal(client: Client) {
    setSelectedClient(client);
    form.reset({
      name: client.name ?? "",
      contactName: client.contactName ?? "",
      contactPhone: client.contactPhone ?? "",
      contactEmail: client.contactEmail ?? "",
      notes: client.notes ?? "",
    });
    setFormModalOpen(true);
  }

  function closeFormModal() {
    if (isSubmitting) return;
    setFormModalOpen(false);
    setSelectedClient(null);
    setPendingValues(null);
    form.reset();
  }

  function closeConfirm() {
    if (isSubmitting) return;
    setConfirmOpen(false);
    setPendingAction(null);
    setPendingValues(null);
  }

  function handleSearch() {
    setPage(1);
    setSearch(searchInput.trim());
  }

  function requestSubmit(values: ClientFormValues) {
    setPendingValues(values);
    setPendingAction(selectedClient ? "update" : "create");
    setConfirmOpen(true);
  }

  function requestDelete(client: Client) {
    setSelectedClient(client);
    setPendingAction("delete");
    setConfirmOpen(true);
  }

  function normalizePayload(values: ClientFormValues) {
    return {
      name: values.name.trim(),
      contactName: values.contactName?.trim() || undefined,
      contactPhone: values.contactPhone?.trim() || undefined,
      contactEmail: values.contactEmail?.trim() || undefined,
      notes: values.notes?.trim() || undefined,
    };
  }

  function confirmAction() {
    if (pendingAction === "delete" && selectedClient) {
      deleteClientMutation.mutate(selectedClient.id, {
        onSuccess: () => {
          closeConfirm();
          setSelectedClient(null);
        },
      });

      return;
    }

    if (!pendingValues) return;

    const payload = normalizePayload(pendingValues);

    if (pendingAction === "update" && selectedClient) {
      updateClientMutation.mutate(
        {
          id: selectedClient.id,
          payload,
        },
        {
          onSuccess: () => {
            closeConfirm();
            closeFormModal();
          },
        },
      );

      return;
    }

    if (pendingAction === "create") {
      createClientMutation.mutate(payload, {
        onSuccess: () => {
          closeConfirm();
          closeFormModal();
        },
      });
    }
  }

  const confirmTitle =
    pendingAction === "create"
      ? "تأكيد إضافة العميل"
      : pendingAction === "update"
        ? "تأكيد تعديل العميل"
        : "تأكيد حذف العميل";

  const confirmDescription =
    pendingAction === "create"
      ? "سيتم إنشاء عميل جديد وربطه لاحقًا بالفعاليات."
      : pendingAction === "update"
        ? `سيتم تعديل بيانات العميل: ${selectedClient?.name ?? ""}.`
        : `سيتم حذف العميل: ${selectedClient?.name ?? ""}. تأكد أن هذا العميل غير مرتبط بفعاليات مهمة قبل المتابعة.`;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Clients Management"
        title="إدارة العملاء"
        description="إدارة الجهات المنظمة التي ترتبط بها الفعاليات. كل فعالية يجب أن تكون تابعة لعميل."
        actions={
          <Button onClick={openCreateModal}>
            <Plus className="h-4 w-4" />
            إضافة عميل
          </Button>
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-[#4B4B4B]/60">
                إجمالي العملاء
              </p>
              <h3 className="mt-2 text-3xl font-extrabold text-[#4B4B4B]">
                {total}
              </h3>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#A88042]/10 text-[#A88042]">
              <Building2 className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-[#4B4B4B]/60">
                نتائج الصفحة
              </p>
              <h3 className="mt-2 text-3xl font-extrabold text-[#4B4B4B]">
                {clients.length}
              </h3>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-[#A88042]">
              <Users className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-[#4B4B4B]/60">
                حالة البيانات
              </p>
              <h3 className="mt-2 text-xl font-extrabold text-[#4B4B4B]">
                {clientsQuery.isFetching ? "تحديث..." : "مستقرة"}
              </h3>
            </div>

            <Badge variant={clientsQuery.isFetching ? "warning" : "success"}>
              {clientsQuery.isFetching ? "Loading" : "Ready"}
            </Badge>
          </div>
        </Card>
      </section>

      <Card>
        <CardContent>
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>قائمة العملاء</CardTitle>
              <CardDescription>
                استعرض العملاء، ابحث عن جهة منظمة، أو عدّل بيانات التواصل.
              </CardDescription>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="w-full sm:w-80">
                <Input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      handleSearch();
                    }
                  }}
                  placeholder="ابحث باسم العميل..."
                  icon={<Search className="h-5 w-5" />}
                />
              </div>

              <Button variant="secondary" onClick={handleSearch}>
                بحث
              </Button>

              {search ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchInput("");
                    setSearch("");
                    setPage(1);
                  }}
                >
                  مسح
                </Button>
              ) : null}
            </div>
          </div>

          {clientsQuery.isLoading ? (
            <div className="flex min-h-[320px] items-center justify-center rounded-[1.5rem] border border-black/10 bg-[#F8F8FF]">
              <div className="text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#A88042]" />
                <p className="mt-3 text-sm font-bold text-[#4B4B4B]/60">
                  جاري تحميل العملاء...
                </p>
              </div>
            </div>
          ) : clientsQuery.isError ? (
            <div className="flex min-h-[320px] items-center justify-center rounded-[1.5rem] border border-red-200 bg-red-50">
              <div className="text-center">
                <p className="text-lg font-extrabold text-red-700">
                  تعذر تحميل العملاء
                </p>
                <p className="mt-2 text-sm font-bold text-red-600/70">
                  تحقق من الاتصال بالباك أو صلاحية الجلسة.
                </p>
                <Button
                  className="mt-4"
                  variant="danger"
                  onClick={() => clientsQuery.refetch()}
                >
                  إعادة المحاولة
                </Button>
              </div>
            </div>
          ) : clients.length === 0 ? (
            <div className="flex min-h-[320px] items-center justify-center rounded-[1.5rem] border border-black/10 bg-[#F8F8FF]">
              <div className="max-w-sm text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#A88042]/10 text-[#A88042]">
                  <Building2 className="h-7 w-7" />
                </div>
                <p className="text-lg font-extrabold text-[#4B4B4B]">
                  لا يوجد عملاء بعد
                </p>
                <p className="mt-2 text-sm font-bold leading-6 text-[#4B4B4B]/60">
                  ابدأ بإضافة أول عميل حتى تتمكن لاحقًا من إنشاء فعالية مرتبطة
                  به.
                </p>
                <Button className="mt-5" onClick={openCreateModal}>
                  <Plus className="h-4 w-4" />
                  إضافة عميل
                </Button>
              </div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>اسم العميل</TableHead>
                    <TableHead>مسؤول التواصل</TableHead>
                    <TableHead>الهاتف</TableHead>
                    <TableHead>البريد</TableHead>
                    <TableHead>ملاحظات</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {clients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-black text-sm font-extrabold text-[#A88042]">
                            {client.name.slice(0, 1)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-extrabold">{client.name}</p>
                            <p className="mt-1 text-xs font-bold text-[#4B4B4B]/45">
                              ID: {client.id.slice(0, 8)}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>{client.contactName || "—"}</TableCell>

                      <TableCell dir="ltr" className="text-right">
                        {client.contactPhone || "—"}
                      </TableCell>

                      <TableCell>{client.contactEmail || "—"}</TableCell>

                      <TableCell className="max-w-[240px] truncate">
                        {client.notes || "—"}
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditModal(client)}
                          >
                            <Edit className="h-4 w-4" />
                            تعديل
                          </Button>

                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => requestDelete(client)}
                          >
                            <Trash2 className="h-4 w-4" />
                            حذف
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-bold text-[#4B4B4B]/55">
                  الصفحة {page} من {totalPages}
                </p>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    disabled={page <= 1}
                    onClick={() => setPage((value) => Math.max(1, value - 1))}
                  >
                    السابق
                  </Button>

                  <Button
                    variant="outline"
                    disabled={page >= totalPages}
                    onClick={() => setPage((value) => value + 1)}
                  >
                    التالي
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Modal
        open={formModalOpen}
        onClose={closeFormModal}
        title={selectedClient ? "تعديل العميل" : "إضافة عميل جديد"}
        description={
          selectedClient
            ? "عدّل بيانات العميل ومعلومات التواصل، ثم أكّد العملية قبل الحفظ."
            : "أدخل بيانات الجهة المنظمة، ثم أكّد العملية قبل إنشاء العميل."
        }
        footer={
          <>
            <Button
              variant="outline"
              onClick={closeFormModal}
              disabled={isSubmitting}
            >
              إلغاء
            </Button>
            <Button
              onClick={form.handleSubmit(requestSubmit)}
              disabled={isSubmitting}
            >
              {selectedClient ? "متابعة التعديل" : "متابعة الإضافة"}
            </Button>
          </>
        }
      >
        <form
          className="grid gap-4"
          onSubmit={form.handleSubmit(requestSubmit)}
        >
          <Input
            label="اسم العميل"
            placeholder="مثال: Creative Group"
            error={form.formState.errors.name?.message}
            {...form.register("name")}
          />

          <Input
            label="مسؤول التواصل"
            placeholder="مثال: مدير العمليات"
            error={form.formState.errors.contactName?.message}
            {...form.register("contactName")}
          />

          <Input
            label="رقم الهاتف"
            placeholder="+963944000001"
            error={form.formState.errors.contactPhone?.message}
            {...form.register("contactPhone")}
          />

          <Input
            label="البريد الإلكتروني"
            placeholder="client@example.com"
            error={form.formState.errors.contactEmail?.message}
            {...form.register("contactEmail")}
          />

          <div className="space-y-2">
            <label className="text-sm font-bold text-[#4B4B4B]">ملاحظات</label>
            <textarea
              {...form.register("notes")}
              rows={4}
              placeholder="أي ملاحظات إضافية..."
              className="w-full resize-none rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-bold text-[#4B4B4B] outline-none transition placeholder:text-[#4B4B4B]/40 focus:border-[#A88042] focus:ring-4 focus:ring-[#A88042]/10"
            />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        title={confirmTitle}
        description={confirmDescription}
        confirmText={
          pendingAction === "create"
            ? "تأكيد الإضافة"
            : pendingAction === "update"
              ? "تأكيد التعديل"
              : "تأكيد الحذف"
        }
        variant={pendingAction === "delete" ? "danger" : "gold"}
        isLoading={isSubmitting}
        onClose={closeConfirm}
        onConfirm={confirmAction}
      />
    </div>
  );
}
