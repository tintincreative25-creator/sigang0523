import Header from "@/components/Header";
import HeroBanner from "@/components/HeroBanner";
import WeeklyBest from "@/components/WeeklyBest";
import ProductGrid from "@/components/ProductGrid";
import AboutSection from "@/components/AboutSection";
import CartSidebar from "@/components/CartSidebar";
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet";

const Index = () => {
  return (
    <>
      <Helmet>
        <title>excremento | 현대 예술 갤러리</title>
        <meta
          name="description"
          content="45억년의 시간을 담은 예술 작품 컬렉션. 가치의 본질을 재정의하는 현대 미술 갤러리."
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-16 md:pt-20">
          <HeroBanner />
          <WeeklyBest />
          <ProductGrid />
          <AboutSection />
        </main>
        <Footer />
        <CartSidebar />
      </div>
    </>
  );
};

export default Index;
