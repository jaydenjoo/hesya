// `server-only` no-op stub — Next.js runtime은 client bundle import 시 throw하지만
// 단위 테스트는 server/client 구분 없는 jsdom 환경. 빈 export로 import 통과.
export {};
