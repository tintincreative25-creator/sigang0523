import product1 from "@/assets/product-1.jpg";
import product2 from "@/assets/product-2.jpg";
import product3 from "@/assets/product-3.jpg";
import product4 from "@/assets/product-4.jpg";
import product5 from "@/assets/product-5.jpg";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  soldOut: boolean;
  notForSale?: boolean;
  details?: string[];
}

export const products: Product[] = [
  {
    id: "1",
    name: "행성의 파편",
    description: "45억년 전 배설물과 같은 행성에서 자란 나무 쪼가리",
    price: 12000,
    image: product1,
    soldOut: false,
  },
  {
    id: "2",
    name: "감독의 호흡",
    description: "스티븐 스필버그의 방귀가 섞인 공기와 혼합된 봉투 속 공기",
    price: 12000,
    image: product2,
    soldOut: false,
  },
  {
    id: "3",
    name: "당신을 위한 욕설",
    description: "오직 당신만을 위해 준비된 고품격 욕설 한 마디",
    price: 12000,
    image: product3,
    soldOut: false,
  },
  {
    id: "4",
    name: "거장의 디저트",
    description: "브루노 마스가 먹다가 뱉은 20만원 상당의 브라우니",
    price: 12000,
    image: product4,
    soldOut: true,
  },
  {
    id: "5",
    name: "창조주의 유해",
    description: "프레드릭 바우어의 유골이 담긴 프링글스 통",
    price: 12000,
    image: product5,
    soldOut: true,
  },
  {
    id: "6",
    name: "추상적 화폐",
    description: "실제 가치와 동일한 12,000원권 지폐",
    price: 12000,
    image: "",
    soldOut: false,
  },
  {
    id: "7",
    name: "친구",
    description: "없어서 못 팜",
    price: 12000,
    image: "",
    soldOut: true,
  },
  {
    id: "8",
    name: "코딩산 오레오",
    description: "오레오 오즈 틴틴 코딩산 에디션",
    price: 12000,
    image: "",
    soldOut: false,
  },
  {
    id: "9",
    name: "잭슨의 유산",
    description: "마이클 잭슨의 쓰레기가 버려졌던 쓰레기장",
    price: 12000,
    image: "",
    soldOut: false,
    notForSale: true,
  },
  {
    id: "10",
    name: "아이디어",
    description: "순수 개념적 아이디어",
    price: 12000,
    image: "",
    soldOut: true,
  },
  {
    id: "11",
    name: "태초의 공기",
    description: "최초의 인류가 밟고 지나간 자리, 그 지구 반대편에 있던 공기",
    price: 12000,
    image: "",
    soldOut: true,
  },
  {
    id: "12",
    name: "TMI 컬렉션",
    description: "알아두면 쓸모없는 고귀한 지식들",
    price: 12000,
    image: "",
    soldOut: false,
    details: [
      "나는 자습시간 5시간 중에 한번도 공부를 안하고 미술책 2권 76페이지에 있는 테이프 붙여진 바나나만 본 적 있다.",
      "오레오 오즈 틴틴 코딩산은 재고가 떨어지면 내가 직접 보충하지 않는다.",
      "북극곰은 코카콜라를 마실 줄 모른다.",
      "내용 3은 정확한 사실이 아니라 나의 추측이다.",
      "51구역 근무자들은 본인이 51구역에 있다는 사실을 인지하고 있는지 궁금하다.",
      "TMI 내용이 다 떨어져가고 있다.",
      "TMI는 알아도 쓸모없는 지식이란 뜻이다. 아니면 내 알 바 아니다.",
      "아마도 TMI가 여기에서 가장 좋은 상품일 것이다.",
      "내용 6과 내용 7을 합치면 67이다. 식스세븐.",
      "지금 이 TMI는 10번째 TMI다.",
    ],
  },
];

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("ko-KR").format(price) + "원";
};
