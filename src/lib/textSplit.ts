export const splitWords = (text: string) => text.split(/\s+/).filter(Boolean);

export const splitChars = (text: string) => Array.from(text);
