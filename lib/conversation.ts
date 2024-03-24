import { db } from "./db";

export const getOrCreateConv = async (memberAid: string, memberBid: string) => {
  let conv =
    (await findConversation(memberAid, memberBid)) ||
    (await findConversation(memberBid, memberAid));

  if (!conv) {
    conv = await createNewConv(memberAid, memberBid);
  }
  return conv;
};

const findConversation = async (memberAid: string, memberBid: string) => {
  try {
    return await db.conversation.findFirst({
      where: {
        AND: [{ memberAid: memberAid }, { memberBid: memberBid }],
      },
      include: {
        memberA: {
          include: {
            profile: true,
          },
        },
        memberB: {
          include: {
            profile: true,
          },
        },
      },
    });
  } catch (e) {
    return null;
  }
};

const createNewConv = async (memberAid: string, memberBid: string) => {
  try {
    return await db.conversation.create({
      data: {
        memberAid,
        memberBid,
      },
      include: {
        memberA: {
          include: {
            profile: true,
          },
        },
        memberB: {
          include: {
            profile: true,
          },
        },
      },
    });
  } catch (e) {
    return null;
  }
};
