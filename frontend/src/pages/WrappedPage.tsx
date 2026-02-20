import { useState } from 'react';
import { api } from '../api/client';
import WrappedSlides from '../components/WrappedSlides';

export default function WrappedPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState('');

  async function generate() {
    setError('');
    try {
      const data = await api.generateWrapped(year);
      setReport(data.report);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function fetchExisting() {
    setError('');
    try {
      const data = await api.getWrapped(year);
      setReport(data.report);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <section className="card">
      <h2>Your Wrapped</h2>
      <div className="row">
        <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
        <button onClick={generate}>Generate</button>
        <button onClick={fetchExisting}>Fetch Existing</button>
      </div>
      {error && <p className="error">{error}</p>}
      {report && (
        <>
          <h3>{report.title}</h3>
          <p>{report.summary}</p>
          {report.ai_image_ref && <img src={report.ai_image_ref} alt="Wrapped Visual" className="hero" />}
          <WrappedSlides report={report} />
        </>
      )}
    </section>
  );
}
