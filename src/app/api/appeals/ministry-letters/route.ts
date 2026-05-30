import { NextResponse } from 'next/server';
import { getMinistryLetters } from '@/lib/ministry-letters';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const letters = getMinistryLetters();
        return NextResponse.json({ appeals: letters });
    } catch (error) {
        console.error('Error reading ministry letters:', error);
        return NextResponse.json(
            { error: 'Failed to load ministry letters' },
            { status: 500 }
        );
    }
}
