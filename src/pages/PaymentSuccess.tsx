import { useEffect, useState, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle, ArrowLeft, Home } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { toast as sonnerToast } from "@/components/ui/sonner";
import { supabase } from "@/lib/supabase";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const { clearCart } = useCart();
  const { user, loading: authLoading } = useAuth();
  const [orderSaved, setOrderSaved] = useState(false);
  const hasProcessed = useRef(false);

  const orderId = searchParams.get("orderId");
  const paymentKey = searchParams.get("paymentKey");
  const amount = searchParams.get("amount");

  useEffect(() => {
    // 로딩 중이거나 이미 처리된 경우 무시
    if (authLoading || hasProcessed.current) {
      return;
    }

    const saveOrderToDB = async () => {
      // 로그인 확인
      if (!user) {
        console.error("로그인이 필요합니다");
        return;
      }

      // localStorage에서 주문 정보 가져오기
      const pendingOrderStr = localStorage.getItem("pendingOrder");
      if (!pendingOrderStr) {
        console.error("저장된 주문 정보가 없습니다");
        // 주문 정보가 없어도 장바구니는 비우기
        clearCart();
        return;
      }

      try {
        const pendingOrder = JSON.parse(pendingOrderStr);

        // paymentKey가 있어야 Edge Function 호출 가능
        if (!paymentKey) {
          console.error("paymentKey가 없습니다. 결제 승인을 처리할 수 없습니다.");
          sonnerToast.error("결제 정보가 불완전합니다.", {
            duration: 5000,
          });
          return;
        }

        // Edge Function을 통해 결제 승인 처리
        const { data: confirmData, error: confirmError } = await supabase.functions.invoke(
          "approve-payment",
          {
            body: {
              paymentKey: paymentKey,
              orderId: pendingOrder.orderId || orderId,
              amount: pendingOrder.total_amount || parseInt(amount || "0"),
              items: pendingOrder.items,
            },
          }
        );

        if (confirmError) {
          console.error("결제 승인 오류:", confirmError);
          sonnerToast.error(
            `결제 승인 실패: ${confirmError.message || "알 수 없는 오류"}`,
            {
              duration: 5000,
            }
          );
        } else if (confirmData?.error) {
          console.error("결제 승인 오류:", confirmData.error);
          sonnerToast.error(
            `결제 승인 실패: ${confirmData.error}`,
            {
              duration: 5000,
            }
          );
        } else {
          console.log("결제 승인 성공:", confirmData);
          setOrderSaved(true);
          
          // localStorage에서 주문 정보 제거
          localStorage.removeItem("pendingOrder");
          
          // 장바구니 비우기
          clearCart();
          
          sonnerToast.success("결제가 성공적으로 승인되었습니다!", {
            duration: 3000,
          });
        }
      } catch (error: any) {
        console.error("주문 저장 중 오류:", error);
        sonnerToast.error(`주문 저장 중 오류가 발생했습니다: ${error.message || "알 수 없는 오류"}`);
      } finally {
        hasProcessed.current = true;
      }
    };

    // 결제 성공 토스트 (한 번만 표시)
    if (orderId) {
      sonnerToast.success("결제가 완료되었습니다!", {
        duration: 3000,
      });

      // 주문 정보 저장
      if (user) {
        saveOrderToDB();
      }
    } else {
      // orderId가 없어도 장바구니는 비우기
      clearCart();
      hasProcessed.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, orderId]); // clearCart는 안정적인 함수이므로 의존성에서 제외

  return (
    <>
      <Helmet>
        <title>결제 완료 | excremento</title>
        <meta name="description" content="결제가 성공적으로 완료되었습니다." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />

        <main className="pt-20 md:pt-24 pb-16 md:pb-24">
          <div className="container mx-auto px-4 md:px-8">
            <div className="max-w-2xl mx-auto text-center">
              {/* Success Icon */}
              <div className="mb-8 flex justify-center">
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle className="w-16 h-16 text-primary" />
                </div>
              </div>

              {/* Success Message */}
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                결제가 완료되었습니다
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                감사합니다. 주문이 성공적으로 처리되었습니다.
              </p>

              {/* Order Info */}
              {orderId && (
                <div className="mb-8 p-6 bg-muted rounded-lg border border-border">
                  <div className="space-y-2 text-left">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">주문 번호</span>
                      <span className="text-sm font-medium text-foreground">{orderId}</span>
                    </div>
                    {amount && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">결제 금액</span>
                        <span className="text-sm font-medium text-foreground">
                          {parseInt(amount).toLocaleString()}원
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/mypage?tab=orders"
                  className="wood-button px-8 py-3 text-sm font-medium text-primary-foreground uppercase tracking-wider inline-flex items-center justify-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  주문 내역 보기
                </Link>
                <Link
                  to="/"
                  className="px-8 py-3 border border-border hover:bg-muted transition-colors text-sm font-medium text-foreground uppercase tracking-wider inline-flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  홈으로 돌아가기
                </Link>
              </div>

              {/* Note */}
              <p className="text-xs text-muted-foreground mt-8 italic">
                "결제 완료 메일은 이메일로 발송되었습니다."
              </p>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default PaymentSuccess;

