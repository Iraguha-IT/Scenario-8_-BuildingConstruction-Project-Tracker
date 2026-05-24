import { useEffect, useState } from 'react';
import api from '../api';

export default function PurchaseForm() {
  const [projects, setProjects] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [form, setForm] = useState({
    PurchaseDate: '',
    Quantity: '',
    UnitPrice: '',
    TotalCost: '',
    ProjectID: '',
    SupplierID: '',
    MaterialID: ''
  });

  useEffect(() => {
    Promise.all([
      api.get('/projects'),
      api.get('/suppliers'),
      api.get('/materials')
    ]).then(([projRes, supRes, matRes]) => {
      setProjects(projRes.data);
      setSuppliers(supRes.data);
      setMaterials(matRes.data);
    });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newForm = { ...form, [name]: value };

    // Auto-calculate TotalCost if Quantity and UnitPrice exist
    if (name === 'Quantity' || name === 'UnitPrice') {
      const qty = parseFloat(newForm.Quantity) || 0;
      const price = parseFloat(newForm.UnitPrice) || 0;
      newForm.TotalCost = (qty * price).toString();
    }
    setForm(newForm);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    api.post('/purchases', {
      ...form,
      Quantity: parseFloat(form.Quantity),
      UnitPrice: parseFloat(form.UnitPrice),
      TotalCost: parseFloat(form.TotalCost)
    }).then(() => {
      alert('Purchase recorded!');
      setForm({
        PurchaseDate: '', Quantity: '', UnitPrice: '', TotalCost: '',
        ProjectID: '', SupplierID: '', MaterialID: ''
      });
    }).catch(err => alert('Error: ' + err.message));
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Record Purchase</h2>
      <form onSubmit={handleSubmit} className="space-y-3 max-w-md">
        <input type="date" name="PurchaseDate" value={form.PurchaseDate} onChange={handleChange} className="border p-1 rounded w-full" required />

        <select name="ProjectID" value={form.ProjectID} onChange={handleChange} className="border p-1 rounded w-full" required>
          <option value="">Select Project</option>
          {projects.map(p => <option key={p.ProjectID} value={p.ProjectID}>{p.ProjectName}</option>)}
        </select>

        <select name="SupplierID" value={form.SupplierID} onChange={handleChange} className="border p-1 rounded w-full" required>
          <option value="">Select Supplier</option>
          {suppliers.map(s => <option key={s.SupplierID} value={s.SupplierID}>{s.SupplierName}</option>)}
        </select>

        <select name="MaterialID" value={form.MaterialID} onChange={handleChange} className="border p-1 rounded w-full" required>
          <option value="">Select Material</option>
          {materials.map(m => <option key={m.MaterialID} value={m.MaterialID}>{m.MaterialName} ({m.UnitOfMeasure})</option>)}
        </select>

        <input type="number" step="any" name="Quantity" placeholder="Quantity" value={form.Quantity} onChange={handleChange} className="border p-1 rounded w-full" required />
        <input type="number" step="any" name="UnitPrice" placeholder="Unit Price (RWF)" value={form.UnitPrice} onChange={handleChange} className="border p-1 rounded w-full" required />
        <input type="number" step="any" name="TotalCost" placeholder="Total Cost (auto-calculated)" value={form.TotalCost} readOnly className="border p-1 rounded w-full bg-gray-100" />

        <button type="submit" className="bg-blue-500 text-white p-2 rounded w-full">Save Purchase</button>
      </form>
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