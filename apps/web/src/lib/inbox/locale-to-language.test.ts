import { describe, it, expect } from "vitest";
import { mapLocaleToLanguage } from "./locale-to-language";

describe("mapLocaleToLanguage (CC-4)", () => {
  it("en_US/en_GB/en → 'en'", () => {
    expect(mapLocaleToLanguage("en_US")).toBe("en");
    expect(mapLocaleToLanguage("en_GB")).toBe("en");
    expect(mapLocaleToLanguage("en")).toBe("en");
  });

  it("ko_KR/ko → 'ko'", () => {
    expect(mapLocaleToLanguage("ko_KR")).toBe("ko");
    expect(mapLocaleToLanguage("ko")).toBe("ko");
  });

  it("zh_CN/zh_TW/zh → 'zh' (간/번체 통합)", () => {
    expect(mapLocaleToLanguage("zh_CN")).toBe("zh");
    expect(mapLocaleToLanguage("zh_TW")).toBe("zh");
    expect(mapLocaleToLanguage("zh")).toBe("zh");
  });

  it("ja_JP/ja → 'ja', vi_VN/vi → 'vi'", () => {
    expect(mapLocaleToLanguage("ja_JP")).toBe("ja");
    expect(mapLocaleToLanguage("ja")).toBe("ja");
    expect(mapLocaleToLanguage("vi_VN")).toBe("vi");
    expect(mapLocaleToLanguage("vi")).toBe("vi");
  });

  it("미지원 locale (fr_FR, de_DE 등) → null", () => {
    expect(mapLocaleToLanguage("fr_FR")).toBeNull();
    expect(mapLocaleToLanguage("de_DE")).toBeNull();
    expect(mapLocaleToLanguage("th_TH")).toBeNull();
  });

  it("null/empty/공백 → null", () => {
    expect(mapLocaleToLanguage(null)).toBeNull();
    expect(mapLocaleToLanguage("")).toBeNull();
    expect(mapLocaleToLanguage("   ")).toBeNull();
  });

  it("대소문자 혼용 EN_us → 'en' (case-insensitive prefix)", () => {
    expect(mapLocaleToLanguage("EN_us")).toBe("en");
    expect(mapLocaleToLanguage("Ko-kr")).toBe("ko");
  });
});
