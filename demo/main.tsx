import { createRoot } from "react-dom/client";
import { StickersApp } from "../src";
import "./demo.css";

createRoot(document.getElementById("root") as HTMLElement).render(<StickersApp />);
