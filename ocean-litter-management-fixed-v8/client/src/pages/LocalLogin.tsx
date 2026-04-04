import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

// 테스트 계정 정의
const TEST_ACCOUNTS = {
  cleaner: { password: "1234", role: "user", name: "조사원(청소자)" },
  driver: { password: "1234", role: "user", name: "운반자" },
  admin: { password: "1234", role: "admin", name: "관리자" },
};

export default function LocalLogin() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 계정 확인
      const account = TEST_ACCOUNTS[username as keyof typeof TEST_ACCOUNTS];
      
      if (!account || account.password !== password) {
        toast.error("아이디 또는 비밀번호가 잘못되었습니다.");
        setIsLoading(false);
        return;
      }

      // 로컬 스토리지에 사용자 정보 저장
      const userData = {
        id: Math.random().toString(36).substr(2, 9),
        openId: `local-${username}`,
        name: account.name,
        email: `${username}@local.dev`,
        role: account.role,
        loginMethod: "local",
        createdAt: new Date().toISOString(),
      };

      localStorage.setItem("local_user", JSON.stringify(userData));
      localStorage.setItem("local_session", "true");

      toast.success(`${account.name}로 로그인되었습니다.`);

      // 1초 후 홈으로 이동
      setTimeout(() => {
        setLocation("/");
      }, 1000);
    } catch (error) {
      toast.error("로그인 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>AI바다환경지킴이 - 로컬 로그인</CardTitle>
          <CardDescription>
            로컬 개발 환경용 테스트 계정으로 로그인하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {/* 계정 선택 버튼 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">테스트 계정 선택</label>
              <div className="grid grid-cols-1 gap-2">
                {Object.entries(TEST_ACCOUNTS).map(([key, account]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setUsername(key);
                      setPassword(account.password);
                    }}
                    className={`p-3 border-2 rounded-lg text-left transition-all ${
                      username === key
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="font-medium text-sm">{account.name}</div>
                    <div className="text-xs text-gray-500">
                      아이디: {key} / 비밀번호: {account.password}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 또는 수동 입력 */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">또는 수동 입력</span>
              </div>
            </div>

            {/* 아이디 입력 */}
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium">
                아이디
              </label>
              <Input
                id="username"
                placeholder="cleaner, driver, admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* 비밀번호 입력 */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                비밀번호
              </label>
              <Input
                id="password"
                type="password"
                placeholder="1234"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* 로그인 버튼 */}
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !username || !password}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  로그인 중...
                </>
              ) : (
                "로그인"
              )}
            </Button>
          </form>

          {/* 정보 박스 */}
          <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
            <p className="font-medium mb-2">⚠️ 로컬 개발 환경</p>
            <p>이 로그인은 로컬 개발 테스트용입니다. 프로덕션 환경에서는 사용되지 않습니다.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
