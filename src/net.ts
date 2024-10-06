export type Aux = { type: "aux"; other: Aux; label: string }

export type Tree =
  | { type: "nil"; label?: undefined }
  | { type: "one"; down: Tree; label?: undefined }
  | { type: "two"; tag: number; left: Tree; right: Tree; label?: undefined }
  | Aux

export const nil = { type: "nil" as const }

export function con(a: Tree, b: Tree): Tree {
  return ctr(0, a, b)
}

export function dup(a: Tree, b: Tree): Tree {
  return ctr(1, a, b)
}

export function swap(a: Tree): Tree {
  return ctr1(a)
}

export function ctr(tag: number, a: Tree, b: Tree): Tree {
  return { type: "two", tag, left: a, right: b }
}

export function ctr1(a: Tree): Tree {
  return { type: "one", down: a }
}

export function wire(label: string): [Aux, Aux] {
  const x: Tree = { type: "aux", other: null!, label }
  const y: Tree = { type: "aux", other: x, label }
  x.other = y
  return [x, y]
}

export function wires(): Record<string, Aux> {
  return new Proxy({}, {
    get: (target: any, key) => {
      if (key in target) {
        const v = target[key]
        delete target[key]
        return v
      }
      const [a, b] = wire(key as string)
      target[key] = b
      return a
    },
  })
}

export type Pair = [Tree, Tree]

export type Net = [Tree[], Pair[]]

export function reduce([a, b]: Pair): Pair[] {
  if (a.type === "aux") {
    if (b.type === "aux") {
      a.other.other = b.other
      b.other.other = a.other
      a.other.label = b.other.label = pairLabel(a, b)
    } else {
      delete (a.other as any).other
      Object.assign(a.other, b)
    }
    return []
  }
  if (b.type === "aux") {
    delete (b.other as any).other
    Object.assign(b.other, a)
    return []
  }
  if (a.type === "nil") {
    if (b.type === "nil") {
      return []
    }
    if (b.type === "one") {
      return [[nil, b.down]]
    }
    return [[nil, b.left], [nil, b.right]]
  }
  if (b.type === "nil") {
    if (a.type === "one") {
      return [[a.down, nil]]
    }
    return [[a.left, nil], [a.right, nil]]
  }
  if (a.type === "one") {
    if (b.type === "one") {
      return [[a.down, b.down]]
    }
    const newtag = (b.tag == 1) ? 2 : ((b.tag == 2) ? 1 : b.tag)
    const [[Dl, dL], [Dr, dR]] = [
      wire(pairLabel(a.down, b.left)),
      wire(pairLabel(a.down, b.right)),
    ]
    return [
      [a.down, { type: "two", tag: newtag, left: Dl, right: Dr }],
      [{ type: "one", down: dL }, b.left],
      [{ type: "one", down: dR }, b.right],
    ]
  }
  if (b.type === "one") {
    const newtag = (a.tag == 1) ? 2 : ((a.tag == 2) ? 1 : a.tag)
    const [[Ld, lD], [Rd, rD]] = [
      wire(pairLabel(a.left, b.down)),
      wire(pairLabel(a.right, b.down)),
    ]
    return [
      [a.left, { type: "one", down: Ld }],
      [a.right, { type: "one", down: Rd }],
      [{ type: "two", tag: newtag, left: lD, right: rD }, b.down],
    ]
  }
  if (a.tag === b.tag) {
    return [[a.left, b.left], [a.right, b.right]]
  }
  const [[Ll, lL], [Lr, lR], [Rl, rL], [Rr, rR]] = [
    wire(pairLabel(a.left, b.left)),
    wire(pairLabel(a.left, b.right)),
    wire(pairLabel(a.right, b.left)),
    wire(pairLabel(a.right, b.right)),
  ]
  return [
    [a.left, { type: "two", tag: b.tag, left: Ll, right: Lr }],
    [a.right, { type: "two", tag: b.tag, left: Rl, right: Rr }],
    [{ type: "two", tag: a.tag, left: lL, right: rL }, b.left],
    [{ type: "two", tag: a.tag, left: lR, right: rR }, b.right],
  ]
}

function pairLabel(x: Tree, y: Tree) {
  return y.label || x.label || ""
}
