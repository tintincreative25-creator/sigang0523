import { Link, useSearchParams } from "react-router-dom";
import { XCircle, ArrowLeft, RefreshCw } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet";

const PaymentFail = () => {
  const [searchParams] = useSearchParams();

  const code = searchParams.get("code");
  const message = searchParams.get("message");
  const orderId = searchParams.get("orderId");

  const getErrorMessage = () => {
    if (message) return message;
    if (code) {
      switch (code) {
        case "USER_CANCEL":
          return "결제가 취소되었습니다.";
        case "INVALID_CARD":
          return "유효하지 않은 카드 정보입니다.";
        case "INSUFFICIENT_BALANCE":
          return "잔액이 부족합니다.";
        default:
          return "결제 처리 중 오류가 발생했습니다.";
      }
    }
    return "결제 처리 중 오류가 발생했습니다.";
  };

  return (
    <>
      <Helmet>
        <title>결제 실패 | excremento</title>
        <meta name="description" content="결제 처리 중 오류가 발생했습니다." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />

        <main className="pt-20 md:pt-24 pb-16 md:pb-24">
          <div className="container mx-auto px-4 md:px-8">
            <div className="max-w-2xl mx-auto text-center">
              {/* Error Icon */}
              <div className="mb-8 flex justify-center">
                <div className="w-24 h-24 rounded-full bg-destructive/10 flex items-center justify-center">
                  <XCircle className="w-16 h-16 text-destructive" />
                </div>
              </div>

              {/* Error Message */}
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                결제에 실패했습니다
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                {getErrorMessage()}
              </p>

              {/* Order Info */}
              {orderId && (
                <div className="mb-8 p-6 bg-muted rounded-lg border border-border">
                  <div className="space-y-2 text-left">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">주문 번호</span>
                      <span className="text-sm font-medium text-foreground">{orderId}</span>
                    </div>
                    {code && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">에러 코드</span>
                        <span className="text-sm font-medium text-foreground">{code}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => window.history.back()}
                  className="wood-button px-8 py-3 text-sm font-medium text-primary-foreground uppercase tracking-wider inline-flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  다시 시도
                </button>
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
                "문제가 지속되면 고객센터로 문의해주세요."
              </p>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default PaymentFail;

