'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { libraryService } from '@/services/libraryService';
import { BorrowedBook } from '@/types/library';
import { FiSearch, FiCheckCircle, FiClock, FiTrash2, FiAlertCircle } from 'react-icons/fi';

export default function BorrowedLibPage() {
  const { isAdmin } = useAuth();
  
  const [borrowedBooks, setBorrowedBooks] = useState<BorrowedBook[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchBorrower, setSearchBorrower] = useState('');
  const [searchBookTitle, setSearchBookTitle] = useState('');

  useEffect(() => {
    if (isAdmin) {
      fetchBorrowedBooks();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  const fetchBorrowedBooks = async () => {
    try {
      setLoading(true);
      const data = await libraryService.getBorrowedBooks();
      setBorrowedBooks(data);
    } catch (error) {
      console.error('Failed to fetch borrowed books:', error);
      alert('Không thể tải danh sách sách mượn.');
    } finally {
      setLoading(false);
    }
  };

  const handleReturnBook = async (id: string) => {
    if (window.confirm('Xác nhận đã nhận lại sách này?')) {
      try {
        await libraryService.returnBook(id);
        // Refresh list to update status
        fetchBorrowedBooks();
      } catch (error) {
        console.error('Failed to return book:', error);
        alert('Lỗi cập nhật trạng thái.');
      }
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xoá bản ghi này?')) {
      try {
        await libraryService.deleteBorrowedBook(id);
        setBorrowedBooks(prev => prev.filter(b => b.id !== id));
      } catch (error) {
        console.error('Failed to delete user record:', error);
        alert('Lỗi khi xoá.');
      }
    }
  }

  const filteredBooks = useMemo(() => {
    return borrowedBooks.filter(record => 
      record.borrowerName.toLowerCase().includes(searchBorrower.toLowerCase()) &&
      record.bookTitle.toLowerCase().includes(searchBookTitle.toLowerCase())
    );
  }, [borrowedBooks, searchBorrower, searchBookTitle]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'borrowing':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300"><FiClock className="mr-1" /> Đang mượn</span>;
      case 'returned':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"><FiCheckCircle className="mr-1" /> Đã trả</span>;
      case 'overdue':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300"><FiAlertCircle className="mr-1" /> Quá hạn</span>;
      default:
        return null;
    }
  };

  if (!isAdmin) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-10 text-center">
        <FiAlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Quyền truy cập bị từ chối</h2>
        <p className="text-gray-500 dark:text-gray-400">Trang này chỉ dành cho Ban quản trị viên thư viện.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Tìm theo người mượn..."
            className="pl-10 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 py-2.5"
            value={searchBorrower}
            onChange={(e) => setSearchBorrower(e.target.value)}
          />
        </div>
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Tìm theo tên sách..."
            className="pl-10 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 py-2.5"
            value={searchBookTitle}
            onChange={(e) => setSearchBookTitle(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Người mượn</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tên sách</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ngày mượn/trả</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">Liên hệ</th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Trạng thái</th>
              {isAdmin && (
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Hành động</th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <tr>
                <td colSpan={isAdmin ? 6 : 5} className="px-6 py-10 text-center text-gray-500">Đang tải dữ liệu...</td>
              </tr>
            ) : filteredBooks.length === 0 ? (
               <tr>
                <td colSpan={isAdmin ? 6 : 5} className="px-6 py-10 text-center text-gray-500">Không tìm thấy bản ghi nào.</td>
              </tr>
            ) : (
              filteredBooks.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{record.borrowerName}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{record.groupRole}</div>
                    
                    {/* Mobile Only Contacts */}
                    <div className="text-xs text-gray-500 mt-2 lg:hidden">
                       <div>SĐT: {record.phone}</div>
                       {record.facebook && <div>FB: <a href={record.facebook} target="_blank" rel="noreferrer" className="text-blue-500">Link</a></div>}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                    {record.bookTitle}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <div>Mượn: {new Date(record.borrowDate).toLocaleDateString('vi-VN')}</div>
                    <div>Trả: {new Date(record.returnDate).toLocaleDateString('vi-VN')}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 hidden lg:table-cell">
                    <div>{record.phone}</div>
                    {record.facebook && (
                      <a href={record.facebook} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Facebook</a>
                    )}
                    {record.email && <div>{record.email}</div>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {getStatusBadge(record.status)}
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex flex-col items-end gap-2 space-y-2 lg:space-y-0 lg:flex-row lg:justify-end">
                      {record.status !== 'returned' && (
                        <button
                          onClick={() => handleReturnBook(record.id)}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 bg-green-50 dark:bg-green-900/30 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap"
                        >
                          Xác nhận trả
                        </button>
                      )}
                      
                        <button
                          onClick={() => handleDeleteRecord(record.id)}
                          className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 p-1.5 rounded-md transition-colors"
                          title="Xoá bản ghi"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
    </div>
  );
}
