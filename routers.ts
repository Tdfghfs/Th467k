import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { invokeLLM } from "./_core/llm";
import { createConversation, getUserConversations, getConversation, deleteConversation, addMessage, getConversationMessages, searchMessages } from "./db";
import { getPersonalitySystemPrompt } from "./personalities";
import { rateMessage, getUserMessageRating, getMessageRatingStats, removeRating } from "./ratings-db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  chat: router({
    createConversation: protectedProcedure
      .input(z.enum(["programmer"]))
      .mutation(async ({ ctx, input }) => {
        return createConversation(ctx.user.id, input);
      }),

    getConversations: protectedProcedure.query(async ({ ctx }) => {
      return getUserConversations(ctx.user.id);
    }),

    getMessages: protectedProcedure
      .input(z.number())
      .query(async ({ ctx, input }) => {
        const conversation = await getConversation(input);
        if (!conversation || conversation.userId !== ctx.user.id) {
          throw new Error("Unauthorized or conversation not found");
        }
        return getConversationMessages(input);
      }),

    sendMessage: protectedProcedure
      .input(
        z.object({
          conversationId: z.number(),
          message: z.string().min(1),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const conversation = await getConversation(input.conversationId);
        if (!conversation || conversation.userId !== ctx.user.id) {
          throw new Error("Unauthorized or conversation not found");
        }

        const personality = conversation.personality;
        const systemPrompt = getPersonalitySystemPrompt(personality);

        const history = await getConversationMessages(input.conversationId);

        await addMessage(input.conversationId, "user", input.message, personality);

        const messagesArray = [
          { role: "system" as const, content: systemPrompt },
          ...history.map((msg) => ({
            role: msg.role as "user" | "assistant",
            content: msg.content,
          })),
          { role: "user" as const, content: input.message },
        ];

        const response = await invokeLLM({ 
          messages: messagesArray.map(m => ({
            role: m.role,
            content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content)
          })) as any 
        });
        
        let aiMessage = "عذراً، لم أتمكن من الرد.";
        const content = response.choices[0]?.message?.content;
        if (typeof content === 'string') {
          aiMessage = content;
        }

        await addMessage(input.conversationId, "assistant", aiMessage, personality);

        return {
          userMessage: input.message,
          aiMessage,
        };
      }),

    deleteConversation: protectedProcedure
      .input(z.number())
      .mutation(async ({ ctx, input }) => {
        const conversation = await getConversation(input);
        if (!conversation || conversation.userId !== ctx.user.id) {
          throw new Error("Unauthorized or conversation not found");
        }
        return deleteConversation(input);
      }),

    searchMessages: protectedProcedure
      .input(z.string().min(1))
      .query(async ({ ctx, input }) => {
        return searchMessages(ctx.user.id, input);
      }),

    rateMessage: protectedProcedure
      .input(
        z.object({
          messageId: z.number(),
          rating: z.enum(["like", "dislike"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return rateMessage(input.messageId, ctx.user.id, input.rating);
      }),

    getUserMessageRating: protectedProcedure
      .input(z.number())
      .query(async ({ ctx, input }) => {
        return getUserMessageRating(input, ctx.user.id);
      }),

    getMessageRatingStats: protectedProcedure
      .input(z.number())
      .query(async ({ ctx, input }) => {
        return getMessageRatingStats(input);
      }),

    removeRating: protectedProcedure
      .input(z.number())
      .mutation(async ({ ctx, input }) => {
        return removeRating(input, ctx.user.id);
      }),
  }),
});

export type AppRouter = typeof appRouter;
