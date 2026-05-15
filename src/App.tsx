import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";
import { SettingsProvider } from "@/lib/settings";
import { MainLayout } from "@/components/layout/MainLayout";
import { Dashboard } from "@/pages/Dashboard";
import { NuevaCirugia } from "@/pages/NuevaCirugia";
import { DetalleCirugia } from "@/pages/DetalleCirugia";
import { Configuracion } from "@/pages/Configuracion";
import { GateScreen } from "@/pages/GateScreen";

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "nueva", element: <NuevaCirugia /> },
      { path: "cirugia/:id", element: <DetalleCirugia /> },
      { path: "configuracion", element: <Configuracion /> },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);

function Gate() {
  const { status } = useAuth();
  if (status === "unlocked") return <RouterProvider router={router} />;
  return <GateScreen />;
}

function App() {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <AuthProvider>
          <Gate />
        </AuthProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}

export default App;
