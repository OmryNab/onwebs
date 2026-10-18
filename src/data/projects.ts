export type Project = {
  /** basename of the screenshots in public/work: {id}-desktop.jpg / {id}-mobile.jpg */
  id: string;
  title: string;
  en: string;
  category: string;
  url: string;
};

export const projects: Project[] = [
  {
    id: "kafe",
    title: "קפה במצפה",
    en: "KAFE BAMITZPE",
    category: "בית קפה · ינוח-ג׳ת",
    url: "https://kafe-bamitzpe.vercel.app/",
  },
  {
    id: "barista",
    title: "The Barista",
    en: "THE BARISTA",
    category: "בית קפה ספשלטי · ג׳וליס",
    url: "https://thebaristacafe.vercel.app/",
  },
  {
    id: "peak",
    title: "Peak Riders",
    en: "PEAK RIDERS",
    category: "קבוצת רכיבה · עברית / English",
    url: "https://peak-riders-phi.vercel.app/?v=2&lang=he",
  },
  {
    id: "adam",
    title: "Adam Nevoani",
    en: "ADAM NEVOANI",
    category: "תיק עבודות אישי",
    url: "https://adam-nevoani.vercel.app/",
  },
];
