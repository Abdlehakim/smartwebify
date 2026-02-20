// ------------------------------------------------------------------
// src/routes/NavMenu/contactUsRoutes.ts
// ------------------------------------------------------------------
import { Router, Request, Response } from "express";
import nodemailer from "nodemailer";
import { contactFormTemplate } from "@/lib/sendconctusts";
import SpecialPageBanner from "@/models/websitedata/specialPageBanner";

const router = Router();

/**
 * GET /api/NavMenu/contactus/ContactBanner
 * Returns the Contact page banner (title + image URL)
 */
router.get(
  "/ContactBanner",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const doc = await SpecialPageBanner.findOne()
        .select("ContactBannerImgUrl ContactBannerTitle")
        .lean();

      res.status(200).json({
        ContactBannerTitle: doc?.ContactBannerTitle ?? null,
        ContactBannerImgUrl: doc?.ContactBannerImgUrl ?? null,
      });
    } catch (err) {
      console.error("Error fetching ContactBanner:", err);
      res.status(500).json({ error: "Error fetching ContactBanner" });
    }
  }
);

/**
 * POST /api/NavMenu/contactus/PostForm
 */
router.post("/PostForm", async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, message } = req.body;

    // Validate the required fields
    if (!name || !email || !message) {
      res.status(400).json({ error: "Name, email, and message are required" });
      return;
    }

    // Create the transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Email to website contact
    const mailOptions1 = {
      from: process.env.EMAIL_FROM,
      to: process.env.Email_Contact,
      subject: `${name} contacted you`,
      html: contactFormTemplate(name, email, message),
    };

    // Confirmation email to sender
    const mailOptions2 = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "Contact request successfully received",
      html: "Hello, thank you for reaching out. We will get back to you soon.",
    };

    // Send both emails in parallel
    await Promise.all([
      transporter.sendMail(mailOptions1),
      transporter.sendMail(mailOptions2),
    ]);

    res.status(200).json({ message: "Email sent successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error posting contact" });
  }
});

export default router;
