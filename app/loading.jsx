export default function Loading() {
  return (
    <div className="ln-wrap loading-page" role="status" aria-label="Loading page">
      <span className="ln-skel" style={{ width: 520, height: 48 }} />
      <span className="ln-skel" style={{ width: 380, height: 18 }} />
      <span className="ln-skel" style={{ width: '100%', height: 260 }} />
    </div>
  );
}
