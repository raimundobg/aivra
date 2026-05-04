import * as admin from "firebase-admin";
import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {
  sendPatientWelcome,
  sendOnboardingCompleteToNutri,
  sendChatNotificationToNutri,
} from "./email";


admin.initializeApp();
const db = admin.firestore();

const APP_URL = process.env.APP_URL ?? "https://aivra.cl";

// ─── Helper: get any nutritionist email ──────────────────────────────────────
// Simple strategy: find first nutritionist in Firestore to notify.
// In production replace with a patient→nutritionist assignment field.

async function getNutritionist(): Promise<{ email: string; name: string } | null> {
  const snap = await db.collection("users").where("role", "==", "nutritionist").limit(1).get();
  if (snap.empty) return null;
  const d = snap.docs[0].data();
  return { email: d.email ?? "", name: d.displayName ?? "Nutricionista" };
}

// ─── 1. Welcome email when patient registers ─────────────────────────────────

export const onPatientCreated = onDocumentCreated("users/{uid}", async event => {
  const data = event.data?.data();
  if (!data || data.role !== "patient") return;

  const { email, displayName } = data as { email: string; displayName: string };
  if (!email) return;

  logger.info(`[onPatientCreated] sending welcome to ${email}`);
  await sendPatientWelcome(email, displayName ?? "Paciente", APP_URL);
});

// ─── 2. Notify nutritionist when patient completes onboarding ────────────────

export const onOnboardingCompleted = onDocumentUpdated("users/{uid}", async event => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();

  // Only fire when onboardingCompleted flips false → true
  if (!before || !after) return;
  if (before.onboardingCompleted || !after.onboardingCompleted) return;
  if (after.role !== "patient") return;

  const patientName = after.displayName ?? "Paciente";
  const patientUid = event.params.uid;

  const nutri = await getNutritionist();
  if (!nutri?.email) {
    logger.warn("[onOnboardingCompleted] no nutritionist found to notify");
    return;
  }

  logger.info(`[onOnboardingCompleted] notifying ${nutri.email} about ${patientName}`);
  await sendOnboardingCompleteToNutri(nutri.email, nutri.name, patientName, patientUid, APP_URL);
});

// ─── 3. Notify nutritionist on new patient chat message ──────────────────────
// Throttle: only send if no other message was sent in the last 10 minutes
// to avoid email floods from fast-typing patients.

export const onChatMessage = onDocumentCreated(
  "conversations/{patientUid}/messages/{msgId}",
  async event => {
    const data = event.data?.data();
    if (!data || data.sender !== "patient") return;

    const patientUid = event.params.patientUid;
    const content: string = data.content ?? "";

    // Get patient info
    const patientDoc = await db.collection("users").doc(patientUid).get();
    if (!patientDoc.exists) return;
    const patientName = patientDoc.data()?.displayName ?? "Paciente";

    // Throttle: check if a notification was sent in the last 10 minutes
    const throttleDoc = db.collection("_emailThrottle").doc(`chat_${patientUid}`);
    const throttle = await throttleDoc.get();
    if (throttle.exists) {
      const lastSent = throttle.data()?.lastSent?.toDate() as Date | undefined;
      if (lastSent && Date.now() - lastSent.getTime() < 10 * 60 * 1000) {
        logger.info(`[onChatMessage] throttled — last email sent ${lastSent.toISOString()}`);
        return;
      }
    }

    const nutri = await getNutritionist();
    if (!nutri?.email) return;

    logger.info(`[onChatMessage] notifying ${nutri.email} about message from ${patientName}`);
    await sendChatNotificationToNutri(nutri.email, nutri.name, patientName, content, patientUid, APP_URL);

    // Update throttle timestamp
    await throttleDoc.set({ lastSent: admin.firestore.FieldValue.serverTimestamp() });
  }
);

// ─── 4. Groq proxy — keeps the API key server-side ───────────────────────────
// Called from the frontend via httpsCallable("groqProxy").
// Requires the GROQ_API_KEY secret to be set:
//   firebase functions:secrets:set GROQ_API_KEY

interface GroqMessage { role: string; content: string }
interface GroqRequest  { messages: GroqMessage[]; maxTokens?: number; temperature?: number; jsonMode?: boolean }
interface GroqResponse { content: string }

export const groqProxy = onCall<GroqRequest, Promise<GroqResponse>>(
  { cors: true },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be signed in");
    }

    const { messages, maxTokens = 600, temperature = 0.5, jsonMode = false } = request.data;

    if (!Array.isArray(messages) || messages.length === 0) {
      throw new HttpsError("invalid-argument", "messages must be a non-empty array");
    }

    const key = process.env.GROQ_API_KEY;
    if (!key) throw new HttpsError("internal", "Groq API key not configured");

    const body: Record<string, unknown> = {
      model: "llama-3.3-70b-versatile",
      messages,
      temperature,
      max_tokens: maxTokens,
    };
    if (jsonMode) body.response_format = { type: "json_object" };

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      logger.error(`[groqProxy] Groq API error ${res.status}`);
      throw new HttpsError("internal", `Groq error: ${res.status}`);
    }

    const json = await res.json() as { choices: Array<{ message: { content: string } }> };
    const content = json.choices[0]?.message?.content ?? "";
    return { content };
  }
);
