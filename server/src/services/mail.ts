import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { config } from "../config.js";

let transporterPromise: Promise<Transporter | null> | null = null;
let etherealUser: string | null = null;

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function getTransporter(): Promise<Transporter | null> {
  if (!transporterPromise) {
    transporterPromise = (async () => {
      if (config.smtp.host && config.smtp.user && config.smtp.pass) {
        const transport = nodemailer.createTransport({
          host: config.smtp.host,
          port: config.smtp.port,
          secure: config.smtp.port === 465,
          auth: {
            user: config.smtp.user,
            pass: config.smtp.pass,
          },
        });
        await withTimeout(transport.verify(), 10000, "SMTP verify");
        console.log(`[mail] SMTP ready (${config.smtp.host})`);
        return transport;
      }

      try {
        const testAccount = await withTimeout(
          nodemailer.createTestAccount(),
          12000,
          "Ethereal createTestAccount",
        );
        etherealUser = testAccount.user;
        console.log(`[mail] Using Ethereal test inbox: ${testAccount.user}`);
        return nodemailer.createTransport({
          host: testAccount.smtp.host,
          port: testAccount.smtp.port,
          secure: testAccount.smtp.secure,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
      } catch (error) {
        console.warn(
          "[mail] No SMTP configured and Ethereal unavailable. OTPs will be logged to console only.",
          error instanceof Error ? error.message : error,
        );
        return null;
      }
    })().catch((error) => {
      console.warn("[mail] transporter init failed:", error);
      return null;
    });
  }
  return transporterPromise;
}

export async function sendOtpEmail(to: string, code: string, purpose: "verify" | "login") {
  console.log(`[mail] OTP for ${to} (${purpose}): ${code}`);
  const transporter = await getTransporter();
  if (!transporter) {
    return {
      messageId: "console-only",
      previewUrl: undefined,
      etherealUser: undefined,
      delivered: false,
    };
  }

  const subject =
    purpose === "login" ? "Your Orbitly login code" : "Verify your Orbitly account";
  const from = config.smtp.from || config.smtp.user || "Orbitly <noreply@orbitly.app>";

  const info = await withTimeout(
    transporter.sendMail({
      from,
      to,
      subject,
      text: `Your Orbitly verification code is ${code}. It expires in 5 minutes.`,
      html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#f7f8f5;border-radius:16px;">
        <h2 style="margin:0 0 8px;color:#191c19;">Orbitly</h2>
        <p style="color:#5f655e;margin:0 0 20px;">Use this one-time code to ${
          purpose === "login" ? "log in" : "verify your email"
        }:</p>
        <div style="font-size:32px;letter-spacing:8px;font-weight:700;background:#fff;border:1px solid #dde1d8;border-radius:12px;padding:16px;text-align:center;color:#191c19;">
          ${code}
        </div>
        <p style="color:#939891;font-size:13px;margin:20px 0 0;">This code expires in 5 minutes. If you didn’t request it, you can ignore this email.</p>
      </div>
    `,
    }),
    15000,
    "sendMail",
  );

  const previewUrl = nodemailer.getTestMessageUrl(info) || undefined;
  if (previewUrl) console.log(`[mail] OTP preview for ${to}: ${previewUrl}`);
  else console.log(`[mail] OTP emailed to ${to} (messageId=${info.messageId})`);

  return {
    messageId: info.messageId,
    previewUrl,
    etherealUser: etherealUser || undefined,
    delivered: true,
  };
}
