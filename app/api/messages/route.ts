import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { Message } from "@prisma/client";
import { NextResponse } from "next/server";

const MESSAGES_MAX = 10;

export async function GET(request: Request) {
  try {
    const profile = await currentProfile();
    const { searchParams } = new URL(request.url);

    const cursor = searchParams.get("cursor");
    const channelId = searchParams.get("channelId");

    if (!profile) {
      return new NextResponse("Unauthorized!", { status: 401 });
    }
    if (!channelId) {
      return new NextResponse("Channel Id missing!", { status: 400 });
    }

    let messages: Message[] = [];
    if (cursor) {
      messages = await db.message.findMany({
        take: MESSAGES_MAX,
        skip: 1,
        cursor: {
          id: cursor,
        },
        where: {
          channelId,
        },
        include: {
          member: {
            include: {
              profile: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } else {
      messages = await db.message.findMany({
        take: MESSAGES_MAX,
        where: {
          channelId,
        },
        include: {
          member: {
            include: {
              profile: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }

    let nextCursor = null;

    if (messages.length === MESSAGES_MAX) {
      nextCursor = messages[MESSAGES_MAX - 1].id;
    }
    return NextResponse.json({
      items: messages,
      nextCursor,
    });
  } catch (e) {
    console.log("[MESSAGES_GET", e);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
