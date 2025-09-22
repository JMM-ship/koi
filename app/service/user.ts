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
      await insertUser(user);

      // increase credits for new user, expire in one year
      await increaseCredits({
        user_uuid: user.id || "",
        trans_type: CreditsTransType.NewUser,
        credits: CreditsAmount.NewUserGet,
        expired_at: getOneYearLaterTimestr(),
      });
    } else {
      user.id = existUser.id;
      user.id = existUser.uuid;
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
