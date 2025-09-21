// Feedback 功能在新数据库架构中已被移除
// 此文件保留为存根以避免破坏可能的依赖

export async function insertFeedback(feedback: any) {
  console.warn('Feedback feature is disabled in the new database architecture');
  return undefined;
}

export async function findFeedbackByUuid(
  uuid: string
): Promise<any | undefined> {
  console.warn('Feedback feature is disabled in the new database architecture');
  return undefined;
}

export async function getAllFeedback(
  page: number = 1,
  pageSize: number = 50
) {
  console.warn('Feedback feature is disabled in the new database architecture');
  return {
    data: [],
    total: 0,
    page,
    pageSize,
    totalPages: 0,
  };
}