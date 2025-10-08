let capturedOptions: any = null
export class NodeSDK {
  constructor(opts: any) { capturedOptions = opts }
  async start() {}
}
export function __getCapturedOptions() { return capturedOptions }

