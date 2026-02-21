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

      const cards = rows.map(toCard);
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

    default:
      return {
        json: JSON.stringify({ error: `알 수 없는 함수: ${name}` }),
        cards: [],
      };
  }
}

/* ───── 상수 ───── */
const SYSTEM_PROMPT = `당신은 'excremento' 현대 예술 갤러리 쇼핑몰의 친절한 상담 챗봇입니다.
고객의 질문에 한국어로 답변하세요.
상품 정보가 필요하면 제공된 도구(함수)를 적극적으로 활용하세요.
상품 검색, 상세 조회, 재고 확인 등을 할 수 있습니다.
답변은 간결하고 친절하게 해주세요.`;

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

  return (
    <div className="flex gap-2.5 rounded-lg border border-border bg-background p-2 shadow-sm">
      {/* 이미지 */}
      {card.image ? (
        <img
          src={card.image}
          alt={card.name}
          className="h-16 w-16 flex-shrink-0 rounded-md object-cover"
        />
      ) : (
        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-md bg-muted text-[10px] text-muted-foreground">
          No img
        </div>
      )}

      {/* 정보 */}
      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div>
          <p className="truncate text-xs font-bold leading-tight text-foreground">
            {card.name}
          </p>
          <p className="mt-0.5 text-xs font-semibold text-primary">
            {card.priceLabel}
          </p>
        </div>

        {purchasable ? (
          <button
            onClick={handleAdd}
            className="mt-1 flex w-full items-center justify-center gap-1 rounded-md bg-primary px-2 py-1 text-[11px] font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <ShoppingCart className="h-3 w-3" />
            장바구니 담기
          </button>
        ) : (
          <span className="mt-1 block text-center text-[11px] text-muted-foreground">
            {card.notForSale ? "비매품" : "품절"}
          </span>
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
  const conversationRef = useRef<OAIMessage[]>([
    { role: "system", content: SYSTEM_PROMPT },
  ]);

  const hasMessages = useMemo(() => messages.length > 0, [messages.length]);

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
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
    if (!apiKey) {
      return {
        text: "OpenAI API KEY가 설정되지 않았습니다.",
        cards: [],
      };
    }

    conversationRef.current.push({ role: "user", content: prompt });

    // 함수 호출 라운드에서 수집된 카드를 모아둠
    const collectedCards: ChatProductCard[] = [];
    const MAX_TOOL_ROUNDS = 5;

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-5-nano",
            messages: conversationRef.current,
            tools: TOOLS,
            tool_choice: "auto",
          }),
        }
      );

      if (!response.ok) {
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

                {/* 상품 카드 목록 */}
                {message.cards && message.cards.length > 0 && (
                  <div className="mt-2 flex w-full flex-col gap-2">
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
