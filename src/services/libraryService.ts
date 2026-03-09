import { collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy, writeBatch, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Book, BorrowedBook } from '../types/library';

// Helper to convert Firestore Timestamp to string
const formatDate = (date: any): string => {
  if (!date) return '';
  if (date instanceof Timestamp) {
    return date.toDate().toISOString();
  }
  return new Date(date).toISOString();
};

export const libraryService = {
  // Books Collection operations
  async getBooks(): Promise<Book[]> {
    const q = query(collection(db, 'books'), orderBy('title', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: formatDate(data.createdAt),
        updatedAt: formatDate(data.updatedAt)
      } as Book;
    });
  },

  async getBook(id: string): Promise<Book | null> {
    const docRef = doc(db, 'books', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: formatDate(data.createdAt),
        updatedAt: formatDate(data.updatedAt)
      } as Book;
    }
    return null;
  },

  async addBook(bookData: Omit<Book, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'books'), {
      ...bookData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  },

  async updateBook(id: string, updates: Partial<Book>): Promise<void> {
    const docRef = doc(db, 'books', id);
    // Don't accidentally overwrite id, createdAt
    const { id: _, createdAt, ...cleanUpdates } = updates;
    await updateDoc(docRef, {
      ...cleanUpdates,
      updatedAt: serverTimestamp()
    });
  },

  async deleteBook(id: string): Promise<void> {
    await deleteDoc(doc(db, 'books', id));
  },

  // Borrowed Books Collection operations
  async getBorrowedBooks(): Promise<BorrowedBook[]> {
    const q = query(collection(db, 'borrowed_books'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    // Auto-delete logic & overdue status update on fetch
    const now = new Date();
    const batch = writeBatch(db);
    let batchNeedsCommit = false;
    
    const borrowedBooks: BorrowedBook[] = [];

    // Pre-fetch all books to update quantities if needed for auto-deleted records
    const booksQuery = query(collection(db, 'books'));
    const booksSnapshot = await getDocs(booksQuery);
    const booksMap = new Map();
    booksSnapshot.docs.forEach(doc => {
      booksMap.set(doc.id, { ref: doc.ref, data: doc.data() });
    });

    snapshot.docs.forEach(document => {
      const data = document.data();
      let status = data.status;
      let shouldDelete = false;

      // Check for auto-delete (returned > 3 days ago)
      if (status === 'returned' && data.returnedDate) {
        let returnedDateString = '';
        if (data.returnedDate instanceof Timestamp) {
           returnedDateString = data.returnedDate.toDate().toISOString();
        } else {
           returnedDateString = new Date(data.returnedDate).toISOString();
        }

        const returnedDate = new Date(returnedDateString);
        const diffTime = Math.abs(now.getTime() - returnedDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        if (diffDays > 3) {
          shouldDelete = true;
          batch.delete(doc(db, 'borrowed_books', document.id));
          batchNeedsCommit = true;
        }
      }

      // Check for overdue (borrowing and returnDate passed)
      if (!shouldDelete && status === 'borrowing' && data.returnDate) {
         let returnDateString = '';
         if (data.returnDate instanceof Timestamp) {
            returnDateString = data.returnDate.toDate().toISOString();
         } else {
            returnDateString = new Date(data.returnDate).toISOString();
         }

        const returnDate = new Date(returnDateString);
        if (now > returnDate) {
          status = 'overdue';
          batch.update(doc(db, 'borrowed_books', document.id), { status: 'overdue', updatedAt: serverTimestamp() });
          batchNeedsCommit = true;
        }
      }

      if (!shouldDelete) {
        borrowedBooks.push({
          id: document.id,
          ...data,
          status, // Use potentially updated status
          borrowDate: formatDate(data.borrowDate),
          returnDate: formatDate(data.returnDate),
          returnedDate: formatDate(data.returnedDate),
          createdAt: formatDate(data.createdAt),
          updatedAt: formatDate(data.updatedAt)
        } as BorrowedBook);
      }
    });

    if (batchNeedsCommit) {
      await batch.commit();
    }

    return borrowedBooks;
  },

  async borrowBook(borrowData: Omit<BorrowedBook, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const bookRef = doc(db, 'books', borrowData.bookId);
    const bookSnap = await getDoc(bookRef);

    if (!bookSnap.exists()) {
      throw new Error('Book not found');
    }

    const currentQuantity = bookSnap.data().quantity || 0;
    if (currentQuantity <= 0) {
      throw new Error('Sách này đã hết (Số lượng khả dụng: 0).');
    }

    const batch = writeBatch(db);

    // 1. Create borrow record
    const newBorrowRef = doc(collection(db, 'borrowed_books'));
    batch.set(newBorrowRef, {
      ...borrowData,
      status: 'borrowing',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // 2. Decrement book quantity
    batch.update(bookRef, {
      quantity: currentQuantity - 1,
      updatedAt: serverTimestamp()
    });

    await batch.commit();

    return newBorrowRef.id;
  },

  async returnBook(id: string): Promise<void> {
    const borrowRef = doc(db, 'borrowed_books', id);
    const borrowSnap = await getDoc(borrowRef);

    if (!borrowSnap.exists()) {
      throw new Error('Borrow record not found');
    }

    const borrowData = borrowSnap.data();
    if (borrowData.status === 'returned') {
      return; // Already returned, do nothing
    }

    const bookId = borrowData.bookId;
    const bookRef = doc(db, 'books', bookId);
    const bookSnap = await getDoc(bookRef);

    const batch = writeBatch(db);

    // 1. Mark borrow record as returned
    batch.update(borrowRef, {
      status: 'returned',
      returnedDate: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // 2. Increment book quantity if the book still exists
    if (bookSnap.exists()) {
      const currentQuantity = bookSnap.data().quantity || 0;
      batch.update(bookRef, {
        quantity: currentQuantity + 1,
        updatedAt: serverTimestamp()
      });
    }

    await batch.commit();
  },

   async updateBorrowedBook(id: string, updates: Partial<BorrowedBook>): Promise<void> {
    const docRef = doc(db, 'borrowed_books', id);
    const { id: _, createdAt, ...cleanUpdates } = updates;
    await updateDoc(docRef, {
      ...cleanUpdates,
      updatedAt: serverTimestamp()
    });
  },
  
  async deleteBorrowedBook(id: string): Promise<void> {
     // If we delete an active record, we should restore the book quantity
     const borrowRef = doc(db, 'borrowed_books', id);
     const borrowSnap = await getDoc(borrowRef);

     if (!borrowSnap.exists()) return;

     const borrowData = borrowSnap.data();

     const batch = writeBatch(db);
     batch.delete(borrowRef);

     // Only restore quantity if it was actively being borrowed or overdue
     if (borrowData.status === 'borrowing' || borrowData.status === 'overdue') {
       const bookRef = doc(db, 'books', borrowData.bookId);
       const bookSnap = await getDoc(bookRef);
       if (bookSnap.exists()) {
         const currentQuantity = bookSnap.data().quantity || 0;
         batch.update(bookRef, {
           quantity: currentQuantity + 1,
           updatedAt: serverTimestamp()
         });
       }
     }

     await batch.commit();
  }
};
