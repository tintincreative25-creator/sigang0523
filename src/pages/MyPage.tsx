import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet";
import { supabase } from "@/lib/supabase";
import { formatPrice } from "@/data/products";
import { Calendar, Package, CreditCard, RefreshCw } from "lucide-react";

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  items: Array<{
    product_id: string;
    product_name: string;
    quantity: number;
    price: number;
  }>;
  status: string;
}

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "현재 비밀번호를 입력해주세요"),
  newPassword: z.string().min(6, "비밀번호는 최소 6자 이상이어야 합니다"),
  confirmPassword: z.string().min(6, "비밀번호는 최소 6자 이상이어야 합니다"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "비밀번호가 일치하지 않습니다",
  path: ["confirmPassword"],
});

const profileSchema = z.object({
  display_name: z.string().optional(),
  phone: z.string().optional(),
});

type PasswordFormData = z.infer<typeof passwordSchema>;
type ProfileFormData = z.infer<typeof profileSchema>;

const MyPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, loading: authLoading, updatePassword, updateUserMetadata, signOut } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "profile");

  // URL 파라미터와 탭 상태 동기화
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "orders" || tab === "password" || tab === "profile") {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      display_name: user?.user_metadata?.display_name || "",
      phone: user?.user_metadata?.phone || "",
    },
  });

  // 사용자 정보가 변경되면 폼 업데이트
  useEffect(() => {
    if (user) {
      profileForm.reset({
        display_name: user.user_metadata?.display_name || "",
        phone: user.user_metadata?.phone || "",
      });
    }
  }, [user]);

  // 로그인하지 않은 경우 리다이렉트
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // 결제 내역 가져오기
  const fetchOrders = async () => {
    if (!user) return;

    setOrdersLoading(true);
    try {
      // Supabase에서 orders 테이블 조회
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("주문 내역 조회 오류:", error);
        if (error.code === "42P01") {
          // 테이블이 존재하지 않음
          toast.error("orders 테이블이 존재하지 않습니다. Supabase에서 테이블을 생성해주세요.");
        } else {
          toast.error(`주문 내역 조회 실패: ${error.message}`);
        }
        setOrders([]);
      } else {
        setOrders(data || []);
        if (data && data.length > 0) {
          console.log("주문 내역 조회 성공:", data.length, "건");
        }
      }
    } catch (error: any) {
      console.error("주문 내역 조회 중 오류:", error);
      toast.error(`주문 내역 조회 중 오류가 발생했습니다: ${error.message || "알 수 없는 오류"}`);
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  // 페이지 포커스 시 주문 내역 새로고침 (다른 탭에서 결제 후 돌아왔을 때)
  useEffect(() => {
    const handleFocus = () => {
      if (user && document.visibilityState === "visible") {
        fetchOrders();
      }
    };
    
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);
    
    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handlePasswordUpdate = async (data: PasswordFormData) => {
    setPasswordLoading(true);
    try {
      const { error } = await updatePassword(data.newPassword);
      if (error) {
        toast.error(error.message || "비밀번호 변경에 실패했습니다");
      } else {
        toast.success("비밀번호가 성공적으로 변경되었습니다");
        passwordForm.reset();
      }
    } catch (error: any) {
      toast.error(error.message || "비밀번호 변경 중 오류가 발생했습니다");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleProfileUpdate = async (data: ProfileFormData) => {
    setProfileLoading(true);
    try {
      const { error } = await updateUserMetadata({
        display_name: data.display_name,
        phone: data.phone,
      });
      if (error) {
        toast.error(error.message || "회원 정보 수정에 실패했습니다");
      } else {
        toast.success("회원 정보가 성공적으로 수정되었습니다");
      }
    } catch (error: any) {
      toast.error(error.message || "회원 정보 수정 중 오류가 발생했습니다");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    toast.success("로그아웃되었습니다");
    navigate("/");
  };

  return (
    <>
      <Helmet>
        <title>마이페이지 | excremento</title>
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        
        <main className="flex-1 pt-20 md:pt-24 pb-16 md:pb-24">
          <div className="container mx-auto px-4 md:px-8">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-8">마이페이지</h1>

              <Tabs value={activeTab} onValueChange={(value) => {
                setActiveTab(value);
                setSearchParams({ tab: value });
              }} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="profile">회원 정보</TabsTrigger>
                  <TabsTrigger value="password">비밀번호 변경</TabsTrigger>
                  <TabsTrigger value="orders">결제 내역</TabsTrigger>
                </TabsList>

                {/* 회원 정보 탭 */}
                <TabsContent value="profile" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>회원 정보</CardTitle>
                      <CardDescription>회원 정보를 수정할 수 있습니다</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={profileForm.handleSubmit(handleProfileUpdate)} className="space-y-6">
                        <div className="space-y-2">
                          <Label htmlFor="email">이메일</Label>
                          <Input
                            id="email"
                            type="email"
                            value={user.email || ""}
                            disabled
                            className="bg-muted"
                          />
                          <p className="text-xs text-muted-foreground">
                            이메일은 변경할 수 없습니다
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="display_name">이름</Label>
                          <Input
                            id="display_name"
                            placeholder="이름을 입력하세요"
                            {...profileForm.register("display_name")}
                          />
                          {profileForm.formState.errors.display_name && (
                            <p className="text-sm text-destructive">
                              {profileForm.formState.errors.display_name.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="phone">전화번호</Label>
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="010-0000-0000"
                            {...profileForm.register("phone")}
                          />
                          {profileForm.formState.errors.phone && (
                            <p className="text-sm text-destructive">
                              {profileForm.formState.errors.phone.message}
                            </p>
                          )}
                        </div>

                        <Button
                          type="submit"
                          className="wood-button text-primary-foreground"
                          disabled={profileLoading}
                        >
                          {profileLoading ? "저장 중..." : "저장"}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* 비밀번호 변경 탭 */}
                <TabsContent value="password" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>비밀번호 변경</CardTitle>
                      <CardDescription>새로운 비밀번호로 변경할 수 있습니다</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={passwordForm.handleSubmit(handlePasswordUpdate)} className="space-y-6">
                        <div className="space-y-2">
                          <Label htmlFor="currentPassword">현재 비밀번호</Label>
                          <Input
                            id="currentPassword"
                            type="password"
                            placeholder="현재 비밀번호를 입력하세요"
                            {...passwordForm.register("currentPassword")}
                          />
                          {passwordForm.formState.errors.currentPassword && (
                            <p className="text-sm text-destructive">
                              {passwordForm.formState.errors.currentPassword.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="newPassword">새 비밀번호</Label>
                          <Input
                            id="newPassword"
                            type="password"
                            placeholder="최소 6자 이상"
                            {...passwordForm.register("newPassword")}
                          />
                          {passwordForm.formState.errors.newPassword && (
                            <p className="text-sm text-destructive">
                              {passwordForm.formState.errors.newPassword.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword">새 비밀번호 확인</Label>
                          <Input
                            id="confirmPassword"
                            type="password"
                            placeholder="비밀번호를 다시 입력하세요"
                            {...passwordForm.register("confirmPassword")}
                          />
                          {passwordForm.formState.errors.confirmPassword && (
                            <p className="text-sm text-destructive">
                              {passwordForm.formState.errors.confirmPassword.message}
                            </p>
                          )}
                        </div>

                        <Button
                          type="submit"
                          className="wood-button text-primary-foreground"
                          disabled={passwordLoading}
                        >
                          {passwordLoading ? "변경 중..." : "비밀번호 변경"}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* 결제 내역 탭 */}
                <TabsContent value="orders" className="mt-6">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>결제 내역</CardTitle>
                          <CardDescription>주문한 작품 내역을 확인할 수 있습니다</CardDescription>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={fetchOrders}
                          disabled={ordersLoading}
                          className="gap-2"
                        >
                          <RefreshCw className={`w-4 h-4 ${ordersLoading ? "animate-spin" : ""}`} />
                          새로고침
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {ordersLoading ? (
                        <div className="text-center py-8 text-muted-foreground">로딩 중...</div>
                      ) : orders.length === 0 ? (
                        <div className="text-center py-8">
                          <CreditCard className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                          <p className="text-muted-foreground mb-2">결제 내역이 없습니다</p>
                          <p className="text-xs text-muted-foreground">
                            작품을 구매하면 여기에 표시됩니다
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {orders.map((order) => (
                            <Card key={order.id} className="border">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-4">
                                  <div className="flex items-center gap-2">
                                    <Package className="w-4 h-4 text-muted-foreground" />
                                    <span className="font-medium">주문 #{order.id.slice(0, 8)}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Calendar className="w-4 h-4" />
                                    <span>
                                      {new Date(order.created_at).toLocaleDateString("ko-KR", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                      })}
                                    </span>
                                  </div>
                                </div>
                                <Separator className="my-4" />
                                <div className="space-y-2 mb-4">
                                  {order.items && order.items.length > 0 ? (
                                    order.items.map((item, index) => (
                                      <div key={index} className="flex justify-between text-sm">
                                        <span>
                                          {item.product_name} × {item.quantity}
                                        </span>
                                        <span>{formatPrice(item.price * item.quantity)}</span>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="text-sm text-muted-foreground">
                                      상품 정보 없음
                                    </div>
                                  )}
                                </div>
                                <Separator className="my-4" />
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-muted-foreground">총 금액</span>
                                  <span className="text-lg font-bold">
                                    {formatPrice(order.total_amount || 0)}
                                  </span>
                                </div>
                                <div className="mt-2">
                                  <span
                                    className={`text-xs px-2 py-1 rounded ${
                                      order.status === "completed"
                                        ? "bg-green-500/20 text-green-600"
                                        : "bg-yellow-500/20 text-yellow-600"
                                    }`}
                                  >
                                    {order.status === "completed" ? "완료" : "대기중"}
                                  </span>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              <Separator className="my-8" />

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-foreground mb-1">계정 관리</h3>
                      <p className="text-sm text-muted-foreground">
                        로그아웃하거나 계정을 삭제할 수 있습니다
                      </p>
                    </div>
                    <Button variant="outline" onClick={handleLogout}>
                      로그아웃
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default MyPage;

