import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      type: "service_account",
      project_id: "ai-social-saas-1de62",
      private_key_id: "YOUR_PRIVATE_KEY_ID",
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      client_email: "firebase-adminsdk-fbsvc@ai-social-saas-1de62.iam.gserviceaccount.com",
      client_id: "112243478634765786868",
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40ai-social-saas-1de62.iam.gserviceaccount.com"
    }),
  });
}

export const authAdmin = admin.auth();
