import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import {
  products as localProducts,
  formatPrice,
  type Product,
} from "@/data/products";
import { useCart } from "@/context/CartContext";
import { ShoppingCart } from "lucide-react";
import { checkLoginInfo, getCurrentUserEmail } from "@/lib/globalState";
import { loadTossPayments } from "@tosspayments/payment-sdk";

/* ───── 타입 정의 ───── */
type ChatProductCard = {
  id: string;
  name: string;
  price: number;
  priceLabel: string;
  image: string;
  soldOut: boolean;
  notForSale: boolean;
  description: string;
  index?: number; // 카드 번호 (1, 2, 3...)
};

type ChatMessage = {
  id: string;
  role: "user" | "bot";
  text: string;
  createdAt: string;
  cards?: ChatProductCard[];
};

type OAIMessage =
  | { role: "system" | "user" | "assistant"; content: string }
  | { role: "assistant"; content: null; tool_calls: OAIToolCall[] }
  | { role: "tool"; tool_call_id: string; content: string };

type OAIToolCall = {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
};

/* ───── Function Calling: 도구 정의 ───── */
const TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "search_products",
      description:
        "키워드로 상품을 검색합니다. 상품 이름이나 설명에 키워드가 포함된 상품을 찾습니다.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "검색할 키워드 (예: 오레오, 공기, 잭슨)",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_product_detail",
      description:
        "상품 ID 또는 이름으로 특정 상품의 상세 정보(가격, 재고 상태, 설명, 상세내용 등)를 조회합니다.",
      parameters: {
        type: "object",
        properties: {
          product_id: {
            type: "string",
            description: "상품 ID (예: 1, 2, 3 ...)",
          },
          product_name: {
            type: "string",
            description: "상품 이름 (예: 행성의 파편)",
          },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "list_all_products",
      description:
        "전체 상품 목록을 반환합니다. 이름, 가격, 품절 여부를 포함합니다.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "check_availability",
      description:
        "특정 상품의 구매 가능 여부(품절, 비매품 등)를 확인합니다.",
      parameters: {
        type: "object",
        properties: {
          product_name: {
            type: "string",
            description: "확인할 상품 이름",
          },
        },
        required: ["product_name"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_order",
      description: "상품을 주문하고 결제를 진행합니다.",
      parameters: {
        type: "object",
        properties: {
          product_id: {
            type: "string",
            description: "상품 ID (예: '1', '2', '3' - AI가 '1번'을 '1'로 변환해서 전달)",
          },
          quantity: {
            type: "number",
            description: "주문 수량 (예: 2 - AI가 '2개'를 2로 변환해서 전달)",
          },
          customer_email: {
            type: "string",
            description: "고객 이메일 주소 (선택사항, AI가 물어봐서 받음)",
          },
          customer_name: {
            type: "string",
            description: "고객 이름 (선택사항, AI가 물어봐서 받음)",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_orders",
      description: "주문 내역을 조회합니다.",
      parameters: {
        type: "object",
        properties: {
          customer_email: {
            type: "string",
            description: "고객 이메일 주소 (선택사항, AI가 물어봐서 받음)",
          },
        },
        required: [],
      },
    },
  },
];

/* ───── 헬퍼 ───── */
type ProductRow = {
  id: string;
  name: string;
  description: string;
  price: number;
  sold_out: boolean;
  not_for_sale: boolean;
  details?: string[] | unknown;
};

const toRows = (): ProductRow[] =>
  localProducts.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price,
    sold_out: p.soldOut,
    not_for_sale: !!p.notForSale,
    details: p.details ?? [],
  }));

/** product ID → 로컬 이미지 경로 매핑 */
const getLocalImage = (productId: string): string => {
  const local = localProducts.find((p) => p.id === productId);
  return local?.image ?? "";
};

/** DB row 또는 로컬 row → ChatProductCard 변환 */
const toCard = (p: {
  id: string;
  name: string;
  description: string;
  price: number;
  sold_out: boolean;
  not_for_sale: boolean;
}): ChatProductCard => ({
  id: p.id,
  name: p.name,
  price: p.price,
  priceLabel: formatPrice(p.price),
  image: getLocalImage(p.id),
  soldOut: p.sold_out,
  notForSale: !!p.not_for_sale,
  description: p.description,
});

/* ───── Function Calling: 핸들러 ───── */
/** 함수 호출 결과 + 카드 데이터를 함께 반환 */
type FnResult = { json: string; cards: ChatProductCard[] };

// 마지막 검색 결과를 저장하는 전역 변수 (컴포넌트 간 공유)
let lastSearchResults: ChatProductCard[] = [];

async function handleFunctionCall(
  name: string,
  args: Record<string, unknown>
): Promise<FnResult> {
  switch (name) {
    case "search_products": {
      const query = ((args.query as string) ?? "").trim();
      if (!query)
        return {
          json: JSON.stringify({ results: [], message: "검색어가 비어 있습니다." }),
          cards: [],
        };

      const pattern = `%${query}%`;
      const { data, error } = await supabase
        .from("products")
        .select("id, name, description, price, sold_out, not_for_sale, details")
        .or(`name.ilike.${pattern},description.ilike.${pattern}`);

      let rows: ProductRow[];
      if (!error && data && data.length > 0) {
        rows = data as ProductRow[];
      } else {
        if (error)
          console.warn("search_products Supabase 실패, 로컬 fallback:", error.message);
        const q = query.toLowerCase();
        rows = toRows().filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q)
        );
      }

      if (rows.length === 0)
        return {
          json: JSON.stringify({ results: [], message: "검색 결과가 없습니다." }),
          cards: [],
        };

      const cards = rows.map((row, index) => ({
        ...toCard(row),
        index: index + 1, // 1부터 시작하는 번호
      }));
      
      // 마지막 검색 결과 저장
      lastSearchResults = cards;
      
      return {
        json: JSON.stringify({
          results: cards.map((c) => ({
            id: c.id,
            name: c.name,
            price: c.priceLabel,
            soldOut: c.soldOut,
            notForSale: c.notForSale,
            description: c.description,
          })),
        }),
        cards,
      };
    }

    case "get_product_detail": {
      let sbQuery = supabase
        .from("products")
        .select("id, name, description, price, sold_out, not_for_sale, details");

      if (args.product_id) {
        sbQuery = sbQuery.eq("id", args.product_id as string);
      } else if (args.product_name) {
        sbQuery = sbQuery.ilike("name", `%${args.product_name as string}%`);
      } else {
        return {
          json: JSON.stringify({ error: "상품 ID 또는 이름을 지정해주세요." }),
          cards: [],
        };
      }

      const { data, error } = await sbQuery.limit(1).maybeSingle();
      let row: ProductRow | null = !error && data ? (data as ProductRow) : null;

      if (!row) {
        if (error)
          console.warn("get_product_detail Supabase 실패, 로컬 fallback:", error.message);
        const localRows = toRows();
        row =
          localRows.find((p) => p.id === args.product_id) ??
          localRows.find(
            (p) =>
              p.name === args.product_name ||
              p.name.includes(args.product_name as string)
          ) ??
          null;
      }

      if (!row)
        return {
          json: JSON.stringify({ error: "해당 상품을 찾을 수 없습니다." }),
          cards: [],
        };

      const card = toCard(row);
      return {
        json: JSON.stringify({
          id: row.id,
          name: row.name,
          description: row.description,
          price: formatPrice(row.price),
          soldOut: row.sold_out,
          notForSale: row.not_for_sale,
          purchasable: !row.sold_out && !row.not_for_sale,
          details: row.details ?? [],
        }),
        cards: [card],
      };
    }

    case "list_all_products": {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, description, price, sold_out, not_for_sale")
        .order("id", { ascending: true });

      const rows: ProductRow[] =
        !error && data && data.length > 0 ? (data as ProductRow[]) : toRows();
      if (error)
        console.warn("list_all_products Supabase 실패, 로컬 fallback:", error.message);

      const cards = rows.map(toCard);
      return {
        json: JSON.stringify({
          products: cards.map((c) => ({
            id: c.id,
            name: c.name,
            price: c.priceLabel,
            soldOut: c.soldOut,
            notForSale: c.notForSale,
            purchasable: !c.soldOut && !c.notForSale,
          })),
        }),
        cards,
      };
    }

    case "check_availability": {
      const pName = ((args.product_name as string) ?? "").trim();
      if (!pName)
        return {
          json: JSON.stringify({ error: "상품 이름을 지정해주세요." }),
          cards: [],
        };

      const { data, error } = await supabase
        .from("products")
        .select("id, name, description, price, sold_out, not_for_sale")
        .ilike("name", `%${pName}%`)
        .limit(1)
        .maybeSingle();

      let row: ProductRow | null = !error && data ? (data as ProductRow) : null;

      if (!row) {
        if (error)
          console.warn("check_availability Supabase 실패, 로컬 fallback:", error.message);
        const q = pName.toLowerCase();
        row =
          toRows().find(
            (p) =>
              p.name.toLowerCase() === q || p.name.toLowerCase().includes(q)
          ) ?? null;
      }

      if (!row)
        return {
          json: JSON.stringify({ error: "해당 상품을 찾을 수 없습니다." }),
          cards: [],
        };

      let status = "구매 가능";
      if (row.not_for_sale) status = "비매품 (구매 불가)";
      else if (row.sold_out) status = "품절";

      return {
        json: JSON.stringify({
          name: row.name,
          status,
          soldOut: row.sold_out,
          notForSale: !!row.not_for_sale,
        }),
        cards: [toCard(row)],
      };
    }

    case "create_order": {
      const productId = (args.product_id as string)?.trim();
      const quantity = args.quantity as number;

      // 필수 파라미터 검증
      if (!productId) {
        return {
          json: JSON.stringify({ error: "상품 ID가 필요합니다." }),
          cards: [],
        };
      }

      if (!quantity || quantity <= 0) {
        return {
          json: JSON.stringify({ error: "올바른 수량이 필요합니다." }),
          cards: [],
        };
      }

      // 1. 이메일 결정: customer_email이 있으면 그거 사용, 없으면 currentUserEmail 사용
      const customerEmail = (args.customer_email as string)?.trim() || getCurrentUserEmail();

      // 2. 이메일이 둘 다 없으면 에러 반환
      if (!customerEmail) {
        return {
          json: JSON.stringify({ error: "이메일을 알려주세요." }),
          cards: [],
        };
      }

      // 3. customers 테이블에서 이메일로 조회
      const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .select("id, email, display_name")
        .eq("email", customerEmail)
        .maybeSingle();

      if (customerError) {
        console.warn("customers 테이블 조회 실패:", customerError.message);
      }

      // 4. 이름 결정: customers에서 찾은 이름 사용, 없으면 customer_name 사용
      const customerName = 
        (customerData?.display_name as string)?.trim() || 
        (args.customer_name as string)?.trim();

      // 5. 이름도 없으면 에러 반환
      if (!customerName) {
        return {
          json: JSON.stringify({ error: "이름을 알려주세요." }),
          cards: [],
        };
      }

      // 6. product_id로 products 테이블 조회
      const { data: productData, error: productError } = await supabase
        .from("products")
        .select("id, name, price, sold_out, not_for_sale")
        .eq("id", productId)
        .maybeSingle();

      // 7. 상품 없으면 에러
      if (productError || !productData) {
        console.error("상품 조회 오류:", productError);
        return {
          json: JSON.stringify({ error: "상품을 찾을 수 없어요." }),
          cards: [],
        };
      }

      // 8. 재고 확인: sold_out으로 판단 (stock 필드는 products 테이블에 없음)
      if (productData.sold_out) {
        return {
          json: JSON.stringify({ error: "상품이 품절되었어요." }),
          cards: [],
        };
      }

      // 비매품 체크
      if (productData.not_for_sale) {
        return {
          json: JSON.stringify({ error: "이 상품은 구매할 수 없어요." }),
          cards: [],
        };
      }

      // 9. 총 금액 계산: product.price * quantity
      const totalPrice = (productData.price as number) * quantity;

      // 주문 정보 객체 만들기
      const orderInfo = {
        customer_name: customerName,
        customer_email: customerEmail,
        product_id: productData.id,
        product_name: productData.name,
        quantity: quantity,
        total_price: totalPrice,
        status: 'pending' as const,
      };

      // 결제 진행
      try {
        const clientKey = "test_ck_KNbdOvk5rkWX19R4L5Knrn07xlzm";
        const tossPayments = await loadTossPayments(clientKey);

        const orderId = `order-${Date.now()}-${productData.id}`;
        const orderName = `${productData.name} ${quantity}개`;

        // 주문 정보를 localStorage에 저장 (결제 성공 시 DB 저장용)
        const orderData = {
          orderId: orderId,
          items: [
            {
              product_id: productData.id,
              product_name: productData.name,
              quantity: quantity,
              price: productData.price,
            },
          ],
          total_amount: totalPrice,
          customer_name: customerName,
          customer_email: customerEmail,
        };
        localStorage.setItem("pendingOrder", JSON.stringify(orderData));

        // 토스페이먼츠 결제 요청
        await tossPayments.requestPayment("카드", {
          amount: totalPrice,
          orderId: orderId,
          orderName: orderName,
          customerName: customerName,
          customerEmail: customerEmail,
          successUrl: `${window.location.origin}/payment/success`,
          failUrl: `${window.location.origin}/payment/fail`,
        });

        // 결제 창이 열렸으므로 성공 메시지 반환
        return {
          json: JSON.stringify({
            success: true,
            message: "결제 창이 열렸습니다. 결제를 완료해주세요.",
            order: orderInfo,
          }),
          cards: [],
        };
      } catch (paymentError: any) {
        // 결제 실패 또는 취소
        console.error("결제 오류:", paymentError);
        
        // 사용자가 결제를 취소한 경우
        if (paymentError?.code === "USER_CANCEL" || paymentError?.message?.includes("취소")) {
          return {
            json: JSON.stringify({ error: "결제가 취소되었습니다." }),
            cards: [],
          };
        }

        // 기타 결제 오류
        return {
          json: JSON.stringify({ 
            error: `결제 중 오류가 발생했습니다: ${paymentError?.message || "알 수 없는 오류"}` 
          }),
          cards: [],
        };
      }
    }

    case "get_orders": {
      // 1. 이메일 결정: customer_email이 있으면 사용, 없으면 currentUserEmail 사용
      const customerEmail = (args.customer_email as string)?.trim() || getCurrentUserEmail();

      // 2. 이메일 없으면 에러
      if (!customerEmail) {
        return {
          json: JSON.stringify({ error: "이메일을 알려주세요." }),
          cards: [],
        };
      }

      console.log("get_orders 호출 - 이메일:", customerEmail);

      // 3. customers 테이블에서 이메일로 customer_id 찾기
      const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .select("id")
        .eq("email", customerEmail)
        .maybeSingle();

      console.log("customers 조회 결과:", { customerData, customerError });

      if (customerError) {
        console.error("customers 테이블 조회 실패:", customerError);
        return {
          json: JSON.stringify({ 
            error: `고객 정보를 찾을 수 없어요. (오류: ${customerError.message})` 
          }),
          cards: [],
        };
      }

      // customer_id 결정: customers 테이블에서 찾거나 auth.users의 id 사용
      let customerId: string | null = null;

      if (customerData && customerData.id) {
        customerId = customerData.id;
      } else {
        // customers 테이블에 없으면 auth.users에서 찾기 시도
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email === customerEmail) {
          customerId = session.user.id;
        }
      }

      if (!customerId) {
        return {
          json: JSON.stringify({ 
            error: "고객 정보를 찾을 수 없어요. 먼저 주문을 진행해주세요." 
          }),
          cards: [],
        };
      }

      console.log("조회할 customer_id:", customerId);

      // 4. orders 테이블에서 customer_id로 조회 (created_at 기준 내림차순)
      // customer_id와 user_id 둘 다 시도
      let ordersData: any[] | null = null;
      let ordersError: any = null;

      // 먼저 customer_id로 시도
      const { data: ordersByCustomerId, error: errorByCustomerId } = await supabase
        .from("orders")
        .select("id, items, total_amount, status, created_at, customer_id, user_id")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false });

      if (!errorByCustomerId && ordersByCustomerId && ordersByCustomerId.length > 0) {
        ordersData = ordersByCustomerId;
        console.log("customer_id로 조회 성공:", ordersByCustomerId.length, "건");
      } else {
        // customer_id로 실패하면 user_id로 시도
        console.log("customer_id로 조회 실패, user_id로 시도:", errorByCustomerId);
        const { data: ordersByUserId, error: errorByUserId } = await supabase
          .from("orders")
          .select("id, items, total_amount, status, created_at, customer_id, user_id")
          .eq("user_id", customerId)
          .order("created_at", { ascending: false });

        if (!errorByUserId && ordersByUserId) {
          ordersData = ordersByUserId;
          console.log("user_id로 조회 성공:", ordersByUserId.length, "건");
        } else {
          ordersError = errorByUserId;
          console.log("user_id로도 조회 실패:", errorByUserId);
        }
      }

      console.log("orders 조회 결과:", { 
        ordersData, 
        ordersError,
        ordersCount: ordersData?.length || 0 
      });

      if (ordersError) {
        console.error("orders 테이블 조회 실패:", ordersError);
        return {
          json: JSON.stringify({ 
            error: `주문 내역을 불러오는 중 오류가 발생했어요. (오류: ${ordersError.message || ordersError})` 
          }),
          cards: [],
        };
      }

      // 5. 주문 없으면 메시지 반환
      if (!ordersData || ordersData.length === 0) {
        console.log("주문 내역이 없습니다. customer_id:", customerId, "email:", customerEmail);
        return {
          json: JSON.stringify({ 
            message: "주문 내역이 없어요. 아직 주문한 상품이 없습니다." 
          }),
          cards: [],
        };
      }

      // 6. 주문 있으면 리스트 형태로 보기 좋게 표시
      const ordersList = ordersData.map((order, index) => {
        const items = Array.isArray(order.items) ? order.items : [];
        const orderDate = new Date(order.created_at).toLocaleDateString("ko-KR", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

        const itemsSummary = items.length > 0
          ? items
              .map((item: any) => `${item.product_name || item.product_id} ${item.quantity || 1}개`)
              .join(", ")
          : "상품 정보 없음";

        return {
          번호: index + 1,
          주문번호: order.id.substring(0, 8) + "...", // UUID 일부만 표시
          상품목록: itemsSummary,
          총금액: `${(order.total_amount || 0).toLocaleString()}원`,
          상태: order.status === "completed" ? "완료" : order.status === "pending" ? "대기중" : order.status || "알 수 없음",
          주문일시: orderDate,
        };
      });

      return {
        json: JSON.stringify({
          success: true,
          message: `총 ${ordersData.length}개의 주문 내역이 있습니다.`,
          orders: ordersList,
          total_count: ordersData.length,
        }),
        cards: [],
      };
    }

    default:
      return {
        json: JSON.stringify({ error: `알 수 없는 함수: ${name}` }),
        cards: [],
      };
  }
}

/* ───── 상수 ───── */
/**
 * currentUserEmail 값에 따라 동적으로 시스템 프롬프트를 생성하는 함수
 */
const getSystemPrompt = (lastSearchResults: ChatProductCard[] = []): string => {
  const basePrompt = `당신은 'excremento' 현대 예술 갤러리 쇼핑몰의 친절한 상담 챗봇입니다.
고객의 질문에 한국어로 답변하세요.
상품 정보가 필요하면 제공된 도구(함수)를 적극적으로 활용하세요.
상품 검색, 상세 조회, 재고 확인 등을 할 수 있습니다.
답변은 간결하고 친절하게 해주세요.`;

  const currentUserEmail = getCurrentUserEmail();

  // 번호 및 수량 인식 규칙
  const numberRecognitionRules = `
번호 인식 규칙:
- 사용자가 "1번", "첫 번째"라고 말하면 lastSearchResults[0]의 id를 product_id로 사용하세요.
- 사용자가 "2번", "두 번째"라고 말하면 lastSearchResults[1]의 id를 사용하세요.
- 사용자가 "3번", "세 번째"라고 말하면 lastSearchResults[2]의 id를 사용하세요.
- 이 패턴은 계속됩니다 (4번=네 번째, 5번=다섯 번째 등).
- lastSearchResults가 비어있으면 "먼저 상품을 검색해주세요"라고 안내하세요.

수량 인식 규칙:
- "1개" → quantity: 1
- "2개", "두 개" → quantity: 2
- "3개", "세 개" → quantity: 3
- "4개", "네 개" → quantity: 4
- "5개", "다섯 개" → quantity: 5
- 이 패턴은 계속됩니다.

현재 검색 결과 (lastSearchResults):
${lastSearchResults.length > 0 
  ? lastSearchResults.map((result, index) => `${index + 1}번: ${result.name} (ID: ${result.id})`).join('\n')
  : '검색 결과가 없습니다. 먼저 상품을 검색해주세요.'}`;

  if (currentUserEmail) {
    // 로그인 상태: 이메일이 이미 확인됨
    return `${basePrompt}

${numberRecognitionRules}

중요한 주문 관련 지침:
- 사용자 이메일은 이미 확인되었습니다: ${currentUserEmail}
- 이메일을 다시 묻지 마세요.
- customers 테이블에 이 이메일이 없으면 이름만 물어보세요.`;
  } else {
    // 비로그인 상태: 주문 시 이메일 먼저 물어봐야 함
    return `${basePrompt}

${numberRecognitionRules}

중요한 주문 관련 지침:
- 주문할 때 이메일을 먼저 물어보세요.
- 그 이메일로 customers 테이블을 조회해서 고객 정보가 없으면 이름도 물어보세요.`;
  }
};

const DEFAULT_MESSAGES: ChatMessage[] = [
  {
    id: "welcome",
    role: "bot",
    text: "안녕하세요! 무엇을 도와드릴까요? 상품 검색, 재고 확인 등 무엇이든 물어보세요 😊",
    createdAt: new Date().toISOString(),
  },
];

const STORAGE_KEY = "chat_session_id";

const getSessionId = () => {
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing) return existing;
    const fresh =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `chat-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    localStorage.setItem(STORAGE_KEY, fresh);
    return fresh;
  } catch {
    return `chat-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
};

/* ═══════════════════════════════════════════
   상품 카드 컴포넌트
   ═══════════════════════════════════════════ */
const ProductCardInChat = ({ card }: { card: ChatProductCard }) => {
  const { addToCart } = useCart();
  const purchasable = !card.soldOut && !card.notForSale;

  const handleAdd = () => {
    const product: Product = {
      id: card.id,
      name: card.name,
      description: card.description,
      price: card.price,
      image: card.image,
      soldOut: card.soldOut,
      notForSale: card.notForSale,
    };
    addToCart(product);
  };

  // 재고 수량 표시 (DB에 재고 필드가 없으므로 상태 기반으로 표시)
  const getStockStatus = () => {
    if (card.notForSale) return "비매품";
    if (card.soldOut) return "품절";
    return "재고 있음";
  };

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-all hover:shadow-md">
      {/* 번호 배지 */}
      {card.index !== undefined && (
        <div className="absolute left-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-sm">
          {card.index}
        </div>
      )}

      {/* 이미지 */}
      <div className="relative aspect-square w-full overflow-hidden bg-muted">
        {card.image ? (
          <img
            src={card.image}
            alt={card.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted text-xs text-muted-foreground">
            이미지 없음
          </div>
        )}
      </div>

      {/* 정보 */}
      <div className="flex flex-1 flex-col p-3">
        {/* 상품 이름 */}
        <h3 className="mb-1.5 line-clamp-2 text-sm font-semibold text-foreground">
          {card.name}
        </h3>

        {/* 가격 */}
        <p className="mb-2 text-base font-bold text-primary">
          {card.priceLabel}
        </p>

        {/* 재고 수량 */}
        <div className="mb-3 flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">재고:</span>
          <span
            className={`text-xs font-medium ${
              card.soldOut || card.notForSale
                ? "text-destructive"
                : "text-green-600"
            }`}
          >
            {getStockStatus()}
          </span>
        </div>

        {/* 장바구니 버튼 */}
        {purchasable ? (
          <button
            onClick={handleAdd}
            className="mt-auto flex w-full items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 active:scale-[0.98]"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            장바구니 담기
          </button>
        ) : (
          <div className="mt-auto rounded-md bg-muted px-3 py-2 text-center text-xs text-muted-foreground">
            {card.notForSale ? "비매품" : "품절"}
          </div>
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════
   ChatWidget 메인 컴포넌트
   ═══════════════════════════════════════════ */
const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(DEFAULT_MESSAGES);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const sessionIdRef = useRef<string>(getSessionId());
  const listRef = useRef<HTMLDivElement | null>(null);
  
  // 마지막 검색 결과를 추적하는 ref
  const lastSearchResultsRef = useRef<ChatProductCard[]>([]);
  
  // 시스템 프롬프트를 동적으로 생성하여 conversationRef 초기화
  const initializeConversation = () => {
    return [{ role: "system", content: getSystemPrompt(lastSearchResultsRef.current) }];
  };
  const conversationRef = useRef<OAIMessage[]>(initializeConversation());

  const hasMessages = useMemo(() => messages.length > 0, [messages.length]);

  // 챗봇이 시작될 때 로그인 정보 확인
  useEffect(() => {
    void checkLoginInfo();
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const container = listRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [isOpen, messages]);

  useEffect(() => {
    if (!isOpen) return;
    if (messages.length > 1) return;

    const fetchMessages = async () => {
      setIsLoading(true);
      setLoadError(null);
      const { data, error } = await supabase
        .from("chat_messages")
        .select("id, role, text, created_at")
        .eq("session_id", sessionIdRef.current)
        .order("created_at", { ascending: true });

      if (error) {
        setLoadError("채팅 기록을 불러오지 못했습니다.");
        setIsLoading(false);
        return;
      }

      if (data && data.length > 0) {
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const loaded = data
            .filter((item) => !existingIds.has(item.id))
            .map((item) => ({
              id: item.id,
              role: item.role as ChatMessage["role"],
              text: item.text,
              createdAt: item.created_at,
            }));
          return [...prev, ...loaded];
        });
      }
      setIsLoading(false);
    };

    void fetchMessages();
  }, [isOpen, messages.length]);

  const appendMessage = (message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  };

  const persistMessage = async (message: ChatMessage) => {
    await supabase.from("chat_messages").insert({
      session_id: sessionIdRef.current,
      role: message.role,
      text: message.text,
      created_at: message.createdAt,
    });
  };

  /* ───── OpenAI API 호출 (Function Calling + 카드 수집) ───── */
  const fetchOpenAIResponse = async (
    prompt: string
  ): Promise<{ text: string; cards: ChatProductCard[] }> => {
    // 하드코딩된 OpenAI API 키
    const apiKey = '';
    
    if (!apiKey) {
      return {
        text: "OpenAI API KEY가 설정되지 않았습니다.",
        cards: [],
      };
    }

    // currentUserEmail이 변경되었을 수 있으므로 시스템 메시지 업데이트
    // lastSearchResults도 함께 업데이트
    const currentSystemPrompt = getSystemPrompt(lastSearchResultsRef.current);
    if (conversationRef.current.length > 0 && conversationRef.current[0].role === "system") {
      conversationRef.current[0] = { role: "system", content: currentSystemPrompt };
    } else {
      conversationRef.current.unshift({ role: "system", content: currentSystemPrompt });
    }

    conversationRef.current.push({ role: "user", content: prompt });

    // 함수 호출 라운드에서 수집된 카드를 모아둠
    const collectedCards: ChatProductCard[] = [];
    const MAX_TOOL_ROUNDS = 5;

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      // 클라이언트에서 직접 OpenAI API 호출
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: conversationRef.current,
            tools: TOOLS,
            tool_choice: "auto",
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("OpenAI API 오류:", response.status, errorText);
        return {
          text: "지금은 답변을 생성할 수 없습니다. 잠시 후 다시 시도해주세요.",
          cards: [],
        };
      }

      const data = await response.json();
      const choice = data?.choices?.[0];
      if (!choice) return { text: "답변을 준비하지 못했어요.", cards: [] };

      const assistantMessage = choice.message;

      if (
        assistantMessage.tool_calls &&
        assistantMessage.tool_calls.length > 0
      ) {
        conversationRef.current.push({
          role: "assistant",
          content: null,
          tool_calls: assistantMessage.tool_calls,
        });

        for (const toolCall of assistantMessage.tool_calls) {
          const fnName = toolCall.function.name;
          let fnArgs: Record<string, unknown> = {};
          try {
            fnArgs = JSON.parse(toolCall.function.arguments);
          } catch {
            /* 파싱 실패 */
          }

          const result = await handleFunctionCall(fnName, fnArgs);

          // 카드 수집
          if (result.cards.length > 0) {
            collectedCards.push(...result.cards);
            
            // search_products 결과인 경우 lastSearchResultsRef 업데이트
            if (fnName === "search_products") {
              lastSearchResultsRef.current = result.cards;
              // 시스템 프롬프트도 업데이트
              if (conversationRef.current.length > 0 && conversationRef.current[0].role === "system") {
                conversationRef.current[0] = { 
                  role: "system", 
                  content: getSystemPrompt(lastSearchResultsRef.current) 
                };
              }
            }
          }

          conversationRef.current.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: result.json,
          });
        }

        continue;
      }

      const text =
        assistantMessage.content?.trim() ?? "답변을 준비하지 못했어요.";
      conversationRef.current.push({ role: "assistant", content: text });

      // 중복 카드 제거 (id 기준)
      const uniqueCards = Array.from(
        new Map(collectedCards.map((c) => [c.id, c])).values()
      );

      return { text, cards: uniqueCards };
    }

    return {
      text: "요청 처리 중 오류가 발생했습니다. 다시 시도해주세요.",
      cards: [],
    };
  };

  const handleSend = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: trimmed,
      createdAt: new Date().toISOString(),
    };

    appendMessage(userMessage);
    setInputValue("");
    void persistMessage(userMessage);

    setIsSending(true);
    const { text: botText, cards } = await fetchOpenAIResponse(trimmed);
    const botMessage: ChatMessage = {
      id: `bot-${Date.now() + 1}`,
      role: "bot",
      text: botText,
      createdAt: new Date().toISOString(),
      cards: cards.length > 0 ? cards : undefined,
    };

    appendMessage(botMessage);
    void persistMessage(botMessage);
    setIsSending(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleSend();
    }
  };

  /* ───── 렌더 ───── */
  return (
    <>
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-50 w-[340px] overflow-hidden rounded-xl border border-border bg-card shadow-xl">
          {/* 헤더 */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="text-sm font-semibold text-foreground">채팅</div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              aria-label="채팅 닫기"
            >
              닫기
            </Button>
          </div>

          {/* 메시지 목록 */}
          <div
            ref={listRef}
            className={cn(
              "max-h-[400px] min-h-[240px] space-y-3 overflow-y-auto px-4 py-3 text-sm",
              !hasMessages && "text-muted-foreground"
            )}
          >
            {isLoading && (
              <div className="text-muted-foreground">
                채팅 기록 불러오는 중...
              </div>
            )}
            {loadError && (
              <div className="text-destructive">{loadError}</div>
            )}
            {!hasMessages && <div>대화를 시작해 보세요.</div>}

            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex flex-col",
                  message.role === "user" ? "items-end" : "items-start"
                )}
              >
                {/* 텍스트 말풍선 */}
                <div
                  className={cn(
                    "max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  )}
                >
                  {message.text}
                </div>

                {/* 상품 카드 목록 - Grid 레이아웃 */}
                {message.cards && message.cards.length > 0 && (
                  <div className="mt-3 grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {message.cards.map((card) => (
                      <ProductCardInChat key={card.id} card={card} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 입력 */}
          <div className="border-t border-border px-3 py-3">
            <div className="flex items-center gap-2">
              <Input
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="메시지를 입력하세요"
                aria-label="채팅 입력"
                disabled={isLoading || isSending}
              />
              <Button
                onClick={handleSend}
                aria-label="메시지 전송"
                disabled={isLoading || isSending}
              >
                {isSending ? "전송 중" : "전송"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <Button
        className="fixed bottom-4 right-4 z-50 h-12 w-12 rounded-full shadow-lg"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="채팅 열기"
      >
        {isOpen ? "−" : "채팅"}
      </Button>
    </>
  );
};

export default ChatWidget;
