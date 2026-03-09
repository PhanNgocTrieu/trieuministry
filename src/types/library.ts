export interface Book {
  id: string;
  title: string;
  description: string;
  author: string;
  category: string;
  theme: string;
  quantity: number;
  location: string;
  createdAt: string;
  updatedAt: string;
}

export interface BorrowedBook {
  id: string;
  borrowerName: string;
  groupRole: string; // Vai trò nhóm nhỏ
  bookId: string;
  bookTitle: string;
  borrowDate: string;
  returnDate: string;
  phone: string;
  facebook: string;
  email: string;
  status: 'borrowing' | 'returned' | 'overdue';
  returnedDate?: string; // Bổ sung để track thời gian đã trả
  createdAt: string;
  updatedAt: string;
}
