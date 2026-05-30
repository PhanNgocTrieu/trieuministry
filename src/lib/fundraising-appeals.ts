import fs from 'fs';
import path from 'path';
import {
    findLanguagePdf,
    parseFolderDate,
    slugToDisplayTitle,
    getCoverImageUrl,
    readFolderMeta,
} from './appeal-pdf-utils';

export interface FundraisingAppeal {
    id: string;
    title: string;
    titleEn: string;
    description?: string;
    descriptionEn?: string;
    pdfUrl?: string;
    pdfUrlEn?: string;
    coverImage?: string;
    folderName: string;
    sortOrder: number;
    year?: number;
    month?: number;
}

const FUNDRAISING_DIR = path.join(process.cwd(), 'public/appeals/fundraising');
const PUBLIC_BASE_PATH = '/appeals/fundraising';

export function getFundraisingAppeals(): FundraisingAppeal[] {
    if (!fs.existsSync(FUNDRAISING_DIR)) {
        return [];
    }

    const folders = fs
        .readdirSync(FUNDRAISING_DIR, { withFileTypes: true })
        .filter((entry) => entry.isDirectory() && entry.name.startsWith('_'))
        .map((entry) => entry.name);

    const appeals: FundraisingAppeal[] = [];

    for (const folderName of folders) {
        const folderPath = path.join(FUNDRAISING_DIR, folderName);
        const files = fs.readdirSync(folderPath).filter((file) => !file.startsWith('.'));

        const englishPdf = findLanguagePdf(files, 'english');
        const vietnamesePdf = findLanguagePdf(files, 'vietnamese');

        if (!englishPdf && !vietnamesePdf) continue;

        const meta = readFolderMeta(folderPath);
        const dateInfo = parseFolderDate(folderName);
        const defaultTitle = slugToDisplayTitle(folderName);

        const sortOrder =
            meta?.sortOrder ??
            (dateInfo ? dateInfo.year * 100 + dateInfo.month : 0);

        appeals.push({
            id: `fundraising-${folderName.replace(/^_/, '')}`,
            title: meta?.title || defaultTitle,
            titleEn: meta?.titleEn || defaultTitle,
            description: meta?.description,
            descriptionEn: meta?.descriptionEn,
            pdfUrl: vietnamesePdf
                ? `${PUBLIC_BASE_PATH}/${folderName}/${vietnamesePdf}`
                : undefined,
            pdfUrlEn: englishPdf
                ? `${PUBLIC_BASE_PATH}/${folderName}/${englishPdf}`
                : undefined,
            coverImage: getCoverImageUrl(folderPath, PUBLIC_BASE_PATH, folderName),
            folderName,
            sortOrder,
            year: dateInfo?.year,
            month: dateInfo?.month,
        });
    }

    appeals.sort((a, b) => {
        if (b.sortOrder !== a.sortOrder) return b.sortOrder - a.sortOrder;
        if (b.year && a.year && b.year !== a.year) return b.year - a.year;
        if (b.month && a.month && b.month !== a.month) return b.month - a.month;
        return b.folderName.localeCompare(a.folderName);
    });

    return appeals;
}
