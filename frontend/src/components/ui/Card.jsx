export default function Card({ title, value, color }) {
  return (
    <div className="bg-white rounded-xl shadow p-4 border-l-4" style={{ borderColor: color }}>
      <h3 className="text-gray-500 text-sm">{title}</h3>
      <p className="text-2xl font-bold mt-2" style={{ color }}>
        {value}
      </p>
    </div>
  );
}