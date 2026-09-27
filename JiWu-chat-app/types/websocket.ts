interface WebSocketService {
  connect(): void;
  disconnect(): void;
  sendGroupInvite(data: any): boolean;
  on(event: string, callback: Function): void;
  off(event: string, callback: Function): void;
  isConnected(): boolean;
}

declare global {
  interface Window {
    websocketService?: WebSocketService;
  }
}

export {};
