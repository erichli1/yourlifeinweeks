import * as React from "react";

import { cn } from "@/lib/utils";

const useAutoResizeTextarea = (
  ref: React.ForwardedRef<HTMLTextAreaElement>,
  value?: React.TextareaHTMLAttributes<HTMLTextAreaElement>["value"]
) => {
  const textAreaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useImperativeHandle(ref, () => textAreaRef.current!);

  const updateTextareaHeight = React.useCallback(() => {
    const ref = textAreaRef?.current;
    if (ref) {
      ref.style.height = "auto";
      ref.style.height = ref.scrollHeight + "px";
    }
  }, []);

  // Run on value changes
  React.useEffect(() => {
    updateTextareaHeight();
  }, [value, updateTextareaHeight]);

  React.useEffect(() => {
    const ref = textAreaRef?.current;
    ref?.addEventListener("input", updateTextareaHeight);

    return () => {
      ref?.removeEventListener("input", updateTextareaHeight);
    };
  }, [updateTextareaHeight]);

  return { textAreaRef };
};

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  autoSize?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, autoSize, value, ...props }, ref) => {
    const { textAreaRef } = useAutoResizeTextarea(ref, value);

    return (
      <textarea
        className={cn(
          "flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={autoSize ? textAreaRef : ref}
        value={value}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
