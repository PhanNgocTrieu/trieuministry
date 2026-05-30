import { redirect } from "next/navigation";

export default async function AppealDetailRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/admin/appeals/${id}`);
}
