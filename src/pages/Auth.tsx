import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet";

const signUpSchema = z.object({
  email: z.string().email("올바른 이메일 형식이 아닙니다"),
  password: z.string().min(6, "비밀번호는 최소 6자 이상이어야 합니다"),
  confirmPassword: z.string().min(6, "비밀번호는 최소 6자 이상이어야 합니다"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "비밀번호가 일치하지 않습니다",
  path: ["confirmPassword"],
});

const signInSchema = z.object({
  email: z.string().email("올바른 이메일 형식이 아닙니다"),
  password: z.string().min(1, "비밀번호를 입력해주세요"),
});

type SignUpFormData = z.infer<typeof signUpSchema>;
type SignInFormData = z.infer<typeof signInSchema>;

const Auth = () => {
  const navigate = useNavigate();
  const { signUp, signIn, user, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const signUpForm = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const signInForm = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // 이미 로그인된 경우 홈으로 리다이렉트
  useEffect(() => {
    if (!loading && user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  if (user) {
    return null;
  }

  const onSignUp = async (data: SignUpFormData) => {
    setIsLoading(true);
    try {
      const { error } = await signUp(data.email, data.password);
      if (error) {
        toast.error(error.message || "회원가입에 실패했습니다");
      } else {
        toast.success("회원가입이 완료되었습니다! 이메일을 확인해주세요.");
        signUpForm.reset();
      }
    } catch (error: any) {
      toast.error(error.message || "회원가입 중 오류가 발생했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  const onSignIn = async (data: SignInFormData) => {
    setIsLoading(true);
    try {
      const { error } = await signIn(data.email, data.password);
      if (error) {
        toast.error(error.message || "로그인에 실패했습니다");
      } else {
        toast.success("로그인 성공!");
        navigate("/");
      }
    } catch (error: any) {
      toast.error(error.message || "로그인 중 오류가 발생했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>로그인 / 회원가입 | excremento</title>
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        
        <main className="flex-1 flex items-center justify-center pt-20 md:pt-24 pb-16 md:pb-24">
          <div className="container mx-auto px-4 md:px-8">
            <div className="max-w-md w-full mx-auto">
              <div className="bg-card border border-border rounded-lg p-8 shadow-lg">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2 text-center">
                  excremento
                </h1>
                <p className="text-sm text-muted-foreground mb-8 text-center">
                  갤러리에 오신 것을 환영합니다
                </p>

                <Tabs defaultValue="signin" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="signin">로그인</TabsTrigger>
                    <TabsTrigger value="signup">회원가입</TabsTrigger>
                  </TabsList>

                  <TabsContent value="signin" className="space-y-4 mt-6">
                    <form onSubmit={signInForm.handleSubmit(onSignIn)} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signin-email">이메일</Label>
                        <Input
                          id="signin-email"
                          type="email"
                          placeholder="example@email.com"
                          {...signInForm.register("email")}
                        />
                        {signInForm.formState.errors.email && (
                          <p className="text-sm text-destructive">
                            {signInForm.formState.errors.email.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signin-password">비밀번호</Label>
                        <Input
                          id="signin-password"
                          type="password"
                          placeholder="••••••••"
                          {...signInForm.register("password")}
                        />
                        {signInForm.formState.errors.password && (
                          <p className="text-sm text-destructive">
                            {signInForm.formState.errors.password.message}
                          </p>
                        )}
                      </div>

                      <Button
                        type="submit"
                        className="w-full wood-button text-primary-foreground"
                        disabled={isLoading}
                      >
                        {isLoading ? "처리 중..." : "로그인"}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="signup" className="space-y-4 mt-6">
                    <form onSubmit={signUpForm.handleSubmit(onSignUp)} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-email">이메일</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="example@email.com"
                          {...signUpForm.register("email")}
                        />
                        {signUpForm.formState.errors.email && (
                          <p className="text-sm text-destructive">
                            {signUpForm.formState.errors.email.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-password">비밀번호</Label>
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder="최소 6자 이상"
                          {...signUpForm.register("password")}
                        />
                        {signUpForm.formState.errors.password && (
                          <p className="text-sm text-destructive">
                            {signUpForm.formState.errors.password.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-confirm-password">비밀번호 확인</Label>
                        <Input
                          id="signup-confirm-password"
                          type="password"
                          placeholder="비밀번호를 다시 입력하세요"
                          {...signUpForm.register("confirmPassword")}
                        />
                        {signUpForm.formState.errors.confirmPassword && (
                          <p className="text-sm text-destructive">
                            {signUpForm.formState.errors.confirmPassword.message}
                          </p>
                        )}
                      </div>

                      <Button
                        type="submit"
                        className="w-full wood-button text-primary-foreground"
                        disabled={isLoading}
                      >
                        {isLoading ? "처리 중..." : "회원가입"}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Auth;

