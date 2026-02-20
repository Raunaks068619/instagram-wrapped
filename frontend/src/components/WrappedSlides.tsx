export default function WrappedSlides({ report }: { report: any }) {
  const slides = Array.isArray(report?.slides_json) ? report.slides_json : [];
  return (
    <div className="slides">
      {slides.map((s: any, idx: number) => (
        <article className="slide" key={idx} style={{ transitionDelay: `${idx * 0.1}s` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <h3>{s.title}</h3>
            <span style={{ fontSize: '1.5rem', opacity: 0.3 }}>0{idx + 1}</span>
          </div>
          <p>{s.text}</p>
        </article>
      ))}
    </div>
  );
}
