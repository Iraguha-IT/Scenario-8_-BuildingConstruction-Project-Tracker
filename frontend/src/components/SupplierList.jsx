import { useEffect, useState } from 'react';
import api from '../api';

export default function SupplierList() {
  const [suppliers, setSuppliers] = useState([]);
  const [form, setForm] = useState({ SupplierName: '', ContactPerson: '', PhoneNumber: '' });

  const fetchSuppliers = () => {
    api.get('/suppliers').then(res => setSuppliers(res.data));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    api.post('/suppliers', form).then(() => {
      setForm({ SupplierName: '', ContactPerson: '', PhoneNumber: '' });
      fetchSuppliers();
    });
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Suppliers</h2>
      <form onSubmit={handleSubmit} className="mb-6 grid grid-cols-3 gap-2">
        <input 
          type="text" placeholder="Supplier Name" value={form.SupplierName}
          onChange={e => setForm({...form, SupplierName: e.target.value})}
          className="border p-1 rounded" required
        />
        <input 
          type="text" placeholder="Contact Person" value={form.ContactPerson}
          onChange={e => setForm({...form, ContactPerson: e.target.value})}
          className="border p-1 rounded"
        />
        <input 
          type="text" placeholder="Phone Number" value={form.PhoneNumber}
          onChange={e => setForm({...form, PhoneNumber: e.target.value})}
          className="border p-1 rounded"
        />
        <button type="submit" className="bg-green-500 text-white p-1 rounded col-span-3">Add Supplier</button>
      </form>
      <table className="w-full bg-white">
        <thead>
          <tr><th>ID</th><th>Name</th><th>Contact Person</th><th>Phone</th></tr>
        </thead>
        <tbody>
          {suppliers.map(s => (
            <tr key={s.SupplierID}>
              <td>{s.SupplierID}</td>
              <td>{s.SupplierName}</td>
              <td>{s.ContactPerson}</td>
              <td>{s.PhoneNumber}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
const handleEdit = (project) => {
  const newName = prompt('New project name:', project.ProjectName);
  if (newName) {
    api.put(`/projects/${project.ProjectID}`, { ...project, ProjectName: newName }).then(fetchProjects);
  }
};

const handleDelete = (id) => {
  if (confirm('Delete this project?')) {
    api.delete(`/projects/${id}`).then(fetchProjects);
  }
};