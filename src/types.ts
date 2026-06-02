export interface PluginInput {
  client: unknown
  project: unknown
  directory: string
  $: unknown
}

export interface Hooks {
  tool?: Record<string, unknown>
  "tool.execute.before"?: (input: HookInput, output: HookOutput) => Promise<void>
  "tool.execute.after"?: (input: HookInput, output: HookOutput) => Promise<void>
  "experimental.chat.system.transform"?: (messages: SystemMessage[]) => Promise<SystemMessage[]>
  "experimental.session.compacting"?: (input: unknown) => Promise<unknown>
  "command.execute.before"?: (input: CommandInput, output: HookOutput) => Promise<void>
  event?: (input: EventInput) => void
  config?: (cfg: Record<string, unknown>) => void
}

export interface HookInput {
  tool_name?: string
  command?: string
  type?: string
}

export interface HookOutput {
  args?: Record<string, unknown>
}

export interface SystemMessage {
  role: string
  content: string
}

export interface CommandInput {
  command?: string
}

export interface EventInput {
  type: string
  [key: string]: unknown
}

export type Plugin = (
  input: PluginInput,
  options?: Record<string, unknown>
) => Promise<Hooks>