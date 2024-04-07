import { NextApiRequest } from "next";
import { NextApiResponseServerIo } from "@/types";
import { db } from "@/lib/db";
import { currentProfile } from "@/lib/current-profil-pages";

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponseServerIo
) {
  if (request.method !== "POST") {
    return response.status(405).json({ error: "Method not allowed" });
  }

  try {
    const profile = await currentProfile(request);
    const { content, fileUrl } = request.body;
    const { serverId, channelId } = request.query;

    if (!profile) {
      return response.status(401).json({ error: "Unauthorized" });
    }

    if (!serverId) {
      return response.status(400).json({ error: "Server ID missing" });
    }

    if (!channelId) {
      return response.status(400).json({ error: "Channel ID missing" });
    }

    if (!content) {
      return response.status(400).json({ error: "Content missing" });
    }

    const server = await db.server.findFirst({
      where: {
        id: serverId as string,
        members: {
          some: {
            profileId: profile.id,
          },
        },
      },
      include: {
        members: true,
      },
    });

    if (!server) {
      return response.status(404).json({ message: "Server not found" });
    }

    const channel = await db.channel.findFirst({
      where: {
        id: channelId as string,
        serverId: serverId as string,
      },
    });

    if (!channel) {
      return response.status(404).json({ message: "Channel not found" });
    }

    const member = server.members.find(
      (member) => member.profileId === profile.id
    );

    if (!member) {
      return response.status(404).json({ message: "Member not found" });
    }

    const message = await db.message.create({
      data: {
        content,
        fileUrl,
        channelId: channelId as string,
        memberId: member.id,
      },
      include: {
        member: {
          include: {
            profile: true,
          },
        },
      },
    });

    const channelKey = `chat:${channelId}:messages`;

    response?.socket?.server?.io?.emit(channelKey, message);

    return response.status(200).json(message);
  } catch (e) {
    console.log("[MESSAGES_POST]", e);
    return response.status(500).json({ message: "Internal Error" });
  }
}
