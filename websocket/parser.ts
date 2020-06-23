// export type Parser<T> = (message: string) => T;
export type Parser<T, O = never> = ((message: string) => T) | ((message: string, options: O) => T);
