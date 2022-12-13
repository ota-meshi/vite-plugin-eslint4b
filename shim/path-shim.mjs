export function dirname(p) {
  return p.split("/").slice(0, -1).join("/") || p;
}

export function extname(p) {
  return /\.[^.]+$/u.exec(p)[0];
}

export function relative(s) {
  return s;
}

export function resolve(s) {
  return s;
}

export function isAbsolute() {
  return false;
}

export function join(...args) {
  return args.join("/");
}

export const sep = "/";

export const posix = {
  dirname,
  extname,
  resolve,
  relative,
  sep,
  isAbsolute,
  join,
  get posix() {
    return posix;
  },
};
export default posix;
