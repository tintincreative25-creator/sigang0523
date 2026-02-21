// ============================================
// 토스페이먼츠 결제 승인 Edge Function
// ============================================
// Supabase Edge Functions 디렉토리에 배포하세요
// 경로: supabase/functions/approve-payment/index.ts
//
// 환경변수 설정 필요:
// - TOSS_SECRET_KEY: 토스페이먼츠 시크릿 키
//   Supabase 대시보드 > Project Settings > Edge Functions > Secrets에서 설정

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PaymentConfirmRequest {
  paymentKey: string;
  orderId: string;
  amount: number;
  userId?: string;
  items?: any[];
}

serve(async (req) => {
  // CORS preflight 요청 처리
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 요청 본문 파싱
    const requestData: PaymentConfirmRequest = await req.json();

    // 필수 파라미터 검증
    if (!requestData.paymentKey) {
      return new Response(
        JSON.stringify({ error: "paymentKey가 필요합니다." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!requestData.orderId) {
      return new Response(
        JSON.stringify({ error: "orderId가 필요합니다." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!requestData.amount) {
      return new Response(
        JSON.stringify({ error: "amount가 필요합니다." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 환경변수에서 시크릿 키 가져오기
    const secretKey = Deno.env.get("TOSS_SECRET_KEY");
    if (!secretKey) {
      console.error("TOSS_SECRET_KEY 환경변수가 설정되지 않았습니다.");
      return new Response(
        JSON.stringify({
          error: "서버 설정 오류: TOSS_SECRET_KEY가 설정되지 않았습니다.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 토스페이먼츠 시크릿 키를 Base64로 인코딩
    const secretKeyBase64 = btoa(secretKey + ":");

    // 토스페이먼츠 결제 승인 API 호출
    const tossResponse = await fetch(
      "https://api.tosspayments.com/v1/payments/confirm",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${secretKeyBase64}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentKey: requestData.paymentKey,
          orderId: requestData.orderId,
          amount: requestData.amount,
        }),
      }
    );

    const tossResult = await tossResponse.json();

    if (!tossResponse.ok) {
      console.error("토스페이먼츠 결제 승인 실패:", tossResult);
      return new Response(JSON.stringify(tossResult), {
        status: tossResponse.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Supabase 클라이언트 생성 (주문 저장용)
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // 사용자 정보 가져오기
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    // 결제 승인 성공 시 주문을 DB에 저장
    if (user && requestData.items) {
      const { error: orderError } = await supabaseClient
        .from("orders")
        .insert({
          user_id: user.id,
          items: requestData.items,
          total_amount: requestData.amount,
          status: "completed",
        });

      if (orderError) {
        console.error("주문 저장 오류:", orderError);
        // 주문 저장 실패해도 결제는 승인되었으므로 경고만 기록
        // 필요시 에러를 반환할 수도 있음
      }
    }

    // 성공 응답
    return new Response(
      JSON.stringify({
        success: true,
        payment: tossResult,
        message: "결제가 성공적으로 승인되었습니다.",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("결제 승인 처리 중 오류:", error);
    return new Response(
      JSON.stringify({
        error: "결제 승인 처리 중 오류가 발생했습니다.",
        message: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

