import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

import prismadb from "@/lib/prismadb";

export async function POST(
    req: Request,
    { params }: { params: { storeId: string}} // this is gotten from the Url parameter
) {
    try {
        // authticate the user
        const { userId } = auth();
        const body = await req.json();

        const { label, imageUrl } = body;

        if (!userId) {
            return new NextResponse("Unauthenticated", { status: 401 });
        }

        if (!label) {
            return new NextResponse("Label is required", { status: 400 });
        }

        if (!imageUrl) {
            return new NextResponse("imageUrl is required", { status: 400 });
        }

        if (!params.storeId) {
            return new NextResponse("storeId is required", { status: 400 });
        }

        const storeByUserId = await prismadb.store.findFirst({
            // try to find if this storeId belong to this particular user.
            where: {
                id: params.storeId,
                userId,
            }
        });

        if (!storeByUserId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const billboard = await prismadb.billboard.create({
            data: {
                // all the other fields id, createdAt, updateUp, will be auto generated
                label,
                imageUrl,
                storeId: params.storeId
            }
        })

        return NextResponse.json(billboard);
    } catch (error) {
        console.log('[BILLBOARDS_POST]', error);
        return new NextResponse("Internal error", { status: 500 })
    }
}


export async function GET(
    req: Request,
    { params }: { params: { storeId: string}} // this is gotten from the Url parameter
) {
    try {
        if (!params.storeId) {
            return new NextResponse("storeId is required", { status: 400 });
        }
        const billboard = await prismadb.billboard.findMany({
            // getting all the billboard in that store
            where: {
                storeId: params.storeId,
            }
        })

        return NextResponse.json(billboard);
    } catch (error) {
        console.log('[BILLBOARDS_GET]', error);
        return new NextResponse("Internal error", { status: 500 })
    }
}