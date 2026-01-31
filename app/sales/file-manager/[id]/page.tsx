import FolderDetailsPage from "@/app/admin/file-manager/[id]/page";

export default function SalesFolderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    return <FolderDetailsPage params={params} />;
}
