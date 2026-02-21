import ProductCard from "./ProductCard";
import { products } from "@/data/products";

const AboutSection = () => {
  return (
    <section id="about" className="py-16 bg-background">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {/* Left: Products (detailed grid) */}
          <div className="md:col-span-2">
            <div className="text-left mb-6">
              <p className="text-xs tracking-[0.3em] text-muted-foreground mb-2 uppercase">
                Catalogue
              </p>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                작품 상세
              </h2>
              <div className="w-16 h-px bg-primary mt-4" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {products.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          </div>

          {/* Right: Large Intro */}
          <aside className="md:col-span-1 bg-card border border-border p-8 rounded-lg shadow-lg">
            <h3 className="text-lg font-bold text-foreground mb-4">갤러리 소개</h3>
            <p className="text-sm text-muted-foreground mb-4">
              이 갤러리는 시간과 기억을 수집하는 공간입니다. 각 작품은 고유한
              역사와 서사를 가지고 있으며, 여기에서 여러분은 그것들을 자세히
              살펴볼 수 있습니다.
            </p>
            <p className="text-sm text-muted-foreground">
              우측의 섹션은 전시와 컬렉션을 깊이 있게 소개하며, 작품 정보와
              제작 배경, 큐레이터 노트를 제공합니다. 더 많은 설명을 원하시면
              개별 작품을 클릭하여 상세 페이지로 이동하세요.
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;


