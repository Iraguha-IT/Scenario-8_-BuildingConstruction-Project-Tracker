import { useEffect, useState } from 'react';
import api from '../api';
import PDFReport from './PDFReport';

export default function CostReport() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');   // ← was missing
  const [report, setReport] = useState([]);
  const [projectBudget, setProjectBudget] = useState(0);

  useEffect(() => {
    api.get('/projects').then(res => setProjects(res.data));
  }, []);

  const fetchReport = (projectId) => {
    if (!projectId) return;
    api.get(`/cost-report/${projectId}`).then(res => {
      setReport(res.data);
      const proj = projects.find(p => p.ProjectID == projectId);
      setProjectBudget(proj ? proj.Budget : 0);
    });
  };

  const handleProjectChange = (e) => {
    const id = e.target.value;
    setSelectedProject(id);
    fetchReport(id);
  };

  const totalSpent = report.reduce((sum, item) => sum + (item.TotalCost || 0), 0);
  const remaining = projectBudget - totalSpent;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Cost Report by Project</h2>
      <select onChange={handleProjectChange} value={selectedProject} className="border p-2 rounded mb-4">
        <option value="">Select a project</option>
        {projects.map(p => (
          <option key={p.ProjectID} value={p.ProjectID}>{p.ProjectName}</option>
        ))}
      </select>

      {selectedProject && (
        <>
          <PDFReport 
            projectName={projects.find(p => p.ProjectID == selectedProject)?.ProjectName}
            reportData={report}
            budget={projectBudget}
            totalSpent={totalSpent}
          />
          <div className="bg-white p-4 rounded shadow mb-4">
            <p><strong>Budget:</strong> {projectBudget.toLocaleString()} RWF</p>
            <p><strong>Total Spent:</strong> {totalSpent.toLocaleString()} RWF</p>
            <p><strong>Remaining:</strong> {remaining.toLocaleString()} RWF</p>
          </div>

          <table className="w-full bg-white">
            <thead>
              <tr><th>Material</th><th>Total Quantity</th><th>Unit Price (RWF)</th><th>Total Cost (RWF)</th></tr>
            </thead>
            <tbody>
              {report.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.MaterialName}</td>
                  <td>{item.TotalQuantity}</td>
                  <td>{item.UnitPrice}</td>
                  <td>{item.TotalCost.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}