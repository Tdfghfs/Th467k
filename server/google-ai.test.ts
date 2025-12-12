import { describe, expect, it } from "vitest";
import { invokeLLM } from "./_core/llm";

describe(
  "Google AI API Integration",
  () => {
    it(
      "should successfully call Google AI API with valid credentials",
      async () => {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant. Respond in Arabic.",
            },
            {
              role: "user",
              content: "السلام عليكم، هل أنت تعمل؟",
            },
          ],
        });

        expect(response).toBeDefined();
        expect(response.choices).toBeDefined();
        expect(response.choices.length).toBeGreaterThan(0);
        expect(response.choices[0]).toBeDefined();
        expect(response.choices[0].message).toBeDefined();
        expect(response.choices[0].message.content).toBeDefined();
        expect(typeof response.choices[0].message.content).toBe("string");
        expect(response.choices[0].message.content.length).toBeGreaterThan(0);
      },
      { timeout: 30000 }
    );
  },
  { timeout: 30000 }
);
