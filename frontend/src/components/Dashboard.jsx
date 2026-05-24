import { useEffect, useState } from 'react';
import api from '../api';

export default function Dashboard() {
  const [stats, setStats] = useState({ projects: 0, suppliers: 0, purchases: 0 });

  useEffect(() => {
    Promise.all([
      api.get('/projects'),
      api.get('/suppliers'),
      api.get('/purchases')
    ]).then(([proj, supp, purch]) => {
      setStats({
        projects: proj.data.length,
        suppliers: supp.data.length,
        purchases: purch.data.length
      });
    });
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded shadow">Total Projects: {stats.projects}</div>
        <div className="bg-white p-4 rounded shadow">Total Suppliers: {stats.suppliers}</div>
        <div className="bg-white p-4 rounded shadow">Total Purchases: {stats.purchases}</div>
      </div>
    </div>
  );
}