
export interface ResourceItem {
    id: string;
    slug: string;
    title: string;
    category: string;
    description: string;
    coverImage: string;
    date: string;
    author: string;
    type: 'blog' | 'document' | 'song';
    fileUrl?: string; // For documents/sheets
    size?: string; // Optional size for display
}

export const mockDocuments: ResourceItem[] = [
  {
    id: 'doc-1',
    slug: 'worship-team-lessons',
    title: 'Worship Team Lessons',
    category: 'Bible Study',
    description: 'Essential lessons and guidelines for the worship team ministry. Learn about the heart of worship, musical excellence, and spiritual preparation.',
    coverImage: '/images/resources/bible_study/_worship_team_lessons.png',
    date: '2024-01-15',
    author: 'Worship Ministry',
    type: 'document',
    fileUrl: '/resources/bible_study/_worship_team_lessons.pdf',
    size: '3.6 MB'
  },
  {
    id: 'doc-2',
    slug: 'honor-parents',
    title: 'Be Blessed in Honoring Parents',
    category: 'Sharing',
    description: 'A spiritual guide on the importance of honoring one\'s parents. Discover biblical principles for family relationships and the blessings that follow obedience.',
    coverImage: '/images/resources/sharing/_be_bless_in_honoring_parents.jpg',
    date: '2024-02-10',
    author: 'Trieu John',
    type: 'document',
    fileUrl: '/resources/sharing/_be_bless_in_honoring_parents.pdf',
    size: '90 KB'
  },
  {
    id: 'doc-3',
    slug: 'can-i-help-you',
    title: 'Can I Help You?',
    category: 'Sharing',
    description: 'Exploring the heart of service and helping others in the community. Practical ways to serve God by serving His people.',
    coverImage: '/images/resources/sharing/_can_i_help_you.jpg',
    date: '2024-02-12',
    author: 'Ministry Team',
    type: 'document',
    fileUrl: '/resources/sharing/_can_i_help_you.pdf',
    size: '320 KB'
  },
  {
    id: 'doc-4',
    slug: 'reason-for-coming',
    title: 'Reason for Coming',
    category: 'Sharing',
    description: 'Understanding the purpose of gathering and our mission. Why do we come to church? What is our collective purpose?',
    coverImage: '/images/resources/sharing/_reason_for_coming.jpg',
    date: '2024-03-01',
    author: 'Leadership',
    type: 'document',
    fileUrl: '/resources/sharing/_reason_for_coming.pdf',
    size: '172 KB'
  }
];

export const mockSongs: ResourceItem[] = [
    {
        id: 'song-1',
        slug: 'man-of-sorrow',
        title: 'Man of Sorrow',
        category: 'Worship',
        description: 'Lyrics and chords for "Man of Sorrow".',
        coverImage: '/images/resources/songs/_man_of_sorrow.jpg', // Placeholder until real image is added
        date: '2024-03-20',
        author: 'Worship Team',
        type: 'song',
        fileUrl: '/resources/songs/_man_of_sorrow.pdf',
        size: '30 KB'
    }
];

export const allMockResources = [...mockDocuments, ...mockSongs];
