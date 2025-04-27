import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eraser, Trash2, Palette } from "lucide-react";

export default function ZenDrawing() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#4f46e5"); // Default color
  const [lineWidth, setLineWidth] = useState(5);
  const [lastX, setLastX] = useState(0);
  const [lastY, setLastY] = useState(0);
  
  const colors = [
    "#4f46e5", // Indigo
    "#ec4899", // Pink
    "#14b8a6", // Teal
    "#f59e0b", // Amber
    "#10b981", // Emerald
    "#8b5cf6", // Violet
    "#ef4444", // Red
    "#3b82f6", // Blue
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    
    if (ctx) {
      // Set the background initially
      ctx.fillStyle = "#f8fafc"; // Light
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        ctx.fillStyle = "#1e293b"; // Dark
      }
      ctx.fillRect(0, 0, canvas!.width, canvas!.height);
    }
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    
    const canvas = canvasRef.current;
    const rect = canvas!.getBoundingClientRect();
    
    let clientX, clientY;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    setLastX(x);
    setLastY(y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const rect = canvas!.getBoundingClientRect();
    
    let clientX, clientY;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
      e.preventDefault(); // Prevent scrolling when drawing
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    if (ctx) {
      ctx.strokeStyle = color;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.lineWidth = lineWidth;
      
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    
    setLastX(x);
    setLastY(y);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    
    if (ctx) {
      // Set background based on theme
      ctx.fillStyle = "#f8fafc"; // Light
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        ctx.fillStyle = "#1e293b"; // Dark
      }
      ctx.fillRect(0, 0, canvas!.width, canvas!.height);
    }
  };

  const switchToEraser = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    
    if (ctx) {
      // Set background as eraser color
      setColor(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? "#1e293b" // Dark theme
        : "#f8fafc" // Light theme
      );
      setLineWidth(20); // Thicker eraser
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl">Zen Drawing</CardTitle>
        <CardDescription>
          Express yourself through drawing to reduce stress
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border rounded-lg overflow-hidden">
          <canvas
            ref={canvasRef}
            width={400}
            height={280}
            className="w-full touch-none"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseOut={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            {colors.map((c) => (
              <button
                key={c}
                className={`w-6 h-6 rounded-full ${color === c ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-gray-600' : ''}`}
                style={{ backgroundColor: c }}
                onClick={() => {
                  setColor(c);
                  setLineWidth(5); // Reset to normal line width
                }}
              />
            ))}
          </div>
          
          <div className="space-x-2">
            <Button size="sm" variant="outline" onClick={switchToEraser}>
              <Eraser size={16} />
            </Button>
            <Button size="sm" variant="outline" onClick={clearCanvas}>
              <Trash2 size={16} />
            </Button>
          </div>
        </div>
        
        <div>
          <label className="text-sm font-medium block mb-2">Brush Size</label>
          <input
            type="range"
            min={1}
            max={30}
            value={lineWidth}
            onChange={(e) => setLineWidth(parseInt(e.target.value))}
            className="w-full"
          />
        </div>
      </CardContent>
    </Card>
  );
}