import { CreativePartnerProfileEdit } from "@/components/admin/users/CreativePartnerProfileEdit";

export default async function CreativePartnerEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CreativePartnerProfileEdit id={id} />;
}