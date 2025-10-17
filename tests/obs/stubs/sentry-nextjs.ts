let lastInitArg: any = null
const tagCalls: Array<[string, string]> = []
const messages: Array<{ message: string; context?: any }> = []

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

export function captureMessage(message: string, context?: any) {
  messages.push({ message, context })
}

export function __getCapturedMessages() {
  return messages.slice()
}

export function __resetCapturedMessages() {
  messages.length = 0
  tagCalls.length = 0
}
