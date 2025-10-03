export function isDecimal<const T extends number | `${number}`>(s: T) {
  if (typeof s === "number") {
    return !Number.isInteger(s);
  } else return !Number.isInteger(Number.parseFloat(s));
}

export function toN<const V extends number | `${number}`>(s: V) {
  return isDecimal(s)
    ? typeof s === "number"
      ? s
      : Number.parseFloat(s)
    : typeof s === "number"
      ? s
      : Number.parseInt(s, 10);
}
