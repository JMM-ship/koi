// Credit 功能已被 CreditTransaction 替代
// 此文件保留为存根以避免破坏可能的依赖

export async function insertCredit(credit: any) {
  console.warn('Credit model is replaced by CreditTransaction in the new database architecture');
  return undefined;
}

export async function findCreditByTransNo(
  trans_no: string
): Promise<any | undefined> {
  console.warn('Credit model is replaced by CreditTransaction in the new database architecture');
  return undefined;
}

export async function findCreditByOrderNo(
  order_no: string
): Promise<any | undefined> {
  console.warn('Credit model is replaced by CreditTransaction in the new database architecture');
  return undefined;
}

export async function getUserValidCredits(
  user_uuid: string
): Promise<any[] | undefined> {
  console.warn('Credit model is replaced by CreditTransaction in the new database architecture');
  return [];
}

export async function getCreditsByUserUuid(
  user_uuid: string,
  page: number = 1,
  limit: number = 50
): Promise<any[] | undefined> {
  console.warn('Credit model is replaced by CreditTransaction in the new database architecture');
  return [];
}