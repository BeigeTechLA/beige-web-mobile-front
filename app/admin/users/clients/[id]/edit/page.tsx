import { ClientProfileEdit } from "@/components/admin/users/ClientProfileEdit";

export default async function ClientEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ClientProfileEdit id={id} />;
}
