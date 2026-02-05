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
export interface ResumeWallPost {
    command: "resume.wall.post";
    operation_id: string;
}
export interface StatusEvent {
    command: "status";
    operation_id: string;
    group_id: string;
    link: string;
    progress: { total: number; current: number };
}
export interface ErrorEvent {
    command: "error";
    operation_id: string;
    group_id: string;
    error: string;
    progress: { total: number; current: number };
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
            this.tryResumeIfNeeded();
        };

        this.socket.onmessage = (event) => {
            try {
                const data: ServerEvent = JSON.parse(event.data);
                this.updateProgressInStorage(data);
                if (this.messageHandler) {
                    this.messageHandler(data);
                }
            } catch (err) {
                console.error("Failed to parse WS message", err, event.data);
            }
        };

        this.socket.onerror = (e) => console.error("WS error", e);

        this.socket.onclose = (event) => {
            console.log("WS closed", event.code, event.reason);
            if (this.isDisconnect) return;
            this.reconnect();
        };
    }

    private updateProgressInStorage(event: ServerEvent) {
        // Обновляем только если есть progress и operation_id
        if (!("progress" in event) || !event.operation_id) return;

        const dataToSave = {
            operation_id: event.operation_id,
            total: event.progress.total,
            current: event.progress.current,
            // можно добавить timestamp, если захочешь чистить старые "зависшие" операции
            last_update: Date.now(),
        };

        localStorage.setItem(
            "vk_wall_post_progress",
            JSON.stringify(dataToSave),
        );
    }

    private tryResumeIfNeeded() {
        const raw = localStorage.getItem("vk_wall_post_progress");
        if (!raw) return;

        try {
            const saved = JSON.parse(raw) as {
                operation_id: string;
                total: number;
                current: number;
                last_update?: number;
            };

            if (saved.current >= saved.total) {
                console.log(
                    `Operation ${saved.operation_id} already finished (according to last known progress)`,
                );
                localStorage.removeItem("vk_wall_post_progress");
                return;
            }

            if (!saved.operation_id) return;

            console.log(
                `Resuming operation ${saved.operation_id} (progress ${saved.current}/${saved.total})`,
            );

            const resumeCmd: ResumeWallPost = {
                command: "resume.wall.post",
                operation_id: saved.operation_id,
            };

            if (this.isConnected()) {
                this.socket!.send(JSON.stringify(resumeCmd));
            }
        } catch (err) {
            console.error("Invalid progress data in localStorage", err);
            localStorage.removeItem("vk_wall_post_progress");
        }
    }

    isConnected(): boolean {
        return this.socket?.readyState === WebSocket.OPEN;
    }

    private reconnect() {
        if (this.reconnectAttems >= this.maxReconnectionAttems) {
            console.log("Max reconnection attempts reached");
            return;
        }
        this.reconnectAttems += 1;
        console.log(
            `Reconnecting in ${this.reconnectInterval / 1000}s (attempt ${this.reconnectAttems})`,
        );

        setTimeout(() => {
            if (!this.isDisconnect) {
                this.createSocket();
            }
        }, this.reconnectInterval);
    }

    send(data: WallPostCommand) {
        if (this.isConnected()) {
            this.socket!.send(JSON.stringify(data));
            return true;
        }

        if (!this.isDisconnect) {
            console.log("WS not connected → triggering reconnect");
            this.createSocket();
        }
        return false;
    }

    /**
     * Вызывать когда постинг завершён на 100% или пользователь явно отменил
     */
    public clearPendingOperation() {
        localStorage.removeItem("vk_wall_post_progress");
    }

    disconnect() {
        this.isDisconnect = true;
        if (this.socket) {
            this.socket.onclose = null;
            this.socket.close();
        }
    }
}
