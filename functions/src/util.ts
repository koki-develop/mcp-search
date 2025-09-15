export const bigram = (str: string): string[] => {
	const bigrams: string[] = [];
	for (let i = 0; i < str.length - 1; i++) {
		bigrams.push(str.slice(i, i + 2));
	}
	return bigrams;
};

export function numberToAlphabet(number: number, fixedLength: number) {
	const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
	let result = "";

	while (number > 0) {
		const remainder = number % alphabet.length;
		result = alphabet[remainder] + result;
		number = Math.floor(number / alphabet.length);
	}

	result = result.padStart(fixedLength, "A");
	return result;
}
