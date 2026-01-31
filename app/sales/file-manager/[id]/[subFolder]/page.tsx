import SubFolderDetailsPage from "@/app/admin/file-manager/[id]/[subFolder]/page";

export default function SalesSubFolderDetailsPage({ params }: { params: Promise<{ id: string; subFolder: string }> }) {
    return <SubFolderDetailsPage params={params} />;
}
