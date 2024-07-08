export declare const protobufPackage = "protocol";
export interface Endpoint {
    address: string;
    port: number;
    nodeId: string;
}
export interface PingMessage {
    from: Endpoint | undefined;
    to: Endpoint | undefined;
    version: number;
    timestamp: number;
}
export interface PongMessage {
    from: Endpoint | undefined;
    echo: number;
    timestamp: number;
}
export interface FindNeighbours {
    from: Endpoint | undefined;
    targetId: string;
    timestamp: number;
}
export interface Neighbours {
    from: Endpoint | undefined;
    neighbours: Endpoint[];
    timestamp: number;
}
export interface BackupMessage {
    flag: boolean;
    priority: number;
}
//# sourceMappingURL=Discover.d.ts.map