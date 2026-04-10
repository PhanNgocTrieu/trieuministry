import * as XLSX from 'xlsx';
import { Book } from '@/types/library';

export const excelService = {
  async getBooksFromExcel(): Promise<Book[]> {
    try {
      const response = await fetch('/resources/lib/lib-mans.xlsx');
      
      if (!response.ok) {
         console.warn("Excel file not found, loading empty books array");
         return [];
      }

      const arrayBuffer = await response.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      // Assume data is in the first sheet
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // header: 1 means parsing as array of arrays without keys
      const rawData = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
      
      const books: Book[] = [];
      
      // Start reading from index 1 (row 2) to skip header (row 1)
      for (let i = 1; i < rawData.length; i++) {
        const row = rawData[i];
        
        // Skip entirely undefined rows
        if (!row || row.length === 0) continue;

        // Data matches columns A, B, C corresponding to index 0, 1, 2
        const name = row[0] ? String(row[0]).trim() : '';
        const author = row[1] ? String(row[1]).trim() : '';
        const category = row[2] ? String(row[2]).trim() : '';
        
        // Stop conditionally if the row is entirely empty
        if (!name && !author && !category) {
          break; // Stop at first empty row as per instructions
        }
        
        books.push({
          id: `excel-book-${i}`,
          title: name,
          author: author,
          category: category,
          description: '', // Fallback as not present in excel
          theme: '', // Fallback
          quantity: 1, // Defaulting to 1 so borrow logic doesn't break entirely
          location: 'Thư viện', // Fallback
        } as Book);
      }
      
      return books;
    } catch (error) {
      console.error('Failed to parse Excel file:', error);
      return [];
    }
  }
};
