import { prisma } from "./db";
import { getUsersByUuids } from "./user";
import { Feedback as PrismaFeedback } from "@prisma/client";

// 转换函数：将应用层数据转换为Prisma格式
function toPrismaFeedback(feedback: any): any {
  return {
    status: feedback.status || null,
    userUuid: feedback.user_uuid || null,
    content: feedback.content || null,
    rating: feedback.rating || null,
  };
}

// 转换函数：将Prisma数据转换为应用层格式
function fromPrismaFeedback(feedback: PrismaFeedback | null): any | undefined {
  if (!feedback) return undefined;
  
  return {
    id: feedback.id,
    created_at: feedback.createdAt.toISOString(),
    status: feedback.status,
    user_uuid: feedback.userUuid,
    content: feedback.content,
    rating: feedback.rating,
  };
}

export async function insertFeedback(feedback: any) {
  try {
    const data = await prisma.feedback.create({
      data: toPrismaFeedback(feedback),
    });
    return fromPrismaFeedback(data);
  } catch (error) {
    throw error;
  }
}

export async function findFeedbackByUuid(
  uuid: string
): Promise<any | undefined> {
  // Note: feedbacks table doesn't have uuid field, this might be looking for user_uuid
  try {
    const feedback = await prisma.feedback.findFirst({
      where: {
        userUuid: uuid,
      },
    });
    return fromPrismaFeedback(feedback);
  } catch (error) {
    return undefined;
  }
}

export async function getFeedbacks(
  page: number = 1,
  limit: number = 50
): Promise<any[] | undefined> {
  if (page < 1) page = 1;
  if (limit <= 0) limit = 50;

  const offset = (page - 1) * limit;

  try {
    const feedbacks = await prisma.feedback.findMany({
      skip: offset,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!feedbacks || feedbacks.length === 0) {
      return [];
    }

    const user_uuids = Array.from(new Set(
      feedbacks
        .filter(item => item.userUuid)
        .map((item) => item.userUuid as string)
    ));
    
    const users = await getUsersByUuids(user_uuids);

    const feedbacksWithUsers = feedbacks.map((item) => {
      const feedback = fromPrismaFeedback(item);
      const user = users.find((user) => user.uuid === item.userUuid);
      return { ...feedback, user };
    });

    return feedbacksWithUsers;
  } catch (error) {
    return [];
  }
}

export async function getFeedbacksTotal(): Promise<number | undefined> {
  try {
    const count = await prisma.feedback.count();
    return count;
  } catch (error) {
    return undefined;
  }
}