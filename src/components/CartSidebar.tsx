import { X, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { formatPrice } from "@/data/products";
import { toast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "@/components/ui/sonner";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { loadTossPayments } from "@tosspayments/payment-sdk";

const CartSidebar = () => {
  const {
    items,
    removeFromCart,
    updateQuantity,
    totalPrice,
    isCartOpen,
    setIsCartOpen,
    clearCart,
  } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCheckout = async () => {
    // 로그인 체크
    if (!user) {
      sonnerToast.error("로그인이 필요합니다");
      setIsCartOpen(false);
      navigate("/auth");
      return;
    }

    if (items.length === 0) {
      return;
    }

    const clientKey = "test_ck_KNbdOvk5rkWX19R4L5Knrn07xlzm";
    const tossPayments = await loadTossPayments(clientKey);

    const orderId = `order-${Date.now()}-cart`;
    const orderName = items.length === 1 
      ? items[0].product.name 
      : `${items[0].product.name} 외 ${items.length - 1}개`;

    // 주문 정보를 localStorage에 저장 (결제 성공 시 DB 저장용)
    const orderData = {
      orderId: orderId,
      items: items.map((item) => ({
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
      })),
      total_amount: totalPrice,
    };
    localStorage.setItem("pendingOrder", JSON.stringify(orderData));

    await tossPayments.requestPayment("카드", {
      amount: totalPrice,
      orderId: orderId,
      orderName: orderName,
      customerName: "홍길동",
      successUrl: `${window.location.origin}/payment/success`,
      failUrl: `${window.location.origin}/payment/fail`,
    });
  };

  if (!isCartOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-foreground/50 z-50 animate-fade-in"
        onClick={() => setIsCartOpen(false)}
      />

      {/* Sidebar */}
      <aside className="fixed top-0 right-0 h-full w-full max-w-md bg-background z-50 shadow-2xl animate-slide-in-right flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-5 h-5 text-foreground" />
            <h2 className="text-lg font-bold text-foreground">장바구니</h2>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="p-2 hover:bg-muted transition-colors"
            aria-label="닫기"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingBag className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">
                장바구니가 비어있습니다
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                예술 작품을 담아보세요
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {items.map((item) => (
                <div
                  key={item.product.id}
                  className="flex gap-4 pb-6 border-b border-border last:border-0"
                >
                  {/* Product Image */}
                  <div className="w-20 h-20 bg-muted flex-shrink-0 overflow-hidden">
                    {item.product.image ? (
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="w-8 h-8 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground text-sm truncate">
                      {item.product.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatPrice(item.product.price)}
                    </p>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-3 mt-3">
                      <button
                        onClick={() =>
                          updateQuantity(item.product.id, item.quantity - 1)
                        }
                        className="w-7 h-7 flex items-center justify-center border border-border hover:bg-muted transition-colors"
                        aria-label="수량 감소"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        min={0}
                        value={item.quantity}
                        onChange={(e) => {
                          const v = parseInt(e.target.value || "0", 10);
                          updateQuantity(item.product.id, Number.isNaN(v) ? 0 : v);
                        }}
                        className="text-sm font-medium w-16 text-center border border-border rounded-sm py-1 bg-card"
                        aria-label={`수량 입력 ${item.product.name}`}
                      />
                      <button
                        onClick={() =>
                          updateQuantity(item.product.id, item.quantity + 1)
                        }
                        className="w-7 h-7 flex items-center justify-center border border-border hover:bg-muted transition-colors"
                        aria-label="수량 증가"
                      >
                        <Plus className="w-3 h-3" />
                      </button>

                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="ml-auto p-1 text-muted-foreground hover:text-destructive transition-colors"
                        aria-label="삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-6 border-t border-border bg-card">
            <div className="flex items-center justify-between mb-6">
              <span className="text-muted-foreground">총 금액</span>
              <span className="text-xl font-bold text-foreground">
                {formatPrice(totalPrice)}
              </span>
            </div>
            <button
              onClick={handleCheckout}
              className="wood-button w-full py-4 text-sm font-medium text-primary-foreground uppercase tracking-wider"
            >
              결제하기
            </button>
            <p className="text-xs text-muted-foreground text-center mt-4">
              결제 시 예술적 가치에 동의하는 것으로 간주됩니다
            </p>
          </div>
        )}
      </aside>
    </>
  );
};

export default CartSidebar;
