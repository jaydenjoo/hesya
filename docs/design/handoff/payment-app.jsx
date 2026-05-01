/* global React */
const { useState: useStateP } = React;
const IconP = window.__hesyaIcons;

const METHODS = [
  {
    id: "card",
    label: "Card",
    sub: "Visa · Master · Amex",
    emoji: "💳",
    brand: "#1A2238",
  },
  {
    id: "alipay",
    label: "Alipay+",
    sub: "支付宝",
    emoji: "🟦",
    brand: "#1677FF",
    suggested: true,
  },
  {
    id: "wechat",
    label: "WeChat Pay",
    sub: "微信支付",
    emoji: "💚",
    brand: "#07C160",
  },
  {
    id: "linepay",
    label: "LINE Pay",
    sub: "ライン",
    emoji: "💚",
    brand: "#06C755",
  },
  {
    id: "paypay",
    label: "PayPay",
    sub: "ペイペイ",
    emoji: "🟥",
    brand: "#FF0033",
  },
  {
    id: "unionpay",
    label: "UnionPay",
    sub: "银联",
    emoji: "💛",
    brand: "#E21836",
  },
  {
    id: "applepay",
    label: "Apple Pay",
    sub: "Touch / Face ID",
    emoji: "",
    brand: "#000000",
  },
  {
    id: "googlepay",
    label: "Google Pay",
    sub: "G Pay",
    emoji: "",
    brand: "#4285F4",
  },
];

function CardForm() {
  const [num, setNum] = useStateP("");
  const formatted = num
    .replace(/\s/g, "")
    .replace(/(\d{4})/g, "$1 ")
    .trim()
    .slice(0, 19);
  const detect = num.startsWith("4")
    ? "VISA"
    : num.startsWith("5")
      ? "MC"
      : num.startsWith("3")
        ? "AMEX"
        : "";
  return (
    <div className="card-form">
      <label className="pf-label">Card number</label>
      <div className="pf-input">
        <input
          value={formatted}
          onChange={(e) => setNum(e.target.value)}
          placeholder="1234 5678 9012 3456"
          inputMode="numeric"
        />
        {detect && <span className="brand-tag">{detect}</span>}
      </div>
      <div className="pf-row">
        <div className="pf-half">
          <label className="pf-label">Expiry</label>
          <div className="pf-input">
            <input placeholder="MM / YY" inputMode="numeric" />
          </div>
        </div>
        <div className="pf-half">
          <label className="pf-label">CVC</label>
          <div className="pf-input">
            <input placeholder="•••" inputMode="numeric" />
          </div>
        </div>
      </div>
      <label className="pf-toggle">
        <span className="t-track">
          <span className="t-dot" />
        </span>
        <div>
          <div className="t-title">Save securely for next time</div>
          <div className="t-sub">Encrypted · we never see full card</div>
        </div>
      </label>
      <a className="disclosure">Billing address differs? →</a>
    </div>
  );
}

function QRPanel({ method }) {
  const isWechat = method === "wechat";
  return (
    <div className="qr-panel">
      <div className="qr-illustration">
        <div className="qr-grid-mini">
          {Array.from({ length: 100 }).map((_, i) => {
            const s = Math.sin(i * 4.7) * 100;
            const r = s - Math.floor(s);
            return <span key={i} style={{ opacity: r > 0.5 ? 1 : 0 }} />;
          })}
        </div>
        <div className="qr-pending">
          QR will appear
          <br />
          after confirm
        </div>
      </div>
      <div className="qr-instr">
        <div className="qr-step">
          <b>1.</b> Tap "Pay" below
        </div>
        <div className="qr-step">
          <b>2.</b> Open {method === "alipay" ? "Alipay" : "WeChat"} on your
          phone
        </div>
        <div className="qr-step">
          <b>3.</b> Scan the QR · 扫码 · スキャン
        </div>
      </div>
      {isWechat && (
        <div className="wechat-disclosure">
          💡 WeChat Pay limits ¥6,000 per transaction. We'll split automatically
          if needed — you'll see two QR codes.
        </div>
      )}
    </div>
  );
}

function DeeplinkPanel({ method }) {
  return (
    <div className="deeplink-panel">
      <button
        className="deeplink-btn"
        style={{ background: METHODS.find((m) => m.id === method).brand }}
      >
        Open {METHODS.find((m) => m.id === method).label}
      </button>
      <div className="deeplink-or">— or scan QR —</div>
      <div className="qr-illustration small">
        <div className="qr-grid-mini">
          {Array.from({ length: 64 }).map((_, i) => {
            const s = Math.sin(i * 3.1) * 100;
            const r = s - Math.floor(s);
            return <span key={i} style={{ opacity: r > 0.5 ? 1 : 0 }} />;
          })}
        </div>
      </div>
    </div>
  );
}

function NativeWalletPanel({ method }) {
  const isApple = method === "applepay";
  return (
    <div className="wallet-panel">
      <button className={`wallet-btn ${method}`}>
        {isApple ? "" : "G"} Pay with {isApple ? "Apple Pay" : "Google Pay"}
      </button>
      <div className="wallet-hint">
        {isApple ? "Confirm with Face ID or Touch ID" : "Confirm in Google Pay"}
      </div>
    </div>
  );
}

function Payment() {
  const [method, setMethod] = useStateP("alipay");

  let panel;
  if (method === "card") panel = <CardForm />;
  else if (method === "alipay" || method === "wechat")
    panel = <QRPanel method={method} />;
  else if (method === "linepay" || method === "paypay" || method === "unionpay")
    panel = <DeeplinkPanel method={method} />;
  else panel = <NativeWalletPanel method={method} />;

  return (
    <div className="pay-stage">
      <div className="iphone-pay">
        <div className="notch" />
        <div className="scroll-pay">
          {/* Top */}
          <div className="pay-top">
            <div className="back-btn">
              <IconP.chevR size={18} style={{ transform: "rotate(180deg)" }} />
            </div>
            <h1 className="pay-title">
              Almost <em>there.</em>
            </h1>
            <div className="pay-spacer" />
          </div>

          {/* Progress */}
          <div className="progress-strip">
            <div className="step done">
              <span className="dot" />
              <span className="lab">Schedule</span>
            </div>
            <div className="link done" />
            <div className="step done">
              <span className="dot" />
              <span className="lab">Stylist</span>
            </div>
            <div className="link done" />
            <div className="step done">
              <span className="dot" />
              <span className="lab">Confirm</span>
            </div>
            <div className="link done" />
            <div className="step active">
              <span className="dot" />
              <span className="lab">Pay</span>
            </div>
          </div>

          {/* Order summary — prominent */}
          <div className="order-sum">
            <div className="os-head">
              <div className="os-thumb">
                <span className="os-emoji">✂️</span>
              </div>
              <div className="os-meta">
                <div className="os-svc">Korean Layered Cut + Treatment</div>
                <div className="os-when">
                  Wed 15 Apr · 14:00 · Minji Kim 박민지
                </div>
              </div>
            </div>
            <div className="os-lines">
              <div className="os-line">
                <span>Subtotal</span>
                <b>₩85,000</b>
              </div>
              <div className="os-line">
                <span>Deposit due now</span>
                <b className="emph">₩25,500</b>
              </div>
              <div className="os-line minor">
                <span>Remaining at salon</span>
                <span>₩59,500</span>
              </div>
            </div>
            <div className="os-divider" />
            <div className="os-total">
              <div className="os-total-lab">Total today</div>
              <div className="os-total-val">
                ₩25,500
                <div className="os-conv">≈ ¥2,595 / $19.10 / ¥185.20</div>
              </div>
            </div>
          </div>

          {/* Payment methods */}
          <div className="section-block">
            <div className="block-title-h">How would you like to pay?</div>
            <div className="method-scroll">
              {METHODS.map((m) => (
                <div
                  key={m.id}
                  className={`method-tile${method === m.id ? " active" : ""}${m.suggested ? " suggested" : ""}`}
                  onClick={() => setMethod(m.id)}
                  style={method === m.id ? { borderColor: m.brand } : {}}
                >
                  {m.suggested && <span className="sugg-pip">Suggested</span>}
                  <div
                    className="m-icon"
                    style={{ background: m.brand + "15", color: m.brand }}
                  >
                    {m.id === "card" && <IconP.card size={22} />}
                    {m.id === "applepay" && <span className="ap"></span>}
                    {m.id === "googlepay" && <span className="gp">G</span>}
                    {!["card", "applepay", "googlepay"].includes(m.id) && (
                      <span className="big-em">{m.emoji}</span>
                    )}
                  </div>
                  <div className="m-label">{m.label}</div>
                  <div className="m-sub">{m.sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Method-specific panel */}
          <div className="method-panel" key={method}>
            {panel}
          </div>

          {/* Trust row */}
          <div className="trust-row">
            <span className="trust-pill">🔒 256-bit SSL</span>
            <span className="trust-pill">💳 PCI DSS</span>
            <span className="trust-pill">↩️ 24-hr free cancel</span>
            <span className="trust-pill">🛡️ Hesya guarantees</span>
          </div>

          {/* Foreign-friendly details */}
          <div className="ff-details">
            <div className="ff-card">
              <span className="ff-ico">🧾</span>
              <div>
                <div className="ff-title">VAT refund eligible</div>
                <div className="ff-body">
                  We'll email your receipt — claim at the airport before
                  departure.
                </div>
              </div>
            </div>
            <div className="ff-card alt">
              <span className="ff-ico">💬</span>
              <div>
                <div className="ff-title">Stuck? Chat with us</div>
                <div className="ff-body">
                  English · 日本語 · 中文 · Tiếng Việt — under 60 seconds
                </div>
              </div>
              <span className="ff-arrow">→</span>
            </div>
          </div>
        </div>

        {/* Sticky bottom */}
        <div className="pay-sticky">
          <button className="pay-cta">
            Pay ₩25,500 <span className="alt">· ≈ ¥2,595</span>
          </button>
          <div className="pay-terms">
            By paying, you agree to Hesya's <a>Terms</a> & <a>Cancellation</a>.
          </div>
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Payment />);
