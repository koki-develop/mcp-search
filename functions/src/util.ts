export const bigram = (str: string): string[] => {
	const bigrams: string[] = [];
	for (let i = 0; i < str.length - 1; i++) {
		bigrams.push(str.slice(i, i + 2));
	}
	return bigrams;
};
