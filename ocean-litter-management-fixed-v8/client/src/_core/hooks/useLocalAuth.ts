import { useEffect, useState } from "react";

export interface LocalUser {
  id: string;
  openId: string;
  name: string;
  email: string;
  role: "admin" | "user";
  loginMethod: string;
  createdAt: string;
}

/**
 * 로컬 개발 환경에서의 인증 상태 관리
 * 프로덕션 환경에서는 useAuth 훅 사용
 */
export function useLocalAuth() {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLocalMode, setIsLocalMode] = useState(false);

  useEffect(() => {
    // 로컬 모드 감지 (localhost 또는 127.0.0.1)
    const isLocal =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname.startsWith("192.168");

    setIsLocalMode(isLocal);

    // 로컬 스토리지에서 사용자 정보 로드
    if (isLocal) {
      const storedUser = localStorage.getItem("local_user");
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (error) {
          console.error("Failed to parse local user:", error);
        }
      }
    }

    setLoading(false);
  }, []);

  const logout = () => {
    localStorage.removeItem("local_user");
    localStorage.removeItem("local_session");
    setUser(null);
  };

  return {
    user,
    loading,
    isLocalMode,
    logout,
  };
}
