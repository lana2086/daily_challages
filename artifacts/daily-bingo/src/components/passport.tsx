import { useState, forwardRef } from "react";
import HTMLFlipBook from "react-pageflip";

const PassportPage = forwardRef<
  HTMLDivElement,
  { children?: React.ReactNode; className?: string }
>(({ children, className = "" }, ref) => {
  return (
    <div ref={ref} className={`passport-page ${className}`}>
      {children}
    </div>
  );
});
PassportPage.displayName = "PassportPage";

export default function Passport() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="mt-10">
      <h2 className="text-3xl font-serif font-bold mb-6">📖 Passport</h2>
      <div className="flex justify-center">
        {!isOpen ? (
          <div className="passport-cover">
            <div className="passport-inner">
              <h2>جواز العبور</h2>

              <p>الدخول إلى جبل صهيون</p>

              <div className="passport-cross">✝</div>

              <button
                onClick={() => setIsOpen(true)}
                className="mt-8 rounded-xl bg-amber-700 text-white px-6 py-3"
              >
                Open Passport
              </button>
            </div>
          </div>
        ) : (
          <HTMLFlipBook
            width={400}
            height={550}
            size="stretch"
            minWidth={315}
            maxWidth={600}
            minHeight={420}
            maxHeight={800}
            maxShadowOpacity={0.5}
            showCover={true}
            mobileScrollSupport={true}
            className="passport-book"
            style={{}}
            startPage={0}
            drawShadow={true}
            flippingTime={700}
            usePortrait={true}
            startZIndex={0}
            autoSize={true}
            clickEventForward={true}
            useMouseEvents={true}
            swipeDistance={30}
            showPageCorners={true}
            disableFlipByClick={false}
          >
            {/* الصفحة الأولى */}
            <PassportPage>
              <h1>اسم المهمة</h1>

              <p>الجولة 1 ____________ الجولة 2 ____________</p>

              <textarea className="passport-textarea" placeholder="..." />

              <div className="mt-6">
                <h3 className="text-xl font-bold mb-2 text-center">الاقتلاع</h3>

                <textarea
                  className="passport-textarea"
                  placeholder="..."
                  rows={5}
                />
              </div>
            </PassportPage>

            {/* الصفحة الثانية */}
            <PassportPage>
              <h1>اسم المهمة</h1>

              <p>الجولة 1 ____________ الجولة 2 ____________</p>

              <textarea className="passport-textarea" placeholder="..." />

              <div className="mt-6">
                <h3 className="text-xl font-bold mb-2 text-center">الاقتلاع</h3>

                <textarea
                  className="passport-textarea"
                  placeholder="..."
                  rows={5}
                />
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="mt-6 rounded-xl bg-amber-700 text-white px-6 py-3"
              >
                Close Passport
              </button>
            </PassportPage>
          </HTMLFlipBook>
        )}
      </div>
    </section>
  );
}
