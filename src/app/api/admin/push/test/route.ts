import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { pushToOwner } from "@/lib/notify";

export async function POST() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const result = await pushToOwner({
    title: "Order alerts are working",
    body: "This is how a new order will appear on this device.",
    url: "/admin/orders",
    tag: "test",
  });
  return NextResponse.json(result);
}
