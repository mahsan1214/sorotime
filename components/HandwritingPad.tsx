"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

export type HandwritingPadHandle = {
  clear: () => void;
};

type HandwritingPadProps = {
  disabled?: boolean;
  onRecognized: (value: string) => void;
};

function setupCanvas(canvas: HTMLCanvasElement) {
  const parent = canvas.parentElement;
  if (!parent) return;

  const dpr = window.devicePixelRatio || 1;
  const width = parent.clientWidth;
  const height = 280;

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#111827";
  ctx.lineWidth = 14;
}

function clearCanvasElement(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const width = canvas.clientWidth;
  const height = canvas.clientHeight;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#111827";
  ctx.lineWidth = 14;
}

function findBoundingBox(
  imageData: ImageData,
  width: number,
  height: number
): { minX: number; minY: number; maxX: number; maxY: number } | null {
  const data = imageData.data;

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];

      const isDark = r < 245 || g < 245 || b < 245;

      if (isDark) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX === -1 || maxY === -1) return null;

  return { minX, minY, maxX, maxY };
}

function createProcessedImage(canvas: HTMLCanvasElement): string | null {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const sourceData = ctx.getImageData(0, 0, width, height);
  const box = findBoundingBox(sourceData, width, height);
  if (!box) return null;

  const padding = 24;
  const cropX = Math.max(0, box.minX - padding);
  const cropY = Math.max(0, box.minY - padding);
  const cropW = Math.min(width - cropX, box.maxX - box.minX + padding * 2);
  const cropH = Math.min(height - cropY, box.maxY - box.minY + padding * 2);

  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = cropW;
  tempCanvas.height = cropH;
  const tempCtx = tempCanvas.getContext("2d");
  if (!tempCtx) return null;

  tempCtx.fillStyle = "#ffffff";
  tempCtx.fillRect(0, 0, cropW, cropH);
  tempCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

  const scale = 4;
  const finalCanvas = document.createElement("canvas");
  finalCanvas.width = cropW * scale;
  finalCanvas.height = cropH * scale;
  const finalCtx = finalCanvas.getContext("2d");
  if (!finalCtx) return null;

  finalCtx.fillStyle = "#ffffff";
  finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
  finalCtx.imageSmoothingEnabled = false;
  finalCtx.drawImage(
    tempCanvas,
    0,
    0,
    cropW,
    cropH,
    0,
    0,
    finalCanvas.width,
    finalCanvas.height
  );

  const processed = finalCtx.getImageData(
    0,
    0,
    finalCanvas.width,
    finalCanvas.height
  );
  const data = processed.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    const value = gray < 210 ? 0 : 255;

    data[i] = value;
    data[i + 1] = value;
    data[i + 2] = value;
    data[i + 3] = 255;
  }

  finalCtx.putImageData(processed, 0, 0);

  return finalCanvas.toDataURL("image/png");
}

const HandwritingPad = forwardRef<HandwritingPadHandle, HandwritingPadProps>(
  function HandwritingPad({ disabled = false, onRecognized }, ref) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const isDrawingRef = useRef(false);
    const hasInkRef = useRef(false);

    const [isRecognizing, setIsRecognizing] = useState(false);
    const [statusText, setStatusText] = useState(
      "数字を大きく書いて「読み取る」を押してください"
    );

    const clearCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      clearCanvasElement(canvas);
      hasInkRef.current = false;
      setStatusText("数字を大きく書いて「読み取る」を押してください");
      onRecognized("");
    };

    useImperativeHandle(ref, () => ({
      clear: clearCanvas,
    }));

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      setupCanvas(canvas);

      const handleResize = () => {
        const oldCanvas = canvasRef.current;
        if (!oldCanvas) return;
        setupCanvas(oldCanvas);
        hasInkRef.current = false;
      };

      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, []);

    const getPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };

      const rect = canvas.getBoundingClientRect();
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
    };

    const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
      if (disabled) return;

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;

      const { x, y } = getPoint(event);

      isDrawingRef.current = true;
      hasInkRef.current = true;

      canvas.setPointerCapture(event.pointerId);
      ctx.beginPath();
      ctx.moveTo(x, y);
    };

    const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
      if (disabled || !isDrawingRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;

      const { x, y } = getPoint(event);
      ctx.lineTo(x, y);
      ctx.stroke();
    };

    const endDrawing = () => {
      isDrawingRef.current = false;
    };

    const recognizeWithPSM = async (
      image: string,
      psm: number
    ): Promise<string> => {
      const { default: Tesseract } = await import("tesseract.js");

      const result = await Tesseract.recognize(image, "eng", {
        tessedit_char_whitelist: "0123456789",
        tessedit_pageseg_mode: String(psm),
        user_defined_dpi: "300",
        preserve_interword_spaces: "1",
      });

      return (result.data.text || "").replace(/[^0-9]/g, "");
    };

    const recognizeText = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      if (!hasInkRef.current) {
        setStatusText("まだ数字が書かれていません");
        onRecognized("");
        return;
      }

      try {
        setIsRecognizing(true);
        setStatusText("読み取り中…");

        const processedImage = createProcessedImage(canvas);
        if (!processedImage) {
          setStatusText("数字が見つかりませんでした");
          onRecognized("");
          return;
        }

        let onlyNumbers = await recognizeWithPSM(processedImage, 7);

        if (!onlyNumbers) {
          onlyNumbers = await recognizeWithPSM(processedImage, 6);
        }

        if (!onlyNumbers) {
          onlyNumbers = await recognizeWithPSM(processedImage, 13);
        }

        if (onlyNumbers) {
          onRecognized(onlyNumbers);
          setStatusText(`読み取り結果: ${onlyNumbers}`);
        } else {
          onRecognized("");
          setStatusText(
            "数字をうまく読めませんでした。1行で大きく、はっきり書いてみてください"
          );
        }
      } catch (error) {
        console.error(error);
        setStatusText("読み取りに失敗しました");
      } finally {
        setIsRecognizing(false);
      }
    };

    return (
      <div className="rounded-3xl border-2 border-orange-200 bg-orange-50 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-sm font-bold text-slate-600">手書きエリア</p>
          <div className="flex gap-2">
            <button
              onClick={clearCanvas}
              disabled={disabled || isRecognizing}
              className="rounded-xl bg-slate-200 px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-300 disabled:opacity-50"
            >
              けす
            </button>
            <button
              onClick={recognizeText}
              disabled={disabled || isRecognizing}
              className="rounded-xl bg-sky-500 px-3 py-2 text-sm font-bold text-white transition hover:bg-sky-600 disabled:opacity-50"
            >
              {isRecognizing ? "読み取り中…" : "読み取る"}
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
          <canvas
            ref={canvasRef}
            className="block w-full touch-none bg-white"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={endDrawing}
            onPointerLeave={endDrawing}
            onPointerCancel={endDrawing}
          />
        </div>

        <p className="mt-3 text-sm leading-6 text-slate-500">{statusText}</p>
        <p className="mt-1 text-xs leading-5 text-slate-400">
          コツ: 1つの答えを横に大きく、つめすぎずに書くと読み取りやすくなります
        </p>
      </div>
    );
  }
);

export default HandwritingPad;
