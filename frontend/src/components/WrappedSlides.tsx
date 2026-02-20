export default function WrappedSlides({ report }: { report: any }) {
  const slides = Array.isArray(report?.slides_json) ? report.slides_json : [];
  return (
    <div className="slides">
      {slides.map((s: any, idx: number) => (
        <article className="slide" key={idx}>
          <h3>{s.title}</h3>
          <p>{s.text}</p>
        </article>
      ))}
    </div>
  );
}
