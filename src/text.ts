export function quote(s: string): string {
    return `"${s}"`;
}

export function indentBy(n: number) {
    return (s: string) => s.split("\n").map(line => " ".repeat(n) + line).join("\n");
}
