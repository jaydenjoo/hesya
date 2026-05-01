/* global React */
const { useState: useStateC, useRef: useRefC, useEffect: useEffectC } = React;
const IconC = window.__hesyaIcons;

const SEED_MESSAGES = [
  {
    from: "salon",
    time: "13:42",
    kr: "안녕하세요, 사쿠라님! 예약 확인됐어요. 오시는 길에 궁금한 거 있으시면 편하게 물어보세요 😊",
    tr: "Hi Sakura! Your booking is confirmed. Feel free to ask anything on the way 😊",
    confidence: "confident",
    lang: "ko→en",
  },
  {
    from: "salon",
    time: "13:42",
    kr: "혹시 원하시는 헤어 스타일 사진 있으시면 미리 보내주셔도 좋아요!",
    tr: "If you have a reference photo of the style you'd like, feel free to send it ahead!",
    confidence: "confident",
    lang: "ko→en",
  },
  {
    from: "user",
    time: "13:48",
    src: "Hi! Yes, I have one. Can the layered cut work for thin hair?",
    tr: "안녕하세요! 네, 한 장 있어요. 얇은 머리에도 레이어드 컷이 어울릴까요?",
    confidence: "confident",
    lang: "en→ko",
  },
  {
    from: "user",
    time: "13:48",
    type: "image",
    caption: "Reference photo",
    src: "Reference photo",
    tr: "참고 사진",
  },
  {
    from: "salon",
    time: "13:51",
    kr: "사진 너무 잘 어울리실 것 같아요! 얇은 머리에 풍성한 느낌 살리는 게 저희 강점이에요. 트리트먼트도 같이 하시는 거 추천드려요.",
    tr: "The photo will suit you so well! Adding volume to fine hair is our strength. I'd recommend the treatment alongside.",
    confidence: "ambiguous",
    note: "Verb tense ambiguous in Korean — original shown above.",
    lang: "ko→en",
  },
  {
    from: "salon",
    time: "13:52",
    type: "voice",
    duration: "0:12",
    transcript:
      "참, 매장 도착하시면 인박스로 한 번만 알려주세요. 입구를 못 찾으시는 분들이 가끔 계셔서요.",
    tr: "Oh, when you arrive please ping me on chat once — some guests have trouble finding the entrance.",
  },
];

function Bubble({ msg, onAudit }) {
  const isSalon = msg.from === "salon";

  if (msg.type === "image") {
    return (
      <div className={`bubble-row ${msg.from}`}>
        <div className={`bubble image ${msg.from}`}>
          <div className="img-thumb">
            <span className="img-emo">📸</span>
            <span className="img-cap">{msg.caption}</span>
          </div>
          <div className="bubble-tr">
            <span className="globe-tag">🌐</span>
            <span className="tr-text">{msg.tr}</span>
          </div>
        </div>
      </div>
    );
  }

  if (msg.type === "voice") {
    return (
      <div className={`bubble-row ${msg.from}`}>
        <div className={`bubble voice ${msg.from}`}>
          <div className="voice-row">
            <button className="play-btn">▶</button>
            <div className="waveform">
              {Array.from({ length: 22 }).map((_, i) => {
                const h = 4 + Math.abs(Math.sin(i * 0.7)) * 14;
                return <span key={i} style={{ height: h }} />;
              })}
            </div>
            <span className="duration">{msg.duration}</span>
          </div>
          <div className="bubble-tr">
            <span className="globe-tag">🌐</span>
            <span className="tr-text">
              <b>Auto-transcript:</b> {msg.transcript}
            </span>
            <span className="tr-text" style={{ marginTop: 4 }}>
              {msg.tr}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bubble-row ${msg.from}`}>
      <div className={`bubble ${msg.from}`}>
        <div className="bubble-orig">{isSalon ? msg.kr : msg.src}</div>
        <div className="bubble-tr">
          <span className="globe-tag" onClick={() => onAudit(msg)}>
            🌐
          </span>
          <span className="tr-text">{msg.tr}</span>
        </div>
      </div>
    </div>
  );
}

function Chat() {
  const [translateOn, setTranslateOn] = useStateC(true);
  const [draft, setDraft] = useStateC("");
  const [audit, setAudit] = useStateC(null);
  const [showEmpty, setShowEmpty] = useStateC(false);

  const messages = showEmpty ? [] : SEED_MESSAGES;

  return (
    <div className="chat-stage">
      <div className="iphone-chat">
        <div className="notch" />

        {/* Header */}
        <div className="chat-header">
          <div className="back-btn">
            <IconC.chevR size={18} style={{ transform: "rotate(180deg)" }} />
          </div>
          <div className="salon-avatar">
            <span>S</span>
            <span className="online-dot" />
          </div>
          <div className="salon-info">
            <div className="salon-name">Stylista — Hongdae</div>
            <div className="salon-status">
              <span className="status-dot" />
              <span>online · responds in ~3 min</span>
            </div>
          </div>
          <div
            className={`translate-toggle${translateOn ? " on" : ""}`}
            onClick={() => setTranslateOn(!translateOn)}
            title="Auto-translate"
          >
            <span className="globe">🌐</span>
            <span className="tt-state">{translateOn ? "ON" : "OFF"}</span>
          </div>
        </div>

        {/* Empty state OR message stream */}
        <div className="chat-stream">
          {messages.length === 0 ? (
            <div className="empty-state">
              <div className="empty-illust">
                <svg viewBox="0 0 200 140" fill="none">
                  <g
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  >
                    <path d="M30 50 Q30 30 50 30 L90 30 Q110 30 110 50 Q110 70 90 70 L70 70 L55 84 L60 70 L50 70 Q30 70 30 50z" />
                    <text
                      x="55"
                      y="55"
                      fontSize="14"
                      fontFamily="Fraunces"
                      fill="currentColor"
                      stroke="none"
                    >
                      안녕
                    </text>
                    <path d="M120 90 Q120 70 140 70 L180 70 Q200 70 200 90 Q200 110 180 110 L160 110 L145 124 L150 110 L140 110 Q120 110 120 90z" />
                    <text
                      x="140"
                      y="95"
                      fontSize="14"
                      fontFamily="Source Sans 3"
                      fill="currentColor"
                      stroke="none"
                    >
                      Hi!
                    </text>
                    <path d="M105 60 Q115 75 125 80" strokeDasharray="2 3" />
                  </g>
                </svg>
              </div>
              <div className="empty-cap">
                Say hello in any language.
                <br />
                <em>We'll do the rest.</em>
              </div>
              <div className="opener-pills">
                <span>Hi, I just booked!</span>
                <span>Can I bring a reference photo?</span>
                <span>Where is your salon?</span>
              </div>
              <a className="empty-restore" onClick={() => setShowEmpty(false)}>
                ← Show example conversation
              </a>
            </div>
          ) : (
            <>
              <div className="day-divider">Today · 4월 15일</div>
              {messages.slice(0, 2).map((m, i) => (
                <Bubble key={i} msg={m} onAudit={setAudit} />
              ))}
              <div className="time-stamp">13:48</div>
              {messages.slice(2, 4).map((m, i) => (
                <Bubble key={i + 100} msg={m} onAudit={setAudit} />
              ))}
              <div className="time-stamp">13:51</div>
              {messages.slice(4, 6).map((m, i) => (
                <Bubble key={i + 200} msg={m} onAudit={setAudit} />
              ))}
              {/* Typing indicator */}
              <div className="bubble-row salon">
                <div className="bubble salon typing">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
              <a
                className="empty-restore"
                onClick={() => setShowEmpty(true)}
                style={{ textAlign: "center", margin: "10px auto" }}
              >
                See empty state →
              </a>
            </>
          )}
        </div>

        {/* Composer */}
        <div className="composer-wrap">
          {draft.length > 0 && (
            <div className="ai-hint">
              <span className="spark">✨</span>
              <span>AI is helping you reply</span>
              <span className="hint-pill">"네, 곧 도착해요!"</span>
            </div>
          )}
          <div className="composer">
            <button className="comp-icon" aria-label="photo">
              <IconC.image size={20} />
            </button>
            <button className="comp-icon" aria-label="voice">
              🎙️
            </button>
            <input
              type="text"
              placeholder="Type in any language…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <button
              className={`send-btn${draft.length > 0 ? " active" : ""}`}
              aria-label="send"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m22 2-7 20-4-9-9-4z" />
                <path d="M22 2 11 13" />
              </svg>
            </button>
          </div>
        </div>

        {/* Audit sheet */}
        {audit && (
          <div className="audit-overlay" onClick={() => setAudit(null)}>
            <div className="audit-sheet" onClick={(e) => e.stopPropagation()}>
              <div className="audit-handle" />
              <div className="audit-title">Translation audit</div>
              <div className="audit-row">
                <div className="audit-label">
                  Original ({audit.lang.split("→")[0]})
                </div>
                <div className="audit-orig">{audit.kr || audit.src}</div>
              </div>
              <div className="audit-row">
                <div className="audit-label">
                  Translated ({audit.lang.split("→")[1]})
                </div>
                <div className="audit-tr">{audit.tr}</div>
              </div>
              <div className={`audit-conf ${audit.confidence}`}>
                {audit.confidence === "confident"
                  ? "✓ Confident translation"
                  : "△ " +
                    (audit.note || "Some ambiguity — original shown above.")}
              </div>
              <button className="audit-close" onClick={() => setAudit(null)}>
                Got it
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Chat />);
