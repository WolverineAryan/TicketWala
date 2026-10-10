import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      code: "CONTACT_DELIVERY_NOT_CONFIGURED",
      message: "Contact delivery is not configured in this environment.",
    },
    { status: 503 },
  );
}
