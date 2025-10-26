import { NextApiRequest, NextApiResponse } from "next";
import { GoogleGenerativeAI } from "@google/generative-ai";
import connectToDatabase from "../../lib/mongodb";
import Note from "../../models/Note";
import mongoose from "mongoose";
import { requireAuth } from "../../lib/auth";

interface SummarizeRequest {
  noteId?: string;
  content?: string;
}

// Simple fallback summarizer
function createSimpleSummary(text: string): string {
  const sentences = text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 10);

  if (sentences.length <= 2) {
    return sentences.join('. ') + '.';
  }

  // Take first and last sentence for longer text
  const firstSentence = sentences[0];
  const lastSentence = sentences[sentences.length - 1];
  
  return `${firstSentence}. ${lastSentence}.`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
      message: "Only POST method is allowed",
    });
  }

  try {
    // Require authentication
    const userId = requireAuth(req);

    const { noteId, content }: SummarizeRequest = req.body;

    if (!noteId && !content) {
      return res.status(400).json({
        success: false,
        error: "Validation error",
        message: "Either noteId or content must be provided",
      });
    }

    let textToSummarize: string;

    if (noteId) {
      if (!mongoose.Types.ObjectId.isValid(noteId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid ID",
          message: "Invalid note ID format",
        });
      }

      await connectToDatabase();
      const note = await Note.findOne({ _id: noteId, userId: userId }).lean();

      if (!note) {
        return res.status(404).json({
          success: false,
          error: "Not found",
          message: "Note not found",
        });
      }

      textToSummarize = note.content || "";
    } else {
      textToSummarize = content || "";
    }

    if (textToSummarize.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Empty content",
        message: "No text provided for summarization",
      });
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return res.status(500).json({
        success: false,
        error: "Missing API key",
        message: "Gemini API key not configured",
      });
    }

    let summary = "";

      try {
        // Initialize Gemini client
        const genAI = new GoogleGenerativeAI(geminiApiKey);
        
        // Try different model names to find one that works
        const modelsToTry = [
          "gemini-2.5-flash",
          "gemini-2.5-pro", 
       
        ];

        let modelWorked = false;
        
        for (const modelName of modelsToTry) {
          try {
            console.log(`Trying model: ${modelName}`);
            const model = genAI.getGenerativeModel({ model: modelName });
            
            const prompt = `Summarize this note in 2-3 sentences:\n\n${textToSummarize}`;
            
            const result = await model.generateContent(prompt);
            summary = result.response.text().trim();
            
            if (summary) {
              console.log(`Success with model: ${modelName}`);
              modelWorked = true;
              break;
            }
          } catch (modelError) {
            if (modelError instanceof Error) {
              console.log(`Model ${modelName} failed:`, modelError.message);
            } else {
              console.log(`Model ${modelName} failed with unknown error:`, modelError);
            }
            continue;
          }
        }

        if (!modelWorked) {
          // Fallback to simple summarizer
          console.log("All Gemini models failed, using fallback summarizer");
          summary = createSimpleSummary(textToSummarize);
        }

      } catch (geminiError) {
        console.error("Gemini API error:", geminiError);
        // Fallback to simple summarizer
        console.log("Gemini API failed, using fallback summarizer");
        summary = createSimpleSummary(textToSummarize);
      }

    // ✅ Update DB if noteId provided
    if (noteId) {
      await Note.findOneAndUpdate({ _id: noteId, userId: userId }, { summary });
    }

    return res.status(200).json({
      success: true,
      data: { summary },
      message: "Summary generated successfully",
    });
  } catch (error) {
    console.error("Error in summarize API:", error);
    return res.status(500).json({
      success: false,
      error: "Internal error",
      message: "Failed to generate summary",
    });
  }
}
