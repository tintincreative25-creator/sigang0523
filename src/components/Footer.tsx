const Footer = () => {
  return (
    <footer className="bg-foreground text-primary-foreground py-12 md:py-16">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {/* Brand */}
          <div>
            <h3 className="text-xl font-bold tracking-tight uppercase mb-4">
              excremento
            </h3>
            <p className="text-sm text-primary-foreground/70 leading-relaxed">
              예술은 가치를 정의하지 않는다.
              <br />
              가치가 예술을 정의한다.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-medium uppercase tracking-wider mb-4 text-primary-foreground/60">
              갤러리
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="#"
                  className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                >
                  전시 안내
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                >
                  작가 소개
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                >
                  구매 문의
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-medium uppercase tracking-wider mb-4 text-primary-foreground/60">
              연락처
            </h4>
            <p className="text-sm text-primary-foreground/70 leading-relaxed">
              서울특별시 어딘가
              <br />
              우주의 끝자락
              <br />
              info@excremento.art
            </p>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 mt-12 pt-8">
          <p className="text-xs text-primary-foreground/50 text-center">
            © 2024 excremento. 모든 가치는 상대적입니다.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
