import fs from 'fs';
import path from 'path';
import { findLanguagePdf, parseFolderDate } from './appeal-pdf-utils';

export interface MinistryLetter {
    id: string;
    title: string;
    titleEn: string;
    pdfUrl?: string;
    pdfUrlEn?: string;
    authorName: string;
    month: number;
    year: number;
    createdAt: { seconds: number };
    folderName: string;
}

const MIN_LETTERS_DIR = path.join(process.cwd(), 'public/appeals/min-letters');
const PUBLIC_BASE_PATH = '/appeals/min-letters';

const MONTH_NAMES_EN = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

export function getMinistryLetters(): MinistryLetter[] {
    if (!fs.existsSync(MIN_LETTERS_DIR)) {
        return [];
    }

    const folders = fs
        .readdirSync(MIN_LETTERS_DIR, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name);

    const letters: MinistryLetter[] = [];

    for (const folderName of folders) {
        const dateInfo = parseFolderDate(folderName);
        if (!dateInfo) continue;

        const folderPath = path.join(MIN_LETTERS_DIR, folderName);
        const files = fs.readdirSync(folderPath).filter((file) => !file.startsWith('.'));

        const englishPdf = findLanguagePdf(files, 'english');
        const vietnamesePdf = findLanguagePdf(files, 'vietnamese');

        if (!englishPdf && !vietnamesePdf) continue;

        const { year, month } = dateInfo;
        const monthName = MONTH_NAMES_EN[month - 1];
        const createdAtSeconds = Math.floor(new Date(year, month - 1, 1).getTime() / 1000);

        letters.push({
            id: `min-letter-${year}${String(month).padStart(2, '0')}`,
            title: `Thư Mục Vụ ${monthName} ${year}`,
            titleEn: `Ministry Letter ${monthName} ${year}`,
            pdfUrl: vietnamesePdf
                ? `${PUBLIC_BASE_PATH}/${folderName}/${vietnamesePdf}`
                : undefined,
            pdfUrlEn: englishPdf
                ? `${PUBLIC_BASE_PATH}/${folderName}/${englishPdf}`
                : undefined,
            authorName: 'TrieuMinistry',
            month,
            year,
            createdAt: { seconds: createdAtSeconds },
            folderName,
        });
    }

    letters.sort((a, b) => {
        if (b.year !== a.year) return b.year - a.year;
        return b.month - a.month;
    });

    return letters;
}
