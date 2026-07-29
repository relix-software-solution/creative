"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Building2,
  Edit,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Plus,
  RefreshCcw,
  Search,
  ShieldCheck,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
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
  useClientAccessAccount,
  useClients,
  useCreateClientWithAccessAccount,
  useSaveClientAccessAccount,
  useUpdateClient,
} from "@/features/clients/clients.queries";
import {
  ClientAccessAccountFormValues,
  ClientFormValues,
  CreateClientWithAccessAccountFormValues,
  clientAccessAccountSchema,
  clientSchema,
  createClientWithAccessAccountSchema,
} from "@/features/clients/clients.schema";
import { ClientLifecycleActions } from "@/features/clients/components/client-lifecycle-actions";
import { Client } from "@/features/clients/clients.types";

const PAGE_LIMIT = 20;

type OpenModal = "create" | "edit" | "account" | null;

const clientDefaults: ClientFormValues = {
  name: "",
  contactName: "",
  contactPhone: "",
  contactEmail: "",
  notes: "",
};

const createDefaults: CreateClientWithAccessAccountFormValues = {
  ...clientDefaults,
  accessFullName: "",
  accessEmail: "",
  accessPhone: "",
  password: "",
  confirmPassword: "",
};

const accountDefaults: ClientAccessAccountFormValues = {
  accountExists: false,
  fullName: "",
  email: "",
  phone: "",
  newPassword: "",
  confirmPassword: "",
};

function normalizeClientPayload(values: ClientFormValues) {
  return {
    name: values.name.trim(),
    contactName: values.contactName?.trim() || undefined,
    contactPhone: values.contactPhone?.trim() || undefined,
    contactEmail: values.contactEmail?.trim() || undefined,
    notes: values.notes?.trim() || undefined,
  };
}

function getClientInitial(name: string) {
  return name.trim().slice(0, 1).toUpperCase() || "C";
}

function getAccountStatusLabel(status: string | undefined) {
  switch (status) {
    case "ACTIVE":
      return "نشط";
    case "SUSPENDED":
      return "موقوف";
    case "INVITED":
      return "بانتظار التفعيل";
    case "DELETED":
      return "محذوف";
    default:
      return "غير معروف";
  }
}

function getAccountStatusVariant(status: string | undefined) {
  switch (status) {
    case "ACTIVE":
      return "success" as const;
    case "SUSPENDED":
      return "warning" as const;
    case "INVITED":
      return "gold" as const;
    case "DELETED":
      return "danger" as const;
    default:
      return "muted" as const;
  }
}

export default function ClientsPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [openModal, setOpenModal] = useState<OpenModal>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [showCreateConfirmation, setShowCreateConfirmation] = useState(false);
  const [showAccountPassword, setShowAccountPassword] = useState(false);
  const [showAccountConfirmation, setShowAccountConfirmation] = useState(false);

  const params = useMemo(
    () => ({
      page,
      limit: PAGE_LIMIT,
      search: search || undefined,
    }),
    [page, search],
  );

  const clientsQuery = useClients(params);
  const accessAccountQuery = useClientAccessAccount(
    selectedClient?.id,
    openModal === "account",
  );
  const createClientMutation = useCreateClientWithAccessAccount();
  const updateClientMutation = useUpdateClient();
  const saveAccessAccountMutation = useSaveClientAccessAccount();

  const createForm = useForm<CreateClientWithAccessAccountFormValues>({
    resolver: zodResolver(createClientWithAccessAccountSchema),
    defaultValues: createDefaults,
  });

  const editForm = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: clientDefaults,
  });

  const accountForm = useForm<ClientAccessAccountFormValues>({
    resolver: zodResolver(clientAccessAccountSchema),
    defaultValues: accountDefaults,
  });

  const clients = clientsQuery.data?.items ?? [];
  const total = clientsQuery.data?.total ?? clients.length;
  const totalPages = clientsQuery.data?.totalPages ?? 1;
  const isSearching = Boolean(search);

  const isBusy =
    createClientMutation.isPending ||
    updateClientMutation.isPending ||
    saveAccessAccountMutation.isPending;

  useEffect(() => {
    if (!clientsQuery.isSuccess) return;

    if (clients.length === 0 && page > 1) {
      const timeout = window.setTimeout(() => {
        setPage((value) => Math.max(1, value - 1));
      }, 0);

      return () => window.clearTimeout(timeout);
    }
  }, [clients.length, clientsQuery.isSuccess, page]);

  useEffect(() => {
    if (
      openModal !== "account" ||
      !selectedClient ||
      !accessAccountQuery.isSuccess
    ) {
      return;
    }

    const account = accessAccountQuery.data;

    accountForm.reset({
      accountExists: Boolean(account),
      fullName: account?.fullName ?? selectedClient.contactName ?? selectedClient.name,
      email: account?.email ?? selectedClient.contactEmail ?? "",
      phone: account?.phone ?? selectedClient.contactPhone ?? "",
      newPassword: "",
      confirmPassword: "",
    });
  }, [
    accessAccountQuery.data,
    accessAccountQuery.isSuccess,
    accountForm,
    openModal,
    selectedClient,
  ]);

  function closeModal() {
    if (isBusy) return;

    setOpenModal(null);
    setSelectedClient(null);
    setShowCreatePassword(false);
    setShowCreateConfirmation(false);
    setShowAccountPassword(false);
    setShowAccountConfirmation(false);
    createForm.reset(createDefaults);
    editForm.reset(clientDefaults);
    accountForm.reset(accountDefaults);
  }

  function openCreateModal() {
    setSelectedClient(null);
    createForm.reset(createDefaults);
    setOpenModal("create");
  }

  function openEditModal(client: Client) {
    setSelectedClient(client);
    editForm.reset({
      name: client.name ?? "",
      contactName: client.contactName ?? "",
      contactPhone: client.contactPhone ?? "",
      contactEmail: client.contactEmail ?? "",
      notes: client.notes ?? "",
    });
    setOpenModal("edit");
  }

  function openAccountModal(client: Client) {
    setSelectedClient(client);
    accountForm.reset(accountDefaults);
    setOpenModal("account");
  }

  function handleSearch() {
    setPage(1);
    setSearch(searchInput.trim());
  }

  function clearSearch() {
    setSearchInput("");
    setSearch("");
    setPage(1);
  }

  function submitCreate(values: CreateClientWithAccessAccountFormValues) {
    createClientMutation.mutate(
      {
        client: normalizeClientPayload(values),
        accessAccount: {
          fullName: values.accessFullName.trim(),
          email: values.accessEmail.trim(),
          phone: values.accessPhone?.trim() || undefined,
          password: values.password,
        },
      },
      {
        onSuccess: closeModal,
      },
    );
  }

  function submitEdit(values: ClientFormValues) {
    if (!selectedClient) return;

    updateClientMutation.mutate(
      {
        id: selectedClient.id,
        payload: normalizeClientPayload(values),
      },
      {
        onSuccess: closeModal,
      },
    );
  }

  function submitAccount(values: ClientAccessAccountFormValues) {
    if (!selectedClient) return;

    saveAccessAccountMutation.mutate(
      {
        clientId: selectedClient.id,
        accountExists: values.accountExists,
        account: {
          fullName: values.fullName.trim(),
          email: values.email.trim(),
          phone: values.phone?.trim() || undefined,
        },
        newPassword: values.newPassword || undefined,
      },
      {
        onSuccess: closeModal,
      },
    );
  }



  return (
    <div className="space-y-6" dir="rtl">
      <PageHeader
        eyebrow="Clients Management"
        title="إدارة العملاء"
        description="إنشاء الجهات المنظمة وإدارة بياناتها وحسابات الدخول الخاصة بلوحة العميل من مكان واحد."
        actions={
          <Button onClick={openCreateModal}>
            <Plus className="h-4 w-4" />
            إضافة عميل مع حساب دخول
          </Button>
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="overflow-hidden border-black/5 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-[#4B4B4B]/60">
                إجمالي العملاء
              </p>
              <h3 className="mt-2 text-3xl font-extrabold text-[#4B4B4B]">
                {clientsQuery.isLoading ? "..." : total}
              </h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#A88042]/10 text-[#A88042]">
              <Building2 className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden border-black/5 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-[#4B4B4B]/60">
                نتائج الصفحة الحالية
              </p>
              <h3 className="mt-2 text-3xl font-extrabold text-[#4B4B4B]">
                {clientsQuery.isLoading ? "..." : clients.length}
              </h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-[#A88042]">
              <Users className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden border-black/5 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-[#4B4B4B]/60">
                حالة البيانات
              </p>
              <h3 className="mt-2 text-xl font-extrabold text-[#4B4B4B]">
                {clientsQuery.isFetching ? "جاري التحديث" : "محدّثة"}
              </h3>
            </div>
            <Badge variant={clientsQuery.isFetching ? "warning" : "success"}>
              {clientsQuery.isFetching ? "Loading" : "Ready"}
            </Badge>
          </div>
        </Card>
      </section>

      <Card className="overflow-hidden border-black/5 shadow-sm">
        <CardContent>
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>قائمة العملاء</CardTitle>
              <CardDescription>
                عدّل بيانات العميل أو افتح إدارة حساب دخوله وكلمة مروره دون المرور بصفحة المستخدمين.
              </CardDescription>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative w-full sm:w-80">
                <Input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") handleSearch();
                  }}
                  placeholder="ابحث باسم العميل..."
                  icon={<Search className="h-5 w-5" />}
                />

                {searchInput ? (
                  <button
                    type="button"
                    onClick={() => setSearchInput("")}
                    className="absolute left-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-[#4B4B4B]/45 transition hover:bg-black/5 hover:text-[#4B4B4B]"
                    aria-label="مسح نص البحث"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>

              <Button variant="secondary" onClick={handleSearch}>
                بحث
              </Button>

              {search ? (
                <Button variant="outline" onClick={clearSearch}>
                  مسح
                </Button>
              ) : null}

              <Button
                variant="outline"
                onClick={() => clientsQuery.refetch()}
                disabled={clientsQuery.isFetching}
              >
                <RefreshCcw
                  className={`h-4 w-4 ${clientsQuery.isFetching ? "animate-spin" : ""}`}
                />
                تحديث
              </Button>
            </div>
          </div>

          {isSearching ? (
            <div className="mb-5 inline-flex rounded-full border border-[#A88042]/20 bg-[#A88042]/10 px-4 py-2 text-sm font-bold text-[#4B4B4B]">
              نتائج البحث عن: {search}
            </div>
          ) : null}

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
                  تحقق من الاتصال بالباك أو صلاحية جلسة الأدمن.
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
                  {isSearching ? "لا توجد نتائج مطابقة" : "لا يوجد عملاء بعد"}
                </p>
                <p className="mt-2 text-sm font-bold leading-6 text-[#4B4B4B]/60">
                  {isSearching
                    ? "جرّب تعديل كلمة البحث أو امسح البحث لعرض كل العملاء."
                    : "أنشئ أول عميل مع حساب دخوله حتى يتمكن من الوصول إلى لوحته مباشرة."}
                </p>
                <div className="mt-5 flex justify-center gap-2">
                  {isSearching ? (
                    <Button variant="outline" onClick={clearSearch}>
                      مسح البحث
                    </Button>
                  ) : null}
                  <Button onClick={openCreateModal}>
                    <Plus className="h-4 w-4" />
                    إضافة عميل
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-3xl border border-black/5">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#F8F8FF]">
                      <TableHead>اسم العميل</TableHead>
                      <TableHead>مسؤول التواصل</TableHead>
                      <TableHead>الهاتف</TableHead>
                      <TableHead>البريد</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {clients.map((client) => (
                      <TableRow
                        key={client.id}
                        className={client.isActive === false ? "bg-black/[0.02]" : undefined}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-black text-sm font-extrabold text-[#A88042]">
                              {getClientInitial(client.name)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-extrabold text-[#4B4B4B]">
                                {client.name}
                              </p>
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

                        <TableCell>
                          <Badge variant={client.isActive === false ? "muted" : "success"}>
                            {client.isActive === false ? "معطّل" : "نشط"}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <div className="flex min-w-max flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditModal(client)}
                              disabled={isBusy}
                            >
                              <Edit className="h-4 w-4" />
                              بيانات العميل
                            </Button>

                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => openAccountModal(client)}
                              disabled={isBusy}
                            >
                              <KeyRound className="h-4 w-4" />
                              حساب الدخول
                            </Button>

                            <ClientLifecycleActions
                              client={client}
                              disabled={isBusy}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-bold text-[#4B4B4B]/55">
                  الصفحة {page} من {totalPages} — عرض {clients.length} من أصل {total}
                </p>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    disabled={page <= 1 || clientsQuery.isFetching}
                    onClick={() => setPage((value) => Math.max(1, value - 1))}
                  >
                    السابق
                  </Button>
                  <Button
                    variant="outline"
                    disabled={page >= totalPages || clientsQuery.isFetching}
                    onClick={() =>
                      setPage((value) => Math.min(totalPages, value + 1))
                    }
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
        open={openModal === "create"}
        onClose={closeModal}
        title="إضافة عميل مع حساب دخول"
        description="سيُنشأ العميل وحسابه الأساسي ضمن عملية واحدة؛ إذا فشل أحدهما فلن يتم حفظ أي جزء."
        className="max-w-3xl"
        closeOnBackdrop={!createClientMutation.isPending}
        footer={
          <>
            <Button
              variant="outline"
              onClick={closeModal}
              disabled={createClientMutation.isPending}
            >
              إلغاء
            </Button>
            <Button
              onClick={createForm.handleSubmit(submitCreate)}
              isLoading={createClientMutation.isPending}
            >
              إنشاء العميل والحساب
            </Button>
          </>
        }
      >
        <form
          className="space-y-6"
          onSubmit={createForm.handleSubmit(submitCreate)}
        >
          <section className="space-y-4 rounded-3xl border border-black/5 bg-[#F8F8FF] p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#A88042]/10 text-[#A88042]">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-[#4B4B4B]">بيانات العميل</h3>
                <p className="text-xs font-bold text-[#4B4B4B]/55">
                  معلومات الجهة المنظمة والتواصل الإداري.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="اسم العميل *"
                placeholder="مثال: Creative Group"
                error={createForm.formState.errors.name?.message}
                disabled={createClientMutation.isPending}
                {...createForm.register("name")}
              />
              <Input
                label="مسؤول التواصل"
                placeholder="مدير العمليات"
                error={createForm.formState.errors.contactName?.message}
                disabled={createClientMutation.isPending}
                {...createForm.register("contactName")}
              />
              <Input
                label="هاتف التواصل"
                placeholder="+963944000001"
                error={createForm.formState.errors.contactPhone?.message}
                disabled={createClientMutation.isPending}
                {...createForm.register("contactPhone")}
              />
              <Input
                label="بريد التواصل"
                type="email"
                placeholder="contact@example.com"
                error={createForm.formState.errors.contactEmail?.message}
                disabled={createClientMutation.isPending}
                {...createForm.register("contactEmail")}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-[#4B4B4B]">ملاحظات</label>
              <textarea
                {...createForm.register("notes")}
                rows={3}
                disabled={createClientMutation.isPending}
                placeholder="أي ملاحظات إدارية إضافية..."
                className="w-full resize-none rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-bold text-[#4B4B4B] outline-none transition placeholder:text-[#4B4B4B]/40 focus:border-[#A88042] focus:ring-4 focus:ring-[#A88042]/10 disabled:cursor-not-allowed disabled:bg-black/5"
              />
            </div>
          </section>

          <section className="space-y-4 rounded-3xl border border-[#A88042]/15 bg-[#A88042]/5 p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black text-[#A88042]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-[#4B4B4B]">
                  حساب الدخول الأساسي
                </h3>
                <p className="text-xs font-bold text-[#4B4B4B]/55">
                  سيستخدمه العميل لتسجيل الدخول إلى المسار /client.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="اسم المستخدم *"
                placeholder="مدير حساب العميل"
                error={createForm.formState.errors.accessFullName?.message}
                disabled={createClientMutation.isPending}
                {...createForm.register("accessFullName")}
              />
              <Input
                label="بريد تسجيل الدخول *"
                type="email"
                dir="ltr"
                placeholder="portal@example.com"
                error={createForm.formState.errors.accessEmail?.message}
                disabled={createClientMutation.isPending}
                {...createForm.register("accessEmail")}
              />
              <Input
                label="هاتف حساب الدخول"
                dir="ltr"
                placeholder="+963944000002"
                error={createForm.formState.errors.accessPhone?.message}
                disabled={createClientMutation.isPending}
                {...createForm.register("accessPhone")}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="relative">
                <Input
                  label="كلمة المرور *"
                  type={showCreatePassword ? "text" : "password"}
                  dir="ltr"
                  autoComplete="new-password"
                  error={createForm.formState.errors.password?.message}
                  disabled={createClientMutation.isPending}
                  {...createForm.register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowCreatePassword((value) => !value)}
                  className="absolute left-3 top-9 flex h-8 w-8 items-center justify-center rounded-xl text-[#4B4B4B]/50 transition hover:bg-black/5"
                  aria-label={showCreatePassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                >
                  {showCreatePassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              <div className="relative">
                <Input
                  label="تأكيد كلمة المرور *"
                  type={showCreateConfirmation ? "text" : "password"}
                  dir="ltr"
                  autoComplete="new-password"
                  error={createForm.formState.errors.confirmPassword?.message}
                  disabled={createClientMutation.isPending}
                  {...createForm.register("confirmPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowCreateConfirmation((value) => !value)}
                  className="absolute left-3 top-9 flex h-8 w-8 items-center justify-center rounded-xl text-[#4B4B4B]/50 transition hover:bg-black/5"
                  aria-label={
                    showCreateConfirmation
                      ? "إخفاء تأكيد كلمة المرور"
                      : "إظهار تأكيد كلمة المرور"
                  }
                >
                  {showCreateConfirmation ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </section>
        </form>
      </Modal>

      <Modal
        open={openModal === "edit"}
        onClose={closeModal}
        title="تعديل بيانات العميل"
        description="هذه البيانات إدارية ومنفصلة عن بيانات حساب تسجيل الدخول."
        closeOnBackdrop={!updateClientMutation.isPending}
        footer={
          <>
            <Button
              variant="outline"
              onClick={closeModal}
              disabled={updateClientMutation.isPending}
            >
              إلغاء
            </Button>
            <Button
              onClick={editForm.handleSubmit(submitEdit)}
              isLoading={updateClientMutation.isPending}
            >
              حفظ التعديلات
            </Button>
          </>
        }
      >
        <form className="grid gap-4" onSubmit={editForm.handleSubmit(submitEdit)}>
          <Input
            label="اسم العميل *"
            error={editForm.formState.errors.name?.message}
            disabled={updateClientMutation.isPending}
            {...editForm.register("name")}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="مسؤول التواصل"
              error={editForm.formState.errors.contactName?.message}
              disabled={updateClientMutation.isPending}
              {...editForm.register("contactName")}
            />
            <Input
              label="رقم الهاتف"
              dir="ltr"
              error={editForm.formState.errors.contactPhone?.message}
              disabled={updateClientMutation.isPending}
              {...editForm.register("contactPhone")}
            />
          </div>
          <Input
            label="البريد الإلكتروني"
            type="email"
            dir="ltr"
            error={editForm.formState.errors.contactEmail?.message}
            disabled={updateClientMutation.isPending}
            {...editForm.register("contactEmail")}
          />
          <div className="space-y-2">
            <label className="text-sm font-bold text-[#4B4B4B]">ملاحظات</label>
            <textarea
              {...editForm.register("notes")}
              rows={4}
              disabled={updateClientMutation.isPending}
              className="w-full resize-none rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-bold text-[#4B4B4B] outline-none transition focus:border-[#A88042] focus:ring-4 focus:ring-[#A88042]/10 disabled:cursor-not-allowed disabled:bg-black/5"
            />
          </div>
        </form>
      </Modal>

      <Modal
        open={openModal === "account"}
        onClose={closeModal}
        title="إدارة حساب دخول العميل"
        description={
          selectedClient
            ? `إدارة الحساب الأساسي المرتبط بالعميل: ${selectedClient.name}`
            : "إدارة حساب الدخول الأساسي"
        }
        className="max-w-2xl"
        closeOnBackdrop={!saveAccessAccountMutation.isPending}
        footer={
          accessAccountQuery.isLoading || accessAccountQuery.isError ? undefined : (
            <>
              <Button
                variant="outline"
                onClick={closeModal}
                disabled={saveAccessAccountMutation.isPending}
              >
                إلغاء
              </Button>
              <Button
                onClick={accountForm.handleSubmit(submitAccount)}
                isLoading={saveAccessAccountMutation.isPending}
              >
                {accessAccountQuery.data ? "حفظ حساب الدخول" : "إنشاء حساب الدخول"}
              </Button>
            </>
          )
        }
      >
        {accessAccountQuery.isLoading ? (
          <div className="flex min-h-64 items-center justify-center">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#A88042]" />
              <p className="mt-3 text-sm font-bold text-[#4B4B4B]/60">
                جاري تحميل حساب الدخول...
              </p>
            </div>
          </div>
        ) : accessAccountQuery.isError ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="font-extrabold text-red-700">
              تعذر تحميل حساب دخول العميل
            </p>
            <p className="mt-2 text-sm font-bold text-red-600/70">
              لم يتم إجراء أي تعديل. أعد المحاولة بعد التحقق من الباك.
            </p>
            <Button
              className="mt-4"
              variant="danger"
              onClick={() => accessAccountQuery.refetch()}
            >
              إعادة المحاولة
            </Button>
          </div>
        ) : (
          <form
            className="space-y-5"
            onSubmit={accountForm.handleSubmit(submitAccount)}
          >
            {accessAccountQuery.data ? (
              <div className="flex flex-col gap-3 rounded-3xl border border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm">
                    <UserRound className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-extrabold text-emerald-900">
                      يوجد حساب دخول أساسي
                    </p>
                    <p className="mt-1 text-xs font-bold text-emerald-800/65">
                      لن يتم عرض كلمة المرور الحالية، ويمكن فقط تعيين كلمة جديدة.
                    </p>
                  </div>
                </div>
                <Badge variant={getAccountStatusVariant(accessAccountQuery.data.status)}>
                  {getAccountStatusLabel(accessAccountQuery.data.status)}
                </Badge>
              </div>
            ) : (
              <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4">
                <p className="font-extrabold text-amber-900">
                  هذا عميل قديم بدون حساب دخول أساسي
                </p>
                <p className="mt-2 text-sm font-bold leading-6 text-amber-800/70">
                  أدخل البيانات التالية لإنشاء حساب CLIENT_VIEWER وربطه كحساب أساسي للعميل.
                </p>
              </div>
            )}


            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="اسم المستخدم *"
                error={accountForm.formState.errors.fullName?.message}
                disabled={saveAccessAccountMutation.isPending}
                {...accountForm.register("fullName")}
              />
              <Input
                label="بريد تسجيل الدخول *"
                type="email"
                dir="ltr"
                error={accountForm.formState.errors.email?.message}
                disabled={saveAccessAccountMutation.isPending}
                {...accountForm.register("email")}
              />
            </div>

            <Input
              label="هاتف حساب الدخول"
              dir="ltr"
              error={accountForm.formState.errors.phone?.message}
              disabled={saveAccessAccountMutation.isPending}
              {...accountForm.register("phone")}
            />

            <section className="space-y-4 rounded-3xl border border-black/5 bg-[#F8F8FF] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black text-[#A88042]">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-extrabold text-[#4B4B4B]">
                    {accessAccountQuery.data
                      ? "تعيين كلمة مرور جديدة"
                      : "كلمة مرور الحساب"}
                  </p>
                  <p className="text-xs font-bold text-[#4B4B4B]/55">
                    {accessAccountQuery.data
                      ? "اترك الحقلين فارغين لإبقاء كلمة المرور الحالية دون تغيير."
                      : "مطلوبة لإنشاء الحساب، وبحد أدنى 8 أحرف."}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="relative">
                  <Input
                    label={accessAccountQuery.data ? "كلمة المرور الجديدة" : "كلمة المرور *"}
                    type={showAccountPassword ? "text" : "password"}
                    dir="ltr"
                    autoComplete="new-password"
                    error={accountForm.formState.errors.newPassword?.message}
                    disabled={saveAccessAccountMutation.isPending}
                    {...accountForm.register("newPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowAccountPassword((value) => !value)}
                    className="absolute left-3 top-9 flex h-8 w-8 items-center justify-center rounded-xl text-[#4B4B4B]/50 transition hover:bg-black/5"
                    aria-label={showAccountPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                  >
                    {showAccountPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                <div className="relative">
                  <Input
                    label={
                      accessAccountQuery.data
                        ? "تأكيد كلمة المرور الجديدة"
                        : "تأكيد كلمة المرور *"
                    }
                    type={showAccountConfirmation ? "text" : "password"}
                    dir="ltr"
                    autoComplete="new-password"
                    error={accountForm.formState.errors.confirmPassword?.message}
                    disabled={saveAccessAccountMutation.isPending}
                    {...accountForm.register("confirmPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowAccountConfirmation((value) => !value)}
                    className="absolute left-3 top-9 flex h-8 w-8 items-center justify-center rounded-xl text-[#4B4B4B]/50 transition hover:bg-black/5"
                    aria-label={
                      showAccountConfirmation
                        ? "إخفاء تأكيد كلمة المرور"
                        : "إظهار تأكيد كلمة المرور"
                    }
                  >
                    {showAccountConfirmation ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {accessAccountQuery.data && accountForm.watch("newPassword") ? (
                <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold leading-6 text-amber-800">
                  عند تغيير كلمة المرور سيتم إلغاء Refresh Tokens القديمة، وسيحتاج العميل إلى تسجيل الدخول مجددًا.
                </p>
              ) : null}
            </section>
          </form>
        )}
      </Modal>


    </div>
  );
}
