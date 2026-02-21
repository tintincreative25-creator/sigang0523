import ProductCard from "./ProductCard";
import { products } from "@/data/products";

const WeeklyBest = () => {
  return (
    <section id="weekly-best" className="py-12 md:py-16 bg-background">
      <div className="container mx-auto px-4 md:px-8">
        {/* Section Header */}
        <div className="text-center mb-8 md:mb-12">
          <p className="text-xs tracking-[0.3em] text-muted-foreground mb-2 uppercase">
            Weekly
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
            Weekly Best
          </h2>
          <div className="w-12 h-px bg-primary mx-auto mt-4" />
        </div>

        {/* Mobile: horizontal scroller with snap */}
        <div className="md:hidden -mx-4 px-4">
          <div className="flex gap-4 overflow-x-auto no-scrollbar py-2 snap-container">
            {products.slice(0, 4).map((product, index) => (
              <div key={product.id} className="min-w-[240px] flex-shrink-0 snap-item">
                <ProductCard product={product} index={index} />
              </div>
            ))}
          </div>
        </div>

        {/* Desktop / Tablet: 4-up Grid */}
        <div className="hidden md:grid md:grid-cols-4 gap-6">
          {products.slice(0, 4).map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default WeeklyBest;


