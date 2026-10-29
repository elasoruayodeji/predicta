import React from "react";
import ReactDOM from "react-dom/client";
// @ts-ignore -- CSS side-effect imports are handled by the bundler.
import "./index.css";
import App from "./App.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
