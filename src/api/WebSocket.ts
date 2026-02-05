export interface ImageObject {
    filename: string;
    content_type: string;
    base64: string;
}

export interface WallPostCommand {
    command: "wall.post";
    group_ids: number[];
    message: string;
    images: ImageObject[];
}

export interface StatusEvent {
    progress: {total: number; current: number};
    command: "status";
    group_id: string;
    link: string;
}

export interface ErrorEvent {
    progress: {total: number; current: number};
    command: "error";
    group_id: string;
    error: string;
}

export type ServerEvent = StatusEvent | ErrorEvent;

export class VkPostSocket {
    private socket: WebSocket | null = null;
    private reconnectAttems = 0;
    private reconnectInterval = 1000;
    private maxReconnectionAttems = 5;
    private isDisconnect = false;

    private messageHandler: ((data: ServerEvent) => void) | null = null;

    connect(onMessage: (data: ServerEvent) => void) {
        this.messageHandler = onMessage;
        this.reconnectAttems = 0;
        this.isDisconnect = false;
        
        this.createSocket();
    }

    private createSocket() {
        const token = localStorage.getItem("access_token");

        if (this.socket) {
            this.socket.onclose = null;
            this.socket.close();
        }

        this.socket = new WebSocket(
            `wss://vkapi.miwory.dev/vk/ws?token=${token}`,
        );

        this.socket.onopen = () => {
            console.log("WS connected");
            this.reconnectAttems = 0;
        };

        this.socket.onmessage = (event) => {
            const data: ServerEvent = JSON.parse(event.data);

            if (this.messageHandler) {
                this.messageHandler(data);
            }
        };

        this.socket.onerror = (e) => console.error("WS error", e);
        this.socket.onclose = (event) => {
            console.log("WS closed. Try reconnect", event.code, event.reason);

            if (this.isDisconnect) {
                return;
            }

            this.reconnect()
        }
    }

    isConnected(): boolean {
        return this.socket?.readyState === WebSocket.OPEN;
    }

    private reconnect() {
        if (this.reconnectAttems >= this.maxReconnectionAttems) {
            console.log("Max reconnection attems reached");
            return;
        }
        
        this.reconnectAttems += 1;
        console.log("Reconnecting in", this.reconnectInterval / 1000, "seconds");
        console.log('Reconnect attems - ', this.reconnectAttems);
        setTimeout(() => {
            if (!this.isDisconnect) {
                this.createSocket()
            }
        }, this.reconnectInterval);
    }

    send(data: WallPostCommand) {
        if (this.isConnected()) {
            this.socket!.send(JSON.stringify(data));
            return true;
        } else {
            if (!this.isDisconnect && this.messageHandler) {
                console.log('Attempting to reconnect');
                this.createSocket();
            }
            return false;
        }
    }

    disconnect() {
        this.isDisconnect = true;
        if (this.socket) {
            this.socket.onclose = null;
            this.socket.close();
        }
    }
}
