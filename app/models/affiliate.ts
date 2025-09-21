// Affiliate 功能在新数据库架构中已被移除
// 此文件保留为存根以避免破坏依赖

export async function insertAffiliate(affiliate: any) {
  console.warn('Affiliate feature is disabled in the new database architecture');
  return undefined;
}

export async function getUserAffiliates(
  user_uuid: string,
  page: number = 1,
  limit: number = 50
): Promise<any[] | undefined> {
  console.warn('Affiliate feature is disabled in the new database architecture');
  return [];
}

export async function getAffiliateSummary(user_uuid: string) {
  const summary = {
    total_invited: 0,
    total_paid: 0,
    total_reward: 0,
  };
  console.warn('Affiliate feature is disabled in the new database architecture');
  return summary;
}

export async function findAffiliateByOrderNo(order_no: string) {
  console.warn('Affiliate feature is disabled in the new database architecture');
  return undefined;
}

export async function getAllAffiliates(
  page: number = 1,
  limit: number = 50
): Promise<any[]> {
  console.warn('Affiliate feature is disabled in the new database architecture');
  return [];
}