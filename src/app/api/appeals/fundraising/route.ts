import { NextResponse } from 'next/server';
import { getFundraisingAppeals } from '@/lib/fundraising-appeals';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const appeals = getFundraisingAppeals();
        return NextResponse.json({ appeals });
    } catch (error) {
        console.error('Error reading fundraising appeals:', error);
        return NextResponse.json(
            { error: 'Failed to load fundraising appeals' },
            { status: 500 }
        );
    }
}
