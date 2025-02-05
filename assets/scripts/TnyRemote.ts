class DisconnectedError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'DisconnectedError';
    }
}

class TnyRemote extends EventTarget {
    public static readonly STATUS_CONNECTED = 'connected';
    public static readonly STATUS_DISCONNECTED = 'disconnected';
    public static readonly STATUS_CONNECTING = 'connecting';
    public static readonly STATUS_DISCONNECTING = 'disconnecting';
    public static readonly STATUS_ERROR = 'error';

    private static instance: TnyRemote
    public static getInstance() {
        if (!TnyRemote.instance) {
            TnyRemote.instance = new TnyRemote();
            (window as any).TnyRemote = TnyRemote.instance;
        }
        return TnyRemote.instance;
    }

    private websocket?: WebSocket;
    private websocketStatus: string = TnyRemote.STATUS_DISCONNECTED;

    private constructor() {
        super();
    }

    private checkConnection(reject: (reason?: any) => void) {
        if (!this.websocket) {
            reject(new DisconnectedError('You are not connected to any robot'));
            return false;
        }
        return true;
    }

    get status() {
        return this.websocketStatus;
    }

    public async connect(ip: string) {
        return new Promise((resolve, reject) => {
            console.log(`Connecting to ${ip} ...`);
            this.websocket = new WebSocket(`ws://${ip}:5621`);
            this.websocketStatus = TnyRemote.STATUS_CONNECTING;

            this.websocket.addEventListener('open', () => {
                console.log(`Connected to ${ip}`);
                this.websocketStatus = TnyRemote.STATUS_CONNECTED;
                resolve(true);
            });
            this.websocket.addEventListener('message', (event) => {
                console.log(`Received message: ${event.data}`);
            });
            this.websocket.addEventListener('close', () => {
                console.log(`Disconnected from ${ip}`);
                this.websocket = undefined;
                this.websocketStatus = TnyRemote.STATUS_DISCONNECTED;
            });
            this.websocket.addEventListener('error', (event) => {
                console.error(`Error:`, event);
                resolve(false);
            });
        });
    }

    public async disconnect() {
        return new Promise((resolve, reject) => {
            console.log(`Disconnecting ...`);
            this.websocket?.close();
            this.websocket = undefined;
            console.log(`Disconnected`);
        });
    }

    public async setMotorRotation(motor: number, rotation: number, lerpTime: number = 0) {
        return new Promise((resolve, reject) => {
            if (!this.checkConnection(reject)) return;
            console.log(`Setting motor ${motor} rotation to ${rotation} ...`);
            this.websocket?.send(`setMotorRotation ${motor} ${rotation}`);
            console.log(`Motor ${motor} rotation set to ${rotation}`);
            resolve(true);
        });
    }

    public async rotateMotorBy(motor: number, rotation: number, lerpTime: number = 0) {
        return new Promise((resolve, reject) => {
            if (!this.checkConnection(reject)) return;
            console.log(`Rotating motor ${motor} by ${rotation} ...`);
            this.websocket?.send(`rotateMotorBy ${motor} ${rotation}`);
            console.log(`Motor ${motor} rotated by ${rotation}`);
            resolve(true);
        });
    }

    public async getMotorRotation(motor: number) {
        return new Promise((resolve, reject) => {
            if (!this.checkConnection(reject)) return;
            console.log(`Getting motor ${motor} rotation ...`);
            this.websocket?.send(`getMotorRotation ${motor}`);
            resolve(0);
        });
    }
}

export { TnyRemote, DisconnectedError };