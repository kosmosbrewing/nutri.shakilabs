import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: { xl: "960px" },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        status: {
          success: "hsl(var(--status-success))",
          warning: "hsl(var(--status-warning))",
          danger: "hsl(var(--status-danger))",
          info: "hsl(var(--status-info))",
        },
      },
      fontFamily: {
        sans: ["Pretendard", ...fontFamily.sans],
        brand: ["GmarketSans", "Pretendard", ...fontFamily.sans],
        // 강조 숫자 전용 스택(BL-020). 스택 자체는 brand와 같지만 이름을 나눠 둔다 —
        // house/card는 GmarketSans를 숫자 전용 45자 서브셋으로 줄였고, nutri는
        // 브랜드 폰트를 한글 제목 30여 곳에 쓰기 때문에 같은 축소를 할 수 없다.
        // 나중에 제목을 Pretendard로 옮기면 이 스택만 숫자 서브셋으로 갈아끼우면 된다.
        numeral: ["GmarketSans", "Pretendard", ...fontFamily.sans],
      },
      borderRadius: {
        xl: "calc(var(--radius) + 6px)",
        lg: "var(--radius)",
      },
      boxShadow: {
        lift: "0 16px 40px -28px hsl(var(--foreground) / 0.42)",
      },
    },
  },
  plugins: [],
} satisfies Config;
