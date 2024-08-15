export class BufferCache {
	private cache: { [key: string]: Buffer } = {};

	constructor(private maxSize: number) {}

	get(key: string) {
		if (!(key in this.cache)) return null;
		return this.cache[key];
	}

	set(key: string, value: Buffer) {
		this.cache[key] = value;
		this.trim();
	}

	delete(key: string) {
		delete this.cache[key];
	}

	private trim() {
		const keys = Object.keys(this.cache);
		let size = Object.values(this.cache).reduce((acc: number, buffer: Buffer) => acc + buffer.byteLength, 0);

		while (size > this.maxSize) {
			const key = keys.shift();
			if (key === undefined) break;
			size -= this.cache[key].byteLength;
			delete this.cache[key];
		}
	}
}
