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

        const { name, value } = body;

        if (!userId) {
            return new NextResponse("Unauthenticated", { status: 401 });
        }

        if (!name) {
            return new NextResponse("Name is required", { status: 400 });
        }

        if (!value) {
            return new NextResponse("Value is required", { status: 400 });
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

        const size = await prismadb.size.create({
            data: {
                // all the other fields id, createdAt, updateUp, will be auto generated
                name,
                value,
                storeId: params.storeId
            }
        })

        return NextResponse.json(size);
    } catch (error) {
        console.log('[SIZE_POST]', error);
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
        const sizes = await prismadb.size.findMany({
            // getting all the billboard in that store
            where: {
                storeId: params.storeId,
            }
        })

        return NextResponse.json(sizes);
    } catch (error) {
        console.log('[SIZES_GET]', error);
        return new NextResponse("Internal error", { status: 500 })
    }
}