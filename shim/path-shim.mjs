export function dirname(p) {
  return p.split("/").slice(0, -1).join("/") || p;
}

export function basename(p, ext) {
  const base = p.split("/").pop() || p;
  return base.endsWith(ext) ? base.slice(0, -ext.length) : base;
}

export function extname(p) {
  return /\.[^.]+$/u.exec(p)?.[0] || "";
}

export function relative(from, to) {
  if (to.startsWith(from)) {
    return adjust(to.slice(from.length));
  }
  return to;

  function adjust(s) {
    return s.startsWith("./") ? s.slice(2) : s.startsWith("/") ? s.slice(1) : s;
  }
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

export function parse(s) {
  const dir = dirname(s);
  const ext = extname(s);
  const base = basename(s);
  return {
    root: "",
    dir,
    base,
    ext,
    name: basename(base, ext),
  };
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
  parse,
  get posix() {
    return posix;
  },
};
export default posix;
