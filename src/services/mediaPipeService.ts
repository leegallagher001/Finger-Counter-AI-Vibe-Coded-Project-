import { FilesetResolver, HandLandmarker, DrawingUtils } from "@mediapipe/tasks-vision";

export class HandDetectionService {
  private landmarker: HandLandmarker | null = null;
  private drawingUtils: DrawingUtils | null = null;

  async initialize() {
    if (this.landmarker) return;

    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
    );

    this.landmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
        delegate: "GPU"
      },
      runningMode: "VIDEO",
      numHands: 4,
      minHandDetectionConfidence: 0.5,
      minHandPresenceConfidence: 0.5,
      minTrackingConfidence: 0.5
    });
  }

  detect(video: HTMLVideoElement, startTimeMs: number) {
    if (!this.landmarker) return null;
    return this.landmarker.detectForVideo(video, startTimeMs);
  }

  countFingers(landmarks: any[]): number {
    // landmarks: [wrist, thumb_cmc, thumb_mcp, thumb_ip, thumb_tip, index_mcp, ... ]
    // Tips indices: 4, 8, 12, 16, 20
    // PIP/MCP indices to compare against

    const dist = (p1: any, p2: any) => Math.sqrt((p1.x - p2.x)**2 + (p1.y - p2.y)**2);
    
    let count = 0;
    const wrist = landmarks[0];

    // --- THUMB (4) ---
    // The thumb is unique. We check two things:
    // 1. Is it extended laterally away from the hand? (Compare to Pinky Base/MCP 17)
    // 2. Is it NOT tucked against the Index finger? (Compare to Index Base/MCP 5)
    const tip4 = landmarks[4];
    const ip3 = landmarks[3];
    const mcp17 = landmarks[17]; 
    const mcp5 = landmarks[5];

    // Standard "Thumbs Up" / "Open" check: Tip is farther out than IP joint relative to the other side of hand
    const isThumbLaterallyOut = dist(tip4, mcp17) > dist(ip3, mcp17);
    
    // Tucked check: If tip is closer to index base than IP is, it's likely tucked
    const isThumbNotTucked = dist(tip4, mcp5) > dist(ip3, mcp5);

    if (isThumbLaterallyOut && isThumbNotTucked) {
        count++;
    }

    // --- FINGERS (Index, Middle, Ring, Pinky) ---
    const fingerIndices = [
      { tip: 8, pip: 6, mcp: 5 },   // Index
      { tip: 12, pip: 10, mcp: 9 }, // Middle
      { tip: 16, pip: 14, mcp: 13 }, // Ring
      { tip: 20, pip: 18, mcp: 17 }  // Pinky
    ];

    fingerIndices.forEach(f => {
      const tip = landmarks[f.tip];
      const pip = landmarks[f.pip];
      const mcp = landmarks[f.mcp];

      // 1. Global Extension: Is the tip farther from the wrist than the middle joint (PIP)?
      const isFarFromWrist = dist(tip, wrist) > dist(pip, wrist);
      
      // 2. Local Extension: Is the tip farther from the finger base (MCP) than the middle joint (PIP)?
      // This helps filter out cases where the finger is bent but the hand orientation makes the wrist distance ambiguous.
      const isFarFromMCP = dist(tip, mcp) > dist(pip, mcp);

      if (isFarFromWrist && isFarFromMCP) {
        count++;
      }
    });

    return count;
  }

  drawResults(ctx: CanvasRenderingContext2D, result: any) {
    ctx.save();
    // Note: Canvas clearing is handled by the caller (WebcamView)
    
    if (result.landmarks) {
      for (const landmarks of result.landmarks) {
        // Simple skeleton draw:
        this.drawConnections(ctx, landmarks);
        this.drawLandmarks(ctx, landmarks);
      }
    }
    ctx.restore();
  }

  // Updated signature to allow points with extra data (like timestamp)
  drawTrails(ctx: CanvasRenderingContext2D, trails: {x: number, y: number, [key: string]: any}[][]) {
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    trails.forEach(trail => {
      if (trail.length < 2) return;

      // Draw segments with increasing opacity to create a "comet" tail effect
      for (let i = 0; i < trail.length - 1; i++) {
        const point = trail[i];
        const nextPoint = trail[i + 1];
        
        // Distance check: If point jumped significantly (> 20% of screen), don't connect
        // This prevents drawing lines across the screen when a hand disappears and reappears
        const dist = Math.sqrt(Math.pow(nextPoint.x - point.x, 2) + Math.pow(nextPoint.y - point.y, 2));
        if (dist > 0.2) {
          continue;
        }

        const alpha = (i / trail.length); // Older points (lower index) are more transparent
        
        ctx.beginPath();
        ctx.moveTo(point.x * ctx.canvas.width, point.y * ctx.canvas.height);
        ctx.lineTo(nextPoint.x * ctx.canvas.width, nextPoint.y * ctx.canvas.height);
        
        ctx.strokeStyle = `rgba(99, 102, 241, ${alpha})`; // Indigo-500 with alpha
        ctx.lineWidth = 8 * alpha; // Tail also gets thinner
        ctx.stroke();
      }
    });

    ctx.restore();
  }

  private drawConnections(ctx: CanvasRenderingContext2D, landmarks: any[]) {
    const connections = HandLandmarker.HAND_CONNECTIONS;
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#6366f1"; // Indigo-500
    
    for (const connection of connections) {
      const start = landmarks[connection.start];
      const end = landmarks[connection.end];
      
      ctx.beginPath();
      ctx.moveTo(start.x * ctx.canvas.width, start.y * ctx.canvas.height);
      ctx.lineTo(end.x * ctx.canvas.width, end.y * ctx.canvas.height);
      ctx.stroke();
    }
  }

  private drawLandmarks(ctx: CanvasRenderingContext2D, landmarks: any[]) {
    ctx.fillStyle = "#fbbf24"; // Amber-400
    for (const landmark of landmarks) {
      ctx.beginPath();
      ctx.arc(landmark.x * ctx.canvas.width, landmark.y * ctx.canvas.height, 4, 0, 2 * Math.PI);
      ctx.fill();
    }
  }
}

export const handDetectionService = new HandDetectionService();