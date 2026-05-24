import { useEffect, useState } from 'react';
import api from '../api';

export default function ProjectList() {
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState({ ProjectName: '', ClientName: '', StartDate: '', EndDate: '', Budget: '' });

  const fetchProjects = () => {
    api.get('/projects').then(res => setProjects(res.data));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    api.post('/projects', form).then(() => {
      setForm({ ProjectName: '', ClientName: '', StartDate: '', EndDate: '', Budget: '' });
      fetchProjects();
    });
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Projects</h2>
      <form onSubmit={handleSubmit} className="mb-6 grid grid-cols-2 gap-2">
        <input type="text" placeholder="Project Name" value={form.ProjectName} onChange={e => setForm({...form, ProjectName: e.target.value})} className="border p-1 rounded" required />
        <input type="text" placeholder="Client Name" value={form.ClientName} onChange={e => setForm({...form, ClientName: e.target.value})} className="border p-1 rounded" />
        <input type="date" placeholder="Start Date" value={form.StartDate} onChange={e => setForm({...form, StartDate: e.target.value})} className="border p-1 rounded" />
        <input type="date" placeholder="End Date" value={form.EndDate} onChange={e => setForm({...form, EndDate: e.target.value})} className="border p-1 rounded" />
        <input type="number" placeholder="Budget" value={form.Budget} onChange={e => setForm({...form, Budget: e.target.value})} className="border p-1 rounded" />
        <button type="submit" className="bg-green-500 text-white p-1 rounded">Add Project</button>
      </form>
      <table className="w-full bg-white">
        <thead><tr><th>ID</th><th>Name</th><th>Client</th><th>Budget</th></tr></thead>
        <tbody>
          {projects.map(p => (
            <tr key={p.ProjectID}><td>{p.ProjectID}</td><td>{p.ProjectName}</td><td>{p.ClientName}</td><td>{p.Budget}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}