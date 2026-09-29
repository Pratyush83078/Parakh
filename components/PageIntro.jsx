export default function PageIntro({ title, description, children }) {
  return (
    <header className="page-intro">
      <div><h1 className="page-intro-title">{title}</h1><p className="page-intro-desc">{description}</p></div>
      {children && <div className="page-intro-aside">{children}</div>}
    </header>
  );
}
