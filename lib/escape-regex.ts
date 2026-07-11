/** Escapes regex metacharacters so user input can be safely used inside a mongoose $regex filter. */
export function escapeRegex(input: string): string {
    return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
