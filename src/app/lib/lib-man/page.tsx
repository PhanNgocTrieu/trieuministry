'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { libraryService } from '@/services/libraryService';
import { Book, BorrowedBook } from '@/types/library';
import { FiSearch, FiFilter, FiEdit2, FiTrash2, FiPlus } from 'react-icons/fi';

const ITEMS_PER_PAGE = 50;

export default function LibraryManPage() {
  const { isAdmin } = useAuth();
  
  // Data states
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('');
  const [sortAsc, setSortAsc] = useState(true);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Modal states
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  
  const [isBorrowModalOpen, setIsBorrowModalOpen] = useState(false);
  const [borrowingBook, setBorrowingBook] = useState<Book | null>(null);

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const data = await libraryService.getBooks();
      setBooks(data);
    } catch (error) {
      console.error('Failed to fetch books:', error);
      alert('Không thể tải danh sách sách. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  // Extract unique categories and themes for filters
  const categories = useMemo(() => Array.from(new Set(books.map(b => b.category).filter(Boolean))), [books]);
  const themes = useMemo(() => Array.from(new Set(books.map(b => b.theme).filter(Boolean))), [books]);

  // Apply filters, search, and sorting
  const filteredAndSortedBooks = useMemo(() => {
    return books
      .filter(book => {
        const matchesSearch = 
          book.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
          book.author.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory ? book.category === selectedCategory : true;
        const matchesTheme = selectedTheme ? book.theme === selectedTheme : true;
        
        return matchesSearch && matchesCategory && matchesTheme;
      })
      .sort((a, b) => {
        const titleA = a.title.toLowerCase();
        const titleB = b.title.toLowerCase();
        if (sortAsc) {
          return titleA < titleB ? -1 : titleA > titleB ? 1 : 0;
        } else {
          return titleA > titleB ? -1 : titleA < titleB ? 1 : 0;
        }
      });
  }, [books, searchTerm, selectedCategory, selectedTheme, sortAsc]);

  // Pagination logic
  const totalPages = Math.ceil(filteredAndSortedBooks.length / ITEMS_PER_PAGE);
  const displayedBooks = filteredAndSortedBooks.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleDeleteBook = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xoá cuốn sách này?')) {
      try {
        await libraryService.deleteBook(id);
        setBooks(prev => prev.filter(b => b.id !== id));
      } catch (error) {
        console.error('Failed to delete book:', error);
        alert('Lỗi khi xoá sách.');
      }
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 flex flex-col gap-6">
      
      {/* Contact Section */}
      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 p-5 rounded-xl border border-indigo-100 dark:border-indigo-800/30">
        <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700 dark:from-blue-400 dark:to-indigo-400 mb-3 flex items-center gap-2">
          <i className="fas fa-id-card"></i> Thông tin liên hệ
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-gray-700 dark:text-gray-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <i className="fas fa-user"></i>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-gray-500">Phụ trách</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">Phan Ngọc Triều</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center text-green-600 dark:text-green-400 shrink-0">
              <i className="fas fa-phone-alt"></i>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-gray-500">SĐT / Zalo</p>
              <a href="tel:0974210249" className="font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">0974 210 249</a>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
              <i className="fas fa-envelope"></i>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-gray-500">Email</p>
              <a href="mailto:phantrieu580@gmail.com" className="font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 break-all">phantrieu580@gmail.com</a>
            </div>
          </div>
        </div>
      </div>

      {/* Top Controls: Search, Filter, Sort, Add Button */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        
        <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Tìm kiếm theo Tên sách hoặc Tác giả..."
              className="pl-10 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 py-2.5"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          {/* Filters */}
          <select
            className="block w-full sm:w-auto rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 py-2.5 px-3"
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">Tất cả Thể loại</option>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>

          <select
            className="block w-full sm:w-auto rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 py-2.5 px-3"
            value={selectedTheme}
            onChange={(e) => {
              setSelectedTheme(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">Tất cả Chủ đề</option>
            {themes.map(theme => <option key={theme} value={theme}>{theme}</option>)}
          </select>
          
          <button
            onClick={() => {
              setSortAsc(!sortAsc);
              setCurrentPage(1);
            }}
            className="flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FiFilter className="mr-2" />
            Sắp xếp {sortAsc ? 'A-Z' : 'Z-A'}
          </button>
        </div>

        <div className="flex gap-2">
          {/* Global Borrow Button */}
          <button
            onClick={() => {
              setBorrowingBook(null); // Open modal with no specific book selected
              setIsBorrowModalOpen(true);
            }}
            className="flex-shrink-0 flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
          >
            Mượn sách
          </button>

          {isAdmin && (
            <button
              onClick={() => {
                setEditingBook(null);
                setIsBookModalOpen(true);
              }}
              className="flex-shrink-0 flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <FiPlus className="mr-2" /> Thêm sách
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tên sách</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Tác giả</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Thể loại / Chủ đề</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">SL & Vị trí</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Hành động</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-gray-500">Đang tải dữ liệu...</td>
              </tr>
            ) : displayedBooks.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-gray-500">Không tìm thấy sách nào.</td>
              </tr>
            ) : (
              displayedBooks.map((book) => (
                <tr key={book.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{book.title}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-1 max-w-xs">{book.description || 'update later'}</div>
                    <div className="text-xs text-gray-500 md:hidden mt-1">{book.author}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 hidden md:table-cell">
                    {book.author}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {book.category}
                    </span>
                    {book.theme && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        {book.theme}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <div className="font-medium">SL: {book.quantity}</div>
                    <div className="text-xs mt-1">{book.location}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => {
                        setBorrowingBook(book);
                        setIsBorrowModalOpen(true);
                      }}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-md transition-colors mr-2 sm:mr-4"
                    >
                      Mượn
                    </button>
                    
                    {isAdmin && (
                      <div className="inline-flex space-x-2 mt-2 sm:mt-0">
                        <button
                          onClick={() => {
                            setEditingBook(book);
                            setIsBookModalOpen(true);
                          }}
                          className="text-gray-600 hover:text-indigo-900 dark:text-gray-400 dark:hover:text-indigo-400 p-1"
                          title="Sửa sách"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          onClick={() => handleDeleteBook(book.id)}
                          className="text-gray-600 hover:text-red-900 dark:text-gray-400 dark:hover:text-red-400 p-1"
                          title="Xoá sách"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 sm:px-6 rounded-b-lg">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Hiển thị <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> đến <span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, filteredAndSortedBooks.length)}</span> trong số <span className="font-medium">{filteredAndSortedBooks.length}</span> kết quả
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Book Form Modal (Admin) */}
      {isBookModalOpen && (
        <BookFormModal
          book={editingBook}
          onClose={() => setIsBookModalOpen(false)}
          onSuccess={() => {
            setIsBookModalOpen(false);
            fetchBooks();
          }}
        />
      )}

      {/* Borrow Form Modal */}
      {isBorrowModalOpen && borrowingBook && (
        <BorrowFormModal
          book={borrowingBook}
          booksList={books}
          onClose={() => setIsBorrowModalOpen(false)}
          onSuccess={() => {
            setIsBorrowModalOpen(false);
            alert('Đăng ký mượn sách thành công!');
          }}
        />
      )}

    </div>
  );
}

// --- Internal Components for Modals ---

function BookFormModal({ book, onClose, onSuccess }: { book: Book | null, onClose: () => void, onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    title: book?.title || '',
    description: book?.description || 'update later',
    author: book?.author || '',
    category: book?.category || '',
    theme: book?.theme || '',
    quantity: book?.quantity?.toString() || '1',
    location: book?.location || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const dataToSave = {
        ...formData,
        quantity: parseInt(formData.quantity) || 0
      };

      if (book) {
        await libraryService.updateBook(book.id, dataToSave);
      } else {
        await libraryService.addBook(dataToSave);
      }
      onSuccess();
    } catch (error) {
      console.error('Save error:', error);
      alert('Lỗi khi lưu thông tin sách');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold dark:text-white">{book ? 'Sửa thông tin sách' : 'Thêm sách mới'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tên sách <span className="text-red-500">*</span></label>
            <input required type="text" className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:text-white" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tác giả <span className="text-red-500">*</span></label>
            <input required type="text" className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:text-white" value={formData.author} onChange={e => setFormData({...formData, author: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Thể loại</label>
            <input type="text" className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:text-white" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Chủ đề</label>
            <input type="text" className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:text-white" value={formData.theme} onChange={e => setFormData({...formData, theme: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Số lượng</label>
              <input type="number" min="0" className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:text-white" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Vị trí</label>
              <input type="text" className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:text-white" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Mô tả</label>
            <textarea className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:text-white" rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600">Hủy</button>
            <button type="submit" disabled={loading} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">
              {loading ? 'Đang lưu...' : 'Lưu lại'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BorrowFormModal({ book, booksList, onClose, onSuccess }: { book: Book | null, booksList: Book[], onClose: () => void, onSuccess: () => void }) {
  // Setup default dates
  const todayDate = new Date().toISOString().split('T')[0];
  const nextWeekDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    borrowerName: '',
    groupRole: '',
    bookId: book?.id || (booksList.length > 0 ? booksList[0].id : ''),
    bookTitle: book?.title || (booksList.length > 0 ? booksList[0].title : ''),
    borrowDate: todayDate,
    returnDate: nextWeekDate,
    phone: '',
    facebook: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await libraryService.borrowBook({
        borrowerName: formData.borrowerName,
        groupRole: formData.groupRole,
        bookId: formData.bookId,
        bookTitle: formData.bookTitle,
        borrowDate: new Date(formData.borrowDate).toISOString(),
        returnDate: new Date(formData.returnDate).toISOString(),
        phone: formData.phone,
        facebook: formData.facebook,
        email: formData.email
      });
      onSuccess();
    } catch (error: any) {
      console.error('Borrow error:', error);
      if (error?.message === 'Sách này đã hết (Số lượng khả dụng: 0).') {
        alert('Rất tiếc, sách này hiện đã hết số lượng khả dụng trong kho.');
      } else {
        alert('Lỗi khi đăng ký mượn sách. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold dark:text-white">Đăng ký mượn sách</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Cuốn sách đang mượn <span className="text-red-500">*</span></label>
            <select
              required
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:text-white"
              value={formData.bookId}
              onChange={e => {
                const selectedBook = booksList.find(b => b.id === e.target.value);
                setFormData({
                  ...formData, 
                  bookId: e.target.value,
                  bookTitle: selectedBook ? selectedBook.title : ''
                });
              }}
            >
              {booksList.map(b => (
                <option key={b.id} value={b.id}>{b.title}</option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tên người mượn <span className="text-red-500">*</span></label>
              <input required type="text" className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:text-white" value={formData.borrowerName} onChange={e => setFormData({...formData, borrowerName: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Vai trò nhóm nhỏ <span className="text-red-500">*</span></label>
              <input required type="text" placeholder="VD: Trưởng nhóm, Thành viên..." className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:text-white" value={formData.groupRole} onChange={e => setFormData({...formData, groupRole: e.target.value})} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Ngày mượn <span className="text-red-500">*</span></label>
              <input required type="date" className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:text-white" value={formData.borrowDate} onChange={e => setFormData({...formData, borrowDate: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Ngày trả dự kiến <span className="text-red-500">*</span></label>
              <input required type="date" className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:text-white" value={formData.returnDate} onChange={e => setFormData({...formData, returnDate: e.target.value})} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Số điện thoại <span className="text-red-500">*</span></label>
            <input required type="tel" className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:text-white" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Facebook Link</label>
              <input type="url" className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:text-white" value={formData.facebook} onChange={e => setFormData({...formData, facebook: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
              <input type="email" className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:text-white" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600">Hủy</button>
            <button type="submit" disabled={loading} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">
              {loading ? 'Đang gửi...' : 'Đăng ký mượn'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
