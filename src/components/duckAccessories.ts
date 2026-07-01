import { fillEll, tri } from "./duckDraw";
import type { Variant } from "./duckTypes";

// Draw the variant's head/face accessory onto an already-rendered duck.
// Coordinates are in the 130x120 sprite space (head centered near x=82, y=44).
// Add a new accessory by extending the Accessory union and adding a branch.
export function drawAccessory(c: CanvasRenderingContext2D, v: Variant) {
  if (v.acc === "shades") {
    c.fillStyle = "#1f2937";
    fillEll(c, 90, 35, 9.5, 7.5, "#1f2937");
    fillEll(c, 73, 35, 8.5, 6.5, "#1f2937");
    c.fillRect(80, 32, 4, 3); // bridge
    c.fillRect(55, 33, 16, 3); // temple arm
    c.fillStyle = "rgba(120,180,255,0.7)";
    fillEll(c, 92, 32, 3.5, 2.5, "rgba(120,180,255,0.7)");
    fillEll(c, 75, 32, 3, 2.2, "rgba(120,180,255,0.7)");
  } else if (v.acc === "pirate") {
    c.fillStyle = "#1f2937";
    fillEll(c, 80, 18, 31, 8, "#1f2937"); // brim
    c.beginPath();
    c.moveTo(56, 18);
    c.quadraticCurveTo(80, -14, 104, 18);
    c.closePath();
    c.fill();
    fillEll(c, 80, 11, 5.5, 5.5, "#f4f7fb"); // skull
    c.fillStyle = "#1f2937";
    fillEll(c, 78, 10, 1.2, 1.5, "#1f2937");
    fillEll(c, 82, 10, 1.2, 1.5, "#1f2937");
    c.fillRect(78.5, 13, 3, 1.4);
  } else if (v.acc === "crown") {
    if (v.effect === "royal") {
      drawRoyalCrown(c, v.accColor!);
    } else {
      c.fillStyle = v.accColor!;
      c.beginPath();
      c.moveTo(58, 16);
      c.lineTo(63, 2);
      c.lineTo(70, 11);
      c.lineTo(80, -1);
      c.lineTo(90, 11);
      c.lineTo(97, 2);
      c.lineTo(102, 16);
      c.closePath();
      c.fill();
      fillEll(c, 63, 4, 2, 2, "#FF5C8A");
      fillEll(c, 80, 1, 2.2, 2.2, "#5CC8FF");
      fillEll(c, 97, 4, 2, 2, "#FF5C8A");
    }
  } else if (v.acc === "party") {
    c.fillStyle = v.accColor!;
    c.beginPath();
    c.moveTo(60, 14);
    c.lineTo(80, -18);
    c.lineTo(100, 14);
    c.closePath();
    c.fill();
    c.fillStyle = "#ffffff";
    c.fillRect(74, 2, 3, 3);
    c.fillRect(84, 6, 3, 3);
    c.fillRect(79, -6, 3, 3);
    fillEll(c, 80, -18, 3.2, 3.2, "#FACC15"); // pom-pom
  } else if (v.acc === "tophat") {
    c.fillStyle = "#23272e";
    fillEll(c, 80, 15, 27, 6.5, "#23272e"); // brim
    c.fillRect(67, 0, 28, 15); // cylinder
    c.fillStyle = v.accColor!;
    c.fillRect(67, 5, 28, 4); // band
    c.fillStyle = "rgba(255,255,255,0.12)";
    c.fillRect(70, 1, 3, 13); // sheen
  } else if (v.acc === "sunhat") {
    fillEll(c, 80, 16, 31, 8, "#F2CE7E"); // straw brim
    fillEll(c, 80, 9, 15, 9, "#F2CE7E"); // dome
    c.strokeStyle = "rgba(150,110,40,0.4)";
    c.lineWidth = 1;
    c.beginPath();
    c.ellipse(80, 16, 31, 8, 0, 0, Math.PI * 2);
    c.stroke();
    fillEll(c, 80, 13, 14, 3.4, v.accColor!); // ribbon
  } else if (v.acc === "flower") {
    const pc = v.accColor!;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      fillEll(c, 64 + Math.cos(a) * 5.5, 15 + Math.sin(a) * 5.5, 4, 4, pc);
    }
    fillEll(c, 64, 15, 3, 3, "#FFD21E"); // center
  } else if (v.acc === "snorkel") {
    c.fillStyle = "#22303C";
    c.fillRect(70, 32, 22, 3); // strap
    fillEll(c, 95, 37, 12.5, 10, "#22303C"); // mask frame
    fillEll(c, 95, 37, 9.5, 7.5, "rgba(150,225,255,0.7)"); // glass
    c.fillStyle = "#F5811F";
    c.fillRect(110, 6, 4.5, 34); // tube
    c.fillRect(110, 6, 9, 4); // bend
    c.fillStyle = "#1f2937";
    c.fillRect(112.5, 36, 5, 5); // mouthpiece
  } else if (v.acc === "bowtie") {
    const bc = v.accColor!;
    tri(
      c,
      [
        [86, 60],
        [78, 55],
        [78, 65],
      ],
      bc,
    );
    tri(
      c,
      [
        [86, 60],
        [94, 55],
        [94, 65],
      ],
      bc,
    );
    fillEll(c, 86, 60, 2.2, 3, "rgba(0,0,0,0.25)");
    fillEll(c, 86, 60, 1.8, 2.5, bc);
  } else if (v.acc === "headphones") {
    c.strokeStyle = "#22303C";
    c.lineWidth = 4;
    c.beginPath();
    c.ellipse(82, 44, 30, 30, 0, Math.PI * 1.2, Math.PI * 1.8);
    c.stroke();
    c.fillStyle = "#22303C";
    c.fillRect(53, 30, 4, 14); // side bar
    fillEll(c, 56, 46, 6, 8, "#22303C"); // ear cup
    fillEll(c, 56, 46, 3.5, 5, v.accColor!); // cushion
  } else if (v.acc === "beanie") {
    c.fillStyle = v.accColor!;
    c.beginPath();
    c.moveTo(54, 24);
    c.quadraticCurveTo(80, -14, 106, 24);
    c.closePath();
    c.fill();
    c.fillStyle = "rgba(0,0,0,0.18)";
    c.fillRect(54, 21, 52, 5); // brim band
    fillEll(c, 80, -12, 6, 6, "#ffffff"); // pompom
  } else if (v.acc === "wizard") {
    c.fillStyle = v.accColor!;
    c.beginPath();
    c.moveTo(54, 20);
    c.lineTo(86, -34);
    c.lineTo(104, 18);
    c.closePath();
    c.fill();
    fillEll(c, 79, 19, 28, 7, v.accColor!); // brim
    c.fillStyle = "#FFE14D"; // stars
    c.fillRect(82, -8, 3, 3);
    c.fillRect(76, 2, 2.5, 2.5);
    c.fillRect(86, 6, 2.5, 2.5);
  } else if (v.acc === "viking") {
    c.fillStyle = "#9aa3ad";
    c.beginPath();
    c.moveTo(56, 22);
    c.quadraticCurveTo(80, -8, 104, 22);
    c.closePath();
    c.fill();
    c.fillStyle = "#6b7178";
    c.fillRect(56, 20, 48, 5); // rim
    c.fillStyle = "#c7cdd4";
    c.fillRect(78, -6, 4, 28); // center ridge
    c.fillStyle = "#f0e6d2";
    c.beginPath(); // left horn
    c.moveTo(58, 16);
    c.quadraticCurveTo(40, 2, 44, -10);
    c.quadraticCurveTo(52, 4, 64, 12);
    c.closePath();
    c.fill();
    c.beginPath(); // right horn
    c.moveTo(102, 16);
    c.quadraticCurveTo(120, 2, 116, -10);
    c.quadraticCurveTo(108, 4, 96, 12);
    c.closePath();
    c.fill();
  } else if (v.acc === "chef") {
    fillEll(c, 80, 4, 18, 12, "#ffffff"); // puffy top
    fillEll(c, 64, 8, 10, 9, "#ffffff");
    fillEll(c, 96, 8, 10, 9, "#ffffff");
    c.fillStyle = "#ffffff";
    c.fillRect(62, 12, 36, 12); // band
    c.strokeStyle = "rgba(0,0,0,0.1)";
    c.lineWidth = 1;
    c.strokeRect(62, 12, 36, 12);
  } else if (v.acc === "cowboy") {
    const cc = v.accColor!;
    fillEll(c, 80, 18, 33, 7, cc); // wide brim
    c.fillStyle = cc;
    c.beginPath(); // crown
    c.moveTo(66, 18);
    c.quadraticCurveTo(64, 0, 80, 0);
    c.quadraticCurveTo(96, 0, 94, 18);
    c.closePath();
    c.fill();
    c.fillStyle = "rgba(0,0,0,0.2)";
    c.fillRect(66, 12, 28, 3); // band
  } else if (v.acc === "propeller") {
    c.fillStyle = v.accColor!;
    c.beginPath();
    c.moveTo(58, 22);
    c.quadraticCurveTo(80, -6, 102, 22);
    c.closePath();
    c.fill();
    c.fillStyle = "#E0457B";
    c.beginPath();
    c.moveTo(80, 22);
    c.lineTo(80, -2);
    c.quadraticCurveTo(94, 4, 102, 22);
    c.closePath();
    c.fill();
    c.fillStyle = "#555"; // stalk
    c.fillRect(79, -12, 2.5, 12);
    fillEll(c, 70, -12, 10, 3, "#FF5C8A"); // blades
    fillEll(c, 90, -12, 10, 3, "#5CC8FF");
    fillEll(c, 80, -12, 2.5, 2.5, "#333");
  } else if (v.acc === "halo") {
    c.strokeStyle = "rgba(255,240,150,0.5)";
    c.lineWidth = 7;
    c.beginPath();
    c.ellipse(80, 10, 18, 6, 0, 0, Math.PI * 2);
    c.stroke();
    c.strokeStyle = "#FFE066";
    c.lineWidth = 4;
    c.beginPath();
    c.ellipse(80, 10, 18, 6, 0, 0, Math.PI * 2);
    c.stroke();
  } else if (v.acc === "devil") {
    tri(
      c,
      [
        [62, 14],
        [58, -4],
        [70, 8],
      ],
      "#C0392B",
    ); // left horn
    tri(
      c,
      [
        [98, 14],
        [102, -4],
        [90, 8],
      ],
      "#C0392B",
    ); // right horn
  } else if (v.acc === "antlers") {
    c.strokeStyle = "#8B5A2B";
    c.lineWidth = 3;
    c.beginPath(); // left antler
    c.moveTo(66, 16);
    c.lineTo(58, 0);
    c.moveTo(60, 8);
    c.lineTo(50, 4);
    c.moveTo(58, 0);
    c.lineTo(50, -6);
    c.stroke();
    c.beginPath(); // right antler
    c.moveTo(94, 16);
    c.lineTo(102, 0);
    c.moveTo(100, 8);
    c.lineTo(110, 4);
    c.moveTo(102, 0);
    c.lineTo(110, -6);
    c.stroke();
  } else if (v.acc === "monocle") {
    c.strokeStyle = v.accColor ?? "#D4AF37";
    c.lineWidth = 2;
    c.beginPath();
    c.arc(96, 38, 10, 0, Math.PI * 2);
    c.stroke();
    c.strokeStyle = "rgba(212,175,55,0.6)";
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(96, 48);
    c.quadraticCurveTo(92, 60, 86, 64);
    c.stroke();
  } else if (v.acc === "scarf") {
    const sc = v.accColor!;
    c.fillStyle = sc;
    c.fillRect(60, 60, 36, 8); // wrap
    c.beginPath(); // hanging end
    c.moveTo(88, 66);
    c.lineTo(96, 84);
    c.lineTo(88, 84);
    c.lineTo(84, 66);
    c.closePath();
    c.fill();
    c.fillStyle = "rgba(0,0,0,0.12)";
    c.fillRect(60, 64, 36, 2);
  } else if (v.acc === "antenna") {
    c.strokeStyle = "#888";
    c.lineWidth = 2.5;
    c.beginPath();
    c.moveTo(80, 14);
    c.lineTo(80, -2);
    c.stroke();
    fillEll(c, 80, -4, 4, 4, "#FF5C5C");
    fillEll(c, 79, -5, 1.3, 1.3, "#ffaaaa");
  }
}

// The king's grand crown: a red-velvet cap ringed by a gem-studded gold band
// with five jewel-tipped points and a pearl base. Kept within the sprite's top
// edge (y >= 1) so nothing is clipped. Drawn instead of the plain crown when the
// duck carries the "royal" effect.
function drawRoyalCrown(c: CanvasRenderingContext2D, gold: string) {
  const tips: [number, number][] = [
    [55, 9], // outer left
    [67, 4], // inner left
    [80, 2], // center
    [93, 4], // inner right
    [105, 9], // outer right
  ];
  const jewels = ["#FF4D6D", "#5CC8FF", "#7CFF7C", "#5CC8FF", "#FF4D6D"];
  const bandTop = 17;
  const bandBot = 27;

  // red velvet cap peeking above the band, between the gold points
  c.fillStyle = "#B0202E";
  c.beginPath();
  c.moveTo(56, bandTop);
  c.quadraticCurveTo(80, 3, 104, bandTop);
  c.closePath();
  c.fill();

  // gold band + five points as one filled outline
  const gg = c.createLinearGradient(0, 2, 0, bandBot);
  gg.addColorStop(0, "#FFF3B0");
  gg.addColorStop(0.5, gold);
  gg.addColorStop(1, "#B8860B");
  c.fillStyle = gg;
  c.beginPath();
  c.moveTo(53, bandBot);
  c.lineTo(53, bandTop);
  for (let i = 0; i < tips.length; i++) {
    c.lineTo(tips[i][0], tips[i][1]); // up to the point
    if (i < tips.length - 1) c.lineTo((tips[i][0] + tips[i + 1][0]) / 2, bandTop); // valley
  }
  c.lineTo(107, bandTop);
  c.lineTo(107, bandBot);
  c.closePath();
  c.fill();

  // jewel on each point
  for (let i = 0; i < tips.length; i++) {
    const [sx, sy] = tips[i];
    fillEll(c, sx, sy + 1, 2.4, 2.4, jewels[i]);
    fillEll(c, sx - 0.7, sy + 0.3, 0.9, 0.9, "rgba(255,255,255,0.9)");
  }

  // gem-studded band
  fillEll(c, 66, 22, 3, 3, "#FF4D6D");
  fillEll(c, 80, 22, 3.4, 3.4, "#5CC8FF");
  fillEll(c, 94, 22, 3, 3, "#7CFF7C");
  fillEll(c, 65, 21, 0.9, 0.9, "rgba(255,255,255,0.9)");
  fillEll(c, 79, 21, 1, 1, "rgba(255,255,255,0.9)");
  fillEll(c, 93, 21, 0.9, 0.9, "rgba(255,255,255,0.9)");

  // pearl base trim
  for (let px = 55; px <= 105; px += 6.5) fillEll(c, px, bandBot, 2.3, 2.3, "#FFF8E0");

  // sheen sweep across the band
  c.fillStyle = "rgba(255,255,255,0.35)";
  c.fillRect(58, bandTop + 1, 4, 8);
}
