declare module 'linematch' {
    export default function lineMatch(
        route1: [number, number][][],
        route2: [number, number][][],
        threshold: number
    ): number[][];
}
