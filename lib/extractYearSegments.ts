interface SuggestedSection {
  title: string;
  content: string;
}

export function extractYearSegments(
  suggestedStructure?: SuggestedSection[]
): { yearRanges: string[]; productSegments: string[] } {
  const yearRangePattern = /((?:19|20)\d{2})\s*-\s*(\d{2}|\d{4})/g;
  const yearRanges: string[] = [];
  const productSegments: string[] = [];

  if (suggestedStructure) {
    suggestedStructure.forEach(section => {
      yearRangePattern.lastIndex = 0;
      let match: RegExpExecArray | null;
      let foundYear = false;
      while ((match = yearRangePattern.exec(section.title)) !== null) {
        foundYear = true;
        const start = match[1];
        const end = match[2].length === 2 ? start.slice(0, 2) + match[2] : match[2];
        yearRanges.push(`${start}-${end}`);
      }
      if (!foundYear) {
        const segment = section.title
          .replace(yearRangePattern, '')
          .replace(/models?/i, '')
          .trim();
        if (segment) productSegments.push(segment);
      }
    });
  }

  return {
    yearRanges: Array.from(new Set(yearRanges)),
    productSegments: Array.from(new Set(productSegments))
  };
}

export type { SuggestedSection };
