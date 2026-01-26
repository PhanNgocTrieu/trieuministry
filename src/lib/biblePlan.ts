
export interface BibleBook {
    name: string;
    chapters: number;
}

export const OT_BOOKS: BibleBook[] = [
    { name: "Genesis", chapters: 50 }, { name: "Exodus", chapters: 40 }, { name: "Leviticus", chapters: 27 },
    { name: "Numbers", chapters: 36 }, { name: "Deuteronomy", chapters: 34 }, { name: "Joshua", chapters: 24 },
    { name: "Judges", chapters: 21 }, { name: "Ruth", chapters: 4 }, { name: "1 Samuel", chapters: 31 },
    { name: "2 Samuel", chapters: 24 }, { name: "1 Kings", chapters: 22 }, { name: "2 Kings", chapters: 25 },
    { name: "1 Chronicles", chapters: 29 }, { name: "2 Chronicles", chapters: 36 }, { name: "Ezra", chapters: 10 },
    { name: "Nehemiah", chapters: 13 }, { name: "Esther", chapters: 10 }, { name: "Job", chapters: 42 },
    { name: "Psalms", chapters: 150 }, { name: "Proverbs", chapters: 31 }, { name: "Ecclesiastes", chapters: 12 },
    { name: "Song of Solomon", chapters: 8 }, { name: "Isaiah", chapters: 66 }, { name: "Jeremiah", chapters: 52 },
    { name: "Lamentations", chapters: 5 }, { name: "Ezekiel", chapters: 48 }, { name: "Daniel", chapters: 12 },
    { name: "Hosea", chapters: 14 }, { name: "Joel", chapters: 3 }, { name: "Amos", chapters: 9 },
    { name: "Obadiah", chapters: 1 }, { name: "Jonah", chapters: 4 }, { name: "Micah", chapters: 7 },
    { name: "Nahum", chapters: 3 }, { name: "Habakkuk", chapters: 3 }, { name: "Zephaniah", chapters: 3 },
    { name: "Haggai", chapters: 2 }, { name: "Zechariah", chapters: 14 }, { name: "Malachi", chapters: 4 }
];

export const NT_BOOKS: BibleBook[] = [
    { name: "Matthew", chapters: 28 }, { name: "Mark", chapters: 16 }, { name: "Luke", chapters: 24 },
    { name: "John", chapters: 21 }, { name: "Acts", chapters: 28 }, { name: "Romans", chapters: 16 },
    { name: "1 Corinthians", chapters: 16 }, { name: "2 Corinthians", chapters: 13 }, { name: "Galatians", chapters: 6 },
    { name: "Ephesians", chapters: 6 }, { name: "Philippians", chapters: 4 }, { name: "Colossians", chapters: 4 },
    { name: "1 Thessalonians", chapters: 5 }, { name: "2 Thessalonians", chapters: 3 }, { name: "1 Timothy", chapters: 6 },
    { name: "2 Timothy", chapters: 4 }, { name: "Titus", chapters: 3 }, { name: "Philemon", chapters: 1 },
    { name: "Hebrews", chapters: 13 }, { name: "James", chapters: 5 }, { name: "1 Peter", chapters: 5 },
    { name: "2 Peter", chapters: 3 }, { name: "1 John", chapters: 5 }, { name: "2 John", chapters: 1 },
    { name: "3 John", chapters: 1 }, { name: "Jude", chapters: 1 }, { name: "Revelation", chapters: 22 }
];

export interface DayPlan {
    day: number;
    readings: string[]; // e.g. ["Gen 1", "Gen 2", "Matt 1"]
    display: string;    // e.g. "Genesis 1-2; Matthew 1"
}

const getReadingsForLoop = (books: BibleBook[], days: number): { [day: number]: string[] } => {
    const totalChapters = books.reduce((acc, book) => acc + book.chapters, 0);
    const readingMap: { [day: number]: string[] } = {};
    
    let currentBookIndex = 0;
    let currentChapter = 1;
    let chaptersAssigned = 0;

    for (let day = 1; day <= days; day++) {
        const targetChapters = Math.round((day / days) * totalChapters) - chaptersAssigned;
        const dailyReadings: string[] = [];
        
        for (let i = 0; i < targetChapters; i++) {
            const book = books[currentBookIndex];
            if (!book) break;

            dailyReadings.push(`${book.name} ${currentChapter}`);
            
            chaptersAssigned++;
            currentChapter++;

            if (currentChapter > book.chapters) {
                currentBookIndex++;
                currentChapter = 1;
            }
        }
        readingMap[day] = dailyReadings;
    }
    return readingMap;
};

const formatReadings = (readings: string[]): string => {
    if (readings.length === 0) return "";
    if (readings.length === 1) return readings[0];

    const first = readings[0];
    const last = readings[readings.length - 1];
    
    // Check if same book
    const firstSpace = first.lastIndexOf(" ");
    const lastSpace = last.lastIndexOf(" ");
    const firstBook = first.substring(0, firstSpace);
    const lastBook = last.substring(0, lastSpace);
    
    if (firstBook === lastBook) {
        const startChap = first.substring(firstSpace + 1);
        const endChap = last.substring(lastSpace + 1);
        return `${firstBook} ${startChap}-${endChap}`;
    } else {
        return `${first} - ${last}`;
    }
};

export const getBiblePlan = (): DayPlan[] => {
    const otMap = getReadingsForLoop(OT_BOOKS, 365);
    const ntMap = getReadingsForLoop(NT_BOOKS, 365);
    const plan: DayPlan[] = [];

    for (let day = 1; day <= 365; day++) {
        const otReadings = otMap[day] || [];
        const ntReadings = ntMap[day] || [];
        const combinedReadings = [...otReadings, ...ntReadings];
        
        const otDisplay = formatReadings(otReadings);
        const ntDisplay = formatReadings(ntReadings);
        
        let display = "";
        if (otDisplay && ntDisplay) {
            display = `${otDisplay}; ${ntDisplay}`;
        } else if (otDisplay) {
            display = otDisplay;
        } else {
            display = ntDisplay || "Rest / Catch up";
        }

        plan.push({
            day,
            readings: combinedReadings,
            display
        });
    }
    return plan;
};
