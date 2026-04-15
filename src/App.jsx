import PortalApp from "./PortalApp";

const currentUser = {
  id: "u1",
  name: "Portal Admin",
  role: "admin",
};

export default function App() {
  return <PortalApp user={currentUser} />;
}