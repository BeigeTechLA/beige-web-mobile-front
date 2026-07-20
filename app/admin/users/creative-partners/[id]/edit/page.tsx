import { CreativePartnerProfileEdit } from "@/components/admin/users/CreativePartnerProfileEdit";

export default function CreativePartnerEditPage({
  params,
}: {
  params: { id: string };
}) {
  return <CreativePartnerProfileEdit id={params.id} />;
}
