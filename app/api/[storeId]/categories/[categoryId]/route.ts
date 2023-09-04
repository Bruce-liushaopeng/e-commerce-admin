import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

export async function GET (
    req: Request,
    { params }: { params: { categoryId: string} } // because we are in the [storeId] dynamic route so we have access for storeId
) {
    try{
        if (!params.categoryId) {
            return new NextResponse("categoryId is required", { status: 400});
        }

        const category = await prismadb.category.findUnique({
            where: {
                id: params.categoryId
            },
            include: {
                billboard: true
            }
        });

        return NextResponse.json(category);
    } catch (error) {
        console.log('[CATEGORY_GET]', error);
        return new NextResponse("Int    ernal error", { status: 500});
    }
}

// Patch method for change category label or category imageUrl
export async function PATCH (
    req: Request,
    { params }: { params: { storeId: string, categoryId: string} } // because we are in the [storeId] dynamic route so we have access for storeId
) {
    try{
        const { userId } = auth();
        const body = await req.json();

        const { name, billboardId } = body;
        if (!userId) {
            return new NextResponse("Unauthenticated", { status: 401})
        }

        if (!name) {
            return new NextResponse("Name is required", { status: 400});
        }

        if (!billboardId) {
            return new NextResponse("billboardId is required", { status: 400});
        }

        if (!params.categoryId) {
            return new NextResponse("categoryId Id is required", { status: 400});
        }

        if (!params.storeId) {
            return new NextResponse("Store id is required", { status: 400});
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


        const category = await prismadb.category.updateMany({
            where: {
                id: params.categoryId,
            },
            data: {
                name,
                billboardId
            }
        });

        return NextResponse.json(category);
    } catch (error) {
        console.log('[CATEGORY_PATCH]', error);
        return new NextResponse("Internal error", { status: 500});
    }
}

// Delete method for deleting a store
export async function DELETE (
    req: Request,
    { params }: { params: { storeId: string, categoryId: string} } // because we are in the [storeId] dynamic route so we have access for storeId
) {
    try{
        const { userId } = auth();
       
        if (!userId) {
            return new NextResponse("Unauthenticated", { status: 401})
        }

        if (!params.categoryId) {
            return new NextResponse("CategoryId is required", { status: 400});
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


        const category = await prismadb.category.deleteMany({
            where: {
                id: params.categoryId
            },
        });

        return NextResponse.json(category);
    } catch (error) {
        console.log('[CATEGORY_DELETE]', error);
        return new NextResponse("Internal error", { status: 500});
    }
}