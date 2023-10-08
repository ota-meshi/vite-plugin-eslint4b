export function dirname(p) {
  return p.split("/").slice(0, -1).join("/") || p;
}

export function basename(p, ext) {
  const base = p.split("/").pop() || p;
  return base.endsWith(ext) ? base.slice(0, -ext.length) : base;
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
  basename,
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
