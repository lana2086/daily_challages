import { useState, forwardRef } from "react";
import HTMLFlipBook from "react-pageflip";
import { motion } from "framer-motion";

const PAGE_W = 320;
const PAGE_H = 460;

const PassportLeaf = forwardRef<HTMLDivElement, { children?: React.ReactNode }>(
  ({ children }, ref) => (
    <div className="passport-leaf" ref={ref}>
      <div className="passport-leaf-inner">{children}</div>
    </div>
  ),
);
PassportLeaf.displayName = "PassportLeaf";

function PassportPageBody({ onClose }: { onClose?: () => void }) {
  return (
    <div className="passport-page-body">
      <div className="passport-page-head">
        <span className="passport-cross-mark">✝</span>
      </div>

      <div className="passport-field">
        <label className="passport-field-label">اسم المهمة</label>
        <div className="passport-write-line" />
      </div>

      <div className="passport-rounds">
        <div className="passport-field">
          <label className="passport-field-label">الجولة 1</label>
          <div className="passport-write-line" />
        </div>
        <div className="passport-field">
          <label className="passport-field-label">الجولة 2</label>
          <div className="passport-write-line" />
        </div>
      </div>

      <div className="passport-field passport-field-grow">
        <textarea
          className="passport-textarea"
          placeholder="اكتب تأملاتك هنا…"
          aria-label="تأمل"
        />
      </div>

      <div className="passport-section-divider">
        <span>الاقتلاع</span>
      </div>

      <div className="passport-field passport-field-grow">
        <textarea
          className="passport-textarea"
          placeholder="اكتب هنا…"
          aria-label="الاقتلاع"
        />
      </div>

      {onClose && (
        <button className="passport-close-btn" onClick={onClose}>
          إغلاق الجواز
        </button>
      )}
    </div>
  );
}

export default function Passport() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="passport-card">
      <div className="passport-card-strip" />

      <div className="passport-card-head">
        <div className="passport-card-icon">📖</div>
        <div>
          <h2 className="passport-card-title">جواز العبور</h2>
          <p className="passport-card-subtitle">Your journey passport</p>
        </div>
      </div>

      <div className="passport-stage">
        {!isOpen ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="passport-cover"
          >
            <div className="passport-cover-frame" />
            <div className="passport-cover-content">
              <h3 className="passport-cover-title">جواز العبور</h3>
              <div className="passport-cover-cross">✝</div>
              <p className="passport-cover-subtitle">الدخول إلى جبل صهيون</p>
              <button
                className="passport-open-btn"
                onClick={() => setIsOpen(true)}
              >
                Open Passport
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="passport-book-wrap"
          >
            <HTMLFlipBook
              width={PAGE_W}
              height={PAGE_H}
              size="stretch"
              minWidth={270}
              maxWidth={PAGE_W}
              minHeight={390}
              maxHeight={PAGE_H}
              maxShadowOpacity={0.5}
              showCover={false}
              mobileScrollSupport={true}
              className="passport-flipbook"
              style={{}}
              startPage={0}
              drawShadow={true}
              flippingTime={650}
              usePortrait={true}
              startZIndex={0}
              autoSize={false}
              clickEventForward={true}
              useMouseEvents={true}
              swipeDistance={30}
              showPageCorners={true}
              disableFlipByClick={false}
            >
              <PassportLeaf>
                <PassportPageBody />
              </PassportLeaf>
              <PassportLeaf>
                <PassportPageBody onClose={() => setIsOpen(false)} />
              </PassportLeaf>
            </HTMLFlipBook>

            <p className="passport-flip-hint">اسحب الصفحة للتقليب</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
