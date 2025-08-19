import { isValid, parse } from 'date-fns';
import type { Timestamp } from 'firebase/firestore';

// Function to parse various date formats, including Excel serial numbers
export function parseDate(dateValue: any): Date {
    if (!dateValue) return new Date(0); // Return an invalid date if no value

    // Case 1: Firestore Timestamp
    if (dateValue && typeof dateValue.toDate === 'function') {
        return (dateValue as Timestamp).toDate();
    }
    
    // Case 2: Standard string date like "14 April 1891"
    if (typeof dateValue === 'string') {
        const parsedDate = parse(dateValue, 'd MMMM yyyy', new Date());
        if (isValid(parsedDate)) {
            return parsedDate;
        }
    }

    // Case 3: Excel Serial Number (which comes as a string or number)
    const numericDate = Number(dateValue);
    if (!isNaN(numericDate) && numericDate > 0) {
        // Excel serial date is the number of days since 1900-01-01.
        // JS Date is milliseconds since 1970-01-01.
        // 25569 is the number of days between 1900 and 1970, accounting for Excel's 1900 leap year bug.
        const excelEpoch = new Date(Date.UTC(1899, 11, 30));
        return new Date(excelEpoch.getTime() + numericDate * 24 * 60 * 60 * 1000);
    }
    
    // Fallback for any other format or invalid string
    const directParsed = new Date(dateValue);
    if(isValid(directParsed)) {
        return directParsed;
    }

    return new Date(0); // Return an invalid date as a final fallback
}
