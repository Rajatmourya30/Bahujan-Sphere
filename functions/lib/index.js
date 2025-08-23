"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTeamUser = exports.setAdminClaim = void 0;
const auth_1 = require("firebase-admin/auth");
const firebase_functions_1 = require("firebase-functions");
const admin = require("firebase-admin");
const firestore_1 = require("firebase-admin/firestore");
admin.initializeApp();
const db = (0, firestore_1.getFirestore)();
exports.setAdminClaim = firebase_functions_1.https.onCall(async (data, context) => {
    var _a;
    // Ensure the caller is an admin before making changes.
    // This checks for the custom claim on the existing admin making the request.
    if (((_a = context.auth) === null || _a === void 0 ? void 0 : _a.token.admin) !== true) {
        throw new firebase_functions_1.HttpsError("permission-denied", "Must be an administrative user to fulfill this request.");
    }
    const { email, admin: isAdmin } = data;
    if (typeof email !== "string" || typeof isAdmin !== "boolean") {
        throw new firebase_functions_1.HttpsError("invalid-argument", "The function must be called with an email and admin status.");
    }
    try {
        const user = await (0, auth_1.getAuth)().getUserByEmail(email);
        await (0, auth_1.getAuth)().setCustomUserClaims(user.uid, { admin: isAdmin });
        return {
            message: `Success! ${email} has been ${isAdmin ? "made" : "removed as"} an admin.`,
        };
    }
    catch (error) {
        console.error("Error setting custom claim:", error);
        if (error instanceof Error) {
            throw new firebase_functions_1.HttpsError("internal", error.message);
        }
        throw new firebase_functions_1.HttpsError("internal", "An unknown error occurred.");
    }
});
// New function to create a user and return their UID
exports.createTeamUser = firebase_functions_1.https.onCall(async (data, context) => {
    if (!context.auth || !context.auth.token.email) {
        throw new firebase_functions_1.HttpsError("unauthenticated", "The function must be called while authenticated.");
    }
    // Check if the caller is an admin via custom claim OR by checking the database.
    // This provides a fallback if the custom claim hasn't propagated yet.
    const isCustomClaimAdmin = context.auth.token.admin === true;
    const teamQuery = await db.collection("teamMembers").where("email", "==", context.auth.token.email).limit(1).get();
    const isDbAdmin = !teamQuery.empty && teamQuery.docs[0].data().role === 'Admin';
    if (!isCustomClaimAdmin && !isDbAdmin) {
        throw new firebase_functions_1.HttpsError("permission-denied", "Only admins can create new team users.");
    }
    const { email, password } = data;
    if (typeof email !== "string" || typeof password !== "string") {
        throw new firebase_functions_1.HttpsError("invalid-argument", "Email and password must be provided.");
    }
    try {
        const userRecord = await admin.auth().createUser({
            email: email,
            password: password,
        });
        return { uid: userRecord.uid };
    }
    catch (error) {
        console.error("Error creating new user:", error);
        if (error instanceof Error) {
            throw new firebase_functions_1.HttpsError("internal", error.message);
        }
        throw new firebase_functions_1.HttpsError("internal", "An unknown error occurred.");
    }
});
//# sourceMappingURL=index.js.map