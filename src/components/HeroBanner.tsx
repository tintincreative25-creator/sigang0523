import { Link } from "react-router-dom";
import heroImage from "@/assets/product-1.jpg";

const HeroBanner = () => {
  return (
    <section className="relative min-h-[70vh] md:min-h-[85vh] flex items-center justify-center overflow-hidden bg-foreground dark:bg-background">
      {/* Spotlight Effect */}
      <div className="absolute inset-0 gallery-spotlight opacity-60 dark:opacity-30" />
      
      {/* Background Image */}
      <div className="absolute inset-0 flex items-center justify-center">
        <img
          src={heroImage}
          alt="45억년 된 행성 나무 조각"
          className="w-full h-full object-contain max-w-3xl opacity-90 dark:opacity-70 dark:filter dark:brightness-50 dark:grayscale"
        />
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 text-center px-4 mt-auto pb-12 md:pb-20">
        <div className="bg-background/90 backdrop-blur-sm px-6 py-6 md:px-12 md:py-8 inline-block">
          <p className="text-xs md:text-sm tracking-[0.3em] text-muted-foreground mb-2 uppercase">
            Limited Edition
          </p>
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3 md:mb-4 tracking-tight">
            45억년 된 행성 나무 조각
          </h2>
          <p className="text-sm md:text-base text-muted-foreground mb-6 max-w-lg mx-auto">
            우주의 시간을 담은 유일무이한 예술 작품
          </p>
          <Link
            to="/product/1"
            className="wood-button inline-block px-8 py-3 md:px-12 md:py-4 text-sm md:text-base font-medium text-primary-foreground tracking-wide uppercase transition-all"
          >
            작품 보기
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;
