import { TextShape } from "@/redux/slices/shapes";
import { useDispatch } from "react-redux";
import { updateShape, removeShape } from "@/redux/slices/shapes";
import { useState, useRef, useEffect } from "react";

interface TextProps {
  shape: TextShape;
  isSelected?: boolean;
}

export const Text = ({ shape, isSelected }: TextProps) => {
  const dispatch = useDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [tempText, setTempText] = useState(shape.text);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (shape.text === "Type here...") {
      setIsEditing(true);
      setTempText("");
    }
  }, []);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    if (!isEditing) {
      setTempText(shape.text);
    }
  }, [shape.text, isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    const newText = tempText.trim();

    if (newText === "") {
      dispatch(removeShape(shape.id));
    } else if (newText !== shape.text) {
      dispatch(
        updateShape({
          id: shape.id,
          patch: { text: newText },
        })
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation(); // Prevent canvas from receiving keys while editing
    if (e.key === "Enter") {
      handleBlur();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setTempText(shape.text);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setTempText(shape.text === "Type here..." ? "" : shape.text);
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        className="absolute pointer-events-auto bg-zinc-900/80 border border-blue-400 outline-none text-white rounded px-2 py-1"
        style={{
          left: shape.x,
          top: shape.y,
          fontSize: shape.fontSize,
          fontFamily: shape.fontFamily,
          fontWeight: shape.fontWeight,
          color: "#ffffff",
          minWidth: "120px",
        }}
        value={tempText}
        onChange={(e) => setTempText(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onPointerDown={(e) => e.stopPropagation()}
        placeholder="Type here..."
        autoComplete="off"
      />
    );
  }

  return (
    <div
      className="absolute pointer-events-none select-none"
      style={{
        left: shape.x,
        top: shape.y,
        fontSize: shape.fontSize,
        fontFamily: shape.fontFamily,
        fontWeight: shape.fontWeight,
        color: "#ffffff",
        whiteSpace: "nowrap",
        padding: "4px 8px",
        border: isSelected ? "2px solid #3b82f6" : "1px solid transparent",
        borderRadius: "4px",
        background: isSelected ? "rgba(59, 130, 246, 0.1)" : "transparent",
      }}
    >
      {shape.text === "Type here..." ? (
        <span className="opacity-50 italic">Type here...</span>
      ) : (
        shape.text
      )}
    </div>
  );
};
