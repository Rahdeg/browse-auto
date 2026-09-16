"use client";

import { ReactNode } from "react";
import {
    LiveblocksProvider,
    RoomProvider,
    ClientSideSuspense,
} from "@liveblocks/react/suspense";

export function Room({ roomId, children }: { roomId: string; children: ReactNode }) {
    return (
        <LiveblocksProvider throttle={16} publicApiKey={"pk_dev_vJxkT6inetyofWp8SyDtX3px-_qv6ZSfvsfcWu62BPKBfmN7ZgHUiVjBNpkapV7f"}>
            <RoomProvider id={roomId}>
                <ClientSideSuspense fallback={<div>Loading…</div>}>
                    {children}
                </ClientSideSuspense>
            </RoomProvider>
        </LiveblocksProvider>
    );
}