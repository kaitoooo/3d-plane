// 線形補間 (previous, current, amt)
// amt : 2つの間で保管する量（0.0から1.0）
const lerp = (previous: number, current: number, amt: number): number => (1 - amt) * previous + amt * current;
export { lerp };
