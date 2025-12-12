import { describe, expect, it } from "vitest";
import { getPersonalitySystemPrompt, personalities } from "./personalities";

describe("Chat Personalities", () => {
  it("should have programmer personality with correct system prompt", () => {
    const prompt = getPersonalitySystemPrompt("programmer");
    expect(prompt).toBeDefined();
    expect(prompt.length).toBeGreaterThan(0);
    expect(prompt).toContain("ايـزن");
    expect(prompt).toContain("برمجة");
  });

  it("should have programmer personality defined", () => {
    expect(personalities.programmer).toBeDefined();
  });

  it("should have correct personality configuration structure", () => {
    const personality = personalities.programmer;
    expect(personality).toHaveProperty("name");
    expect(personality).toHaveProperty("description");
    expect(personality).toHaveProperty("systemPrompt");
    expect(personality).toHaveProperty("icon");
    expect(personality).toHaveProperty("color");
  });

  it("programmer personality should have blue color gradient", () => {
    const personality = personalities.programmer;
    expect(personality.color).toContain("blue");
  });

  it("programmer personality should have correct icon", () => {
    const personality = personalities.programmer;
    expect(personality.icon).toBe("💻");
  });

  it("programmer personality should have correct name", () => {
    const personality = personalities.programmer;
    expect(personality.name).toBe("مساعد البرمجة الذكي");
  });

  it("programmer personality should have correct description", () => {
    const personality = personalities.programmer;
    expect(personality.description).toContain("برمجة");
  });
});
