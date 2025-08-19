
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { https, HttpsError } from "firebase-functions";
import * as admin from "firebase-admin";

initializeApp();

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
    if (context.auth?.token.admin !== true) {
        throw new HttpsError(
            "permission-denied",
            "Only admins can create new team users."
        );
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
