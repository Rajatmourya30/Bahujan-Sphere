
import { getAuth } from "firebase-admin/auth";
import { https } from "firebase-functions";
import { HttpsError } from "firebase-functions/v1/https";
import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

admin.initializeApp();
const db = getFirestore();

export const setAdminClaim = https.onCall(async (data, context) => {
    // Ensure the caller is an admin before making changes.
    // This checks for the custom claim on the existing admin making the request.
    if (context.auth?.token.admin !== true) {
        throw new HttpsError(
            "permission-denied",
            "Must be an administrative user to fulfill this request.",
        );
    }

    const { email, admin: isAdmin } = data;
    if (typeof email !== "string" || typeof isAdmin !== "boolean") {
        throw new HttpsError(
            "invalid-argument",
            "The function must be called with an email and admin status.",
        );
    }

    try {
        const user = await getAuth().getUserByEmail(email);
        await getAuth().setCustomUserClaims(user.uid, { admin: isAdmin });
        return {
            message: `Success! ${email} has been ${
                isAdmin ? "made" : "removed as"
            } an admin.`,
        };
    } catch (error) {
        console.error("Error setting custom claim:", error);
        if (error instanceof Error) {
            throw new HttpsError("internal", error.message);
        }
        throw new HttpsError("internal", "An unknown error occurred.");
    }
});

// New function to create a user and return their UID
export const createTeamUser = https.onCall(async (data, context) => {
    if (!context.auth || !context.auth.token.email) {
        throw new HttpsError("unauthenticated", "The function must be called while authenticated.");
    }

    // Check if the caller is an admin via custom claim OR by checking the database.
    // This provides a fallback if the custom claim hasn't propagated yet.
    const isCustomClaimAdmin = context.auth.token.admin === true;
    
    const teamQuery = await db.collection("teamMembers").where("email", "==", context.auth.token.email).limit(1).get();
    const isDbAdmin = !teamQuery.empty && teamQuery.docs[0].data().role === 'Admin';
    
    if (!isCustomClaimAdmin && !isDbAdmin) {
        throw new HttpsError("permission-denied", "Only admins can create new team users.");
    }


    const { email, password } = data;
    if (typeof email !== "string" || typeof password !== "string") {
        throw new HttpsError(
            "invalid-argument",
            "Email and password must be provided."
        );
    }

    try {
        const userRecord = await admin.auth().createUser({
            email: email,
            password: password,
        });
        return { uid: userRecord.uid };
    } catch (error) {
        console.error("Error creating new user:", error);
        if (error instanceof Error) {
            throw new HttpsError("internal", error.message);
        }
        throw new HttpsError("internal", "An unknown error occurred.");
    }
});
