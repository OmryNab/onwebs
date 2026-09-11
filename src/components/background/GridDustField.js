import { useDustCanvas } from "./useDustCanvas.js";

export function mountGridDustField(root, variant = "dark") {
  if (!root) return () => {};

  const mode = variant === "light" ? "light" : "dark";
  root.classList.add("gdf", mode === "dark" ? "gdf--dark" : "gdf--light");
  root.dataset.gdfVariant = mode;

  const canvas = root.querySelector(":scope > .gdf__canvas");
  if (!(canvas instanceof HTMLCanvasElement)) return () => {};

  return useDustCanvas(root, canvas, () => (root.dataset.gdfVariant === "light" ? "light" : "dark"));
}
