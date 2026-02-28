// ============================================
// OpenAI Chat Completion Edge Function
// ============================================
// Supabase Edge Functions 디렉토리에 배포하세요
// 경로: supabase/functions/chat-completion/index.ts
//
// 환경변수 설정 필요:
// - OPENAI_API_KEY: OpenAI API 키
//   Supabase 대시보드 > Project Settings > Edge Functions > Secrets에서 설정

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ChatCompletionRequest {
  messages: any[];
  tools?: any[];
  tool_choice?: string;
  model?: string;
}

serve(async (req) => {
  // CORS preflight 요청 처리
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // 요청 본문 파싱
    const requestData: ChatCompletionRequest = await req.json();

    // 필수 파라미터 검증
    if (!requestData.messages || !Array.isArray(requestData.messages)) {
      return new Response(
        JSON.stringify({ error: "messages 배열이 필요합니다." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 환경변수에서 OpenAI API 키 가져오기
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      console.error("OPENAI_API_KEY 환경변수가 설정되지 않았습니다.");
      return new Response(
        JSON.stringify({
          error: "서버 설정 오류: OPENAI_API_KEY가 설정되지 않았습니다.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // OpenAI API 호출
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: requestData.model || "gpt-4o-mini",
        messages: requestData.messages,
        tools: requestData.tools,
        tool_choice: requestData.tool_choice || "auto",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API 오류:", response.status, errorText);
      return new Response(
        JSON.stringify({
          error: "OpenAI API 호출 실패",
          status: response.status,
          details: errorText,
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Edge Function 오류:", error);
    return new Response(
      JSON.stringify({
        error: "서버 오류가 발생했습니다.",
        message: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

