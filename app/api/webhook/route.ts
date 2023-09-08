import Stripe from "stripe";
import { headers } from 'next/headers'
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import prismadb from "@/lib/prismadb";

export async function POST(req: Request) {
    console.log("post request start")
    const body = await req.text(); // we can't use req.body because this is web hook, we need to use text()
    headers().forEach(h => {
        console.log("header, ")
    })
    const signature = headers().get("Stripe-Signature") as string
    console.log("header entryies ", headers().entries())
    let event: Stripe.Event;

    console.log('WEB hook secrect, ' + process.env.STRIPE_WEBHOOK_SECRECT)

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRECT!
        )
    } catch (error: any) {
        console.log(" error fount, in the catch block")
        console.log("actual error " + error.message)
        return new NextResponse(`Webhook Error: ${error.message}`, {status: 400}  )
    }

    const session = event.data.object as Stripe.Checkout.Session;
    const address = session?.customer_details?.address;

    const addressComponents = [
        address?.line1,        
        address?.line2,
        address?.city,
        address?.state,
        address?.postal_code,
        address?.country,
    ];

    const addressString = addressComponents.filter((c) => c!== null).join(', ');

    if (event.type === 'checkout.session.completed') {
        const order = await prismadb.order.update({
            where: {
                id: session?.metadata?.orderId,
            },
            data: {
                isPaid: true,
                address: addressString,
                phone: session?.customer_details?.phone || "",
            },
            include: {
                orderItems: true,
            }
        });

        const productIds = order.orderItems.map((orderItem) => orderItem.productId);
        
        console.log("before product being updated")
        await prismadb.product.updateMany({
            where: {
                id: {
                    in: [...productIds]
                }
            },
            data: {
                // archived since it is already sold
                isArchived: true
            }
        })
    }
    console.log('before return 200 response')
    return new NextResponse(null, { status: 200});
}

