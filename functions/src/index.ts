
import {initializeApp} from "firebase-admin/app";
import {getAuth} from "firebase-admin/auth";
import {https} from "firebase-functions";

initializeApp();

export const setAdminClaim = https.onCall(async (data, context) => {
  // Ensure the caller is an admin before making changes.
  if (context.auth?.token.admin !== true) {
    throw new https.HttpsError(
      "permission-denied",
      "Must be an administrative user to fulfill this request.",
    );
  }

  const {email, admin} = data;
  if (typeof email !== "string" || typeof admin !== "boolean") {
    throw new https.HttpsError(
      "invalid-argument",
      "The function must be called with an email and admin status.",
    );
  }

  try {
    const user = await getAuth().getUserByEmail(email);
    await getAuth().setCustomUserClaims(user.uid, {admin});
    return {
      message: `Success! ${email} has been ${
        admin ? "made" : "removed as"
      } an admin.`,
    };
  } catch (error) {
    console.error("Error setting custom claim:", error);
    if (error instanceof Error) {
      throw new https.HttpsError("internal", error.message);
    }
    throw new https.HttpsError("internal", "An unknown error occurred.");
  }
});
