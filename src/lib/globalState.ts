/**
 * 전역 상태 변수
 * 챗봇 및 다른 컴포넌트에서 사용할 수 있는 전역 변수들
 */

import { supabase } from './supabase';

// 현재 사용자 이메일 (초기값: null)
export let currentUserEmail: string | null = null;

/**
 * currentUserEmail 값을 설정하는 함수
 * @param email - 설정할 이메일 주소 (null로 초기화 가능)
 */
export const setCurrentUserEmail = (email: string | null): void => {
  currentUserEmail = email;
};

/**
 * currentUserEmail 값을 가져오는 함수
 * @returns 현재 사용자 이메일 또는 null
 */
export const getCurrentUserEmail = (): string | null => {
  return currentUserEmail;
};

/**
 * 로그인 정보를 확인하고 currentUserEmail에 저장하는 함수
 * 확인 순서:
 * 1. localStorage에서 user 또는 userInfo 찾기
 * 2. sessionStorage에서 user 또는 userInfo 찾기
 * 3. Supabase Auth 세션에서 user.email 찾기
 */
export const checkLoginInfo = async (): Promise<void> => {
  let foundEmail: string | null = null;

  // 1. localStorage에서 user 또는 userInfo 찾기
  try {
    const localUser = localStorage.getItem('user');
    const localUserInfo = localStorage.getItem('userInfo');
    
    if (localUser) {
      try {
        const parsed = JSON.parse(localUser);
        if (parsed.email) {
          foundEmail = parsed.email;
        } else if (parsed.user?.email) {
          foundEmail = parsed.user.email;
        }
      } catch {
        // JSON 파싱 실패 시 무시
      }
    }
    
    if (!foundEmail && localUserInfo) {
      try {
        const parsed = JSON.parse(localUserInfo);
        if (parsed.email) {
          foundEmail = parsed.email;
        } else if (parsed.user?.email) {
          foundEmail = parsed.user.email;
        }
      } catch {
        // JSON 파싱 실패 시 무시
      }
    }
  } catch (error) {
    // localStorage 접근 실패 시 무시
  }

  // 2. sessionStorage에서 user 또는 userInfo 찾기
  if (!foundEmail) {
    try {
      const sessionUser = sessionStorage.getItem('user');
      const sessionUserInfo = sessionStorage.getItem('userInfo');
      
      if (sessionUser) {
        try {
          const parsed = JSON.parse(sessionUser);
          if (parsed.email) {
            foundEmail = parsed.email;
          } else if (parsed.user?.email) {
            foundEmail = parsed.user.email;
          }
        } catch {
          // JSON 파싱 실패 시 무시
        }
      }
      
      if (!foundEmail && sessionUserInfo) {
        try {
          const parsed = JSON.parse(sessionUserInfo);
          if (parsed.email) {
            foundEmail = parsed.email;
          } else if (parsed.user?.email) {
            foundEmail = parsed.user.email;
          }
        } catch {
          // JSON 파싱 실패 시 무시
        }
      }
    } catch (error) {
      // sessionStorage 접근 실패 시 무시
    }
  }

  // 3. Supabase Auth 세션에서 user.email 찾기
  if (!foundEmail) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        foundEmail = session.user.email;
      }
    } catch (error) {
      // Supabase 세션 확인 실패 시 무시
    }
  }

  // 이메일을 찾았으면 저장하고 출력, 못 찾으면 null로 유지하고 출력
  if (foundEmail) {
    setCurrentUserEmail(foundEmail);
    console.log(`로그인 이메일: ${foundEmail}`);
  } else {
    setCurrentUserEmail(null);
    console.log('로그인 정보 없음');
  }
};

