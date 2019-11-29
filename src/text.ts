export function quote(s: string): string {
    return `"${s}"`;
}

export function indentBy(n: number) {
    const indentIfNotEmpty = (line: string) => line === "" ? "" : " ".repeat(n) + line;
    return (s: string) => s.split("\n").map(indentIfNotEmpty).join("\n");
}
