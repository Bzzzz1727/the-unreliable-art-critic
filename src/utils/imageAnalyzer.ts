import { ImageAnalysisData } from '../types';

export async function analyzeImage(dataUrl: string): Promise<ImageAnalysisData> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const width = img.naturalWidth || img.width || 800;
      const height = img.naturalHeight || img.height || 600;
      const ratioVal = width / height;

      let aspectRatio = `${width} : ${height}`;
      if (Math.abs(ratioVal - 1) < 0.05) aspectRatio = '1:1 (Square)';
      else if (Math.abs(ratioVal - 1.414) < 0.1 || Math.abs(ratioVal - 0.707) < 0.1) aspectRatio = 'ISO 216 / A-Series';
      else if (Math.abs(ratioVal - 1.777) < 0.1) aspectRatio = '16:9 (Landscape)';
      else if (Math.abs(ratioVal - 0.5625) < 0.1) aspectRatio = '9:16 (Portrait)';
      else if (Math.abs(ratioVal - 1.5) < 0.1) aspectRatio = '3:2 (Classic 35mm)';
      else if (Math.abs(ratioVal - 0.666) < 0.1) aspectRatio = '2:3 (Portrait)';
      else if (Math.abs(ratioVal - 1.333) < 0.1) aspectRatio = '4:3 (Editorial)';
      else if (Math.abs(ratioVal - 0.75) < 0.1) aspectRatio = '3:4 (Editorial)';

      const isPortrait = height > width * 1.1;
      const isLandscape = width > height * 1.1;
      const isSquare = !isPortrait && !isLandscape;

      // Sample canvas pixels
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const sampleW = 80;
      const sampleH = Math.max(1, Math.round((sampleW / width) * height));
      canvas.width = sampleW;
      canvas.height = sampleH;

      let brightnessLevel: 'dark' | 'balanced' | 'bright' = 'balanced';
      let contrastLevel: 'subdued' | 'moderate' | 'extreme' = 'moderate';
      let estimatedComplexity: 'minimalist' | 'balanced' | 'dense' = 'balanced';
      let dominantColors: string[] = ['#111111', '#555555', '#999999', '#D71920'];
      let hasHighSaturation = false;
      let horizontalBalance: 'left-heavy' | 'centered' | 'right-heavy' = 'centered';
      let verticalBalance: 'top-heavy' | 'centered' | 'bottom-heavy' = 'centered';
      let edgeDensity: 'sparse-margins' | 'balanced-margins' | 'edge-crowded' = 'balanced-margins';

      if (ctx) {
        ctx.drawImage(img, 0, 0, sampleW, sampleH);
        const imgData = ctx.getImageData(0, 0, sampleW, sampleH).data;
        let totalLuminance = 0;
        let lumValues: number[] = [];
        const colorBuckets: { [key: string]: number } = {};
        let satSum = 0;

        let leftLum = 0, leftCount = 0;
        let rightLum = 0, rightCount = 0;
        let topLum = 0, topCount = 0;
        let bottomLum = 0, bottomCount = 0;
        let edgeActivity = 0, edgeCount = 0;

        const borderMarginX = Math.round(sampleW * 0.1);
        const borderMarginY = Math.round(sampleH * 0.1);

        for (let i = 0; i < imgData.length; i += 4) {
          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];
          const a = imgData[i + 3];

          if (a < 50) continue; // skip transparent

          const pixelIndex = i / 4;
          const px = pixelIndex % sampleW;
          const py = Math.floor(pixelIndex / sampleW);

          // Luminance formula
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          totalLuminance += lum;
          lumValues.push(lum);

          // Quadrant weights
          if (px < sampleW / 2) { leftLum += (255 - lum); leftCount++; }
          else { rightLum += (255 - lum); rightCount++; }

          if (py < sampleH / 2) { topLum += (255 - lum); topCount++; }
          else { bottomLum += (255 - lum); bottomCount++; }

          // Check margin edge density
          if (px < borderMarginX || px > sampleW - borderMarginX || py < borderMarginY || py > sampleH - borderMarginY) {
            edgeCount++;
            if (lum < 235 && lum > 20) edgeActivity++;
          }

          // Max - Min for saturation check
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const sat = max === 0 ? 0 : (max - min) / max;
          satSum += sat;

          // Quantize color to coarse bucket
          const qr = Math.round(r / 32) * 32;
          const qg = Math.round(g / 32) * 32;
          const qb = Math.round(b / 32) * 32;
          const hexKey = `#${((1 << 24) + (qr << 16) + (qg << 8) + qb).toString(16).slice(1).toUpperCase()}`;
          colorBuckets[hexKey] = (colorBuckets[hexKey] || 0) + 1;
        }

        const validPixels = lumValues.length || 1;
        const avgLum = totalLuminance / validPixels;
        if (avgLum < 75) brightnessLevel = 'dark';
        else if (avgLum > 175) brightnessLevel = 'bright';
        else brightnessLevel = 'balanced';

        // Calculate variance / contrast
        let varianceSum = 0;
        for (let i = 0; i < lumValues.length; i++) {
          varianceSum += Math.pow(lumValues[i] - avgLum, 2);
        }
        const stdDev = Math.sqrt(varianceSum / validPixels);
        if (stdDev < 35) contrastLevel = 'subdued';
        else if (stdDev > 70) contrastLevel = 'extreme';
        else contrastLevel = 'moderate';

        const avgSat = satSum / validPixels;
        hasHighSaturation = avgSat > 0.45;

        // Balance calculations
        const avgLeftWeight = leftCount ? leftLum / leftCount : 0;
        const avgRightWeight = rightCount ? rightLum / rightCount : 0;
        const hRatio = avgRightWeight ? avgLeftWeight / avgRightWeight : 1;
        if (hRatio > 1.25) horizontalBalance = 'left-heavy';
        else if (hRatio < 0.8) horizontalBalance = 'right-heavy';
        else horizontalBalance = 'centered';

        const avgTopWeight = topCount ? topLum / topCount : 0;
        const avgBottomWeight = bottomCount ? bottomLum / bottomCount : 0;
        const vRatio = avgBottomWeight ? avgTopWeight / avgBottomWeight : 1;
        if (vRatio > 1.25) verticalBalance = 'top-heavy';
        else if (vRatio < 0.8) verticalBalance = 'bottom-heavy';
        else verticalBalance = 'centered';

        // Edge density
        const edgeRatio = edgeCount ? edgeActivity / edgeCount : 0;
        if (edgeRatio > 0.4) edgeDensity = 'edge-crowded';
        else if (edgeRatio < 0.1) edgeDensity = 'sparse-margins';
        else edgeDensity = 'balanced-margins';

        // Sort dominant colors
        const sortedColors = Object.entries(colorBuckets)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map((entry) => entry[0]);

        if (sortedColors.length > 0) {
          dominantColors = sortedColors;
        }

        // Complexity
        if (stdDev < 40 && Object.keys(colorBuckets).length < 25) {
          estimatedComplexity = 'minimalist';
        } else if (stdDev > 65 || Object.keys(colorBuckets).length > 80) {
          estimatedComplexity = 'dense';
        }
      }

      resolve({
        width,
        height,
        aspectRatio,
        isPortrait,
        isLandscape,
        isSquare,
        dominantColors,
        brightnessLevel,
        contrastLevel,
        estimatedComplexity,
        hasHighSaturation,
        horizontalBalance,
        verticalBalance,
        edgeDensity
      });
    };

    img.onerror = () => {
      resolve({
        width: 1000,
        height: 1000,
        aspectRatio: '1:1 (Fallback)',
        isPortrait: false,
        isLandscape: false,
        isSquare: true,
        dominantColors: ['#0A0A0A', '#222222', '#666666', '#D71920'],
        brightnessLevel: 'balanced',
        contrastLevel: 'moderate',
        estimatedComplexity: 'balanced',
        hasHighSaturation: false
      });
    };

    img.src = dataUrl;
  });
}
