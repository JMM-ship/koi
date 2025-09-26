import { CreditsAmount, CreditsTransType } from "./credit";
import { findUserByEmail, findUserById, insertUser } from "@/app/models/user";


import { auth } from "@/app/auth/helpers";
import { getOneYearLaterTimestr } from "@/app/lib/time";
import { getUserUuidByApiKey } from "@/app/models/apikey";
import { headers } from "next/headers";
import { increaseCredits } from "./credit";

export async function saveUser(user:any) {
  try {
    const existUser = await findUserByEmail(user.email);
    if (!existUser) {
      const newUser = await insertUser(user);

      // 为新用户创建钱包并赠送初始积分
      if (newUser?.id) {
        try {
          // 使用新的钱包系统赠送初始积分
          const { addIndependentCredits } = await import("@/app/models/creditBalance");
          await addIndependentCredits(newUser.id, CreditsAmount.NewUserGet);

          // 创建积分交易记录
          const { createCreditTransaction, TransactionType, CreditType } = await import("@/app/models/creditTransaction");
          await createCreditTransaction({
            user_id: newUser.id,
            type: TransactionType.Income,
            credit_type: CreditType.Independent,
            amount: CreditsAmount.NewUserGet,
            before_balance: 0,
            after_balance: CreditsAmount.NewUserGet,
            description: '新用户注册奖励',
            metadata: {
              source: 'oauth_registration',
              provider: user.signin_provider || 'unknown',
            },
          });
        } catch (creditError) {
          console.error("Failed to grant initial credits to OAuth user:", creditError);
          // 不阻止用户创建，只记录错误
        }
      }

      // 设置返回的用户信息
      user.id = newUser?.id;
      user.created_at = newUser?.created_at;
    } else {
      user.id = existUser.id;
      user.created_at = existUser.created_at;
    }

    return user;
  } catch (e) {
    console.log("save user failed: ", e);
    throw e;
  }
}

export async function getUserUuid() {
  let user_id = "";

  const token = await getBearerToken();

  if (token) {
    // api key
    if (token.startsWith("sk-")) {
      const user_id = await getUserUuidByApiKey(token);

      return user_id || "";
    }
  }

  const session = await auth();
  if (session && session.user && session.user.id) {
    user_id = session.user.id;
  }

  return user_id;
}

export async function getBearerToken() {
  const h = await headers();
  const auth = h.get("Authorization");
  if (!auth) {
    return "";
  }

  return auth.replace("Bearer ", "");
}

export async function getUserEmail() {
  let user_email = "";

  const session = await auth();
  if (session && session.user && session.user.email) {
    user_email = session.user.email;
  }

  return user_email;
}

export async function getUserInfo() {
  let user_id = await getUserUuid();

  if (!user_id) {
    return;
  }

  const user = await findUserById(user_id);

  return user;
}
