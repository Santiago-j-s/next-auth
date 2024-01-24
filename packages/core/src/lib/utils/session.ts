import { AdapterUser } from "../../adapters";
import { JWTSessionError, SessionTokenError } from "../../errors";
import { InternalOptions } from "../../types";
import { SessionStore } from "./cookie";

// /**
//  * Returns the currently logged in user, if any.
//  */
export async function getLoggedInUser(
  options: InternalOptions,
  sessionStore: SessionStore
): Promise<Pick<AdapterUser, "name" | "id" | "email"> | null> {
  const {
    adapter,
    jwt,
    logger,
    session: { strategy: sessionStrategy },
  } = options

  const sessionToken = sessionStore.value
  if (!sessionToken) return null

  // Try to decode JWT
  if (sessionStrategy === "jwt") {
    try {
      const salt = options.cookies.sessionToken.name
      const payload = await jwt.decode({ ...jwt, token: sessionToken, salt })

      if (!payload) throw new Error("Invalid JWT")

      return { name: payload.name, email: payload.email ?? "", id: payload.sub ?? "" }
    } catch (e) {
      logger.error(new JWTSessionError(e as Error))
    }

    return null
  }

  // Retrieve session from database
  try {
    let userAndSession = await adapter?.getSessionAndUser(sessionToken)
    if (!userAndSession) return null

    return userAndSession.user
  } catch (e) {
    logger.error(new SessionTokenError(e as Error))
  }

  return null
}
