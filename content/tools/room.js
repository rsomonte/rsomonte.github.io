/* * Room Canvas Drawing Tool
 * This script allows users to draw walls in a room by clicking and dragging on a canvas.
 * Walls snap to either the x-axis or y-axis based on the direction of the mouse movement.
 */

// ===============================
// Constants & Globals
// ===============================
const PIXELS_PER_METER = 150;
const SNAP_RADIUS = 10; // pixels
const furnitureTypes = {
  // Beds
  bed90:   { width: 0.9, height: 2, label: "Bed 90" },
  bed150:  { width: 1.5, height: 2, label: "Bed 150" },
  bedQueen:{ width: 1.6, height: 2, label: "Queen" },
  bedKing: { width: 1.8, height: 2, label: "King" },
  
  // Tables
  table:   { width: 1.5, height: 1, label: "Table" },
  
  // Chairs
  chair:   { width: 0.5, height: 0.5, label: "Chair" },
  gamingChair: { width: 0.70, height: 0.70, label: "Gaming Chair" },
  officeChair: { width: 0.60, height: 0.60, label: "Office Chair" },
  regularArmchair: { width: 0.90, height: 0.85, label: "Armchair" },
  largeArmchair: { width: 1.10, height: 1.00, label: "Large Armchair" },
  
  // Desks
  smallOfficeDesk: { width: 1.00, height: 0.60, label: "Small Desk" },
  regularOfficeDesk: { width: 1.20, height: 0.70, label: "Office Desk" },
  largeOfficeDesk: { width: 1.60, height: 0.80, label: "Large Desk" },
  
  // Storage
  regularBookshelf: { width: 0.80, height: 0.30, label: "Bookshelf" },
  
  // Nightstands
  smallNightstand: { width: 0.35, height: 0.30, label: "Small Nightstand" },
  regularNightstand: { width: 0.45, height: 0.35, label: "Nightstand" },
  largeNightstand: { width: 0.55, height: 0.40, label: "Large Nightstand" },
  
  // Sofas
  regularSofa: { width: 1.80, height: 0.85, label: "Sofa" },
  largeSofa: { width: 2.20, height: 1.00, label: "Large Sofa" },
  // L-Shaped Sofa
  lShapedSofa: { width: 2.20, height: 1.50, label: "L-Sofa", isLShaped: true },
  
  // Plants (circular items)
  smallFlowerPot: { width: 0.15, height: 0.15, label: "Small Plant", isCircular: true },
  regularFlowerPot: { width: 0.25, height: 0.25, label: "Plant", isCircular: true },
  largeFlowerPot: { width: 0.40, height: 0.40, label: "Large Plant", isCircular: true },
  
  // Doors
  door:    { width: 0.9, height: 0.05, label: "Door", isDoor: true },
  doorMirrored: { width: 0.9, height: 0.05, label: "Door Mirrored", isDoor: true, isMirrored: true },
};

const canvas = document.getElementById("roomCanvas");
const ctx = canvas.getContext("2d");
const walls = [];
let furnitureItems = [];
let isDrawing = false;
let startX, startY;
let currentX, currentY;
let selectedFurniture = null;
let previewRotation = 0;
let hoveredSnapPoint = null;
let hoverX = null;
let hoverY = null;
let draggingItem = null;
let dragOffsetX = 0;
let dragOffsetY = 0;
let currentTool = "draw"; // "select", "draw", "place", "rotate", "delete"
let selectedItem = null;

// Camera/viewport variables
let cameraX = 0;
let cameraY = 0;
let isDraggingCanvas = false;
let lastCanvasDragX = 0;
let lastCanvasDragY = 0;

// World-space floor paint layer (offscreen, dynamically growing)
let floorCanvasW = 2048;
let floorCanvasH = 2048;
let floorOriginX = Math.floor(floorCanvasW / 2); // world (0,0) maps to this pixel
let floorOriginY = Math.floor(floorCanvasH / 2);
const floorCanvas = document.createElement('canvas');
floorCanvas.width = floorCanvasW;
floorCanvas.height = floorCanvasH;
const floorCtx = floorCanvas.getContext('2d');
// Mask canvas used during flood fill to draw walls as barriers
const maskCanvas = document.createElement('canvas');
maskCanvas.width = floorCanvasW;
maskCanvas.height = floorCanvasH;
const maskCtx = maskCanvas.getContext('2d');

// ===============================
// Utility Functions
// ===============================
function isDarkMode() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function snapToAxis(x1, y1, x2, y2) {
  if (Math.abs(x2 - x1) > Math.abs(y2 - y1)) {
    return { x: x2, y: y1 };
  } else {
    return { x: x1, y: y2 };
  }
}

function getWallUnderMouse(x, y) {
  const tolerance = 10; // pixels
  for (const wall of walls) {
    // Calculate distance from point to line segment
    const A = x - wall.x1;
    const B = y - wall.y1;
    const C = wall.x2 - wall.x1;
    const D = wall.y2 - wall.y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    
    if (lenSq === 0) continue; // Zero length line
    
    let param = dot / lenSq;
    
    let xx, yy;
    if (param < 0) {
      xx = wall.x1;
      yy = wall.y1;
    } else if (param > 1) {
      xx = wall.x2;
      yy = wall.y2;
    } else {
      xx = wall.x1 + param * C;
      yy = wall.y1 + param * D;
    }

    const dx = x - xx;
    const dy = y - yy;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance <= tolerance) {
      return wall;
    }
  }
  return null;
}

function getItemUnderMouse(x, y) {
  for (let i = furnitureItems.length - 1; i >= 0; i--) {
    const item = furnitureItems[i];
    const def = furnitureTypes[item.type];
    const cx = item.x + item.width / 2;
    const cy = item.y + item.height / 2;

    if (def.isCircular) {
      // For circular items, check if mouse is within radius
      const dx = x - cx;
      const dy = y - cy;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const radius = item.width / 2;
      if (distance <= radius) {
        return item;
      }
    } else if (def.isLShaped) {
      // L-shaped hit detection matching the non-overlapping geometry
      const seatDepth = item.height * 0.4;
      const totalW = item.width;
      const totalH = item.height;

      // Transform mouse into local rotated space
      const dx = x - cx;
      const dy = y - cy;
      const angle = (-item.rotation * Math.PI) / 180;

      const localX = Math.cos(angle) * dx - Math.sin(angle) * dy;
      const localY = Math.sin(angle) * dx + Math.cos(angle) * dy;

      // Horizontal part bounds
      const horizX = -totalW / 2 + seatDepth;
      const horizY = -totalH / 2;
      const horizW = totalW - seatDepth;
      const horizH = seatDepth;

      // Vertical part bounds
      const vertX = -totalW / 2;
      const vertY = -totalH / 2;
      const vertW = seatDepth;
      const vertH = totalH - seatDepth;

      // Hit test
      const inHoriz =
        localX >= horizX && localX <= horizX + horizW &&
        localY >= horizY && localY <= horizY + horizH;

      const inVert =
        localX >= vertX && localX <= vertX + vertW &&
        localY >= vertY && localY <= vertY + vertH;

      if (inHoriz || inVert) return item;
    } else {
      // For rectangular items, use rotation-aware collision detection
      const dx = x - cx;
      const dy = y - cy;
      const angle = (-item.rotation * Math.PI) / 180;

      const localX = Math.cos(angle) * dx - Math.sin(angle) * dy;
      const localY = Math.sin(angle) * dx + Math.cos(angle) * dy;

      if (
        localX >= -item.width / 2 && localX <= item.width / 2 &&
        localY >= -item.height / 2 && localY <= item.height / 2
      ) {
        return item;
      }
    }
  }
  return null;
}

function getWallLengthInMeters(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthInPixels = Math.sqrt(dx * dx + dy * dy);
  return lengthInPixels / PIXELS_PER_METER;
}

function findNearbyEndpoint(x, y) {
  for (const wall of walls) {
    const points = [
      { x: wall.x1, y: wall.y1 },
      { x: wall.x2, y: wall.y2 }
    ];
    for (const pt of points) {
      const dx = pt.x - x;
      const dy = pt.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < SNAP_RADIUS) {
        return pt;
      }
    }
  }
  return null;
}

function selectFurniture(type) {
  selectedFurniture = type;
  currentTool = 'place';
  drawPreview();
}

function setTool(tool) {
  currentTool = tool;
  selectedItem = null;
  isDrawing = false;
  selectedFurniture = null;
  previewRotation = 0;
  draggingItem = null;
  isDraggingCanvas = false;
  
  // Update button highlighting
  document.querySelectorAll('#toolMenu button').forEach(btn => btn.classList.remove('active'));
  document.getElementById(tool + 'Btn')?.classList.add('active');
  
  // Update cursor based on tool
  switch(tool) {
    case 'draw':
      canvas.style.cursor = 'crosshair';
      break;
    case 'select':
      canvas.style.cursor = 'default';
      break;
    case 'rotate':
      canvas.style.cursor = 'grab';
      break;
    case 'delete':
      canvas.style.cursor = 'not-allowed';
      break;
    case 'bucket':
      canvas.style.cursor = 'cell';
      break;
    case 'place':
      canvas.style.cursor = 'copy';
      break;
    default:
      canvas.style.cursor = 'default';
  }
  // Show/hide color row depending on bucket tool
  const colorRow = document.getElementById('colorRow');
  if (colorRow) colorRow.style.display = (tool === 'bucket') ? 'flex' : 'none';
  
  drawPreview();
}

function toggleMenu() {
  const menu = document.getElementById("furnitureMenu");
  // When opening, position it a few pixels below the toggle button
  if (menu.classList.contains('hidden')) {
    const btn = document.getElementById('menuToggle');
    const rect = btn.getBoundingClientRect();
    menu.style.left = rect.left + 'px';
    menu.style.top = (rect.bottom + 8) + 'px';
  }
  menu.classList.toggle("hidden");
}

// ===============================
// Flood Fill (world-space, walls as barriers)
// ===============================
function expandFloorCanvases(newW, newH) {
  if (newW === floorCanvasW && newH === floorCanvasH) return;
  const oldW = floorCanvasW, oldH = floorCanvasH;
  const temp = document.createElement('canvas');
  temp.width = oldW; temp.height = oldH;
  temp.getContext('2d').drawImage(floorCanvas, 0, 0);
  const dx = Math.floor((newW - oldW) / 2);
  const dy = Math.floor((newH - oldH) / 2);

  floorCanvasW = newW; floorCanvasH = newH;
  floorCanvas.width = newW; floorCanvas.height = newH; // clears content
  floorOriginX += dx; floorOriginY += dy;
  floorCtx.drawImage(temp, dx, dy);

  maskCanvas.width = newW; maskCanvas.height = newH; // mask is redrawn each fill
}

function ensureFloorCapacityForRect(minX, minY, maxX, maxY) {
  // Expand by doubling until all world corners are well inside the paint layer
  const pad = 128; // headroom
  let grew = false;
  while (true) {
    const minPx = minX + floorOriginX;
    const minPy = minY + floorOriginY;
    const maxPx = maxX + floorOriginX;
    const maxPy = maxY + floorOriginY;
    const needsLeft = minPx < pad;
    const needsTop = minPy < pad;
    const needsRight = maxPx > (floorCanvasW - pad);
    const needsBottom = maxPy > (floorCanvasH - pad);
    if (!(needsLeft || needsTop || needsRight || needsBottom)) break;
    const newW = floorCanvasW * 2;
    const newH = floorCanvasH * 2;
    expandFloorCanvases(newW, newH);
    grew = true;
  }
  return grew;
}

function hexToRGBA(hex) {
  const h = hex.replace('#','');
  const bigint = parseInt(h.length === 3 ? h.split('').map(c=>c+c).join('') : h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = (bigint >> 0) & 255;
  return [r, g, b, 255];
}

function drawWallsToMask() {
  maskCtx.clearRect(0, 0, floorCanvasW, floorCanvasH);
  maskCtx.save();
  maskCtx.strokeStyle = '#000';
  maskCtx.lineWidth = 8; // thicker to avoid leaks
  maskCtx.lineCap = 'round';
  maskCtx.lineJoin = 'round';
  maskCtx.beginPath();
  for (const w of walls) {
    maskCtx.moveTo(Math.round(w.x1 + floorOriginX), Math.round(w.y1 + floorOriginY));
    maskCtx.lineTo(Math.round(w.x2 + floorOriginX), Math.round(w.y2 + floorOriginY));
  }
  maskCtx.stroke();
  maskCtx.restore();
}

function floodFillFloor(worldX, worldY, hexColor) {
  const viewMinX = worldX - canvas.width - cameraX;
  const viewMinY = worldY - canvas.height - cameraY;
  const viewMaxX = worldX + canvas.width + cameraX;
  const viewMaxY = worldY + canvas.height + cameraY;
  ensureFloorCapacityForRect(viewMinX, viewMinY, viewMaxX, viewMaxY);

  const startX = Math.round(worldX + floorOriginX);
  const startY = Math.round(worldY + floorOriginY);
  if (startX < 0 || startX >= floorCanvasW || startY < 0 || startY >= floorCanvasH) return;

  // Build mask of walls
  drawWallsToMask();
  const maskData = maskCtx.getImageData(0, 0, floorCanvasW, floorCanvasH);
  const maskBuf = new Uint32Array(maskData.data.buffer);

  // Prepare destination floor image
  const floorData = floorCtx.getImageData(0, 0, floorCanvasW, floorCanvasH);
  const floorBuf = new Uint32Array(floorData.data.buffer);

  // If starting point is a wall, abort
  const startIdx = startY * floorCanvasW + startX;
  if (maskBuf[startIdx] !== 0) {
    return;
  }

  const [r, g, b, a] = hexToRGBA(hexColor);
  const targetColor = (a << 24) | (b << 16) | (g << 8) | r; // little-endian RGBA

  // Get the starting color; if it's already the target, nothing to do
  const startColor = floorBuf[startIdx];
  if (startColor === targetColor) return;

  // Simple BFS flood fill constrained by walls (mask!=0 are walls)
  const stack = [startIdx];
  const width = floorCanvasW;
  const height = floorCanvasH;
  const visited = new Uint8Array(width * height);

  while (stack.length) {
    const idx = stack.pop();
    if (visited[idx]) continue;
    visited[idx] = 1;
    // Skip if wall or not the starting color region
    if (maskBuf[idx] !== 0) continue;
    if (floorBuf[idx] !== startColor) continue;
    // Color pixel
    floorBuf[idx] = targetColor;
    const x = idx % width;
    const y = (idx - x) / width;
    if (x > 0) stack.push(idx - 1);
    if (x < width - 1) stack.push(idx + 1);
    if (y > 0) stack.push(idx - width);
    if (y < height - 1) stack.push(idx + width);
  }

  floorCtx.putImageData(floorData, 0, 0);
}

// ===============================
// Drawing & Redraw Functions
// ===============================
function drawPreview() {
  redrawAllWalls();
  ctx.save();
  ctx.translate(cameraX, cameraY);
  
  // Draw preview line if drawing
  if (isDrawing) {
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(currentX, currentY);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Display length of preview line
    const previewLength = getWallLengthInMeters(startX, startY, currentX, currentY).toFixed(2);
    const midX = (startX + currentX) / 2;
    const midY = (startY + currentY) / 2;
    ctx.font = "14px sans-serif";
    ctx.fillStyle = isDarkMode() ? "#fff" : "black";
    ctx.strokeStyle = isDarkMode() ? "#000" : "#fff";
    ctx.lineWidth = 3;
    ctx.strokeText(`${previewLength} m`, midX + 5, midY - 5);
    ctx.fillText(`${previewLength} m`, midX + 5, midY - 5);
  }
  // Draw snapping point if hovering over one
  if (hoveredSnapPoint) {
    ctx.beginPath();
    ctx.arc(hoveredSnapPoint.x, hoveredSnapPoint.y, 5, 0, 2 * Math.PI);
    ctx.fillStyle = "red";
    ctx.fill();
  }
  // Furniture preview
  if (selectedFurniture && hoverX !== null && hoverY !== null) {
    const def = furnitureTypes[selectedFurniture];
    const w = def.width * PIXELS_PER_METER;
    const h = def.height * PIXELS_PER_METER;
    const x = hoverX;
    const y = hoverY;
    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate((previewRotation * Math.PI) / 180);
    ctx.globalAlpha = 0.4;
    if (def.isDoor) {
      const r = w;
      const angle = 30 * (Math.PI / 180);
      const mirrorAngle = def.isMirrored ? -angle : angle;
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 1.5;
      // Closed line
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(r, 0);
      ctx.stroke();
      // Open line
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(mirrorAngle) * r, Math.sin(mirrorAngle) * r);
      ctx.stroke();
      // Arc
      ctx.beginPath();
      if (def.isMirrored) {
        ctx.arc(0, 0, r, mirrorAngle, 0);
      } else {
        ctx.arc(0, 0, r, 0, mirrorAngle);
      }
      ctx.setLineDash([4, 2]);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (def.isLShaped) {
      // Preview L-shaped sofa (non-overlapping L geometry)
      ctx.fillStyle = "#aaddff"; // Same preview color as other furniture
      ctx.strokeStyle = "black";
      ctx.lineWidth = 1;

      // Define total dimensions
      const totalW = w;
      const totalH = h;
      // Define seat depth (thickness of the sofa arms)
      const seatDepth = totalH * 0.4;

      // Horizontal section (base of the L, full length)
      const horizX = -totalW / 2 + seatDepth;
      const horizY = -totalH / 2;
      const horizW = totalW - seatDepth;
      const horizH = seatDepth;

      // Vertical section (leg of the L, partial height)
      const vertX = -totalW / 2;
      const vertY = -totalH / 2;
      const vertW = seatDepth;
      const vertH = totalH - seatDepth;

      // Draw both parts without overlap
      ctx.fillRect(horizX, horizY, horizW, horizH);
      ctx.strokeRect(horizX, horizY, horizW, horizH);

      ctx.fillRect(vertX, vertY, vertW, vertH);
      ctx.strokeRect(vertX, vertY, vertW, vertH);

      // Label positioned just above the inner corner of the L
      const innerCornerX = -totalW / 2 + seatDepth;
      const innerCornerY = -totalH / 2 + seatDepth;
      ctx.fillStyle = "black";
      ctx.font = "10px sans-serif";
      ctx.fillText(def.label, innerCornerX + 4, innerCornerY - 6);
    } else if (def.isCircular) {
      // Preview circular items
      const radius = w / 2;
      ctx.fillStyle = "#90EE90";
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = "#228B22";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "black";
      ctx.font = "8px sans-serif";
      ctx.fillText(def.label, -w / 2 + 2, 2);
    } else {
      ctx.fillStyle = "#aaddff";
      ctx.fillRect(-w / 2, -h / 2, w, h);
      ctx.strokeStyle = "black";
      ctx.strokeRect(-w / 2, -h / 2, w, h);
      ctx.fillStyle = "black";
      ctx.font = "10px sans-serif";
      ctx.fillText(def.label, -w / 2 + 4, -h / 2 + 12);
    }
    ctx.globalAlpha = 1.0;
    ctx.restore();
  }
  
  ctx.restore();
}

function drawWall(x1, y1, x2, y2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = isDarkMode() ? "#fff" : "#000";
  ctx.lineWidth = 2;
  ctx.stroke();
}

function redrawAllWalls() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(cameraX, cameraY);
  // Draw floor paint layer in world coordinates
  ctx.drawImage(floorCanvas, -floorOriginX, -floorOriginY);
  
  // Walls
  for (const wall of walls) {
    drawWall(wall.x1, wall.y1, wall.x2, wall.y2);
    const midX = (wall.x1 + wall.x2) / 2;
    const midY = (wall.y1 + wall.y2) / 2;
    const length = getWallLengthInMeters(wall.x1, wall.y1, wall.x2, wall.y2).toFixed(2);
    ctx.font = "12px sans-serif";
    ctx.fillStyle = isDarkMode() ? "#fff" : "black";
    ctx.fillText(`${length} m`, midX + 5, midY - 5);
  }
  // Furniture
  for (const item of furnitureItems) {
    const def = furnitureTypes[item.type];
    ctx.save();
    ctx.translate(item.x + item.width / 2, item.y + item.height / 2);
    ctx.rotate((item.rotation * Math.PI) / 180);
    if (def.isDoor) {
      // Draw door lines and swing arc
      const doorRadius = item.width;
      // Closed door line
      ctx.strokeStyle = "black";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(doorRadius, 0);
      ctx.stroke();
      // Open door line (~30° open)
      const angle = 30 * (Math.PI / 180);
      const mirrorAngle = def.isMirrored ? -angle : angle;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(
        Math.cos(mirrorAngle) * doorRadius,
        Math.sin(mirrorAngle) * doorRadius
      );
      ctx.stroke();
      // Swing arc
      ctx.beginPath();
      if (def.isMirrored) {
        ctx.arc(0, 0, doorRadius, mirrorAngle, 0);
      } else {
        ctx.arc(0, 0, doorRadius, 0, mirrorAngle);
      }
      ctx.setLineDash([4, 2]);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (def.isLShaped) {
      // Draw L-shaped sofa (non-overlapping L geometry)
      ctx.fillStyle = item.color || "#c0c0ff"; // allow recolor
      ctx.strokeStyle = "black";
      ctx.lineWidth = 1;

      // Define total dimensions
      const totalW = item.width;
      const totalH = item.height;
      // Define seat depth (thickness of the sofa arms)
      const seatDepth = totalH * 0.4;

      // Horizontal section (base of the L, full length)
      const horizX = -totalW / 2 + seatDepth;
      const horizY = -totalH / 2;
      const horizW = totalW - seatDepth;
      const horizH = seatDepth;

      // Vertical section (leg of the L, partial height)
      const vertX = -totalW / 2;
      const vertY = -totalH / 2;
      const vertW = seatDepth;
      const vertH = totalH - seatDepth;

      // Draw both parts without overlap
      ctx.fillRect(horizX, horizY, horizW, horizH);
      ctx.strokeRect(horizX, horizY, horizW, horizH);

      ctx.fillRect(vertX, vertY, vertW, vertH);
      ctx.strokeRect(vertX, vertY, vertW, vertH);

      // Label positioned just above the inner corner of the L
      const innerCornerX = -totalW / 2 + seatDepth;
      const innerCornerY = -totalH / 2 + seatDepth;
      ctx.fillStyle = "black";
      ctx.font = "10px sans-serif";
      ctx.fillText(def.label, innerCornerX + 4, innerCornerY - 6);
    } else if (def.isCircular) {
      // Draw circular items (flower pots)
      const radius = item.width / 2;
      ctx.fillStyle = item.color || "#90EE90";
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = "#228B22";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "black";
      ctx.font = "8px sans-serif";
      ctx.fillText(def.label, -item.width / 2 + 2, 2);
    } else {
      ctx.fillStyle = item.color || "#c0c0ff";
      ctx.fillRect(-item.width / 2, -item.height / 2, item.width, item.height);
      ctx.strokeStyle = "black";
      ctx.strokeRect(-item.width / 2, -item.height / 2, item.width, item.height);
      ctx.fillStyle = "black";
      ctx.font = "10px sans-serif";
      ctx.fillText(def.label, -item.width / 2 + 4, -item.height / 2 + 12);
    }
    ctx.restore();
  }
  
  ctx.restore();
}

// ===============================
// Event Listeners
// ===============================

canvas.addEventListener("mousedown", (e) => {
  // Prevent context menu and handle right-click for canvas dragging
  if (e.button === 2) {
    e.preventDefault();
    // Cancel any ongoing actions
    isDrawing = false;
    selectedFurniture = null;
    draggingItem = null;
    
    // Start canvas dragging
    isDraggingCanvas = true;
    lastCanvasDragX = e.clientX;
    lastCanvasDragY = e.clientY;
    return;
  }

  // Only handle left-click for tools
  if (e.button !== 0) return;

  const rect = canvas.getBoundingClientRect();
  let x = e.clientX - rect.left - cameraX;
  let y = e.clientY - rect.top - cameraY;
  // ===============================
  // Tool-based logic
  // ===============================

  // BUCKET TOOL: Recolor furniture or floor area bounded by walls
  if (currentTool === 'bucket') {
    const colorInput = document.getElementById('colorPicker');
    const newColor = colorInput?.value || '#c0c0ff';
    const item = getItemUnderMouse(x, y);
    if (item) {
      item.color = newColor;
      redrawAllWalls();
      return;
    }
    // Flood fill on floor paint layer at world point (x, y)
    floodFillFloor(x, y, newColor);
    redrawAllWalls();
    return;
  }

  // PLACE TOOL: Furniture placement
  if (currentTool === "place" && selectedFurniture) {
    const def = furnitureTypes[selectedFurniture];
    furnitureItems.push({
      type: selectedFurniture,
      x,
      y,
      width: def.width * PIXELS_PER_METER,
      height: def.height * PIXELS_PER_METER,
      rotation: previewRotation
    });
    selectedFurniture = null;
    previewRotation = 0;
    redrawAllWalls();
    return;
  }

  // DRAW TOOL: Wall drawing
  if (currentTool === "draw") {
    if (!isDrawing) {
      // First click: start point
      const snap = findNearbyEndpoint(x, y);
      if (snap) {
        x = snap.x;
        y = snap.y;
      }
      startX = x;
      startY = y;
      isDrawing = true;
    } else {
      const snap = findNearbyEndpoint(x, y);
      let x2, y2;
      if (snap) {
        const dx = Math.abs(snap.x - startX);
        const dy = Math.abs(snap.y - startY);
        if (dx > dy) {
          // Horizontal wall
          const matching = walls.find(w =>
            Math.abs(w.y1 - startY) < 1e-2 &&
            Math.abs(w.y2 - startY) < 1e-2
          );
          let length = Math.abs(snap.x - startX);
          if (matching) length = Math.abs(matching.x2 - matching.x1);
          x2 = (snap.x < startX) ? startX - length : startX + length;
          y2 = startY;
        } else {
          // Vertical wall
          const matching = walls.find(w =>
            Math.abs(w.x1 - startX) < 1e-2 &&
            Math.abs(w.x2 - startX) < 1e-2
          );
          let length = Math.abs(snap.y - startY);
          if (matching) length = Math.abs(matching.y2 - matching.y1);
          y2 = (snap.y < startY) ? startY - length : startY + length;
          x2 = startX;
        }
      } else {
        // No snapping, just axis alignment
        const axisSnap = snapToAxis(startX, startY, x, y);
        x2 = axisSnap.x;
        y2 = axisSnap.y;
      }
      walls.push({ x1: startX, y1: startY, x2, y2 });
      isDrawing = false;
      redrawAllWalls();
    }
    return;
  }


  // ROTATE TOOL: Rotate furniture item
  if (currentTool === "rotate") {
    const item = getItemUnderMouse(x, y);
    if (item) {
      item.rotation = (item.rotation + 90) % 360;
      redrawAllWalls();
    }
    return;
  }

  // DELETE TOOL: Delete furniture item or wall
  if (currentTool === "delete") {
    const item = getItemUnderMouse(x, y);
    if (item) {
      furnitureItems = furnitureItems.filter(i => i !== item);
      redrawAllWalls();
      return;
    }
    
    // Check if clicking on a wall to delete it
    const wallToDelete = getWallUnderMouse(x, y);
    if (wallToDelete) {
      const index = walls.indexOf(wallToDelete);
      if (index > -1) {
        walls.splice(index, 1);
        redrawAllWalls();
      }
    }
    return;
  }

  // DRAG OBJECT TOOL: Select and drag furniture item
  if (currentTool === "select") {
    const item = getItemUnderMouse(x, y);
    if (item) {
      selectedItem = item;
      draggingItem = item;
      // Calculate simple offset from mouse to object position (not center)
      dragOffsetX = x - item.x;
      dragOffsetY = y - item.y;
      return;
    }
  }

  // If no tool-specific action was taken, clear selection
  selectedItem = null;
  redrawAllWalls();

});

canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  let x = e.clientX - rect.left - cameraX;
  let y = e.clientY - rect.top - cameraY;

  // Handle canvas dragging (right-click drag)
  if (isDraggingCanvas) {
    const deltaX = e.clientX - lastCanvasDragX;
    const deltaY = e.clientY - lastCanvasDragY;
    cameraX += deltaX;
    cameraY += deltaY;
    lastCanvasDragX = e.clientX;
    lastCanvasDragY = e.clientY;
    redrawAllWalls();
    return;
  }

  hoverX = x;
  hoverY = y;

  // 🟡 If dragging furniture, update its position
  if (draggingItem) {
    // Simple dragging - just update position with offset
    draggingItem.x = x - dragOffsetX;
    draggingItem.y = y - dragOffsetY;
    drawPreview();
    return; // Don't do preview line or snapping when dragging
  }

  // 🔴 Wall endpoint snapping (only when not dragging)
  const snap = findNearbyEndpoint(x, y);
  if (snap) {
    x = snap.x;
    y = snap.y;
    hoveredSnapPoint = snap;
  } else {
    hoveredSnapPoint = null;
  }

  // 🟢 If currently drawing a wall, update preview line
  if (isDrawing) {
    const { x: snappedX, y: snappedY } = snapToAxis(startX, startY, x, y);
    currentX = snappedX;
    currentY = snappedY;
  }

  drawPreview(); // Always update preview
});

canvas.addEventListener("mouseup", (e) => {
  if (isDraggingCanvas) {
    isDraggingCanvas = false;
    return;
  }
  
  if (draggingItem) {
    draggingItem = null;
    redrawAllWalls();
  }
});

canvas.addEventListener("contextmenu", (e) => {
  e.preventDefault();
});

// ===============================
// Keyboard Shortcuts
// ===============================
document.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === "r") {
    if (draggingItem) {
      draggingItem.rotation = (draggingItem.rotation + 90) % 360;
    } else if (selectedItem) {
      selectedItem.rotation = (selectedItem.rotation + 90) % 360;
    }
    redrawAllWalls();
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    setTool("select");
  }
});

// ===============================
// Window Resize
// ===============================
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  redrawAllWalls();
}

window.addEventListener('resize', resizeCanvas);
// Initial resize
resizeCanvas();

// ===============================
// Draggable Menus
// ===============================
(function enableDraggableMenus() {
  const toolMenu = document.getElementById('toolMenu');
  const furnitureMenu = document.getElementById('furnitureMenu');

  // Ensure menus are positioned with left/top so they can be dragged anywhere
  function ensureAbsolutePosition(el) {
    const style = window.getComputedStyle(el);
    if (style.left === 'auto' && style.right !== 'auto') {
      // Convert right to left
      const rect = el.getBoundingClientRect();
      el.style.left = rect.left + 'px';
      el.style.top = rect.top + 'px';
      el.style.right = 'auto';
    } else {
      const rect = el.getBoundingClientRect();
      el.style.left = rect.left + 'px';
      el.style.top = rect.top + 'px';
    }
  }

  function makeDraggable(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    ensureAbsolutePosition(container);
    const handle = container.querySelector('.menu-header');
    if (!handle) return;

    let dragging = false;
    let startX = 0, startY = 0;
    let originLeft = 0, originTop = 0;

    handle.addEventListener('mousedown', (e) => {
      // Only left button
      if (e.button !== 0) return;
      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = container.getBoundingClientRect();
      originLeft = rect.left;
      originTop = rect.top;
      // Improve dragging UX
      document.body.style.userSelect = 'none';
    });

    window.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      container.style.left = originLeft + dx + 'px';
      container.style.top = originTop + dy + 'px';
      container.style.right = 'auto';
    });

    window.addEventListener('mouseup', () => {
      if (!dragging) return;
      dragging = false;
      document.body.style.userSelect = '';
    });
  }

  makeDraggable('toolMenu');
  makeDraggable('furnitureMenu');
})();