import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Package } from "lucide-react";
import { products, formatPrice } from "@/data/products";
import { useCart } from "@/context/CartContext";
import Header from "@/components/Header";
import CartSidebar from "@/components/CartSidebar";
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet";
import { toast } from "@/components/ui/sonner";
import { useState } from "react";
import { loadTossPayments } from "@tosspayments/payment-sdk";

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { addToCart } = useCart();
  const [clickCount, setClickCount] = useState(0);

  const product = products.find((p) => p.id === id);

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            작품을 찾을 수 없습니다
          </h1>
          <Link
            to="/"
            className="text-primary hover:underline"
          >
            갤러리로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const getStatusLabel = () => {
    if (product.notForSale) return "판매 비대상";
    if (product.soldOut) return "재고 소진";
    return null;
  };

  const statusLabel = getStatusLabel();

  const handleSoldOutClick = () => {
    if (statusLabel === "재고 소진") {
      setClickCount((prev) => prev + 1);
      toast("없.DAGO. ,gㅔ2려nㅏ😡😡");
    }
  };

  const handlePayment = async () => {
    if (statusLabel) {
      return;
    }

    const clientKey = "test_ck_KNbdOvk5rkWX19R4L5Knrn07xlzm";
    const tossPayments = await loadTossPayments(clientKey);

    const orderId = `order-${Date.now()}-${product.id}`;
    const amount = product.price;
    const orderName = product.name;

    // 주문 정보를 localStorage에 저장 (결제 성공 시 DB 저장용)
    const orderData = {
      orderId: orderId,
      items: [
        {
          product_id: product.id,
          product_name: product.name,
          quantity: 1,
          price: product.price,
        },
      ],
      total_amount: amount,
    };
    localStorage.setItem("pendingOrder", JSON.stringify(orderData));

    await tossPayments.requestPayment("카드", {
      amount: amount,
      orderId: orderId,
      orderName: orderName,
      customerName: "홍길동",
      successUrl: `${window.location.origin}/payment/success`,
      failUrl: `${window.location.origin}/payment/fail`,
    });
  };

  return (
    <>
      <Helmet>
        <title>{product.name} | excremento</title>
        <meta name="description" content={product.description} />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />

        <main className="pt-20 md:pt-24 pb-16 md:pb-24">
          <div className="container mx-auto px-4 md:px-8">
            {/* Back Link */}
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              갤러리로 돌아가기
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
              {/* Product Image */}
              <div className="relative aspect-square bg-muted overflow-hidden animate-fade-in">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-concrete-dark">
                    <Package className="w-24 h-24 text-muted-foreground/30" />
                  </div>
                )}

                {/* Spotlight Effect */}
                <div className="absolute inset-0 gallery-spotlight pointer-events-none" />

                {/* Status Badge */}
                {statusLabel && (
                  <div className="absolute top-4 left-4 px-4 py-2 bg-foreground text-primary-foreground text-xs font-medium uppercase tracking-wider">
                    {statusLabel}
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="flex flex-col justify-center animate-slide-up">
                <div className="max-w-lg">
                  <p className="text-xs tracking-[0.3em] text-muted-foreground mb-3 uppercase">
                    Artwork #{product.id.padStart(3, "0")}
                  </p>

                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 tracking-tight">
                    {product.name}
                  </h1>

                  <div className="w-16 h-px bg-primary mb-6" />

                  <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                    {product.description}
                  </p>

                  {/* TMI Details */}
                  {product.details && (
                    <div className="mb-8 p-6 bg-muted border-l-4 border-primary">
                      <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4">
                        수록 내용
                      </h3>
                      <ul className="space-y-3">
                        {product.details.map((detail, index) => (
                          <li
                            key={index}
                            className="text-sm text-muted-foreground leading-relaxed"
                          >
                            <span className="text-primary font-medium">
                              #{index + 1}
                            </span>{" "}
                            {detail}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Price */}
                  <div className="mb-8">
                    <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">
                      가격
                    </p>
                    <p className="text-3xl md:text-4xl font-bold text-foreground">
                      {formatPrice(product.price)}
                    </p>
                  </div>

                  {/* Add to Cart and Buy Buttons */}
                  {!statusLabel ? (
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => addToCart(product)}
                        className="wood-button w-full md:w-auto px-12 py-4 text-sm font-medium text-primary-foreground uppercase tracking-wider"
                      >
                        장바구니에 담기
                      </button>
                      <button
                        onClick={handlePayment}
                        className="wood-button w-full md:w-auto px-12 py-4 text-sm font-medium text-primary-foreground uppercase tracking-wider"
                      >
                        구매하기
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleSoldOutClick}
                      className="px-12 py-4 bg-muted text-center hover:bg-muted/80 transition-colors cursor-pointer w-full md:w-auto"
                    >
                      <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        {statusLabel}
                      </span>
                    </button>
                  )}

                  {/* Philosophical Note */}
                  <p className="text-xs text-muted-foreground mt-8 italic">
                    "예술의 가치는 보는 이의 마음 속에 있습니다.
                    <br />
                    12,000원은 그저 숫자일 뿐입니다."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>

        <Footer />
        <CartSidebar />
      </div>
    </>
  );
};

export default ProductDetail;
