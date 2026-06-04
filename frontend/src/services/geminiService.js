import axios from "axios";
import { mockDb } from "./mockDb";

const getGeminiKey = () => {
  const settings = mockDb.getSettings();
  return settings.geminiApiKey || import.meta.env.VITE_GEMINI_API_KEY || "";
};

// Realistic mock responses for companies when offline
const OFFLINE_MOCK_INTERVIEWS = {
  Google: [
    "Welcome to your Google mock interview! Let's start with a classic technical question. Google cares heavily about clean data structures and algorithmic complexity. Can you explain the difference between a Hash Map and a Binary Search Tree, and explain when you would prefer one over the other in terms of time and space complexity?",
    "That makes sense. Now let's apply it. Imagine you are building a system that processes a high-volume stream of student record updates and needs to query the top 10 highest-GPA students in real-time. What data structures would you use to implement this system efficiently, and what would be the complexity of inserting a new record?",
    "Great explanation. For our final question, let's look at behavioral aspect. At Google, 'Googliness' and leadership are critical. Tell me about a time you faced a major conflict within a technical project group (e.g., disagreement on design or teammate lack of participation) and how you navigated it to ensure project success."
  ],
  Microsoft: [
    "Welcome! I am your Microsoft mock interviewer. Let's start with system foundations. Microsoft developers need to work close to the metal and manage large codebases. Can you explain the concepts of multi-threading, concurrency, and how you prevent race conditions or deadlocks in software?",
    "Good summary. Microsoft has built some of the world's most popular platforms like React Native and TypeScript. In your profile, you mentioned React. Can you explain how React's Virtual DOM works, and what lifecycle hooks or patterns (like Context or custom hooks) you would use to optimize rendering in a large-scale enterprise web application?",
    "Excellent. For our final question: Tell me about a technical project you are most proud of. What was the architectural design, what major challenges did you run into, and how did you overcome them?"
  ],
  Generic: [
    "Welcome to your mock interview coach! To begin, please introduce yourself, share your primary technical interests, and explain why you're interested in pursuing a role with our team.",
    "Interesting background! You mentioned skills in software development. Can you walk me through a complex programming challenge you solved recently? Tell me about the data structures and languages you selected, and why you chose them.",
    "Got it. Finally, tell me about a time you had to learn a completely new technology or framework under a tight deadline to deliver a project. How did you structure your learning and what was the outcome?"
  ]
};

export const geminiService = {
  isConfigured: () => {
    const key = getGeminiKey();
    return !!key && key !== "YOUR_GEMINI_API_KEY";
  },

  generateResponse: async (chatLog, studentProfile, targetCompany, targetRole, focusArea) => {
    const apiKey = getGeminiKey();
    const isMock = !apiKey || apiKey === "YOUR_GEMINI_API_KEY";

    if (isMock) {
      // Mock simulation mode
      await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate thinking latency
      
      const qList = OFFLINE_MOCK_INTERVIEWS[targetCompany] || OFFLINE_MOCK_INTERVIEWS.Generic;
      
      // Count user messages to know which question we are on
      const userMessageCount = chatLog.filter(m => m.sender === "user").length;
      
      if (userMessageCount === 0) {
        return qList[0];
      } else if (userMessageCount === 1) {
        return qList[1];
      } else if (userMessageCount === 2) {
        return qList[2];
      } else {
        return "Thank you for completing all questions! The interview session is now complete. Please click the 'Generate Performance Report' button above to review your detailed feedback score and recommended improvement paths.";
      }
    }

    // Call live Gemini 3.5 Flash API
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;
      
      // Construct prompt payload
      const systemPrompt = `You are a professional, elite technical recruiter conducting a mock placement interview for a student.
Student Profile:
- Name: ${studentProfile.name}
- Department: ${studentProfile.department}
- CGPA: ${studentProfile.cgpa}
- Skills: ${studentProfile.skills?.join(", ")}
- Certifications: ${studentProfile.certifications?.join(", ")}
- Internship experience: ${studentProfile.internshipExperience} years

Context:
- Target Recruiter: ${targetCompany}
- Target Role: ${targetRole}
- Interview Style Focus: ${focusArea}

Instructions:
1. You must act as the interviewer. Stay in character.
2. Ask exactly ONE clear, concise question at a time. Do not dump multiple questions.
3. Assess the student's previous response in a brief, encouraging sentence before asking the next question.
4. Tailor the interview questions to the target company (e.g. Google focuses on algorithms; Microsoft on platform engineering/robustness; TCS/Accenture on general software logic and communication).
5. If the student completes 3 questions, say: "Thank you for completing all questions! The interview session is now complete. Please click the 'Generate Performance Report' button above to review your detailed feedback score."`;

      // Map chat log history into Gemini format
      // Gemini contents MUST start with a "user" role and alternate user/model.
      const formattedContents = [];

      // Always prepend a user greeting to start the conversation on a "user" turn
      formattedContents.push({
        role: "user",
        parts: [{ text: "Hello, I am ready to start my mock interview." }]
      });

      // Add actual chat conversation history
      chatLog.forEach(msg => {
        formattedContents.push({
          role: msg.sender === "user" ? "user" : "model",
          parts: [{ text: msg.text }]
        });
      });

      const response = await axios.post(url, {
        contents: formattedContents,
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500
        }
      });

      const reply = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!reply) {
        throw new Error("Empty response payload received from Gemini API.");
      }
      
      return reply;
    } catch (error) {
      console.error("Gemini API call failed, falling back to local simulation:", error);
      if (error.response?.data) {
        console.error("Gemini API Error details:", JSON.stringify(error.response.data, null, 2));
      }
      // Fallback
      const qList = OFFLINE_MOCK_INTERVIEWS[targetCompany] || OFFLINE_MOCK_INTERVIEWS.Generic;
      const userMessageCount = chatLog.filter(m => m.sender === "user").length;
      return `[API Connection Error - Fallback Active]\n\n${qList[userMessageCount] || "Thank you! Please generate your report."}`;
    }
  },

  evaluateInterview: async (chatLog, studentProfile, targetCompany, targetRole) => {
    const apiKey = getGeminiKey();
    const isMock = !apiKey || apiKey === "YOUR_GEMINI_API_KEY";

    if (isMock) {
      // Return highly realistic mock feedback after 2 seconds latency
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const score = Math.floor(75 + Math.random() * 15); // Score 75 - 90
      
      return {
        score,
        strengths: [
          "Demonstrated solid conceptual clarity in core technical domains.",
          "Good awareness of the target company's values and structure.",
          "Communicated software architecture and projects with clean structured logic."
        ],
        improvements: [
          "Could refine algorithmic analysis by specifying exact Big-O complexities upfront.",
          "Consider using the STAR format (Situation, Task, Action, Result) more rigorously for behavioral responses.",
          "Expand answers to include concrete testing methods or edge cases."
        ],
        suggestedAnswers: [
          {
            question: "Technical Concept Question",
            suggestedAnswer: "A complete answer should detail the primary trade-offs: Hash Maps provide O(1) average lookup but have hashing overhead and no ordering, whereas Binary Search Trees (balanced like Red-Black Trees) provide O(log N) lookup and maintain sorted order."
          },
          {
            question: "Behavioral Conflict Resolution",
            suggestedAnswer: "Clearly state a technical disagreement. Outline the data-driven process you used to resolve it (e.g. running a benchmark), how you maintained empathy, and focus on the final deliverables."
          }
        ]
      };
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;
      
      const evaluationPrompt = `You are an elite corporate interviewer. Evaluate the following mock interview transcript between candidate ${studentProfile.name} and the AI interviewer.
Target Recruiter: ${targetCompany}
Target Role: ${targetRole}

Provide a detailed evaluation in structured JSON format. The response MUST strictly follow the JSON schema provided below. Do not wrap the JSON in markdown code blocks like \`\`\`json. Return ONLY the raw JSON string.

Transcript:
${chatLog.map(m => `${m.sender === "user" ? "Candidate" : "Interviewer"}: ${m.text}`).join("\n\n")}

JSON Schema:
{
  "score": integer (overall percentage out of 100),
  "strengths": [string array of 3 specific key strengths],
  "improvements": [string array of 3 specific areas for improvement],
  "suggestedAnswers": [
    {
      "question": "summary of the question",
      "suggestedAnswer": "brief model response combining correct technical depth and behavioral expectations"
    }
  ]
}`;

      const response = await axios.post(url, {
        contents: [
          {
            role: "user",
            parts: [{ text: evaluationPrompt }]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2
        }
      });

      const rawJson = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawJson) {
        throw new Error("Empty feedback payload received from Gemini API.");
      }

      return JSON.parse(rawJson);
    } catch (error) {
      console.error("Gemini Interview Evaluation failed, falling back to local calculation:", error);
      if (error.response?.data) {
        console.error("Gemini Evaluation API Error details:", JSON.stringify(error.response.data, null, 2));
      }
      // Fallback response
      return {
        score: 78,
        strengths: [
          "Demonstrated solid conceptual clarity in technical areas.",
          "Excellent communication and structural flow in explanations.",
          "Solid knowledge of core profile details."
        ],
        improvements: [
          "Could refine algorithmic analysis by specifying exact Big-O complexities upfront.",
          "Consider using the STAR format (Situation, Task, Action, Result) more rigorously for behavioral responses.",
          "Expand answers to include concrete testing methods or edge-cases."
        ],
        suggestedAnswers: [
          {
            question: "Core Interview Question",
            suggestedAnswer: "When answering, provide a structured response starting with the definition, followed by trade-offs, and then give a concrete example from your project work."
          }
        ],
        isFallback: true
      };
    }
  }
};
export default geminiService;
