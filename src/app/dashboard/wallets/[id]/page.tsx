import WalletDetail from "@/components/wallets/WalletDetail";

export default async function WalletDetailUserPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <WalletDetail walletId={id} basePath="/dashboard/wallets" />;
}
