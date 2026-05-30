import fs from 'fs';
import path from 'path';

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

export function findLanguagePdf(files: string[], language: 'english' | 'vietnamese'): string | undefined {
    return files.find(
        (file) =>
            file.toLowerCase().endsWith('.pdf') &&
            file.toLowerCase().includes(`_${language}`)
    );
}

export function parseFolderDate(folderName: string): { year: number; month: number } | null {
    const match = folderName.match(/_(\d{4})(\d{2})$/);
    if (!match) return null;

    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    if (month < 1 || month > 12) return null;

    return { year, month };
}

export function slugToDisplayTitle(folderName: string): string {
    const slug = folderName.replace(/^_/, '').replace(/-/g, ' ');
    return slug.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getCoverImageUrl(folderPath: string, publicBasePath: string, folderName: string): string | undefined {
    const imagesDir = path.join(folderPath, 'images');
    if (!fs.existsSync(imagesDir)) return undefined;

    const imageFile = fs
        .readdirSync(imagesDir)
        .find((file) => IMAGE_EXTENSIONS.has(path.extname(file).toLowerCase()) && !file.startsWith('.'));

    if (!imageFile) return undefined;
    return `${publicBasePath}/${folderName}/images/${imageFile}`;
}

export interface AppealFolderMeta {
    title?: string;
    titleEn?: string;
    description?: string;
    descriptionEn?: string;
    sortOrder?: number;
}

export function readFolderMeta(folderPath: string): AppealFolderMeta | null {
    const metaPath = path.join(folderPath, 'meta.json');
    if (!fs.existsSync(metaPath)) return null;

    try {
        const raw = fs.readFileSync(metaPath, 'utf-8');
        return JSON.parse(raw) as AppealFolderMeta;
    } catch {
        return null;
    }
}
