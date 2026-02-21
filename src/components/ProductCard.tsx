import { Link } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { Product, formatPrice } from "@/data/products";
import { Package } from "lucide-react";

interface ProductCardProps {
  product: Product;
  index: number;
}

const ProductCard = ({ product, index }: ProductCardProps) => {
  const { addToCart } = useCart();

  const getStatusLabel = () => {
    if (product.notForSale) return "판매 비대상";
    if (product.soldOut) return "재고 소진";
    return null;
  };

  const statusLabel = getStatusLabel();

  return (
    <article
      className="museum-card group animate-slide-up"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <Link to={`/product/${product.id}`} className="block">
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-muted">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-concrete-dark">
              <Package className="w-16 h-16 text-muted-foreground/50" />
            </div>
          )}

          {/* Sold Out / Not For Sale Overlay */}
          {statusLabel && (
            <div className="sold-out-overlay">
              <span className="text-primary-foreground text-sm font-medium tracking-wider uppercase px-4 py-2 bg-foreground/80">
                {statusLabel}
              </span>
            </div>
          )}

          {/* Spotlight effect on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>
      </Link>

      {/* Product Info */}
      <div className="p-4 md:p-6">
        <Link to={`/product/${product.id}`}>
          <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4 min-h-[2.5rem]">
            {product.description}
          </p>
        </Link>

        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-foreground">
            {formatPrice(product.price)}
          </span>

          {!statusLabel && (
            <button
              onClick={(e) => {
                e.preventDefault();
                addToCart(product);
              }}
              className="wood-button px-4 py-2 text-xs font-medium text-primary-foreground uppercase tracking-wider"
            >
              담기
            </button>
          )}
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
