import { useState, useCallback } from "react";
import { toast } from "sonner";

interface UseStyleGuideProps {
  projectId: string;
}

interface ColorSwatch {
  name: string;
  hexColor: string;
  description?: string;
}

interface TypographyStyle {
  name: string;
  fontFamily: string;
  fontSize: string;
  fontWeight: string;
  lineHeight: string;
  description?: string;
}

interface StyleGuideData {
  id: string;
  colors: ColorSwatch[];
  typography: TypographyStyle[];
  themeName?: string;
  themeDesc?: string;
}

export function useStyleGuide({ projectId }: UseStyleGuideProps) {
  const [styleGuide, setStyleGuide] = useState<StyleGuideData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [fetching, setFetching] = useState(true);

  const fetchStyleGuide = useCallback(async () => {
    try {
      const response = await fetch(`/api/project/${projectId}/generate-style`);
      if (!response.ok) throw new Error("Failed to fetch style guide");

      const data = await response.json();
      if (data.styleGuide) {
        setStyleGuide(data.styleGuide);
      }
    } catch (error) {
      console.error("Error fetching style guide:", error);
    } finally {
      setFetching(false);
    }
  }, [projectId]);

  const generateStyleGuide = async (onSuccess?: () => void) => {
    try {
      setIsGenerating(true);
      const response = await fetch(`/api/project/${projectId}/generate-style`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to start generation");
      }

      toast.success("AI is generating your style guide...");

      // Start polling for results
      const pollInterval = setInterval(async () => {
        const res = await fetch(`/api/project/${projectId}/generate-style`);
        const data = await res.json();

        if (data.styleGuide) {
          setStyleGuide(data.styleGuide);
          setIsGenerating(false);
          clearInterval(pollInterval);
          toast.success("Style guide generated!");
          if (onSuccess) onSuccess();
        }
      }, 2000);

      // Stop polling after 60 seconds (timeout)
      setTimeout(() => {
        clearInterval(pollInterval);
        setIsGenerating(false);
      }, 60000);
    } catch (error: any) {
      setIsGenerating(false);
      toast.error(error.message);
    }
  };

  return {
    styleGuide,
    isGenerating,
    fetching,
    fetchStyleGuide,
    generateStyleGuide,
  };
}
