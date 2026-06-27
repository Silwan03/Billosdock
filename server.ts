/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Set high body limits to allow base64 bill document transfers
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Initialize Gemini if key exists
  let ai: GoogleGenAI | null = null;
  if (process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }

  // API to analyze a bill image using Gemini OCR
  app.post("/api/analyze-bill", async (req, res) => {
    try {
      if (!ai) {
        return res.status(500).json({ 
          error: "Gemini API key is not configured on the server. Please check your AI Studio secrets panel." 
        });
      }

      const { fileData, fileType } = req.body;
      if (!fileData) {
        return res.status(400).json({ error: "No bill document file data provided." });
      }

      // Extract raw base64 data from dataURL if present
      let base64Data = fileData;
      if (fileData.includes(";base64,")) {
        base64Data = fileData.split(";base64,")[1];
      }

      const mimeType = fileType || "image/jpeg";

      const prompt = `Analyze this bill, invoice, or receipt image/document. Extract relevant billing details carefully. 
If the document is NOT a bill, receipt, or invoice, set isBill to false and describe the document in notes.
If it IS a bill, set isBill to true, and carefully extract:
1. Merchant name (e.g. Electric Company, Water Corp, landlord name, subscription name, etc.)
2. Total amount due (numeric float)
3. Due Date in YYYY-MM-DD format (look for words like "Due Date", "Please pay by", "Date", etc. If no explicit due date is present but an invoice date is, use the invoice date or format it carefully. Format MUST be strictly YYYY-MM-DD)
4. Recommended category (Choose ONE of: "Utilities", "Rent", "Subscriptions", "Credit Cards", "Insurance", "Other")
5. Quick summary/notes (e.g. key line items, invoice number, or billing period)
6. Suggested payment reminder timing (days before due date to remind, e.g., 3, 5, or 1)`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          },
          prompt
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isBill: {
                type: Type.BOOLEAN,
                description: "Whether the document is a bill, receipt, or invoice."
              },
              merchant: {
                type: Type.STRING,
                description: "Name of the merchant, provider, or store."
              },
              amount: {
                type: Type.NUMBER,
                description: "The total payment amount due. If not found, default to 0.0."
              },
              dueDate: {
                type: Type.STRING,
                description: "The due date in YYYY-MM-DD format."
              },
              category: {
                type: Type.STRING,
                description: "One of: 'Utilities', 'Rent', 'Subscriptions', 'Credit Cards', 'Insurance', 'Other'."
              },
              notes: {
                type: Type.STRING,
                description: "Brief bullet summary of items or description."
              },
              reminderDaysBefore: {
                type: Type.INTEGER,
                description: "Number of days before the due date to send a payment reminder (e.g., 3)."
              }
            },
            required: ["isBill"]
          }
        }
      });

      const text = response.text;
      if (!text) {
        return res.status(500).json({ error: "Empty response from Gemini AI." });
      }

      const parsedData = JSON.parse(text.trim());
      res.json(parsedData);
    } catch (err: any) {
      console.error("Error analyzing bill with Gemini:", err);
      res.status(500).json({ error: err.message || "An error occurred while analyzing the document." });
    }
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", geminiConfigured: !!ai });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
