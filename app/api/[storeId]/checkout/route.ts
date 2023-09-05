import Stripe from "stripe";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import prismadb from "@/lib/prismadb";

// for development, prevent CORS error happen
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// before we do post request, we need to do Options request, otherwise CORS still won't work
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: corsHeaders,
    }
  );
}

export async function POST(
  req: Request,
  {
    params,
  }: {
    params: {
      storeId: string;
    };
  }
) {
  const { productIds } = await req.json();
    console.log("Products Id received: " ,productIds)
  if (!productIds || productIds.length === 0) {
    return new NextResponse("Product Ids are required", {
      status: 400,
    });
  }

  const products = await prismadb.product.findMany({
    where: {
      id: {
        in: productIds,
      },
    },
  });

  const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

  products.forEach((product) => {
    line_items.push({
      quantity: 1,
      price_data: {
        currency: "CAD",
        product_data: {
          name: product.name,
        },
        unit_amount: product.price.toNumber() * 100,
      },
    });
  });

  // create order using product Ids
  console.log('going to create order in prisma')
  const order = await prismadb.order.create({
    data: {
      storeId: params.storeId,
      isPaid: false, // false because this is just a checkout session
      orderItems: {
        create: productIds.map((productId: string) => ({
          product: {
            connect: {
              id: productId,
            },
          },
        })),
      },
    },
  });

  // create session
  console.log('going to create session')
  const session = await stripe.checkout.sessions.create({
    line_items,
    mode: "payment",
    billing_address_collection: "required",
    phone_number_collection: {
      enabled: true,
    },
    success_url: `${process.env.FRONTEND_STORE_URL}/cart?success=1`,
    cancel_url: `${process.env.FRONTEND_STORE_URL}/cart?canceled=1`,
    metadata: {
      // when the order is paid, we need to use this metadata to find the order that is created
      // and change the status to paid
      orderId: order.id,
    },
  });
  console.log('session', session)
  return NextResponse.json({ url: session.url }, { headers: corsHeaders });
}
