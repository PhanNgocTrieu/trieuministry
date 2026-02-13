"use client";

import React, { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, doc, deleteDoc, Timestamp, writeBatch } from 'firebase/firestore';
import { useModal } from '@/context/ModalContext';

interface PrayerSponsor {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    tags: string[]; // Array of strings
    phoneNumber: string;
    group: 'vietnamese' | 'foreigner';
    notes: string;
    createdAt: Timestamp;
}

export default function PrayerSponsors() {
    const [sponsors, setSponsors] = useState<PrayerSponsor[]>([]);
    const [loading, setLoading] = useState(true);
    const { showAlert, showConfirm } = useModal();
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Search & Filter
    const [searchTerm, setSearchTerm] = useState('');
    const [tagFilter, setTagFilter] = useState('');
    const [phoneFilter, setPhoneFilter] = useState<'all' | 'has_phone' | 'no_phone'>('all');
    const [groupFilter, setGroupFilter] = useState<'all' | 'vietnamese' | 'foreigner'>('all');
    const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name_asc' | 'name_desc'>('newest');

    // Modal & Form State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        email: '',
        firstName: '',
        lastName: '',
        tags: '', // Input as comma-separated string
        phoneNumber: '',
        group: 'vietnamese' as 'vietnamese' | 'foreigner', // Default to Vietnamese
        notes: ''
    });

    useEffect(() => {
        const q = query(collection(db, "prayer_sponsors"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    // Ensure tags is always an array
                    tags: Array.isArray(data.tags) ? data.tags : [],
                    // Ensure group has a default if missing
                    group: data.group || 'vietnamese'
                };
            }) as PrayerSponsor[];
            setSponsors(list);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const resetForm = () => {
        setFormData({
            email: '',
            firstName: '',
            lastName: '',
            tags: '',
            phoneNumber: '',
            group: 'vietnamese',
            notes: ''
        });
        setEditingId(null);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        
        try {
            // Process tags: split by comma, trim whitespace, filter empty
            const processedTags = formData.tags
                .split(',')
                .map(t => t.trim())
                .filter(t => t.length > 0);

            const data = {
                email: formData.email,
                firstName: formData.firstName,
                lastName: formData.lastName,
                tags: processedTags,
                phoneNumber: formData.phoneNumber,
                group: formData.group,
                notes: formData.notes,
                updatedAt: Timestamp.now()
            };

            if (editingId) {
                await updateDoc(doc(db, "prayer_sponsors", editingId), data);
            } else {
                await addDoc(collection(db, "prayer_sponsors"), {
                    ...data,
                    createdAt: Timestamp.now()
                });
            }
            
            setIsModalOpen(false);
            resetForm();
            showAlert("Success", "Partner saved successfully.");
        } catch (error) {
            console.error("Error saving prayer sponsor:", error);
            showAlert("Error", "Failed to save information.");
        }
    };

    const handleEdit = (sponsor: PrayerSponsor) => {
        setEditingId(sponsor.id);
        setFormData({
            email: sponsor.email || '',
            firstName: sponsor.firstName || '',
            lastName: sponsor.lastName || '',
            tags: (sponsor.tags || []).join(', '),
            phoneNumber: sponsor.phoneNumber || '',
            group: sponsor.group || 'vietnamese',
            notes: sponsor.notes || ''
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        showConfirm(
            "Delete Partner",
            "Are you sure you want to delete this partner from the list?",
            async () => {
                await deleteDoc(doc(db, "prayer_sponsors", id));
            },
            true
        );
    };

    const exportToCSV = () => {
        // Headers with Phone Number included for completeness using this format
        const headers = ["Email Address", "First Name", "Last Name", "Group", "Tags", "Phone Number"];
        
        // Export filtered results only? The user requested "export file csv cũng chọn theo group để export" 
        // implies exporting what is currently viewed or selectable. 
        // Let's export the *filteredSponsors* to respect the filters.
        const rows = filteredSponsors.map(s => [
            s.email,
            s.firstName,
            s.lastName,
            s.group || 'vietnamese',
            `"${(s.tags || []).join(',')}"`, // Quote tags to handle commas inside
            s.phoneNumber
        ]);

        const csvContent = [
            headers.join(','), 
            ...rows.map(r => r.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        
        link.setAttribute("href", url);
        link.setAttribute("download", `prayer_partners_${groupFilter === 'all' ? 'all' : groupFilter}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const text = e.target?.result as string;
                if (!text) return;

                const lines = text.split('\n');
                if (lines.length < 2) {
                    showAlert("Error", "CSV file is empty or missing data.");
                    return;
                }

                // Parse headers
                const headerLine = lines[0];
                const headers = parseCSVLine(headerLine).map(h => h.toLowerCase().trim());
                
                // Map columns
                const emailIdx = headers.findIndex(h => h.includes('email'));
                const firstNameIdx = headers.findIndex(h => h.includes('first') && h.includes('name'));
                const lastNameIdx = headers.findIndex(h => h.includes('last') && h.includes('name'));
                const groupIdx = headers.findIndex(h => h.includes('group') || h.includes('classification') || h.includes('type'));
                const tagsIdx = headers.findIndex(h => h.includes('tag') || h.includes('category'));
                const phoneIdx = headers.findIndex(h => h.includes('phone') || h.includes('mobile') || h.includes('number'));

                console.log("CSV Header Mapping:", { headers, emailIdx, firstNameIdx, lastNameIdx, groupIdx, tagsIdx, phoneIdx });

                // If no email column found, try index 0 but warn
                // If mapping fails completely, fallback to default order: Email, First, Last, Group, Tags, Phone
                const useDefaultMapping = emailIdx === -1 && firstNameIdx === -1;
                
                const dataLines = lines.slice(1);
                const batch = writeBatch(db);
                let count = 0;
                let errorCount = 0;

                for (const line of dataLines) {
                    if (!line.trim()) continue;

                    const cols = parseCSVLine(line);
                    
                    // Defaults
                    let email = '', firstName = '', lastName = '', group = 'vietnamese', tagsRaw = '', phoneNumber = '';

                    if (useDefaultMapping) {
                         // Default: Email, First, Last, Group, Tags, Phone
                         if (cols.length >= 1) email = cols[0];
                         if (cols.length >= 2) firstName = cols[1];
                         if (cols.length >= 3) lastName = cols[2];
                         // Check if col 3 is likely a group or tag? 
                         // To be safe, let's assume if it matches 'foreigner' or 'vietnamese' it is group
                         // Otherwise check col 3 logic. But let's follow the export structure: Group at index 3
                         if (cols.length >= 4) group = cols[3];
                         if (cols.length >= 5) tagsRaw = cols[4];
                         if (cols.length >= 6) phoneNumber = cols[5];
                    } else {
                        // Mapped
                        if (emailIdx !== -1) email = cols[emailIdx] || '';
                        if (firstNameIdx !== -1) firstName = cols[firstNameIdx] || '';
                        if (lastNameIdx !== -1) lastName = cols[lastNameIdx] || '';
                        if (groupIdx !== -1) group = cols[groupIdx] || 'vietnamese';
                        if (tagsIdx !== -1) tagsRaw = cols[tagsIdx] || '';
                        if (phoneIdx !== -1) phoneNumber = cols[phoneIdx] || '';
                    }

                    // Normalize group
                    const groupLower = group.toLowerCase().trim();
                    const finalGroup = (groupLower === 'foreigner' || groupLower === 'foreign') ? 'foreigner' : 'vietnamese';

                    // Validation
                    if (!email || !email.includes('@')) {
                        console.warn("Skipping invalid email row:", line, { email });
                        errorCount++;
                        continue;
                    }

                    const tags = tagsRaw 
                        ? tagsRaw.split(',').map(t => t.trim()).filter(t => t) 
                        : [];
                    
                    const docRef = doc(collection(db, "prayer_sponsors"));
                    batch.set(docRef, {
                        email: email.trim(),
                        firstName: firstName?.trim() || '',
                        lastName: lastName?.trim() || '',
                        group: finalGroup,
                        tags: tags,
                        phoneNumber: phoneNumber?.trim() || '',
                        notes: 'Imported via CSV',
                        createdAt: Timestamp.now()
                    });
                    count++;
                }

                if (count > 0) {
                    await batch.commit();
                    let msg = `Successfully imported ${count} partners.`;
                    if (errorCount > 0) msg += ` Skipped ${errorCount} invalid rows.`;
                    showAlert("Success", msg);
                } else {
                    console.warn("No valid records found in lines:", dataLines.length);
                    showAlert("Info", "No valid records found. Ensure headers include 'Email', 'First Name', etc.");
                }

            } catch (error) {
                console.error("Import error:", error);
                showAlert("Error", "Failed to import CSV file. Check format.");
            }
            
            // Reset input
            if (fileInputRef.current) fileInputRef.current.value = '';
        };
        reader.readAsText(file);
    };

    // Helper for robust CSV line parsing
    const parseCSVLine = (text: string) => {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            if (char === '"') {
                // If next char is also quote, it's an escaped quote
                if (inQuotes && text[i+1] === '"') {
                    current += '"';
                    i++; 
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.trim());
        return result;
    };

    // Filter & Sort Logic
    const filteredSponsors = sponsors.filter(s => {
        const matchesSearch = 
            (s.email?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
            (s.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
            (s.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) || '');
            
        const matchesTag = tagFilter 
            ? s.tags?.some(tag => tag.toLowerCase().includes(tagFilter.toLowerCase())) 
            : true;

        const matchesPhone = 
            phoneFilter === 'all' ? true :
            phoneFilter === 'has_phone' ? (s.phoneNumber && s.phoneNumber.trim().length > 0) :
            (s.phoneNumber === '' || !s.phoneNumber); // no_phone

        const matchesGroup = 
            groupFilter === 'all' ? true :
            s.group === groupFilter;

        return matchesSearch && matchesTag && matchesPhone && matchesGroup;
    }).sort((a, b) => {
        if (sortBy === 'newest') return b.createdAt.toMillis() - a.createdAt.toMillis();
        if (sortBy === 'oldest') return a.createdAt.toMillis() - b.createdAt.toMillis();
        
        const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
        const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
        
        if (sortBy === 'name_asc') return nameA.localeCompare(nameB);
        if (sortBy === 'name_desc') return nameB.localeCompare(nameA);
        
        return 0;
    });

    // Get all unique tags for filter dropdown
    const allTags = Array.from(new Set(sponsors.flatMap(s => s.tags || []))).sort();

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Prayer Partners (Mailing List)</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Manage contacts for prayer updates and newsletters.</p>
                </div>
                <div className="flex gap-3">
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleImportCSV} 
                        accept=".csv" 
                        className="hidden" 
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold flex items-center gap-2 transition-all"
                    >
                        <i className="fas fa-file-import"></i> Import CSV
                    </button>
                    <button
                        onClick={exportToCSV}
                        className="bg-green-600 text-white px-4 py-2.5 rounded-xl hover:bg-green-500 shadow-lg shadow-green-900/20 font-bold flex items-center gap-2 transition-all"
                    >
                        <i className="fas fa-file-csv"></i> Export CSV
                    </button>
                    <button
                        onClick={() => { resetForm(); setIsModalOpen(true); }}
                        className="bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-500 shadow-lg shadow-blue-900/20 font-bold flex items-center gap-2 transition-all transform hover:-translate-y-0.5"
                    >
                        <i className="fas fa-plus"></i> Add Partner
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="relative md:col-span-2">
                    <i className="fas fa-search absolute left-4 top-3.5 text-slate-400"></i>
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
                <div>
                    <select
                        value={groupFilter}
                        onChange={(e) => setGroupFilter(e.target.value as any)}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                    >
                        <option value="all">All Groups</option>
                        <option value="vietnamese">Vietnamese</option>
                        <option value="foreigner">Foreigner</option>
                    </select>
                </div>
                <div>
                    <select
                        value={tagFilter}
                        onChange={(e) => setTagFilter(e.target.value)}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                    >
                        <option value="">All Tags</option>
                        {allTags.map(tag => (
                            <option key={tag} value={tag}>{tag}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <select
                        value={phoneFilter}
                        onChange={(e) => setPhoneFilter(e.target.value as any)}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                    >
                        <option value="all">All Phone</option>
                        <option value="has_phone">Has Phone</option>
                        <option value="no_phone">No Phone</option>
                    </select>
                </div>
                {/* Moved Sort to fit grid better if needed, or keep separately. 5 cols is getting tight. */}
            </div>
            
            <div className="flex justify-end mb-4">
                 <div className="w-full md:w-48">
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                    >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="name_asc">Name (A-Z)</option>
                        <option value="name_desc">Name (Z-A)</option>
                    </select>
                </div>
            </div>

            {/* List */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-white/5">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">First Name</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Last Name</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Group</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tags</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Phone</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right w-24">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                            {filteredSponsors.length > 0 ? filteredSponsors.map(sponsor => (
                                <tr key={sponsor.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                                    <td className="px-6 py-4 align-top">
                                        <div className="font-bold text-slate-900 dark:text-white">
                                            {sponsor.firstName}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 align-top">
                                        <div className="font-bold text-slate-900 dark:text-white">
                                            {sponsor.lastName}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 align-top">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${
                                            sponsor.group === 'foreigner' 
                                            ? 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700/50' 
                                            : 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700/50'
                                        }`}>
                                            {sponsor.group === 'foreigner' ? 'Foreigner' : 'Vietnamese'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 align-top">
                                        <a href={`mailto:${sponsor.email}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                                            {sponsor.email}
                                        </a>
                                    </td>
                                    <td className="px-6 py-4 align-top">
                                        <div className="flex flex-wrap gap-1">
                                            {sponsor.tags && sponsor.tags.length > 0 ? (
                                                sponsor.tags.map((tag, idx) => (
                                                    <span key={idx} className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10">
                                                        {tag}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-slate-400 italic text-xs">No tags</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 align-top text-slate-600 dark:text-slate-400">
                                        {sponsor.phoneNumber || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right align-top">
                                        <div className="flex items-center justify-end gap-2">
                                            <button 
                                                onClick={() => handleEdit(sponsor)} 
                                                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-blue-500/10 hover:text-blue-500 dark:hover:text-blue-400 transition-all"
                                                title="Edit"
                                            >
                                                <i className="fas fa-pen"></i>
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(sponsor.id)} 
                                                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-all"
                                                title="Delete"
                                            >
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <i className="fas fa-users text-4xl mb-3 opacity-20"></i>
                                            <p>No prayer partners found.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden transform transition-all" onClick={e => e.stopPropagation()}>
                        <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-b border-slate-200 dark:border-white/10 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                {editingId ? 'Edit Partner' : 'Add Prayer Partner'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all">
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">First Name</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={formData.firstName}
                                        onChange={e => setFormData({...formData, firstName: e.target.value})}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 font-bold text-slate-900 dark:text-white placeholder-slate-400"
                                        placeholder="John"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Last Name</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={formData.lastName}
                                        onChange={e => setFormData({...formData, lastName: e.target.value})}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 font-bold text-slate-900 dark:text-white placeholder-slate-400"
                                        placeholder="Doe"
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Group Classification</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({...formData, group: 'vietnamese'})}
                                        className={`px-4 py-3 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all ${
                                            formData.group === 'vietnamese'
                                            ? 'bg-red-50 border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-500/30'
                                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 dark:bg-slate-800 dark:border-white/10 dark:text-slate-400 dark:hover:bg-slate-700'
                                        }`}
                                    >
                                        <span className="w-3 h-3 rounded-full bg-red-500"></span> Vietnamese
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({...formData, group: 'foreigner'})}
                                        className={`px-4 py-3 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all ${
                                            formData.group === 'foreigner'
                                            ? 'bg-purple-50 border-purple-200 text-purple-600 dark:bg-purple-900/20 dark:border-purple-500/30'
                                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 dark:bg-slate-800 dark:border-white/10 dark:text-slate-400 dark:hover:bg-slate-700'
                                        }`}
                                    >
                                        <span className="w-3 h-3 rounded-full bg-purple-500"></span> Foreigner
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Email Address</label>
                                <input 
                                    type="email" 
                                    required
                                    value={formData.email}
                                    onChange={e => setFormData({...formData, email: e.target.value})}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white placeholder-slate-400"
                                    placeholder="john@example.com"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Phone Number (Optional)</label>
                                <input 
                                    type="tel" 
                                    value={formData.phoneNumber}
                                    onChange={e => setFormData({...formData, phoneNumber: e.target.value})}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white placeholder-slate-400"
                                    placeholder="+1 234 567 8900"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Tags / Categories</label>
                                <input 
                                    type="text" 
                                    value={formData.tags}
                                    onChange={e => setFormData({...formData, tags: e.target.value})}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white placeholder-slate-400"
                                    placeholder="e.g. Church, Family, Close Friend (comma separated)"
                                />
                                <p className="text-xs text-slate-400 mt-1">Separate multiple tags with commas.</p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Notes (Internal)</label>
                                <textarea 
                                    value={formData.notes}
                                    onChange={e => setFormData({...formData, notes: e.target.value})}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white resize-none h-20 placeholder-slate-400"
                                    placeholder="Any additional details..."
                                />
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-6 py-2.5 rounded-xl text-slate-500 font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-8 py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-500 transition-all"
                                >
                                    Save Partner
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
