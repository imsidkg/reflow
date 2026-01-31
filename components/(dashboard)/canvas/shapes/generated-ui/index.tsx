import { GeneratedUIShape } from "@/redux/slices/shapes";
import DOMPurify from "isomorphic-dompurify";

export const GeneratedUI = ({ shape }: { shape: GeneratedUIShape }) => {
  if (!shape.uiSpecData) return null;

  return (
    <>
      <div
        className="absolute overflow-hidden bg-white shadow-xl"
        style={{
          left: shape.x,
          top: shape.y,
          width: shape.w,
          height: shape.h,
          borderRadius: "12px",
          // Ideally, we'd use a shadow root or iframe for full isolation,
          // but for now, we'll scoped inline styles or just render raw HTML.
          // Since Tailwind v4 generates utility classes, they should work if the CSS is loaded globally.
          // However, to ensure isolation, an iframe is safer, but complex to manage with data URI.
        }}
      >
        <div
          className="w-full h-full overflow-auto"
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(shape.uiSpecData),
          }}
        />

        {/* Helper overlay to indicate it's generated */}
        <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 backdrop-blur-md rounded text-[10px] text-white font-medium z-10 pointer-events-none">
          AI Generated
        </div>
      </div>
    </>
  );
};
