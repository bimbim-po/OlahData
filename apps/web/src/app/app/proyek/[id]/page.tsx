import { redirect } from 'next/navigation';

interface ProyekPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProyekIndexPage({ params }: ProyekPageProps) {
  const resolved = await params;
  redirect(`/app/proyek/${resolved.id}/analisis`);
}
