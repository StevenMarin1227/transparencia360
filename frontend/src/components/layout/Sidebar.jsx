import { FaTachometerAlt } from "react-icons/fa";

export default function Sidebar() {
  return (
    <div
      className="bg-success text-white p-3"
      style={{ width: "250px", minHeight: "100vh" }}
    >
      <h4 className="mb-4">Transparencia360</h4>

      <ul className="nav flex-column">
        <li className="nav-item d-flex align-items-center gap-2">
          <FaTachometerAlt />
          <span>Dashboard</span>
        </li>
      </ul>
    </div>
  );
}