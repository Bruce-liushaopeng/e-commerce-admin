"use client";
import { useEffect, useState } from "react";

import { StoreModal } from "@/components/modals/store-modal";

// to be used inside layout.tsx, but because layout.tsx is a SSC, we cannot directly add CSC to it
// we have to ensure there not be hydration errors 
// there're many ways we can cause to trigger a modal, which would cause
// inconsistency between client side and server side 
export const ModalProvider = () => {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        // this would only be true on the client side
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        // server side is not mounted, so we just return null
        return null;
    }

    return (
        <>
            <StoreModal />
        </>
    )
}