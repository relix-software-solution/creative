"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  CheckCircle2,
  Edit,
  KeyRound,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserCog,
  UserRound,
  Users,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
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
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useClients } from "@/features/clients/clients.queries";
import {
  createUserSchema,
  resetUserPasswordSchema,
  ResetUserPasswordFormValues,
  updateUserSchema,
  UserFormValues,
} from "@/features/users/users.schema";
import {
  useActivateUser,
  useCreateUser,
  useDeleteUser,
  useResetUserPassword,
  useSuspendUser,
  useUpdateUser,
  useUsers,
} from "@/features/users/users.queries";
import { User, UserRole, UserStatus } from "@/features/users/users.types";

type UserModalMode = "create" | "edit";
type PendingAction = "activate" | "suspend" | "delete" | null;

const roleLabels: Record<string, string> = {
  ADMIN: "مدير النظام",
  STAFF: "موظف تشغيل",
  CLIENT_VIEWER: "متابع عميل",
};

const statusLabels: Record<string, string> = {
  ACTIVE: "فعّال",
  SUSPENDED: "موقوف",
  DELETED: "محذوف",
};

function getRoleVariant(
  role?: UserRole | null,
): "gold" | "black" | "muted" | "success" | "warning" | "danger" {
  if (role === "ADMIN") return "black";
  if (role === "STAFF") return "gold";
  if (role === "CLIENT_VIEWER") return "success";
  return "muted";
}

function getStatusVariant(
  status?: UserStatus | null,
): "success" | "warning" | "danger" | "muted" | "gold" {
  if (!status || status === "ACTIVE") return "success";
  if (status === "SUSPENDED") return "warning";
  if (status === "DELETED") return "danger";
  return "muted";
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("ar-SY", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [clientFilter, setClientFilter] = useState("");

  const [userModalOpen, setUserModalOpen] = useState(false);
  const [userModalMode, setUserModalMode] = useState<UserModalMode>("create");

  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  const usersParams = useMemo(
    () => ({
      page,
      limit: 20,
      search: search || undefined,
      role: roleFilter || undefined,
      status: statusFilter || undefined,
      clientId: clientFilter || undefined,
    }),
    [page, search, roleFilter, statusFilter, clientFilter],
  );

  const usersQuery = useUsers(usersParams);
  const clientsQuery = useClients({ page: 1, limit: 100 });

  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const activateUserMutation = useActivateUser();
  const suspendUserMutation = useSuspendUser();
  const deleteUserMutation = useDeleteUser();
  const resetPasswordMutation = useResetUserPassword();

  const users = usersQuery.data?.items ?? [];
  const clients = clientsQuery.data?.items ?? [];
  const total = usersQuery.data?.total ?? users.length;
  const totalPages = usersQuery.data?.totalPages ?? 1;

  const form = useForm<UserFormValues>({
    resolver: zodResolver(
      userModalMode === "create" ? createUserSchema : updateUserSchema,
    ),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      password: "",
      role: "STAFF",
      clientId: "",
    },
  });

  const passwordForm = useForm<ResetUserPasswordFormValues>({
    resolver: zodResolver(resetUserPasswordSchema),
    defaultValues: {
      newPassword: "",
    },
  });

  const selectedRole = form.watch("role");

  const isUserSubmitting =
    createUserMutation.isPending || updateUserMutation.isPending;

  const isActionSubmitting =
    activateUserMutation.isPending ||
    suspendUserMutation.isPending ||
    deleteUserMutation.isPending;

  function openCreateModal() {
    setUserModalMode("create");
    setSelectedUser(null);
    form.reset({
      fullName: "",
      email: "",
      phone: "",
      password: "",
      role: "STAFF",
      clientId: "",
    });
    setUserModalOpen(true);
  }

  function openEditModal(user: User) {
    setUserModalMode("edit");
    setSelectedUser(user);
    form.reset({
      fullName: user.fullName ?? "",
      email: user.email ?? "",
      phone: user.phone ?? "",
      password: "",
      role:
        user.role === "CLIENT_VIEWER" || user.role === "STAFF"
          ? user.role
          : "STAFF",
      clientId: user.clientId ?? "",
    });
    setUserModalOpen(true);
  }

  function closeUserModal() {
    if (isUserSubmitting) return;
    setUserModalOpen(false);
    setSelectedUser(null);
    form.reset();
  }

  function openPasswordModal(user: User) {
    setSelectedUser(user);
    passwordForm.reset({
      newPassword: "",
    });
    setPasswordModalOpen(true);
  }

  function closePasswordModal() {
    if (resetPasswordMutation.isPending) return;
    setPasswordModalOpen(false);
    setSelectedUser(null);
    passwordForm.reset();
  }

  function requestAction(user: User, action: PendingAction) {
    setSelectedUser(user);
    setPendingAction(action);
    setConfirmOpen(true);
  }

  function closeConfirm() {
    if (isActionSubmitting) return;
    setConfirmOpen(false);
    setSelectedUser(null);
    setPendingAction(null);
  }

  const submitUser: SubmitHandler<UserFormValues> = (values) => {
    if (userModalMode === "create") {
      createUserMutation.mutate(
        {
          fullName: values.fullName.trim(),
          email: values.email?.trim() || undefined,
          phone: values.phone?.trim() || undefined,
          password: values.password ?? "",
          role: values.role,
          clientId:
            values.role === "CLIENT_VIEWER" ? values.clientId : undefined,
        },
        {
          onSuccess: closeUserModal,
        },
      );

      return;
    }

    if (!selectedUser) return;

    updateUserMutation.mutate(
      {
        id: selectedUser.id,
        payload: {
          fullName: values.fullName.trim(),
          email: values.email?.trim() || undefined,
          phone: values.phone?.trim() || undefined,
          role: values.role,
          clientId: values.role === "CLIENT_VIEWER" ? values.clientId : null,
        },
      },
      {
        onSuccess: closeUserModal,
      },
    );
  };

  const submitPassword: SubmitHandler<ResetUserPasswordFormValues> = (
    values,
  ) => {
    if (!selectedUser) return;

    resetPasswordMutation.mutate(
      {
        id: selectedUser.id,
        payload: {
          newPassword: values.newPassword,
        },
      },
      {
        onSuccess: closePasswordModal,
      },
    );
  };

  function confirmAction() {
    if (!selectedUser || !pendingAction) return;

    if (pendingAction === "activate") {
      activateUserMutation.mutate(selectedUser.id, {
        onSuccess: closeConfirm,
      });
      return;
    }

    if (pendingAction === "suspend") {
      suspendUserMutation.mutate(selectedUser.id, {
        onSuccess: closeConfirm,
      });
      return;
    }

    if (pendingAction === "delete") {
      deleteUserMutation.mutate(selectedUser.id, {
        onSuccess: closeConfirm,
      });
    }
  }

  function clearFilters() {
    setPage(1);
    setSearch("");
    setRoleFilter("");
    setStatusFilter("");
    setClientFilter("");
  }

  function getConfirmCopy() {
    if (!selectedUser) {
      return {
        title: "تأكيد العملية",
        description: "هل تريد تنفيذ هذه العملية؟",
        confirmText: "تأكيد",
        variant: "gold" as const,
      };
    }

    if (pendingAction === "activate") {
      return {
        title: "تفعيل المستخدم",
        description: `سيتم تفعيل المستخدم ${selectedUser.fullName}.`,
        confirmText: "تفعيل",
        variant: "gold" as const,
      };
    }

    if (pendingAction === "suspend") {
      return {
        title: "إيقاف المستخدم",
        description: `سيتم إيقاف المستخدم ${selectedUser.fullName} ومنعه من استخدام النظام.`,
        confirmText: "إيقاف",
        variant: "danger" as const,
      };
    }

    return {
      title: "حذف المستخدم",
      description: `سيتم حذف المستخدم ${selectedUser.fullName}. لا يمكن للمستخدم الدخول بعد هذه العملية.`,
      confirmText: "حذف",
      variant: "danger" as const,
    };
  }

  const confirmCopy = getConfirmCopy();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Users"
        title="إدارة المستخدمين"
        description="إدارة حسابات موظفي التشغيل Staff ومتابعي العملاء Client Viewers وصلاحيات الدخول للنظام."
        actions={
          <Button onClick={openCreateModal}>
            <Plus className="h-4 w-4" />
            مستخدم جديد
          </Button>
        }
      />

      <section className="grid gap-4 md:grid-cols-4">
        <Card className="p-5">
          <p className="text-sm font-bold text-[#4B4B4B]/60">
            إجمالي المستخدمين
          </p>
          <div className="mt-3 flex items-center justify-between">
            <h3 className="text-3xl font-extrabold text-[#4B4B4B]">{total}</h3>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#A88042]/10 text-[#A88042]">
              <Users className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-bold text-[#4B4B4B]/60">Staff</p>
          <h3 className="mt-3 text-3xl font-extrabold text-[#4B4B4B]">
            {users.filter((user) => user.role === "STAFF").length}
          </h3>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-bold text-[#4B4B4B]/60">Client Viewers</p>
          <h3 className="mt-3 text-3xl font-extrabold text-[#4B4B4B]">
            {users.filter((user) => user.role === "CLIENT_VIEWER").length}
          </h3>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-bold text-[#4B4B4B]/60">حالة البيانات</p>
          <div className="mt-3">
            <Badge variant={usersQuery.isFetching ? "warning" : "success"}>
              {usersQuery.isFetching ? "تحديث..." : "مستقرة"}
            </Badge>
          </div>
        </Card>
      </section>

      <Card>
        <CardContent>
          <div className="mb-6 flex flex-col gap-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <CardTitle>قائمة المستخدمين</CardTitle>
                <CardDescription>
                  أنشئ حسابات Staff للسكانر وحسابات Client Viewer لمتابعة
                  فعاليات العملاء.
                </CardDescription>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => usersQuery.refetch()}>
                  <RefreshCw className="h-4 w-4" />
                  تحديث
                </Button>

                <Button variant="outline" onClick={clearFilters}>
                  مسح الفلاتر
                </Button>
              </div>
            </div>

            <div className="grid gap-3 xl:grid-cols-[1fr_200px_200px_240px]">
              <Input
                value={search}
                placeholder="بحث بالاسم أو البريد أو الهاتف..."
                onChange={(event) => {
                  setPage(1);
                  setSearch(event.target.value);
                }}
                icon={<Search className="h-4 w-4" />}
              />

              <Select
                value={roleFilter}
                placeholder="كل الأدوار"
                onChange={(value) => {
                  setPage(1);
                  setRoleFilter(value);
                }}
                options={[
                  { label: "كل الأدوار", value: "" },
                  { label: "Staff", value: "STAFF" },
                  { label: "Client Viewer", value: "CLIENT_VIEWER" },
                  { label: "Admin", value: "ADMIN" },
                ]}
              />

              <Select
                value={statusFilter}
                placeholder="كل الحالات"
                onChange={(value) => {
                  setPage(1);
                  setStatusFilter(value);
                }}
                options={[
                  { label: "كل الحالات", value: "" },
                  { label: "فعّال", value: "ACTIVE" },
                  { label: "موقوف", value: "SUSPENDED" },
                  { label: "محذوف", value: "DELETED" },
                ]}
              />

              <Select
                value={clientFilter}
                placeholder="كل العملاء"
                onChange={(value) => {
                  setPage(1);
                  setClientFilter(value);
                }}
                options={[
                  { label: "كل العملاء", value: "" },
                  ...clients.map((client) => ({
                    label: client.name,
                    value: client.id,
                  })),
                ]}
              />
            </div>
          </div>

          {usersQuery.isLoading ? (
            <div className="flex min-h-[320px] items-center justify-center rounded-[1.5rem] border border-black/10 bg-[#F8F8FF]">
              <div className="text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#A88042]" />
                <p className="mt-3 text-sm font-bold text-[#4B4B4B]/60">
                  جاري تحميل المستخدمين...
                </p>
              </div>
            </div>
          ) : usersQuery.isError ? (
            <div className="flex min-h-[320px] items-center justify-center rounded-[1.5rem] border border-red-200 bg-red-50">
              <div className="text-center">
                <p className="text-lg font-extrabold text-red-700">
                  تعذر تحميل المستخدمين
                </p>
                <Button
                  className="mt-4"
                  variant="danger"
                  onClick={() => usersQuery.refetch()}
                >
                  إعادة المحاولة
                </Button>
              </div>
            </div>
          ) : users.length === 0 ? (
            <div className="flex min-h-[320px] items-center justify-center rounded-[1.5rem] border border-black/10 bg-[#F8F8FF]">
              <div className="max-w-sm text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#A88042]/10 text-[#A88042]">
                  <UserCog className="h-7 w-7" />
                </div>

                <p className="text-lg font-extrabold text-[#4B4B4B]">
                  لا يوجد مستخدمون
                </p>

                <p className="mt-2 text-sm font-bold leading-6 text-[#4B4B4B]/60">
                  أضف Staff للسكانر أو Client Viewer لمتابعة فعاليات العملاء.
                </p>

                <Button className="mt-5" onClick={openCreateModal}>
                  <Plus className="h-4 w-4" />
                  مستخدم جديد
                </Button>
              </div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المستخدم</TableHead>
                    <TableHead>الدور</TableHead>
                    <TableHead>العميل</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>تاريخ الإنشاء</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#A88042]/10 text-[#A88042]">
                            <UserRound className="h-5 w-5" />
                          </div>

                          <div>
                            <p className="font-extrabold">{user.fullName}</p>

                            <div className="mt-1 flex flex-col gap-1 text-xs font-bold text-[#4B4B4B]/45">
                              {user.email ? <span>{user.email}</span> : null}
                              {user.phone ? <span>{user.phone}</span> : null}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant={getRoleVariant(user.role)}>
                          {roleLabels[user.role] || user.role}
                        </Badge>
                      </TableCell>

                      <TableCell>{user.client?.name || "—"}</TableCell>

                      <TableCell>
                        <Badge variant={getStatusVariant(user.status)}>
                          {statusLabels[user.status ?? "ACTIVE"] ||
                            user.status ||
                            "فعّال"}
                        </Badge>
                      </TableCell>

                      <TableCell>{formatDate(user.createdAt)}</TableCell>

                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditModal(user)}
                            disabled={user.role === "ADMIN"}
                          >
                            <Edit className="h-4 w-4" />
                            تعديل
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openPasswordModal(user)}
                            disabled={user.role === "ADMIN"}
                          >
                            <KeyRound className="h-4 w-4" />
                            كلمة المرور
                          </Button>

                          {user.status === "SUSPENDED" ? (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => requestAction(user, "activate")}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              تفعيل
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => requestAction(user, "suspend")}
                              disabled={user.role === "ADMIN"}
                            >
                              <XCircle className="h-4 w-4" />
                              إيقاف
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => requestAction(user, "delete")}
                            disabled={user.role === "ADMIN"}
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
        open={userModalOpen}
        onClose={closeUserModal}
        title={userModalMode === "create" ? "إضافة مستخدم" : "تعديل مستخدم"}
        description={
          userModalMode === "create"
            ? "أنشئ حساب Staff أو Client Viewer جديد."
            : "عدّل بيانات المستخدم وصلاحياته."
        }
        className="max-w-2xl"
        footer={
          <>
            <Button
              variant="outline"
              onClick={closeUserModal}
              disabled={isUserSubmitting}
            >
              إلغاء
            </Button>

            <Button
              onClick={form.handleSubmit(submitUser)}
              disabled={isUserSubmitting}
            >
              {isUserSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
              حفظ
            </Button>
          </>
        }
      >
        <form className="grid gap-4" onSubmit={form.handleSubmit(submitUser)}>
          <Input
            label="الاسم الكامل"
            error={form.formState.errors.fullName?.message}
            {...form.register("fullName")}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="البريد الإلكتروني"
              dir="ltr"
              error={form.formState.errors.email?.message}
              {...form.register("email")}
            />

            <Input
              label="رقم الهاتف"
              dir="ltr"
              error={form.formState.errors.phone?.message}
              {...form.register("phone")}
            />
          </div>

          {userModalMode === "create" ? (
            <Input
              label="كلمة المرور"
              type="password"
              dir="ltr"
              error={form.formState.errors.password?.message}
              {...form.register("password")}
            />
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <Select
              label="الدور"
              value={selectedRole}
              error={form.formState.errors.role?.message}
              onChange={(value) => {
                form.setValue("role", value as "STAFF" | "CLIENT_VIEWER", {
                  shouldDirty: true,
                  shouldValidate: true,
                });

                if (value === "STAFF") {
                  form.setValue("clientId", "", {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }
              }}
              options={[
                { label: "Staff - موظف تشغيل", value: "STAFF" },
                {
                  label: "Client Viewer - متابع عميل",
                  value: "CLIENT_VIEWER",
                },
              ]}
            />

            <Select
              label="العميل"
              value={form.watch("clientId") ?? ""}
              placeholder="اختر العميل"
              disabled={selectedRole !== "CLIENT_VIEWER"}
              error={form.formState.errors.clientId?.message}
              onChange={(value) => {
                form.setValue("clientId", value, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              }}
              options={clients.map((client) => ({
                label: client.name,
                value: client.id,
              }))}
            />
          </div>

          {selectedRole === "CLIENT_VIEWER" ? (
            <div className="rounded-2xl border border-[#A88042]/20 bg-[#A88042]/5 p-4">
              <p className="text-sm font-extrabold text-[#4B4B4B]">
                Client Viewer
              </p>
              <p className="mt-1 text-xs font-bold leading-6 text-[#4B4B4B]/55">
                هذا المستخدم سيشاهد بيانات العميل المرتبط به فقط، حسب صلاحيات
                الباك.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-black/10 bg-[#F8F8FF] p-4">
              <p className="text-sm font-extrabold text-[#4B4B4B]">Staff</p>
              <p className="mt-1 text-xs font-bold leading-6 text-[#4B4B4B]/55">
                هذا المستخدم مخصص لاحقًا لواجهة السكانر وعمليات الدخول والمزامنة
                offline.
              </p>
            </div>
          )}
        </form>
      </Modal>

      <Modal
        open={passwordModalOpen}
        onClose={closePasswordModal}
        title="إعادة تعيين كلمة المرور"
        description={
          selectedUser
            ? `تغيير كلمة مرور المستخدم ${selectedUser.fullName}.`
            : "تغيير كلمة مرور المستخدم."
        }
        className="max-w-md"
        footer={
          <>
            <Button
              variant="outline"
              onClick={closePasswordModal}
              disabled={resetPasswordMutation.isPending}
            >
              إلغاء
            </Button>

            <Button
              onClick={passwordForm.handleSubmit(submitPassword)}
              disabled={resetPasswordMutation.isPending}
            >
              {resetPasswordMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <KeyRound className="h-4 w-4" />
              )}
              تغيير
            </Button>
          </>
        }
      >
        <form
          className="grid gap-4"
          onSubmit={passwordForm.handleSubmit(submitPassword)}
        >
          <Input
            label="كلمة المرور الجديدة"
            type="password"
            dir="ltr"
            error={passwordForm.formState.errors.newPassword?.message}
            {...passwordForm.register("newPassword")}
          />
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        title={confirmCopy.title}
        description={confirmCopy.description}
        confirmText={confirmCopy.confirmText}
        variant={confirmCopy.variant}
        isLoading={isActionSubmitting}
        onClose={closeConfirm}
        onConfirm={confirmAction}
      />
    </div>
  );
}
