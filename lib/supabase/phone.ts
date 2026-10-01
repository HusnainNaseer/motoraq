// Accepts 03001234567, +92 300 1234567, 0092300..., and stores 923001234567
export function normalizePkPhone(input: string): string | null {
  let n = input.replace(/\D/g, "");
  if (n.startsWith("0092")) n = n.slice(2);
  else if (n.startsWith("0")) n = "92" + n.slice(1);
  return /^923\d{9}$/.test(n) ? n : null;
}

export function formatPkPhone(n: string) {
  return `+${n.slice(0, 2)} ${n.slice(2, 5)} ${n.slice(5)}`;
}