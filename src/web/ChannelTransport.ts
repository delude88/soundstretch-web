export interface ChannelTransport<T> {
  getPointer(channel?: number): number

  write(element: T): void

  read(element?: T): T

  close(): void
}
