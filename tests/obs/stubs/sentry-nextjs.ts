let lastInitArg: any = null
const tagCalls: Array<[string, string]> = []

export function init(arg: any) {
  lastInitArg = arg
}

export function setTag(k: string, v: string) {
  tagCalls.push([k, v])
}

export function __getInitArg() {
  return lastInitArg
}

export function __getTagCalls() {
  return tagCalls.slice()
}

