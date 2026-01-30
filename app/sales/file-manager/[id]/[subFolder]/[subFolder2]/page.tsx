import SubFolder2DetailsPage from "@/app/admin/file-manager/[id]/[subFolder]/[subFolder2]/page";

export default function SalesSubFolder2DetailsPage({
    params
}: {
    params: Promise<{ id: string; subFolder: string; subFolder2: string }>
}) {
    return <SubFolder2DetailsPage params={params} />;
}
