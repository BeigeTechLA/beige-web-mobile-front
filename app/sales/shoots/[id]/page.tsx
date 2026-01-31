import ShootDetailsPage from "@/app/admin/shoots/[id]/page";

export default function SalesShootDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    return <ShootDetailsPage params={params} />;
}
