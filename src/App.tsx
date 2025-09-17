import React from "react";
import { RouterProvider } from "react-router";
import { createBrowserRouter } from "react-router-dom";

import { route } from "./router";

// STORES

const App: React.FC = () => {
  // THEME
  const router = createBrowserRouter(route);

  return <RouterProvider router={router} />;
};

export default App;
