export default function PageIntro({ title, description, children }) {
  return (
    <header className="page-intro">
      <div><h1>{title}</h1><p>{description}</p></div>
      {children && <div className="page-intro-aside">{children}</div>}
    </header>
  );
}
