import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { MemberRole } from "@prisma/client";
import { NextResponse } from "next/server";

export async function POST(
    req: Request
) {
    try {
        const profile = await currentProfile();
        const { name, type } = await req.json();
        const { searchParams } = new URL(req.url);

        const serverId = searchParams.get("serverId");
        if(!profile){
            return new NextResponse("Unauthorized", { status: 401 });
        }
        if(!serverId){
            return new NextResponse("Bad request: No server id present", { status: 400 });
        }
        if(name === 'general'){
            return new NextResponse("Name can't be general", { status: 400 }); // daca da bypass cineva la frontend
        }
        const server = await db.server.update({
            where: {
                id: serverId,
                members: {
                    some: {
                        profileId: profile.id,
                        role: {
                            in: [MemberRole.ADMIN, MemberRole.MODERATOR]
                        }
                    }
                }
            },
            data: {
                channels: {
                    create: {
                        profileId: profile.id,
                        name, 
                        type
                    }
                }
            }
        });
        return NextResponse.json(server);
    } catch (e) {
        console.log("Channls_post", e);
        return new NextResponse("Internal Error", {status: 500});
    }
}