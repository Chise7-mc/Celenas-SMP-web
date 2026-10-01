type SectionHeadingProps = {
  eyebrow?: string;
  id?: string;
  title: string;
  description?: string;
};

export function SectionHeading({
  eyebrow,
  id,
  title,
  description,
}: SectionHeadingProps) {
  return (
    <div className="section-heading">
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h2 id={id}>{title}</h2>
      {description ? (
        <p className="muted section-description">{description}</p>
      ) : null}
    </div>
  );
}
